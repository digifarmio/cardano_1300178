import { ValidationError } from '@/modules/core/errors';
import { Blockchain } from '@/types';
import path from 'path';

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

  get policyId(): string {
    return this.validateEnvVar('NMKR_POLICY_ID', process.env.NMKR_POLICY_ID);
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

  get batchStoragePath(): string {
    return path.join(process.cwd(), 'data', 'batches');
  }

  get reportStoragePath(): string {
    return path.join(process.cwd(), 'data', 'reports');
  }

  get concurrencyLimit(): number {
    const limit = this.validateEnvVar('CONCURRENCY_LIMIT', process.env.CONCURRENCY_LIMIT);
    return parseInt(limit || '5', 10);
  }

  get retryCount(): number {
    const count = this.validateEnvVar('RETRY_COUNT', process.env.RETRY_COUNT);
    return parseInt(count || '3', 10);
  }

  get awsRegion(): string {
    return this.validateEnvVar('AWS_REGION', process.env.AWS_REGION);
  }

  get awsS3Bucket(): string {
    return this.validateEnvVar('AWS_S3_BUCKET', process.env.AWS_S3_BUCKET);
  }

  get awsDynamoBatchRecords(): string {
    return this.validateEnvVar(
      'AWS_DYNAMO_TABLE_BATCH_RECORDS',
      process.env.AWS_DYNAMO_TABLE_BATCH_RECORDS
    );
  }

  get awsDynamoRecordsStatus(): string {
    return this.validateEnvVar(
      'AWS_DYNAMO_TABLE_RECORDS_STATUS',
      process.env.AWS_DYNAMO_TABLE_RECORDS_STATUS
    );
  }

  get awsAccessKeyId(): string {
    return this.validateEnvVar('AWS_ACCESS_KEY_ID', process.env.AWS_ACCESS_KEY_ID);
  }

  get awsSecretAccessKey(): string {
    return this.validateEnvVar('AWS_SECRET_ACCESS_KEY', process.env.AWS_SECRET_ACCESS_KEY);
  }

  get bucketName(): string {
    return this.validateEnvVar('BUCKET_NAME', process.env.BUCKET_NAME);
  }

  get bucketKey(): string {
    return this.validateEnvVar('BUCKET_KEY', process.env.BUCKET_KEY);
  }
}
