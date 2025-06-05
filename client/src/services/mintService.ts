import type { AxiosResponse } from 'axios';
import { apiClient } from '../lib/apiClient';
import type { MintBatchResult, ReportStatus } from '../lib/types';

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

  getUserNfts: () => {
    return apiClient.get('/user/nfts');
  },

  getNftDetailsById: (uid: string) => {
    return apiClient.get(`/nfts/${uid}`);
  },

  getTransactions: () => {
    return apiClient.get('/transactions');
  },

  mintRandom: (count: number): Promise<AxiosResponse<MintBatchResult>> => {
    return apiClient.post('/mintRandom', { count });
  },

  mintSpecific: (
    reserveNftsIds: (string | number | bigint)[]
  ): Promise<AxiosResponse<MintBatchResult>> => {
    const reserveNfts = reserveNftsIds.map((uid) => ({
      nftUid: uid.toString(),
      lovelace: import.meta.env.VITE_MINT_PRICE || 0,
      tokencount: import.meta.env.VITE_MINT_COUNT || 1,
    }));
    return apiClient.post('/mintSpecific', { reserveNfts });
  },

  generateReport(): Promise<AxiosResponse<{ data: { reportId: string; statusUrl: string } }>> {
    return apiClient.post('/reports');
  },

  getAllReports(): Promise<AxiosResponse<{ data: ReportStatus[] }>> {
    return apiClient.get('/reports');
  },

  getReportById(reportId: string): Promise<AxiosResponse<{ data: ReportStatus }>> {
    return apiClient.get(`/reports/${reportId}`);
  },

  downloadReport(reportId: string): Promise<AxiosResponse<{ data: string }>> {
    return apiClient.get(`/reports/${reportId}/download`);
  },

  deleteReport(reportId: string): Promise<AxiosResponse<{ data: { deleted: boolean } }>> {
    return apiClient.delete(`/reports/${reportId}`);
  },

  generateUserToken: (uids: string[]): Promise<AxiosResponse<{ token: string }>> => {
    return apiClient.post('/tokens/user', { fields: uids });
  },
};
