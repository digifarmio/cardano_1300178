import type { AdminStatKey } from './types';

export const getStatLabel = (key: AdminStatKey): string => {
  const labels: Record<AdminStatKey, string> = {
    total: 'Total Fields',
    sold: 'Minted NFT',
    free: 'Ready to Mint',
    reserved: 'Processing',
    error: 'Error',
  };
  return labels[key];
};

export const getStatColor = (key: AdminStatKey): string | undefined => {
  const colors: Partial<Record<AdminStatKey, string>> = {
    sold: 'blue',
    free: 'green',
    reserved: 'orange',
    error: 'red',
  };
  return colors[key];
};
