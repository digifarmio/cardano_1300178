import { ConfigService } from '@/config/config.service';
import { BatchProcessingError } from '@/modules/core/errors';
import { StorageService } from '@/modules/minting/storage.service';
import { ValidationService } from '@/modules/minting/validation.service';
import { BatchRecord, MintAndSendResult } from '@/types';
import csv from 'csvtojson';
import { v4 as uuidv4 } from 'uuid';

export class BatchProcessingService {
  constructor(
    private readonly config = new ConfigService(),
    private readonly validationService = new ValidationService(),
    private readonly storageService = new StorageService()
  ) {}

  async createMintRequestFromCSV(csvContent: string) {
    try {
      const jsonArray = await csv().fromString(csvContent);
      if (jsonArray.length === 0) throw new BatchProcessingError('Empty CSV file');

      const headers = Object.keys(jsonArray[0]);
      this.validationService.validateCSVHeaders(headers, ['nftUid', 'lovelace', 'tokencount']);

      return {
        reserveNfts: jsonArray.map((row) => ({
          nftUid: row.nftUid,
          lovelace: this.validationService.validateStringNumber(row.lovelace, 'lovelace'),
          tokencount: this.validationService.validateStringNumber(row.tokencount, 'tokencount'),
        })),
      };
    } catch (error) {
      throw new BatchProcessingError(
        'Failed to parse CSV content',
        undefined,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  createMintRequestFromTemplate(nftUid: string, count: number, lovelace: number) {
    this.validationService.validateRequired(nftUid, 'nftUid');
    this.validationService.validatePositiveNumber(count, 'count');
    this.validationService.validateNonNegativeNumber(lovelace, 'lovelace');

    return {
      reserveNfts: Array(count).fill({ nftUid, lovelace, tokencount: 1 }),
    };
  }

  async createBatchRecord(record: BatchRecord): Promise<BatchRecord> {
    return this.storageService.storeBatchRecord(record);
  }

  async getBatchRecords(): Promise<BatchRecord[]> {
    return this.storageService.getBatchRecords();
  }

  async processInBatches(
    totalCount: number,
    processor: (batchSize: number, startIndex?: number) => Promise<MintAndSendResult>
  ): Promise<BatchRecord[]> {
    this.validationService.validatePositiveNumber(totalCount, 'totalCount');
    const batchSize = this.config.mintBatchSize;

    const batchPromises = Array.from({ length: Math.ceil(totalCount / batchSize) }, (_, index) => {
      const startIdx = index * batchSize;
      const currentBatchSize = Math.min(batchSize, totalCount - startIdx);
      const batchId = uuidv4();

      return processor(currentBatchSize, startIdx)
        .then((result) =>
          this.createBatchRecord({
            id: batchId,
            size: currentBatchSize,
            startIdx,
            endIdx: startIdx + currentBatchSize - 1,
            success: true,
            result,
            status: 'completed',
            createdAt: new Date().toISOString(),
          })
        )
        .catch((error) =>
          this.createBatchRecord({
            id: batchId,
            size: currentBatchSize,
            startIdx,
            endIdx: startIdx + currentBatchSize - 1,
            success: false,
            result: {},
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            createdAt: new Date().toISOString(),
          })
        );
    });

    const results = await Promise.allSettled(batchPromises);

    const batchRecords = results
      .filter((res) => res.status === 'fulfilled')
      .map((res) => (res as PromiseFulfilledResult<BatchRecord>).value);

    const errors = results
      .filter((res) => res.status === 'rejected')
      .map((res) => (res as PromiseRejectedResult).reason);

    if (errors.length > 0) {
      throw new BatchProcessingError(
        `Completed with ${errors.length} failed batches. First error: ${errors[0]}`,
        undefined,
        { batchRecords }
      );
    }

    return batchRecords;
  }
}
