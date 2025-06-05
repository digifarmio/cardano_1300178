import { createObjectCsvStringifier } from 'csv-writer';
import { v4 as uuidv4 } from 'uuid';
import { ReportGenerationError } from '../core/errors';
import { NmkrClient } from '@/modules/core/nmkr.client';
import { SqsService } from '@/modules/minting/sqs.service';
import { ExplorerService } from '@/modules/minting/explorer.service';
import { StorageService } from '@/modules/minting/storage.service';
import { CsvRecord, ProjectTransaction, ReportStatus } from '@/types';

export class ReportService {
  constructor(
    private readonly nmkr: NmkrClient = new NmkrClient(),
    private readonly explorer: ExplorerService = new ExplorerService(),
    private readonly storageService: StorageService = new StorageService(),
    private readonly sqsService: SqsService = new SqsService()
  ) {}

  async generateReport(): Promise<{ reportId: string; statusUrl: string }> {
    try {
      const activeReport = await this.storageService.hasActiveReport();
      if (activeReport) {
        throw new ReportGenerationError(
          'A report is already being processed. Please wait until it completes.'
        );
      }

      const reportId = uuidv4();
      await this.storageService.saveStatus(reportId, {
        id: reportId,
        status: 'queued',
        createdAt: new Date().toISOString(),
      });

      await this.sqsService.sendReportGenerationMessage(reportId);
      return { reportId, statusUrl: `/reports/${reportId}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to generate report';
      console.error('Failed to generate report:', error);
      throw new ReportGenerationError(message);
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
      throw new Error(
        `Failed to get report file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async processReport(reportId: string): Promise<void> {
    console.log(`[report:${reportId}] Starting report processing`);

    try {
      console.log(`[report:${reportId}] Marking status as "processing"`);
      await this.storageService.updateStatus({
        id: reportId,
        status: 'processing',
        updatedAt: new Date().toISOString(),
      });

      console.log(`[report:${reportId}] Fetching transactions from NMKR`);
      const transactions = await this.nmkr.getTransactions();
      console.log(`[report:${reportId}] Retrieved ${transactions.length} transactions`);

      if (!transactions.length) {
        console.warn(`[report:${reportId}] No transactions available for report`);
        throw new Error('No transactions available for report');
      }

      const batchSize = 10;
      const progressUpdateInterval = 10;
      const allRecords: CsvRecord[] = [];

      let processedCount = 0;

      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        console.log(
          `[report:${reportId}] Processing batch ${Math.floor(i / batchSize) + 1}, size: ${batch.length}`
        );

        const batchRecords = await this.processBatch(batch);
        allRecords.push(...batchRecords);

        processedCount += batch.length;
        console.log(
          `[report:${reportId}] Batch ${Math.floor(i / batchSize) + 1} processed, records: ${batchRecords.length}`
        );

        if (
          processedCount % progressUpdateInterval === 0 ||
          processedCount === transactions.length
        ) {
          const progress = Math.min(100, Math.round((processedCount / transactions.length) * 100));
          console.log(`[report:${reportId}] Updating progress to ${progress}%`);

          await this.storageService.updateStatus({
            id: reportId,
            status: 'processing',
            updatedAt: new Date().toISOString(),
            progress,
          });
        }
      }

      console.log(`[report:${reportId}] All batches processed, generating CSV`);
      const csvPath = await this.generateCsv(reportId, allRecords);
      console.log(`[report:${reportId}] CSV generated at path: ${csvPath}`);

      await this.storageService.updateStatus({
        id: reportId,
        status: 'completed',
        updatedAt: new Date().toISOString(),
        csvPath,
        progress: 100,
      });

      console.log(`[report:${reportId}] Report processing completed successfully`);
    } catch (error) {
      console.error(`[report:${reportId}] Error during processing:`, error);

      await this.storageService.updateStatus({
        id: reportId,
        status: 'failed',
        updatedAt: new Date().toISOString(),
        error: {
          message: error instanceof Error ? error.message : 'Report processing failed',
          code: 'PROCESSING_ERROR',
        },
      });

      throw error;
    }
  }

  private async processBatch(transactions: ProjectTransaction[]): Promise<CsvRecord[]> {
    const batchResults = await Promise.allSettled(
      transactions.map(async (tx) => {
        if (!tx.transactionNfts?.length) return [];

        const nftResults = await Promise.allSettled(
          tx.transactionNfts.map(async (nft) => {
            try {
              if (!nft.assetName) {
                throw new Error('NFT is missing assetName');
              }

              const tokenName = this.hexToString(nft.assetName);
              const details = await this.nmkr.getNftDetailsByTokennameThrottled(tokenName);
              const parsedMetadata = this.parseMetadata(details.metadata);

              return {
                fieldID: this.extractFieldId(parsedMetadata),
                tokenID: details.uid,
                txID: details.initialminttxhash || 'Pending',
                explorerURL: details.initialminttxhash
                  ? this.explorer.getExplorerUrl(
                      details.mintedOnBlockchain,
                      details.initialminttxhash
                    )
                  : 'N/A',
              };
            } catch (error) {
              console.error(`Error processing NFT:`, error);
              return {
                fieldID: 'Error',
                tokenID: 'Error',
                txID: 'Error',
                explorerURL: 'N/A',
              };
            }
          })
        );

        return nftResults
          .filter(
            (result): result is PromiseFulfilledResult<CsvRecord> => result.status === 'fulfilled'
          )
          .map((result) => result.value);
      })
    );

    return batchResults
      .filter(
        (result): result is PromiseFulfilledResult<CsvRecord[]> => result.status === 'fulfilled'
      )
      .flatMap((result) => result.value);
  }

  private async generateCsv(reportId: string, data: CsvRecord[]): Promise<string> {
    try {
      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'fieldID', title: 'Field ID' },
          { id: 'tokenID', title: 'Token ID' },
          { id: 'txID', title: 'Transaction ID' },
          { id: 'explorerURL', title: 'Explorer URL' },
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
    if (typeof parsedMetadata?.id_long === 'string') {
      return parsedMetadata.id_long;
    }

    if (typeof parsedMetadata?.id === 'string') {
      return parsedMetadata.id;
    }

    return 'N/A';
  }
}
