import { createObjectCsvStringifier } from 'csv-writer';
import { v4 as uuidv4 } from 'uuid';
import { NmkrClient } from '@/modules/core/nmkr.client';
import { ExplorerService } from '@/modules/minting/explorer.service';
import { StorageService } from '@/modules/minting/storage.service';
import { CsvRecord, ProjectTransaction, ReportStatus } from '@/types';

export class ReportService {
  constructor(
    private readonly nmkr: NmkrClient = new NmkrClient(),
    private readonly explorer: ExplorerService = new ExplorerService(),
    private readonly storageService: StorageService = new StorageService()
  ) {}

  async generateReport(): Promise<{ reportId: string; statusUrl: string }> {
    try {
      const reportId = uuidv4();
      await this.storageService.saveStatus(reportId, {
        id: reportId,
        status: 'processing',
        createdAt: new Date().toISOString(),
      });

      await this.processReport(reportId);
      return { reportId, statusUrl: `/reports/${reportId}` };
    } catch (error) {
      console.error('Failed to fetch all report statuses:', error);
      throw new Error('Unable to retrieve report statuses');
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

  private async processReport(reportId: string): Promise<void> {
    try {
      const transactions = await this.nmkr.getTransactions();
      if (!transactions.length) {
        throw new Error('No transactions available for report');
      }

      const csvData = await this.prepareData(transactions);
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

  private async prepareData(transactions: ProjectTransaction[]) {
    try {
      const results = await Promise.all(
        transactions.map(async (tx) => {
          if (!tx.transactionNfts?.length) return [];

          const nftDetails = await Promise.all(
            tx.transactionNfts.map(async (nft) => {
              try {
                if (!nft.assetName) {
                  throw new Error('NFT is missing assetName');
                }

                const tokenName = this.hexToString(nft.assetName);
                const details = await this.nmkr.getNftDetailsByTokennameThrottled(tokenName);
                const parsedMetadata = this.parseMetadata(details.metadata);

                return {
                  success: true,
                  csvRecord: {
                    fieldID: this.extractFieldId(parsedMetadata),
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
                console.error(`Error fetching NFT details for asset ${nft.assetName}:`, error);
                return {
                  success: false,
                  csvRecord: {
                    fieldID: 'Error',
                    tokenID: 'Error',
                    txID: 'Error',
                    explorerURL: 'N/A',
                  },
                };
              }
            })
          );

          return nftDetails.map((data) => data.csvRecord);
        })
      );

      return results.flat();
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
