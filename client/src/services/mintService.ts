import type { AxiosResponse } from 'axios';
import { apiClient } from '../lib/apiClient';
import type { ReportStatus } from '../lib/types';

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

  getTransactions: () => {
    return apiClient.get('/transactions');
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

  generateReport(): Promise<AxiosResponse<{ data: { reportId: string; statusUrl: string } }>> {
    return apiClient.post('/reports');
  },

  getReportStatus(reportId: string): Promise<AxiosResponse<{ data: ReportStatus }>> {
    return apiClient.get(`/reports/${reportId}`);
  },

  getReportFile(reportId: string, type: 'csv' | 'pdf'): Promise<AxiosResponse<{ data: string }>> {
    return apiClient.get(`/reports/${reportId}/download/${type}`);
  },
};
