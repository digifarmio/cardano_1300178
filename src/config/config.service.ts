import { ValidationError } from '../modules/core/errors';
import { Blockchain } from '../types';

export class ConfigService {
  private validateEnvVar(name: string, value: string | undefined): string {
    if (!value) {
      throw new ValidationError(`Missing required environment variable: ${name}`);
    }
    return value;
  }

  get apiKey(): string {
    return this.validateEnvVar('NMKR_API_KEY', process.env.NMKR_API_KEY);
  }

  get baseUrl(): string {
    return process.env.NMKR_BASE_URL || 'https://studio-api.nmkr.io';
  }

  get customerId(): string {
    return this.validateEnvVar('NMKR_CUSTOMER_ID', process.env.NMKR_CUSTOMER_ID);
  }

  get projectUid(): string {
    return this.validateEnvVar('NMKR_PROJECT_UID', process.env.NMKR_PROJECT_UID);
  }

  get receiverAddress(): string {
    return this.validateEnvVar('RECEIVER_ADDRESS', process.env.RECEIVER_ADDRESS);
  }

  get blockchain(): Blockchain {
    return this.validateEnvVar('BLOCKCHAIN', process.env.BLOCKCHAIN) as Blockchain;
  }

  get mintBatchSize(): number {
    const size = this.validateEnvVar('MINT_BATCH_SIZE', process.env.MINT_BATCH_SIZE);
    return parseInt(size || '10', 10);
  }

  get mintTotalCount(): number {
    const size = this.validateEnvVar('MINT_TOTAL_COUNT', process.env.MINT_TOTAL_COUNT);
    return parseInt(size || '500', 10);
  }
}
