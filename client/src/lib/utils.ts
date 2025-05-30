import type { Metadata } from './types';

export const fieldStatuses = ['Ready', 'Pending', 'In Progress', 'Minted'];
export const nftStatuses = ['Claimable', 'Owned', 'Locked'];

export const generateNftsRecords = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    fieldId: (i + 1).toString(),
    size: Math.floor(Math.random() * 91) + 10,
    sustainability: Math.floor(Math.random() * 91) + 10,
    status: nftStatuses[i % nftStatuses.length],
  }));

export function parseMetadata(jsonString: string): Metadata | null {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed['721']) return null;
    const block721 = parsed['721'];

    const policyIdKey = Object.keys(block721).find((key) => key !== 'version');
    if (!policyIdKey) return null;

    const metadataObj = block721[policyIdKey];
    const nftKey = Object.keys(metadataObj)[0];
    if (!nftKey) return null;

    const raw = metadataObj[nftKey];
    if (!raw) return null;

    return raw;
  } catch (e) {
    console.error('Failed to parse or normalize metadata:', e);
    return null;
  }
}
