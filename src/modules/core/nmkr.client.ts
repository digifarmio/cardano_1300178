import { AxiosError } from 'axios';
import pLimit from 'p-limit';
import pRetry from 'p-retry';
import { ConfigService } from '@/config/config.service';
import { handleAxiosError } from '@/modules/core/errorHandler';
import { NotFoundError } from '@/modules/core/errors';
import { HttpClient } from '@/modules/core/http.client';
import {
  APIResponse,
  BatchMintParams,
  BatchMintRequest,
  GetNftsParams,
  MintAndSendResult,
  NftCountResponse,
  NftDetailsResponse,
  NftProjectDetails,
  ProjectTransaction,
  UploadFiles,
} from '@/types';

export class NmkrClient extends HttpClient {
  private readonly configService = new ConfigService();
  private readonly limit = pLimit(this.configService.concurrencyLimit);
  private readonly retryCount = this.configService.retryCount;

  async getServerState(): Promise<{ status: string; version: string; timestamp: string }> {
    try {
      const response = await this.instance.get('/v2/GetServerState');
      return response.data;
    } catch (error: unknown) {
      handleAxiosError(error);
    }
  }

  async getMintCouponBalance(): Promise<number> {
    try {
      const response = await this.instance.get('/v2/GetMintCouponBalance');
      return response.data.balance;
    } catch (error: unknown) {
      handleAxiosError(error);
    }
  }

  async getProjectDetails(projectUid: string): Promise<NftProjectDetails> {
    try {
      const response = await this.instance.get(`/v2/GetProjectDetails/${projectUid}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        throw new NotFoundError('Project', projectUid);
      }
      handleAxiosError(error);
    }
  }

  async checkSaleConditions(projectUid: string, address: string, count: number): Promise<boolean> {
    try {
      const response = await this.instance.get(
        `/v2/CheckIfSaleConditionsMet/${projectUid}/${address}/${count}`
      );
      return response.data.conditionsMet;
    } catch (error: unknown) {
      handleAxiosError(error);
    }
  }

  async mintRandom(params: BatchMintParams): Promise<MintAndSendResult> {
    try {
      const { projectUid, count, receiver, blockchain } = params;
      const response = await this.instance.get<MintAndSendResult>(
        `/v2/MintAndSendRandom/${projectUid}/${count}/${receiver}`,
        { params: { blockchain } }
      );
      return response.data;
    } catch (error: unknown) {
      handleAxiosError(error);
    }
  }

  async mintSpecific(
    params: BatchMintParams,
    payload: BatchMintRequest
  ): Promise<MintAndSendResult> {
    try {
      const { projectUid, receiver, blockchain } = params;
      const response = await this.instance.post<MintAndSendResult>(
        `/v2/MintAndSendSpecific/${projectUid}/${receiver}`,
        payload,
        { params: { blockchain } }
      );
      return response.data;
    } catch (error: unknown) {
      handleAxiosError(error);
    }
  }

  async getTransactions(): Promise<ProjectTransaction[]> {
    try {
      const response = await this.instance.get(
        `/v2/GetProjectTransactions/${this.configService.projectUid}`,
        { params: { exportOptions: 'Json' } }
      );
      return response.data;
    } catch (error: unknown) {
      handleAxiosError(error);
    }
  }

  async getTransaction(transactionId: string): Promise<ProjectTransaction> {
    try {
      const transactions = await this.getTransactions();
      const transaction = transactions.find((t) => t.transactionid === transactionId);

      if (!transaction) {
        throw new NotFoundError('Transaction', transactionId);
      }

      return transaction;
    } catch (error: unknown) {
      if (error instanceof NotFoundError) throw error;
      handleAxiosError(error);
    }
  }

  async getLatestTransaction(): Promise<ProjectTransaction> {
    try {
      const transactions = await this.getTransactions();
      if (transactions.length === 0) {
        throw new NotFoundError('Transaction');
      }
      return transactions[0];
    } catch (error: unknown) {
      if (error instanceof NotFoundError) throw error;
      handleAxiosError(error);
    }
  }

  async getBalance(): Promise<APIResponse> {
    try {
      const response = await this.instance.get('/v2/GetMintCouponBalance');
      return response.data;
    } catch (error: unknown) {
      handleAxiosError(error);
    }
  }

  async getCounts(projectUid: string): Promise<NftCountResponse> {
    try {
      const response = await this.instance.get(`/v2/GetCounts/${projectUid}`);
      return response.data;
    } catch (error: unknown) {
      handleAxiosError(error);
    }
  }

  async getNfts(params: GetNftsParams): Promise<APIResponse> {
    try {
      const { projectUid, state, count = 100, page = 1 } = params;
      const response = await this.instance.get(
        `/v2/GetNfts/${projectUid}/${state}/${count}/${page}`
      );
      return response.data;
    } catch (error: unknown) {
      handleAxiosError(error);
    }
  }

  async getNftDetailsById(nftUid: string): Promise<NftDetailsResponse> {
    try {
      const response = await this.instance.get(`/v2/GetNftDetailsById/${nftUid}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        throw new NotFoundError('NFT', nftUid);
      }
      handleAxiosError(error);
    }
  }

  async getNftDetailsThrottled(nftUid: string) {
    return this.limit(() =>
      pRetry(() => this.getNftDetailsById(nftUid), {
        retries: this.retryCount,
        onFailedAttempt: (error) => {
          console.log(
            `Retrying getNftDetails for ${nftUid}. Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
          );
        },
      })
    );
  }

  async getNftDetailsByTokenname(tokenName: string): Promise<NftDetailsResponse> {
    try {
      const response = await this.instance.get(
        `/v2/GetNftDetailsByTokenname/${this.configService.projectUid}/${tokenName}`
      );
      return response.data;
    } catch (error: unknown) {
      handleAxiosError(error);
    }
  }

  async getNftDetailsByTokennameThrottled(tokenName: string): Promise<NftDetailsResponse> {
    return this.limit(() =>
      pRetry(() => this.getNftDetailsByTokenname(tokenName), {
        retries: this.retryCount,
        onFailedAttempt: (error) => {
          console.log(
            `Retrying getNftDetailsByTokenname for ${tokenName}. Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
          );
        },
      })
    );
  }

  async uploadNft(projectUid: string, payload: UploadFiles): Promise<APIResponse> {
    try {
      const url = `/v2/UploadNft/${projectUid}`;
      const response = await this.instance.post<APIResponse>(url, payload);
      return response.data;
    } catch (error) {
      handleAxiosError(error);
    }
  }
}
