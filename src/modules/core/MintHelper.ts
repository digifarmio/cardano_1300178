import { ValidationError } from '../../modules/core/errors';
import { BatchMintRequest } from '../../types';

export class MintHelper {
  /**
   * Generate mint payload from CSV string
   * @param csv CSV format: "nftUid,lovelace,tokencount\n..."
   */
  static fromCSV(csv: string): BatchMintRequest {
    const lines = csv.trim().split('\n');
    const reserveNfts = lines
      .map((line, i) => {
        // Skip empty lines
        if (!line.trim()) return null;

        const [nftUid, lovelace, tokencount] = line.split(',');

        if (!nftUid || !lovelace || !tokencount) {
          throw new ValidationError(
            `Invalid CSV format at line ${i + 1}. Expected: nftUid,lovelace,tokencount`
          );
        }

        return {
          nftUid: nftUid.trim(),
          lovelace: Number(lovelace),
          tokencount: Number(tokencount) || 1,
        } as const;
      })
      .filter((entry): entry is Exclude<typeof entry, null> => entry !== null);

    if (reserveNfts.length === 0) {
      throw new ValidationError('CSV file contains no valid entries');
    }

    return { reserveNfts };
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
