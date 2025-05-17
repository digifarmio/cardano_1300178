import { ValidationError } from '@/modules/core/errors';
import { BatchMintRequest } from '@/types';
import csvParser from 'csvtojson';

interface ParsedCsvRow {
  nftUid: string;
  lovelace: string;
  tokencount: string;
}

export class MintHelper {
  /**
   * Generate mint payload from CSV string using csvtojson library
   * @param csv CSV format: "nftUid,lovelace,tokencount\n..."
   */
  static async fromCSV(csv: string): Promise<BatchMintRequest> {
    try {
      const parseOpts = {
        noheader: false,
        headers: ['nftUid', 'lovelace', 'tokencount'],
        trim: true,
        ignoreEmpty: true,
      };

      const parsedData: ParsedCsvRow[] = await csvParser(parseOpts).fromString(csv);

      if (parsedData.length === 0) {
        throw new ValidationError('CSV file contains no valid entries');
      }

      const reserveNfts = parsedData.map((item: ParsedCsvRow, index: number) => {
        if (!item.nftUid || !item.lovelace) {
          throw new ValidationError(
            `Missing required fields at row ${index + 1}. Both nftUid and lovelace are required.`
          );
        }

        return {
          nftUid: item.nftUid.trim(),
          lovelace: Number(item.lovelace),
          tokencount: Number(item.tokencount) || 1,
        } as const;
      });

      return { reserveNfts };
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        throw error;
      }
      if (error && typeof error === 'object' && 'message' in error) {
        throw new ValidationError(`Failed to parse CSV: ${error.message}`);
      }
      throw new ValidationError('Failed to parse CSV: Unknown error');
    }
  }

  /**
   * Generate bulk mint payload for identical NFTs
   * @param nftUid The NFT template UID
   * @param count Number of NFTs to mint
   * @param lovelace Lovelace amount per NFT
   */
  static bulkTemplate(nftUid: string, count: number, lovelace: number): BatchMintRequest {
    return {
      reserveNfts: Array(count).fill({
        nftUid,
        lovelace,
        tokencount: 1,
      }),
    };
  }

  /**
   * Generate payload from array of NFT UIDs with fixed price
   * @param nftUids Array of NFT UIDs
   * @param lovelace Lovelace amount per NFT
   */
  static fromUidArray(nftUids: string[], lovelace: number): BatchMintRequest {
    return {
      reserveNfts: nftUids.map((nftUid) => ({
        nftUid,
        lovelace,
        tokencount: 1,
      })),
    };
  }
}
