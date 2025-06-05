import { NmkrClient } from '@/modules/core/nmkr.client';
import { ValidationService } from '@/modules/minting/validation.service';
import {
  APIResponse,
  BatchMintParams,
  BatchMintRequest,
  GetNftsParams,
  NftCountResponse,
  NftDetailsResponse,
  ProjectTransaction,
} from '@/types';

export class MintService {
  constructor(
    private nmkrClient = new NmkrClient(),
    private validationService = new ValidationService()
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

  async getUserNfts(nftUids: string[]): Promise<NftDetailsResponse[]> {
    this.validationService.validateRequired(nftUids, 'nftUids');
    const promises = nftUids.map((uid) => this.nmkrClient.getNftDetailsThrottled(uid));
    return Promise.all(promises);
  }

  async getNftDetailsById(uid: string): Promise<NftDetailsResponse> {
    this.validationService.validateRequired(uid, 'uid');
    return this.nmkrClient.getNftDetailsById(uid);
  }

  async getTransactions(): Promise<ProjectTransaction[]> {
    return this.nmkrClient.getTransactions();
  }

  async mintRandom(params: BatchMintParams) {
    await this.validateAndCheck(params);
    return this.nmkrClient.mintRandom(params);
  }

  async mintSpecific(params: BatchMintParams, payload: BatchMintRequest) {
    await this.validateAndCheck(params, payload);
    return await this.nmkrClient.mintSpecific(params, payload);
  }

  private async validateAndCheck(params: BatchMintParams, payload?: BatchMintRequest) {
    this.validationService.validateBatchMintParams(params);
    if (payload) this.validationService.validateBatchMintPayload(payload);
    return this.validationService.validateMintConditions(params);
  }
}
