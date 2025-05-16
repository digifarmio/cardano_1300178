import {
  APIResponse,
  BatchMintParams,
  BatchMintRequest,
  GetNftsParams,
  MintCouponBalanceResponse,
  NftProjectDetails,
  SaleConditionsResponse,
  UploadFiles,
} from '../../types';
import { handleAxiosError } from './errorHandler';
import { HttpClient } from './http.client';

export enum NmkrEndpoints {
  ServerState = '/v2/GetServerState',
  MintCouponBalance = '/v2/GetMintCouponBalance',
  ProjectDetails = '/v2/GetProjectDetails',
  NftCount = '/v2/GetCounts',
  NftCollection = '/v2/GetNfts',
  SaleConditions = '/v2/CheckIfSaleConditionsMet',
  MintRandom = '/v2/MintAndSendRandom',
  MintSpecific = '/v2/MintAndSendSpecific',
  UploadFiles = '/v2/UploadNft',
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

  async getMintCouponBalance(): Promise<number> {
    try {
      const url = `${NmkrEndpoints.MintCouponBalance}`;
      const response = await this.instance.get<MintCouponBalanceResponse>(url);
      return response.data.balance;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  async getProjectDetails(projectUid: string): Promise<NftProjectDetails> {
    try {
      const url = `${NmkrEndpoints.ProjectDetails}/${projectUid}`;
      const response = await this.instance.get<NftProjectDetails>(url);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  async getNftCount(projectUid: string): Promise<number> {
    try {
      const url = `${NmkrEndpoints.ProjectDetails}/${projectUid}`;
      const response = await this.instance.get<{ free: number }>(url);
      return response.data.free;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  async getNftCollection(params: GetNftsParams): Promise<APIResponse> {
    try {
      const { projectUid, state, count = 100, page = 1 } = params;
      const url = `${NmkrEndpoints.NftCollection}/${projectUid}/${state}/${count}/${page}`;
      const response = await this.instance.get(url);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  async checkSaleConditions(
    projectUid: string,
    address: string,
    countnft: number
  ): Promise<boolean> {
    try {
      const url = `${NmkrEndpoints.SaleConditions}/${projectUid}/${address}/${countnft}`;
      const response = await this.instance.get<SaleConditionsResponse>(url);
      return response.data.conditionsMet;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  async mintRandomBatch(params: BatchMintParams): Promise<APIResponse> {
    try {
      const { projectUid, count, receiver, blockchain } = params;
      const query = new URLSearchParams({ blockchain });
      const url = `${NmkrEndpoints.MintRandom}/${projectUid}/${count}/${receiver}?${query.toString()}`;
      const response = await this.instance.get<APIResponse>(url);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  async mintSpecificBatch(
    params: BatchMintParams,
    payload: BatchMintRequest
  ): Promise<APIResponse> {
    try {
      const { projectUid, receiver, blockchain } = params;
      const query = new URLSearchParams({ blockchain });
      const url = `${NmkrEndpoints.MintSpecific}/${projectUid}/${receiver}?${query.toString()}`;
      const response = await this.instance.post<APIResponse>(url, payload);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  async uploadNft(projectUid: string, payload: UploadFiles): Promise<APIResponse> {
    try {
      const url = `${NmkrEndpoints.UploadFiles}/${projectUid}`;
      const response = await this.instance.post<APIResponse>(url, payload);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }
}
