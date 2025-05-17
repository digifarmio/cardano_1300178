import { ConfigService } from '../../config/config.service';
import {
  APIResponse,
  BatchMintParams,
  BatchMintRequest,
  CustomerTransaction,
  GetNftsParams,
  MintCouponBalanceResponse,
  NftCount,
  NftProjectDetails,
  SaleConditionsResponse,
} from '../../types';
import { NMKRAPIError } from '../core/errors';
import { handleAxiosError } from './errorHandler';
import { HttpClient } from './http.client';

export enum NmkrEndpoints {
  ServerState = '/v2/GetServerState',
  MintCouponBalance = '/v2/GetMintCouponBalance',
  ProjectDetails = '/v2/GetProjectDetails',
  SaleConditions = '/v2/CheckIfSaleConditionsMet',
  MintRandom = '/v2/MintAndSendRandom',
  MintSpecific = '/v2/MintAndSendSpecific',
  CustomerTransactions = '/v2/GetCustomerTransactions',
  NftCount = '/v2/GetCounts',
  NftCollection = '/v2/GetNfts',
  NftDetailsById = '/v2/GetNftDetailsById',
  NftDetailsByToken = '/v2/GetNftDetailsByTokenname',
}

export class NmkrClient extends HttpClient {
  private readonly configService: ConfigService = new ConfigService();

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

  async getTransactions(): Promise<CustomerTransaction[]> {
    try {
      const url = `${NmkrEndpoints.CustomerTransactions}/${this.configService.customerId}`;
      const response = await this.instance.get<CustomerTransaction[]>(url, {
        params: { exportOptions: 'Json' },
      });
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  async getTransaction(transactionId: string): Promise<CustomerTransaction> {
    try {
      const url = `${NmkrEndpoints.CustomerTransactions}/${this.configService.customerId}`;
      const response = await this.instance.get<CustomerTransaction[]>(url, {
        params: { exportOptions: 'Json' },
      });

      const tx = response.data.find((t) => t.transactionid === transactionId);
      if (!tx) throw new NMKRAPIError('Transaction not found');

      return { ...tx, blockchain: tx.blockchain };
    } catch (error) {
      handleAxiosError(error);
    }
  }

  async getLatestTransaction(): Promise<CustomerTransaction> {
    try {
      const url = `${NmkrEndpoints.CustomerTransactions}/${this.configService.customerId}`;
      const response = await this.instance.get<CustomerTransaction[]>(url, {
        params: { exportOptions: 'Json' },
      });

      const tx = response.data[0];
      if (!tx) throw new NMKRAPIError('Transaction not found');

      return tx;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  async getNftCount(projectUid: string): Promise<NftCount> {
    try {
      const url = `${NmkrEndpoints.NftCount}/${projectUid}`;
      const response = await this.instance.get(url);
      return response.data;
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

  async getNftDetailsById(nftuid: string): Promise<APIResponse> {
    try {
      const url = `${NmkrEndpoints.NftDetailsById}/${nftuid}`;
      const response = await this.instance.get(url);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  async getNftDetailsByToken(projectUid: string, assetName: string): Promise<APIResponse> {
    try {
      const url = `${NmkrEndpoints.NftDetailsByToken}/${projectUid}/${assetName}`;
      const response = await this.instance.get(url);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }
}
