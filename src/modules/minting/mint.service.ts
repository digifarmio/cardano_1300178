import { ConfigService } from '../../config/config.service';
import { APIResponse, BatchMintParams, BatchMintRequest, GetNftsParams } from '../../types';
import { NMKRAPIError, ValidationError } from '../core/errors';
import { NmkrClient } from '../core/nmkr.client';

export class MintService {
  private readonly nmkrClient = new NmkrClient();
  private readonly config = new ConfigService();

  async getNftCollection(params: GetNftsParams): Promise<APIResponse> {
    this.validateGetNftsParams(params);
    return this.nmkrClient.getNftCollection(params);
  }

  async mintRandomBatch(params: BatchMintParams) {
    this.validateBatchMintParams(params);
    await this.validateMintConditions(params);

    const totalCount = params.count;

    if (totalCount <= this.config.mintBatchSize) {
      return this.nmkrClient.mintRandomBatch(params);
    }

    return this.processBatchRequests(totalCount, (batchSize) => {
      const batchParams = { ...params, count: batchSize };
      return this.nmkrClient.mintRandomBatch(batchParams);
    });
  }

  async mintSpecificBatch(params: BatchMintParams, payload: BatchMintRequest) {
    this.validateBatchMintParams(params);
    this.validateBatchMintPayload(payload);
    await this.validateMintConditions(params);

    const nfts = payload.reserveNfts;
    const totalCount = nfts.length;

    if (totalCount <= this.config.mintBatchSize) {
      return this.nmkrClient.mintSpecificBatch(params, payload);
    }

    return this.processBatchRequests(totalCount, (_, startIdx, endIdx) => {
      const batchNfts = nfts.slice(startIdx, endIdx);
      const batchParams = { ...params, count: batchNfts.length };
      const batchPayload = { ...payload, reserveNfts: batchNfts };
      return this.nmkrClient.mintSpecificBatch(batchParams, batchPayload);
    });
  }

  private async processBatchRequests<T>(
    totalCount: number,
    processFn: (batchSize: number, startIndex: number, endIndex: number) => Promise<T>
  ) {
    const batchSize = this.config.mintBatchSize;
    const batches = Math.ceil(totalCount / batchSize);
    const promises: Promise<T>[] = [];

    for (let i = 0; i < batches; i++) {
      const startIdx = i * batchSize;
      const endIdx = Math.min(startIdx + batchSize, totalCount);
      const currentBatchSize = endIdx - startIdx;

      if (currentBatchSize > 0) {
        promises.push(processFn(currentBatchSize, startIdx, endIdx));
      }
    }

    const results = await Promise.allSettled(promises);
    return this.processBatchResults(results);
  }

  private processBatchResults<T>(results: PromiseSettledResult<T>[]) {
    const success = results
      .filter((result): result is PromiseFulfilledResult<T> => result.status === 'fulfilled')
      .map((result) => result.value);

    const errors = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result) => result.reason);

    return {
      successCount: success.length,
      errorCount: errors.length,
      success,
      errors,
    };
  }

  // ======== Validation Methods ========
  private validateGetNftsParams(params: GetNftsParams): void {
    if (!params.projectUid) throw new ValidationError('Project UID is required', 'projectUid');
    if (!params.state) throw new ValidationError('State is required', 'state');
    if (params.count <= 0) throw new ValidationError('Count must be positive', 'count');
    if (params.page <= 0) throw new ValidationError('Page must be positive', 'page');
  }

  private validateBatchMintParams(params: BatchMintParams): void {
    if (!params.projectUid) throw new ValidationError('Project UID is required', 'projectUid');
    if (!params.receiver) throw new ValidationError('Receiver address is required', 'receiver');
    if (!params.count) throw new ValidationError('Count is required', 'count');
    if (!params.blockchain) throw new ValidationError('Blockchain is required', 'blockchain');
  }

  private validateBatchMintPayload(payload: BatchMintRequest): void {
    if (!payload?.reserveNfts?.length) {
      throw new ValidationError('At least one NFT must be specified', 'reserveNfts');
    }

    payload.reserveNfts.forEach((nft, index) => {
      if (!nft.nftUid)
        throw new ValidationError(
          `NFT UID required for item ${index}`,
          `reserveNfts[${index}].nftUid`
        );
      if (nft.lovelace < 0)
        throw new ValidationError(
          `Lovelace must be positive for item ${index}`,
          `reserveNfts[${index}].lovelace`
        );
      if (nft.tokencount <= 0)
        throw new ValidationError(
          `Token count must be positive for item ${index}`,
          `reserveNfts[${index}].tokencount`
        );
    });
  }

  private async validateMintConditions(params: BatchMintParams): Promise<void> {
    const countToMint = params.count;

    try {
      const [projectDetails, nftCount, balance, saleConditionsMet] = await Promise.all([
        this.nmkrClient.getProjectDetails(params.projectUid),
        this.nmkrClient.getNftCount(params.projectUid),
        this.nmkrClient.getMintCouponBalance(),
        this.nmkrClient.checkSaleConditions(params.projectUid, params.receiver, countToMint),
      ]);
      if (projectDetails.uid !== params.projectUid) {
        throw new ValidationError('Invalid or non-existent Project UID', 'projectUid');
      }
      if (nftCount.free < countToMint) {
        throw new ValidationError(
          `Insufficient NFTs available. Requested: ${countToMint}, Available: ${nftCount.free}`,
          'count'
        );
      }
      if (balance < countToMint) {
        throw new ValidationError(
          `Insufficient mint coupon balance. Required: ${countToMint}, Available: ${balance}`,
          'count'
        );
      }
      if (!saleConditionsMet) {
        throw new ValidationError('Sale conditions not met for this address', 'receiver');
      }
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new NMKRAPIError(
        'Failed to validate mint conditions',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}
