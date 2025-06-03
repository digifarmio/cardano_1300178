import { createObjectCsvStringifier } from 'csv-writer';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@/config/config.service';
import { NmkrClient } from '@/modules/core/nmkr.client';
import { ExplorerService } from '@/modules/minting/explorer.service';
import { StorageService } from '@/modules/minting/storage.service';
import { BatchRecord, CsvRecord, ReportStatus } from '@/types';

export class ReportService {
  constructor(
    private readonly nmkr: NmkrClient = new NmkrClient(),
    private readonly config: ConfigService = new ConfigService(),
    private readonly explorer: ExplorerService = new ExplorerService(),
    private readonly storageService: StorageService = new StorageService()
  ) {}

  async generateReport(): Promise<{ reportId: string; statusUrl: string }> {
    const reportId = uuidv4();
    await this.storageService.saveStatus(reportId, {
      id: reportId,
      status: 'processing',
      createdAt: new Date().toISOString(),
    });

    // Process report in background
    this.processReport(reportId).catch((error) => {
      console.error('Failed to process report:', error);
    });

    return {
      reportId,
      statusUrl: `/reports/${reportId}`,
    };
  }

  async getReportStatus(id: string): Promise<ReportStatus> {
    try {
      const status = await this.storageService.getStatus(id);
      return {
        id,
        status: status.status ?? 'pending',
        ...status,
        createdAt: status.createdAt ?? new Date().toISOString(),
      };
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

  async getReportFile(id: string, type: 'csv'): Promise<string> {
    try {
      return await this.storageService.getReportFileUrl(id, type);
    } catch (error) {
      throw new Error(
        `Failed to get report file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async processReport(reportId: string): Promise<void> {
    try {
      const batches = await this.storageService.getBatchRecords();
      if (!batches.length) {
        throw new Error('No batch records available for report');
      }

      const { csvData } = await this.prepareData(batches);
      const csvPath = await this.generateCsv(reportId, csvData);

      await this.storageService.updateStatus({
        id: reportId,
        status: 'completed',
        updatedAt: new Date().toISOString(),
        csvPath,
      });
    } catch (error) {
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

  private async prepareData(batches: BatchRecord[]) {
    try {
      const results = await Promise.all(
        batches.map(async (batch) => {
          const nfts = batch.success
            ? (batch.result.sendedNft ?? []).filter((nft) => nft.name)
            : [];

          const nftDetails = await Promise.all(
            nfts.map(async (nft) => {
              try {
                const details = await this.nmkr.getNftDetailsThrottled(nft.uid);

                return {
                  success: true,
                  csvRecord: {
                    fieldID: nft.name || 'Unknown NFT',
                    tokenID: details.uid,
                    txID: details.initialminttxhash || 'Pending',
                    explorerURL: details.initialminttxhash
                      ? this.explorer.getExplorerUrl(
                          details.mintedOnBlockchain,
                          details.initialminttxhash
                        )
                      : 'N/A',
                  },
                };
              } catch (error) {
                console.error(`Error fetching NFT details for ${nft.name}:`, error);
                return {
                  success: false,
                  csvRecord: {
                    fieldID: nft.name || 'Unknown NFT',
                    tokenID: 'Error',
                    txID: 'Error',
                    explorerURL: 'N/A',
                  },
                };
              }
            })
          );

          return {
            csvRecords: nftDetails.map((d) => d.csvRecord),
          };
        })
      );

      return {
        csvData: results.flatMap((r) => r.csvRecords),
      };
    } catch (error) {
      throw error;
    }
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
}
