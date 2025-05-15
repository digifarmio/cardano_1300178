import { ConfigService } from '../../config/config.service';
import { APIResponse, BatchMintParams, BatchMintRequest, GetNftsParams } from '../../types';
import { NMKRAPIError, ValidationError } from '../core/errors';
import { NmkrClient } from '../core/nmkr.client';

export class MintService {
  constructor(
    private readonly nmkrClient = new NmkrClient(),
    private readonly configService = new ConfigService()
  ) {}

  async getNftCollection(params: GetNftsParams): Promise<APIResponse> {
    this.validateGetNftsParams(params);
    return this.nmkrClient.getNftCollection(params);
  }

  async mintRandomBatch(params: BatchMintParams): Promise<APIResponse> {
    this.validateBatchMintParams(params);
    await this.validateMintConditions(params);
    return this.nmkrClient.mintRandomBatch(params);
  }

  async mintSpecificBatch(
    params: BatchMintParams,
    payload: BatchMintRequest
  ): Promise<APIResponse> {
    this.validateBatchMintParams(params);
    this.validateBatchMintPayload(payload);
    await this.validateMintConditions(params);
    return this.nmkrClient.mintSpecificBatch(params, payload);
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
    if (!params.receiver) throw new ValidationError('Receiver addr is required', 'receiver');
    if (!params.blockchain) throw new ValidationError('Blockchain is required', 'blockchain');
  }

  private validateBatchMintPayload(payload: BatchMintRequest): void {
    if (!payload?.reserveNfts?.length) {
      throw new ValidationError('At least one NFT must be specified', 'reserveNfts');
    }

    const batchSize = this.configService.batchSize;
    if (payload.reserveNfts.length > batchSize) {
      throw new ValidationError(`Maximum batch size is ${batchSize}`, 'reserveNfts');
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
    const countToMint = Number(params.count || 1);

    if (!['Cardano', 'Ethereum', 'Solana'].includes(params.blockchain)) {
      throw new ValidationError('Unsupported blockchain type', 'blockchain');
    }

    if (!params.receiver?.trim()) {
      throw new ValidationError('Receiver address cannot be empty', 'receiver');
    }

    try {
      // Check project details
      const projectDetails = await this.nmkrClient.getProjectDetails(params.projectUid);
      if (projectDetails.uid !== params.projectUid) {
        throw new ValidationError('Invalid or non-existent Project UID', 'projectUid');
      }

      // Check available NFTs
      const freeNftCount = await this.nmkrClient.getNftCount(params.projectUid);
      if (freeNftCount < countToMint) {
        throw new ValidationError(
          `Insufficient NFTs available to mint. Requested: ${countToMint}, Available: ${freeNftCount}`,
          'count'
        );
      }

      // Check mint coupon balance
      const balance = await this.nmkrClient.getMintCouponBalance();
      if (balance < countToMint) {
        throw new ValidationError(
          `Insufficient mint coupon balance. Required: ${countToMint}, Available: ${balance}`,
          'count'
        );
      }

      // Check sale conditions last
      const conditionsMet = await this.nmkrClient.checkSaleConditions(
        params.projectUid,
        params.receiver,
        countToMint
      );

      if (!conditionsMet) {
        throw new ValidationError('Sale conditions not met for this address', 'receiver');
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new NMKRAPIError(
        'Failed to validate mint conditions',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}
