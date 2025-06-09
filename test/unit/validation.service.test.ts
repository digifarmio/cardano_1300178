import { NotFoundError, ValidationError } from '@/modules/core/errors';
import { ConfigService } from '@/config/config.service';
import { NmkrClient } from '@/modules/core/nmkr.client';
import { ValidationService } from '@/modules/minting/validation.service';
import { Blockchain } from '@/types';

describe('ValidationService', () => {
  const configService = new ConfigService();
  const nmkrClient = new NmkrClient();
  const service = new ValidationService(nmkrClient, configService);

  describe('validateRequired', () => {
    it('throws if value is undefined', () => {
      expect(() => service.validateRequired(undefined, 'field')).toThrow(ValidationError);
    });

    it('does not throw if value is defined', () => {
      expect(() => service.validateRequired('abc', 'field')).not.toThrow();
    });
  });

  describe('validatePositiveNumber', () => {
    it('throws if number is 0 or negative', () => {
      expect(() => service.validatePositiveNumber(0, 'count')).toThrow(ValidationError);
      expect(() => service.validatePositiveNumber(-5, 'count')).toThrow(ValidationError);
    });

    it('does not throw if number is positive', () => {
      expect(() => service.validatePositiveNumber(1, 'count')).not.toThrow();
    });
  });

  describe('validateNonNegativeNumber', () => {
    it('throws if number is negative', () => {
      expect(() => service.validateNonNegativeNumber(-1, 'count')).toThrow(ValidationError);
    });

    it('does not throw if number is zero or positive', () => {
      expect(() => service.validateNonNegativeNumber(0, 'count')).not.toThrow();
      expect(() => service.validateNonNegativeNumber(5, 'count')).not.toThrow();
    });
  });

  describe('validateStringNumber', () => {
    it('throws if value is not a number', () => {
      expect(() => service.validateStringNumber('abc', 'field')).toThrow(ValidationError);
    });

    it('returns number if string is valid number', () => {
      expect(service.validateStringNumber('123', 'field')).toBe(123);
    });
  });

  describe('validateGetNftsParams', () => {
    it('validates properly with valid params', () => {
      expect(() =>
        service.validateGetNftsParams({
          projectUid: 'proj-1',
          state: 'all',
          count: 10,
          page: 1,
        })
      ).not.toThrow();
    });

    it('throws on missing or invalid params', () => {
      expect(() =>
        service.validateGetNftsParams({
          projectUid: '',
          state: '',
          count: 0,
          page: 0,
        })
      ).toThrow(ValidationError);
    });
  });

  describe('validateBatchMintParams', () => {
    it('validates properly with correct params', () => {
      expect(() =>
        service.validateBatchMintParams({
          projectUid: 'p1',
          receiver: 'addr1',
          count: 5,
          blockchain: 'Cardano',
        })
      ).not.toThrow();
    });

    it('throws on missing fields or unsupported blockchain', () => {
      expect(() =>
        service.validateBatchMintParams({
          projectUid: '',
          receiver: '',
          count: 0,
          blockchain: 'Ethereum' as Blockchain,
        })
      ).toThrow(ValidationError);
    });

    it('throws on exceeding maxMintLimit', () => {
      const limit = configService.maxMintLimit;
      expect(() =>
        service.validateBatchMintParams({
          projectUid: 'x',
          receiver: 'y',
          count: limit + 1,
          blockchain: 'Cardano',
        })
      ).toThrow(ValidationError);
    });
  });

  describe('validateBatchMintPayload', () => {
    it('validates successfully with correct payload', () => {
      expect(() =>
        service.validateBatchMintPayload({
          reserveNfts: [
            {
              nftUid: 'uid1',
              lovelace: 0,
              tokencount: 1,
            },
          ],
        })
      ).not.toThrow();
    });

    it('throws on missing or invalid nft fields', () => {
      expect(() => service.validateBatchMintPayload({ reserveNfts: [] })).toThrow(ValidationError);

      expect(() =>
        service.validateBatchMintPayload({
          reserveNfts: [
            {
              nftUid: '',
              lovelace: -1,
              tokencount: 0,
            },
          ],
        })
      ).toThrow(ValidationError);
    });
  });

  describe('validateReportRequest', () => {
    it('throws on empty report ID', () => {
      expect(() => service.validateReportRequest('')).toThrow(ValidationError);
      expect(() => service.validateReportRequest('   ')).toThrow(ValidationError);
    });

    it('does not throw on valid report ID', () => {
      expect(() => service.validateReportRequest('abc123')).not.toThrow();
    });
  });

  describe('validateMaxMintLimit', () => {
    it('throws if count exceeds maxMintLimit', () => {
      expect(() => service.validateMaxMintLimit(configService.maxMintLimit + 1)).toThrow(
        ValidationError
      );
    });

    it('does not throw if count is within limit', () => {
      expect(() => service.validateMaxMintLimit(configService.maxMintLimit)).not.toThrow();
    });
  });

  describe('validateMintConditions (real calls)', () => {
    it('throws if any condition is invalid', async () => {
      await expect(
        service.validateMintConditions({
          projectUid: 'invalid-project',
          receiver: 'invalid-addr',
          count: 99999,
          blockchain: 'Cardano',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });
});
