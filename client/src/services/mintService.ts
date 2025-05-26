import { apiClient } from '../lib/apiClient';

export const MintService = {
  getBalance: () => {
    return apiClient.get(`/balance`);
  },

  getCounts: () => {
    return apiClient.get(`/counts`);
  },

  getNfts: (state: string, page: number, limit: number) => {
    return apiClient.get(`/nfts/${state}/${limit}/${page}`);
  },

  getNftDetailsById: (uid: string) => {
    return apiClient.get(`/nfts/${uid}`);
  },

  mintRandomBatch: (count: number) => {
    return apiClient.post('/mint/random-batch', { count });
  },

  mintSpecificBatch: (reserveNftsIds: (string | number | bigint)[]) => {
    const reserveNfts = reserveNftsIds.map((uid) => ({
      nftUid: uid.toString(),
      lovelace: import.meta.env.VITE_MINT_PRICE || 0,
      tokencount: import.meta.env.VITE_MINT_COUNT || 1,
    }));
    return apiClient.post('/mint/specific-batch', { reserveNfts });
  },
};
