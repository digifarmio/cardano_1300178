import { ConfigService } from '@/config/config.service';
import { NmkrClient } from '@/modules/core/nmkr.client';
import { BatchProcessingService } from '@/modules/minting/batch-processing.service';
import { ReportService } from '@/modules/minting/report.service';
import { ValidationService } from '@/modules/minting/validation.service';
import {
  APIResponse,
  BatchMintParams,
  BatchMintRequest,
  BatchProcessingSummary,
  BatchRecord,
  CustomerTransaction,
  GetNftsParams,
  MintAndSendResult,
  NftCountResponse,
  NftDetailsResponse,
  ReportStatus,
} from '@/types';

export class MintService {
  constructor(
    private nmkrClient = new NmkrClient(),
    private config = new ConfigService(),
    private reportService = new ReportService(),
    private validationService = new ValidationService(),
    private batchService = new BatchProcessingService()
  ) {}

  async getBalance(): Promise<APIResponse> {
    return this.nmkrClient.getBalance();
  }

  async getCounts(projectUid: string): Promise<NftCountResponse> {
    this.validationService.validateRequired(projectUid, 'projectUid');
    return this.nmkrClient.getCounts(projectUid);
  }

  async getNfts(params: GetNftsParams): Promise<APIResponse> {
    this.validationService.validateGetNftsParams(params);
    return this.nmkrClient.getNfts(params);
  }

  async getNftDetailsById(uid: string): Promise<NftDetailsResponse> {
    this.validationService.validateRequired(uid, 'uid');
    return this.nmkrClient.getNftDetailsById(uid);
  }

  async getTransactions(): Promise<CustomerTransaction[]> {
    return this.nmkrClient.getTransactions();
  }

  async mintRandomBatch(params: BatchMintParams): Promise<BatchProcessingSummary> {
    await this.validateAndCheck(params);
    return this.processMintBatch(params.count, (batchSize: number) =>
      this.nmkrClient.mintRandomBatch({ ...params, count: batchSize })
    );
  }

  async mintSpecificBatch(
    params: BatchMintParams,
    payload: BatchMintRequest
  ): Promise<BatchProcessingSummary> {
    await this.validateAndCheck(params, payload);
    const { reserveNfts } = payload;
    const count = reserveNfts.length;

    let mintFn;

    if (count <= this.config.mintBatchSize) {
      mintFn = () => this.nmkrClient.mintSpecificBatch({ ...params, count }, payload);
    } else {
      mintFn = (batchSize: number, startIndex = 0) => {
        const slicedNfts = reserveNfts.slice(startIndex, startIndex + batchSize);
        return this.nmkrClient.mintSpecificBatch(
          { ...params, count: batchSize },
          { ...payload, reserveNfts: slicedNfts }
        );
      };
    }

    return this.processMintBatch(count, mintFn);
  }

  async initiateReportGeneration(): Promise<{ reportId: string; statusUrl: string }> {
    return this.reportService.generateReport();
  }

  async getReportStatus(reportId: string): Promise<ReportStatus> {
    return this.reportService.getReportStatus(reportId);
  }

  async getReportFile(reportId: string, type: 'csv' | 'pdf'): Promise<string> {
    return this.reportService.getReportFile(reportId, type);
  }

  private async validateAndCheck(params: BatchMintParams, payload?: BatchMintRequest) {
    this.validationService.validateBatchMintParams(params);
    if (payload) this.validationService.validateBatchMintPayload(payload);
    return this.validationService.validateMintConditions(params);
  }

  private async processMintBatch(
    count: number,
    mintFn: (batchSize: number, startIndex?: number) => Promise<MintAndSendResult>
  ): Promise<BatchProcessingSummary> {
    const batchRecords = await this.batchService.processInBatches(count, mintFn);
    return this.combineBatchResults(batchRecords);
  }

  private combineBatchResults(batchRecords: BatchRecord[]): BatchProcessingSummary {
    return {
      totalBatches: batchRecords.length,
      successfulBatches: batchRecords.filter((r) => r.success).length,
      failedBatches: batchRecords.filter((r) => !r.success).length,
      firstError: batchRecords.find((r) => !r.success)?.error,
      transactionIds: batchRecords
        .flatMap((r) => r.result.sendedNft?.map((nft) => nft.txHashSolanaTransaction) || [])
        .filter((txId): txId is string => typeof txId === 'string'),
      failedItems: batchRecords
        .filter((r) => !r.success)
        .map((r) => ({ error: r.error || 'Unknown error', batchId: r.id })),
      batches: batchRecords,
    };
  }
}
