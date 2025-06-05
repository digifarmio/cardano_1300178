import type { Metadata } from './types';

export const fieldStatuses = ['Ready', 'Pending', 'In Progress', 'Minted'];
export const nftStatuses = ['Claimable', 'Owned', 'Locked'];
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'queued':
      return 'orange';
    case 'processing':
      return 'blue';
    case 'completed':
      return 'green';
    case 'failed':
      return 'red';
    default:
      return 'gray';
  }
};

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

/**
 * Converts Lovelace (smallest Cardano unit) to ADA.
 * Example: 1430000 => 1.430000
 */
export function lovelaceToAda(value: number | string): string {
  const num = Number(value);
  if (!num || isNaN(num)) {
    return '0.000000';
  }
  const ada = num / 1_000_000;
  return ada.toFixed(6);
}

/**
 * Converts ADA to Lovelace.
 * Example: 1.43 => 1430000
 */
export function adaToLovelace(value: number | string): number {
  const num = Number(value);
  if (!num || isNaN(num)) {
    return 0;
  }
  return Math.round(num * 1_000_000);
}
