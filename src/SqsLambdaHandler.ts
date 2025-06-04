import { Readable } from 'stream';
import { EventEmitter } from 'events';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SQSRecord, SQSEvent } from 'aws-lambda';
import SftpClient from 'ssh2-sftp-client';
import { ConfigService } from './config/config.service';
import { AwsClientProvider, AwsClientType } from './modules/core/AwsClients';

EventEmitter.defaultMaxListeners = 50;

export class SqsLambdaHandler {
  private readonly s3Client: S3Client;
  private readonly configService: ConfigService;
  private readonly sftp: SftpClient;

  constructor() {
    this.configService = new ConfigService();
    this.sftp = new SftpClient();
    this.s3Client = AwsClientProvider.getClient(AwsClientType.S3) as S3Client;
  }

  /**
   * Process a batch of SQS records
   * This method handles the processing of records within the Lambda function
   */
  async processSqsRecords(records: SQSRecord[]): Promise<void> {
    try {
      console.log(`Processing ${records.length} SQS records`);

      await this.sftp.connect({
        host: this.configService.sftpHost,
        port: this.configService.sftpPort,
        username: this.configService.sftpUsername,
        password: this.configService.sftpPassword,
        readyTimeout: 30000,
      });

      // Process files concurrently
      const uploadPromises = records.map((record) => this.processAndUploadRecord(record));

      await Promise.all(uploadPromises);

      console.log(`Successfully processed ${records.length} files`);
    } catch (error) {
      console.error('Error processing SQS records batch:', error);
      throw error;
    } finally {
      await this.sftp.end();
    }
  }

  /**
   * Processes a single SQS record by downloading from S3 and uploading to SFTP
   */
  private async processAndUploadRecord(record: SQSRecord): Promise<void> {
    try {
      const { bucketName, key } = JSON.parse(record.body);
      console.log(`Starting upload for file: ${key}`);
      const remoteFilePath = `${this.configService.remotePath}/${key}`;

      const stats = await this.sftp.stat(remoteFilePath);
      if (stats.size > 0) {
        console.log(`File already exists on SFTP: ${remoteFilePath}`);
        return;
      }

      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const data = await this.s3Client.send(getCommand);
      const body = data.Body as Readable;

      await this.sftp.put(body, remoteFilePath);

      console.log(`✅ Successfully uploaded: ${key}`);
    } catch (err) {
      console.error(`❌ Failed to upload file:`, err);
      throw err;
    }
  }
}

export const handler = new SqsLambdaHandler();
export const lambdaHandler = async (event: SQSEvent): Promise<void> => {
  await handler.processSqsRecords(event.Records);
};
