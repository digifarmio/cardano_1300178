import { ValidationError } from '../modules/core/errors';
import { BlockchainType } from '../types';

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

  get blockchain(): BlockchainType {
    const chain = process.env.BLOCKCHAIN || 'Cardano';
    if (!['Cardano', 'Solana', 'Ethereum'].includes(chain)) {
      throw new ValidationError(`Unsupported blockchain: ${chain}`);
    }
    return chain as BlockchainType;
  }

  get batchSize(): number {
    const size = parseInt(process.env.BATCH_SIZE || '500', 10);
    if (isNaN(size) || size <= 0) {
      throw new ValidationError('BATCH_SIZE must be a positive number');
    }
    return size;
  }

  get awsRegion(): string {
    return process.env.AWS_REGION || '';
  }

  get bucketName(): string {
    return process.env.BUCKET_NAME || '';
  }

  get bucketKey(): string {
    return process.env.BUCKET_KEY || '';
  }
}
