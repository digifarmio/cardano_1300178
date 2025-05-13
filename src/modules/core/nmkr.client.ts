import {
  BatchMintParams,
  BatchMintRequest,
  BatchMintResponse,
  GetNftsParams,
  UploadedFile,
} from '../../types';
import { handleAxiosError } from '../core/utils';
import { HttpClient } from './http.client';

export enum NmkrEndpoints {
  NftCollection = '/v2/GetNfts',
  MintRandom = '/v2/MintAndSendRandom',
  MintSpecific = '/v2/MintAndSendSpecific',
  ServerState = '/v2/GetServerState',
}

export class NmkrClient extends HttpClient {
  async getServerState(): Promise<{ status: string; version: string; timestamp: string }> {
    try {
      const response = await this.instance.get(NmkrEndpoints.ServerState);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  async getNftCollection(params: GetNftsParams): Promise<UploadedFile[]> {
    try {
      const { projectUid, state, count = 100, page = 1 } = params;
      const url = `${NmkrEndpoints.NftCollection}/${projectUid}/${state}/${count}/${page}`;
      const response = await this.instance.get(url);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  async mintRandomBatch(params: BatchMintParams): Promise<BatchMintResponse> {
    try {
      const { projectUid, count, receiver, blockchain } = params;
      const query = new URLSearchParams({ blockchain });
      const url = `${NmkrEndpoints.MintRandom}/${projectUid}/${count}/${receiver}?${query.toString()}`;
      const response = await this.instance.get<BatchMintResponse>(url);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  async mintSpecificBatch(
    params: BatchMintParams,
    payload: BatchMintRequest
  ): Promise<BatchMintResponse> {
    try {
      const { projectUid, receiver, blockchain } = params;
      const query = new URLSearchParams({ blockchain });
      const url = `${NmkrEndpoints.MintSpecific}/${projectUid}/${receiver}?${query.toString()}`;
      const response = await this.instance.post<BatchMintResponse>(url, payload);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }
}
