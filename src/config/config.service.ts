import { ValidationError } from '@/modules/core/errors';
import { Blockchain } from '@/types';

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

  get concurrencyLimit(): number {
    const limit = this.validateEnvVar('CONCURRENCY_LIMIT', process.env.CONCURRENCY_LIMIT);
    return parseInt(limit || '5', 10);
  }

  get retryCount(): number {
    const count = this.validateEnvVar('RETRY_COUNT', process.env.RETRY_COUNT);
    return parseInt(count || '3', 10);
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

  get bucketNameCsv(): string {
    return this.validateEnvVar('AWS_BUCKET_NAME_CSV', process.env.AWS_BUCKET_NAME_CSV);
  }

  get bucketNameNft(): string {
    return this.validateEnvVar('AWS_BUCKET_NAME_NFT', process.env.AWS_BUCKET_NAME_NFT);
  }

  get sqsQueueUrl(): string {
    return this.validateEnvVar('AWS_SQS_QUEUE_URL', process.env.AWS_SQS_QUEUE_URL);
  }

  get sftpHost(): string {
    return this.validateEnvVar('SFTP_HOST', process.env.SFTP_HOST);
  }

  get sftpPort(): number {
    const port = parseInt(process.env.SFTP_PORT || '');
    if (isNaN(port) || port <= 0) {
      throw new ValidationError('SFTP_PORT must be a positive number');
    }
    return port;
  }

  get sftpUsername(): string {
    return this.validateEnvVar('SFTP_USERNAME', process.env.SFTP_USERNAME);
  }

  get sftpPassword(): string {
    return this.validateEnvVar('SFTP_PASSWORD', process.env.SFTP_PASSWORD);
  }

  get remotePath(): string {
    return this.validateEnvVar('REMOTE_PATH', process.env.REMOTE_PATH);
  }

  get jwtSecret(): string {
    return this.validateEnvVar('JWT_SECRET', process.env.JWT_SECRET);
  }

  get jwtIssuer(): string {
    return this.validateEnvVar('JWT_ISSUER', process.env.JWT_ISSUER);
  }

  get jwtExpiresIn(): string {
    return this.validateEnvVar('JWT_EXPIRES_IN', process.env.JWT_EXPIRES_IN);
  }
}
