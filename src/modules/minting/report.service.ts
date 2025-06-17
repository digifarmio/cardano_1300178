import { createObjectCsvStringifier } from 'csv-writer';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError } from '../core/errors';
import { NmkrClient } from '@/modules/core/nmkr.client';
import { SqsService } from '@/modules/minting/sqs.service';
import { ExplorerService } from '@/modules/minting/explorer.service';
import { StorageService } from '@/modules/minting/storage.service';
import { CsvRecord, GetTransactionNfts, ProjectTransaction, ReportStatus } from '@/types';

export class ReportService {
  private readonly BATCH_SIZE = 10;

  constructor(
    private readonly nmkr: NmkrClient = new NmkrClient(),
    private readonly explorer: ExplorerService = new ExplorerService(),
    private readonly storageService: StorageService = new StorageService(),
    private readonly sqsService: SqsService = new SqsService()
  ) {}

  async generateReport(): Promise<{ reportId: string; statusUrl: string }> {
    if (await this.storageService.hasActiveReport()) {
      throw new Error('Another report is already in progress');
    }

    if (await this.sqsService.hasMessagesInQueue()) {
      throw new Error('Report generation is already queued');
    }

    const reportId = uuidv4();
    console.log(`[Report Service] Starting report generation with ID: ${reportId}`);

    await this.storageService.saveStatus(reportId, {
      status: 'queued',
      totalNfts: 0,
      processedNfts: 0,
      records: [],
    });

    await this.sqsService.sendTriggerMessage(reportId);

    return { reportId, statusUrl: `/reports/${reportId}` };
  }

  async initializeReport(reportId: string): Promise<void> {
    console.log(`[Report Service] Initializing report ${reportId}`);

    try {
      // Fetch all transactions
      const transactions: ProjectTransaction[] = await this.nmkr.getTransactions();
      console.log(`[Report Service] Found ${transactions.length} transactions`);

      // Flatten NFTs from transactions
      const allNfts: { tx: ProjectTransaction; nft: GetTransactionNfts }[] = [];
      transactions.forEach((tx) => {
        if (tx.transactionNfts && tx.transactionNfts.length) {
          tx.transactionNfts.forEach((nft) => {
            allNfts.push({ tx, nft });
          });
        }
      });

      console.log(`[Report Service] Found ${allNfts.length} total NFTs to process`);

      if (allNfts.length === 0) {
        console.log(`[Report Service] No NFTs found, completing report immediately`);
        await this.storageService.updateStatus({
          id: reportId,
          status: 'completed',
          totalNfts: 0,
          processedNfts: 0,
          progress: 100,
          updatedAt: new Date().toISOString(),
        });
        return;
      }

      // Update report with total NFT count and processing status
      await this.storageService.updateStatus({
        id: reportId,
        status: 'processing',
        totalNfts: allNfts.length,
        processedNfts: 0,
        progress: 0,
        updatedAt: new Date().toISOString(),
      });

      // Send NFT batches to SQS
      const totalBatches = Math.ceil(allNfts.length / this.BATCH_SIZE);
      console.log(`[Report Service] Creating ${totalBatches} batches of size ${this.BATCH_SIZE}`);

      for (let i = 0; i < allNfts.length; i += this.BATCH_SIZE) {
        const batch = allNfts.slice(i, i + this.BATCH_SIZE);
        const batchIndex = Math.floor(i / this.BATCH_SIZE);

        await this.sqsService.sendBatchMessage(reportId, batchIndex, batch);
        console.log(`[Report Service] Sent batch ${batchIndex + 1}/${totalBatches} to queue`);
      }

      console.log(`[Report Service] All batches sent for report ${reportId}`);
    } catch (error) {
      console.error(`[Report Service] Error initializing report ${reportId}:`, error);
      await this.storageService.updateStatus({
        id: reportId,
        status: 'failed',
        error: {
          message: error instanceof Error ? error.message : 'Failed to initialize report',
          code: 'INITIALIZATION_ERROR',
        },
        updatedAt: new Date().toISOString(),
      });
      throw error;
    }
  }

  async processBatch(
    reportId: string,
    batch: { tx: ProjectTransaction; nft: GetTransactionNfts }[]
  ): Promise<void> {
    if (!batch?.length) {
      console.warn(`[Report Service] Empty batch for report ${reportId}`);
      return;
    }

    try {
      console.log(`[Report Service] Processing ${batch.length} NFTs for ${reportId}`);
      const records = await this.processNfts(batch);

      const current = await this.storageService.getReportById(reportId);
      const processedNfts = current.processedNfts + records.length;
      const progress = Math.min(100, Math.round((processedNfts / current.totalNfts) * 100));

      const { shouldFinalize } = await this.storageService.addRecordsWithProgress(
        reportId,
        records,
        processedNfts,
        progress
      );

      if (shouldFinalize) {
        console.log(`[Report Service] Finalizing report ${reportId}`);
        const report = await this.storageService.getReportById(reportId);
        const csvPath = await this.generateCsv(reportId, report.records || []);

        await this.storageService.updateStatus({
          id: reportId,
          status: 'completed',
          csvPath,
          progress: 100,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`[Report Service] Batch failed for ${reportId}:`, error);
      await this.storageService.updateStatus({
        id: reportId,
        status: 'failed',
        error: {
          message: error instanceof Error ? error.message : 'Batch processing failed',
          code: 'BATCH_ERROR',
        },
        updatedAt: new Date().toISOString(),
      });
      throw error;
    }
  }

  private async processNfts(
    batch: { tx: ProjectTransaction; nft: GetTransactionNfts }[]
  ): Promise<CsvRecord[]> {
    const validBatch = batch.filter((item) => item && item.nft && item.nft.assetName);
    if (validBatch.length === 0) {
      console.warn('[Report Service] No valid NFTs in batch');
      return [];
    }

    console.log(`[Report Service] Processing ${validBatch.length} valid NFTs`);

    const results = await Promise.all(
      validBatch.map(async ({ nft }, index) => {
        try {
          const tokenName = this.hexToString(nft.assetName ?? '');
          const details = await this.nmkr.getNftDetailsByTokennameThrottled(tokenName);
          const parsedMetadata = this.parseMetadata(details.metadata);

          return {
            fieldID: this.extractFieldId(parsedMetadata),
            nmkrTokenID: details.uid,
            txID: details.initialminttxhash || 'Pending',
            explorerURL: this.explorer.getExplorerUrl(
              details.mintedOnBlockchain,
              details.initialminttxhash
            ),
            poolPmURL: this.explorer.getPoolUrl(details.fingerprint),
          };
        } catch (error) {
          console.error(`[Report Service] Error processing NFT ${index + 1}:`, error);
          return {
            fieldID: 'Error',
            nmkrTokenID: 'Error',
            txID: 'Error',
            explorerURL: 'N/A',
            poolPmURL: 'N/A',
          };
        }
      })
    );

    return results;
  }

  async finalizeReport(reportId: string): Promise<void> {
    console.log(`[Report Service] Finalizing report ${reportId}`);

    try {
      const report = await this.storageService.getReportById(reportId);
      const csvPath = await this.generateCsv(reportId, report.records || []);
      console.log(`[Report Service] CSV generated for report ${reportId}: ${csvPath}`);

      await this.storageService.updateStatus({
        id: reportId,
        status: 'completed',
        csvPath,
        progress: 100,
        updatedAt: new Date().toISOString(),
      });

      console.log(`[Report Service] Report ${reportId} completed successfully`);
    } catch (error) {
      console.error(`[Report Service] Error finalizing report ${reportId}:`, error);
      await this.storageService.updateStatus({
        id: reportId,
        status: 'failed',
        error: {
          message: error instanceof Error ? error.message : 'Failed to finalize report',
          code: 'FINALIZATION_ERROR',
        },
        updatedAt: new Date().toISOString(),
      });
      throw error;
    }
  }

  async getAllReports(): Promise<ReportStatus[]> {
    try {
      return await this.storageService.getAllReports();
    } catch (error) {
      console.error('Failed to fetch all report statuses:', error);
      throw new Error('Unable to retrieve report statuses');
    }
  }

  async getReportById(id: string): Promise<ReportStatus> {
    try {
      return this.storageService.getReportById(id);
    } catch (error) {
      return {
        id,
        status: 'failed',
        createdAt: new Date().toISOString(),
        error: {
          message: error instanceof Error ? error.message : 'Failed to get report status',
          code: 'STATUS_ERROR',
        },
        records: [],
        totalNfts: 0,
        processedNfts: 0,
      };
    }
  }

  async deleteReport(reportId: string): Promise<boolean> {
    try {
      return await this.storageService.deleteReport(reportId);
    } catch (error) {
      console.error('Failed to delete report:', error);
      throw new Error('Unable to delete report');
    }
  }

  async getReportFile(id: string, type: 'csv'): Promise<string> {
    try {
      return await this.storageService.getReportFileUrl(id, type);
    } catch (error) {
      if (error && typeof error === 'object') {
        const errObj = error as {
          name?: string;
          $metadata?: { httpStatusCode?: number };
          Code?: string;
          message?: unknown;
        };

        const isNotFound =
          errObj.name === 'NoSuchKey' ||
          errObj.$metadata?.httpStatusCode === 404 ||
          errObj.Code === 'NoSuchKey';

        if (isNotFound) {
          throw new NotFoundError('Report', id);
        }

        const message = typeof errObj.message === 'string' ? errObj.message : 'Unknown error';
        throw new Error(`Failed to get report file: ${message}`);
      }

      throw new Error('Failed to get report file: Unknown error');
    }
  }

  private async generateCsv(reportId: string, data: CsvRecord[]): Promise<string> {
    try {
      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'fieldID', title: 'Field ID' },
          { id: 'nmkrTokenID', title: 'NMKR Token ID' },
          { id: 'txID', title: 'Transaction ID' },
          { id: 'explorerURL', title: 'Explorer URL' },
          { id: 'poolPmURL', title: 'Pool.pm URL' },
        ],
      });

      const header = csvStringifier.getHeaderString() || '';
      const records = csvStringifier.stringifyRecords(data) || '';
      const csvContent = `${header}${records}`;

      return this.storageService.storeReportFile(reportId, csvContent, 'csv');
    } catch (error) {
      console.error('Error generating CSV:', error);
      throw new Error('Failed to generate CSV report');
    }
  }

  private hexToString(hex: string): string {
    return decodeURIComponent(hex.replace(/(..)/g, '%$1'));
  }

  private parseMetadata(jsonString: string): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(jsonString);

      if (!parsed['721']) return null;
      const block721 = parsed['721'];

      const policyIdKey = Object.keys(block721).find((key) => key !== 'version');
      if (!policyIdKey) return null;

      const metadataObj = block721[policyIdKey];
      const nftKey = Object.keys(metadataObj)[0];
      if (!nftKey) return null;

      const raw = metadataObj[nftKey];
      if (!raw) return null;

      return raw;
    } catch (e) {
      console.error('Failed to parse or normalize metadata:', e);
      return null;
    }
  }

  private extractFieldId(parsedMetadata: Record<string, unknown> | null): string {
    if (typeof parsedMetadata?.production_id === 'string') {
      return parsedMetadata.production_id;
    }

    if (typeof parsedMetadata?.id === 'string') {
      return parsedMetadata.id;
    }

    return 'N/A';
  }
}
