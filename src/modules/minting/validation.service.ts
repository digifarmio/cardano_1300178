import { ConfigService } from '@/config/config.service';
import { ValidationError } from '@/modules/core/errors';
import { NmkrClient } from '@/modules/core/nmkr.client';
import { BatchMintParams, BatchMintRequest, GetNftsParams } from '@/types';

export class ValidationService {
  constructor(
    private readonly nmkrClient = new NmkrClient(),
    private readonly configService = new ConfigService()
  ) {}

  validateRequired(value: unknown, field: string): void {
    if (!value) throw new ValidationError(`${field} is required`);
  }

  validatePositiveNumber(value: number, field: string): void {
    if (value <= 0) throw new ValidationError(`${field} must be a positive number`);
  }

  validateNonNegativeNumber(value: number, field: string): void {
    if (value < 0) throw new ValidationError(`${field} must be a non-negative number`);
  }

  validateStringNumber(value: string, field: string): number {
    const num = Number(value);
    if (isNaN(num)) throw new ValidationError(`Invalid number in ${field}: ${value}`);
    return num;
  }

  validateGetNftsParams({ projectUid, state, count, page }: GetNftsParams): void {
    [projectUid, state].forEach((field, idx) =>
      this.validateRequired(field, idx === 0 ? 'projectUid' : 'state')
    );
    [count, page].forEach((num, idx) =>
      this.validatePositiveNumber(num, idx === 0 ? 'count' : 'page')
    );
  }

  validateBatchMintParams({ projectUid, receiver, count, blockchain }: BatchMintParams): void {
    [projectUid, receiver, blockchain].forEach((field, idx) =>
      this.validateRequired(field, ['projectUid', 'receiver', 'blockchain'][idx])
    );
    this.validatePositiveNumber(count, 'count');
    this.validateMaxMintLimit(count);
    if (blockchain !== 'Cardano') throw new ValidationError('Unsupported blockchain type');
  }

  validateBatchMintPayload({ reserveNfts }: BatchMintRequest): void {
    if (!reserveNfts?.length) throw new ValidationError('No NFTs provided in batch mint request');
    reserveNfts.forEach(({ nftUid, lovelace, tokencount }, index) => {
      this.validateRequired(nftUid, `NFT[${index}].nftUid`);
      this.validateNonNegativeNumber(lovelace, `NFT[${index}].lovelace`);
      this.validatePositiveNumber(tokencount, `NFT[${index}].tokencount`);
    });
  }

  async validateMintConditions(params: BatchMintParams): Promise<void> {
    const [projectDetails, nftCount, balance, conditionsMet] = await Promise.all([
      this.nmkrClient.getProjectDetails(params.projectUid),
      this.nmkrClient.getCounts(params.projectUid),
      this.nmkrClient.getMintCouponBalance(),
      this.nmkrClient.checkSaleConditions(params.projectUid, params.receiver, params.count),
    ]);

    if (projectDetails.uid !== params.projectUid) throw new ValidationError('Invalid project UID');
    if (nftCount.free < params.count) throw new ValidationError(`Not enough NFTs available.`);
    if (balance < params.count) throw new ValidationError(`Insufficient mint coupon balance.`);
    if (!conditionsMet) throw new ValidationError('Sale conditions not met');
  }

  validateReportRequest(reportId: string): void {
    if (!reportId?.trim()) throw new ValidationError('Invalid report ID');
  }

  validateMaxMintLimit(countToMint: number): void {
    const maxMintLimit = this.configService.maxMintLimit;
    if (countToMint > maxMintLimit) {
      throw new ValidationError(`Minting count exceeds total allowed limit (${maxMintLimit}).`);
    }
  }
}
