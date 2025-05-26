import { ConfigService } from '@/config/config.service';
import { NmkrClient } from '@/modules/core/nmkr.client';
import { ExplorerService } from '@/modules/minting/explorer.service';
import { StorageService } from '@/modules/minting/storage.service';
import { BatchRecord, CsvRecord, PdfRecord, ReportStatus } from '@/types';
import { createObjectCsvStringifier } from 'csv-writer';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';

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

  async getReportFile(id: string, type: 'csv' | 'pdf'): Promise<string> {
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

      const { csvData, pdfData } = await this.prepareData(batches);

      const [csvPath, pdfPath] = await Promise.all([
        this.generateCsv(reportId, csvData),
        this.generatePdf(reportId, pdfData),
      ]);

      await this.storageService.updateStatus({
        id: reportId,
        status: 'completed',
        updatedAt: new Date().toISOString(),
        csvPath,
        pdfPath,
      });
    } catch (error) {
      const statusUpdate = {
        id: reportId,
        updatedAt: new Date().toISOString(),
      };

      if (error instanceof Error && error.message.includes('Please try again later.')) {
        await this.storageService.updateStatus({
          ...statusUpdate,
          status: 'processing',
          error: {
            message: error instanceof Error ? error.message : String(error),
            code: 'PROCESSING_ERROR',
          },
        });
      } else {
        await this.storageService.updateStatus({
          ...statusUpdate,
          status: 'failed',
          error: {
            message: error instanceof Error ? error.message : 'Report processing failed',
            code: 'PROCESSING_ERROR',
          },
        });
      }
      throw error;
    }
  }

  private async prepareData(batches: BatchRecord[]) {
    try {
      let allNftsHaveTxHash = true;
      let missingTxNfts: string[] = [];

      const results = await Promise.all(
        batches.map(async (batch) => {
          const nfts = batch.success
            ? (batch.result.sendedNft ?? []).filter((nft) => nft.name)
            : [];

          const nftDetails = await Promise.all(
            nfts.map(async (nft) => {
              try {
                const details = await this.nmkr.getNftDetailsThrottled(nft.uid);

                if (!details.initialminttxhash) {
                  allNftsHaveTxHash = false;
                  missingTxNfts.push(nft.name || 'Unknown NFT');
                }

                return {
                  success: true,
                  hasTxHash: !!details.initialminttxhash,
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
                  pdfNft: {
                    name: nft.name || 'Unknown NFT',
                    assetName: details.assetname,
                    fingerprint: details.fingerprint,
                    txID: details.initialminttxhash || 'Pending',
                    explorerURL: details.initialminttxhash
                      ? this.explorer.getExplorerUrl(
                          details.mintedOnBlockchain,
                          details.initialminttxhash
                        )
                      : 'N/A',
                    metadata: details.metadata,
                    policyId: details.policyid,
                    receiverAddress: details.receiveraddress,
                    ipfsHash: details.ipfshash,
                    ipfsGatewayAddress: details.ipfsGatewayAddress,
                  },
                };
              } catch (error) {
                console.error(`Error fetching NFT details for ${nft.name}:`, error);
                allNftsHaveTxHash = false;
                missingTxNfts.push(nft.name || 'Unknown NFT');

                return {
                  success: false,
                  hasTxHash: false,
                  csvRecord: {
                    fieldID: nft.name || 'Unknown NFT',
                    tokenID: 'Error',
                    txID: 'Error',
                    explorerURL: 'N/A',
                  },
                  pdfNft: {
                    name: nft.name || 'Unknown NFT',
                    assetName: 'Error',
                    fingerprint: 'N/A',
                    txID: 'Error',
                    explorerURL: 'N/A',
                    metadata: 'N/A',
                    policyId: 'N/A',
                    receiverAddress: 'N/A',
                    ipfsHash: 'N/A',
                    ipfsGatewayAddress: 'N/A',
                  },
                };
              }
            })
          );

          return {
            csvRecords: nftDetails.map((d) => d.csvRecord),
            pdfRecord: {
              batchId: batch.id,
              status: batch.status,
              createdAt: batch.createdAt,
              error: batch.error,
              nfts: nftDetails.map((d) => d.pdfNft),
              successCount: nftDetails.filter((d) => d.success).length,
              errorCount: nftDetails.filter((d) => !d.success).length,
            },
            allNftsHaveTxHash: nftDetails.every((d) => d.hasTxHash),
          };
        })
      );

      if (!allNftsHaveTxHash) {
        throw new Error(
          `Report cannot be completed. Missing blockchain transactions for NFTs: ${missingTxNfts.join(', ')}. Please try again later.`
        );
      }

      return {
        csvData: results.flatMap((r) => r.csvRecords),
        pdfData: results.map((r) => r.pdfRecord),
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

  private async generatePdf(reportId: string, data: PdfRecord[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ autoFirstPage: false });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          const url = await this.storageService.storeReportFile(reportId, pdfBuffer, 'pdf');
          resolve(url);
        } catch (error) {
          console.error('Error storing PDF:', error);
          reject(new Error('Failed to store PDF report'));
        }
      });
      doc.on('error', (error) => {
        console.error('PDF generation error:', error);
        reject(new Error('Failed to generate PDF report'));
      });

      // Generate PDF content
      data.forEach((record) => {
        doc
          .addPage()
          .fontSize(16)
          .text(`NFT Minting Report - Batch ${record.batchId}`, { align: 'center' })
          .moveDown(2)
          .fontSize(12)
          .text(`Batch ID: ${record.batchId}`)
          .text(`Status: ${record.status}`)
          .text(`Created At: ${record.createdAt}`);

        if (record.error) {
          doc.fillColor('red').text(`Error: ${record.error}`).fillColor('black').moveDown();
        } else {
          doc.moveDown();
        }

        if (record.nfts.length) {
          doc.fontSize(10).text('NFT Details:', { underline: true }).moveDown(0.5);

          record.nfts.forEach((nft, index) => {
            doc
              .fontSize(10)
              .text(`- NFT ${index + 1}`)
              .text(`  NFT Name: ${nft.name}`)
              .text(`  Asset Name: ${nft.assetName}`)
              .text(`  Fingerprint: ${nft.fingerprint}`)
              .text(`  TX ID: ${nft.txID}`)
              .text(`  Explorer URL: ${nft.explorerURL}`)
              .text(`  Metadata: ${JSON.stringify(nft.metadata, null, 2)}`)
              .text(`  Policy ID: ${nft.policyId}`)
              .text(`  Receiver Address: ${nft.receiverAddress}`)
              .text(`  IPFS Hash: ${nft.ipfsHash}`)
              .text(`  IPFS Gateway Address: ${nft.ipfsGatewayAddress}`)
              .moveDown(0.5);
          });
        } else {
          doc.text('No NFTs were processed in this batch.').moveDown(0.5);
        }
      });

      doc.end();
    });
  }
}
