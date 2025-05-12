import { ConfigService } from '../../config/config.service';
import {
  BatchMintParams,
  BatchMintRequest,
  BatchMintResponse,
  GetNftsParams,
  UploadedFile,
} from '../../types';
import { ValidationError } from '../core/errors';
import { NmkrClient } from '../core/nmkr.client';

export class MintService {
  constructor(
    private readonly nmkrClient = new NmkrClient(),
    private readonly configService = new ConfigService()
  ) {}

  async getNftCollection(params: GetNftsParams): Promise<UploadedFile[]> {
    this.validateGetNftsParams(params);
    return this.nmkrClient.getNftCollection(params);
  }

  async mintRandomBatch(params: BatchMintParams): Promise<BatchMintResponse> {
    this.validateBatchMintParams(params);
    return this.nmkrClient.mintRandomBatch(params);
  }

  async mintSpecificBatch(
    params: BatchMintParams,
    payload: BatchMintRequest
  ): Promise<BatchMintResponse> {
    this.validateBatchMintParams(params);
    this.validateBatchMintPayload(payload);
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
}
