import { BatchMintRequest, BatchMintResponse } from '../../types/mint.types';
import { HttpClient } from '../core/http.client';

export class NmkrClient extends HttpClient {
  async batchMintAssets(request: BatchMintRequest): Promise<BatchMintResponse> {
    try {
      const response = await this.instance.post('/mint/batch', request);
      return response.data;
    } catch (error) {
      throw new Error(
        `NMKR API Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
