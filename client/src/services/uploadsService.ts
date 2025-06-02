import { apiClient } from '../lib/apiClient';

export const UploadsService = {
  processCSV: (nftBucket: string, csvBucket: string) => {
    return apiClient.post('/get-nft/process-csv', { nftBucket, csvBucket });
  },
};
