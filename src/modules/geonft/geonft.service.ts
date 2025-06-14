import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { GetQueueAttributesCommand, SQSClient, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { AwsClientProvider, AwsClientType } from '../core/AwsClients';
import { ConfigService } from '../../config/config.service';
import { APIResponse } from '../../types';

export class GeoNftService {
  private readonly s3Client: S3Client;
  private readonly sqsClient: SQSClient;
  private readonly BATCH_SIZE = 10;

  constructor(private readonly configService = new ConfigService()) {
    this.s3Client = AwsClientProvider.getClient(AwsClientType.S3) as S3Client;
    this.sqsClient = AwsClientProvider.getClient(AwsClientType.SQS) as SQSClient;
  }

  /**
   * Main entry point from the controller
   * This method orchestrates the entire process
   */
  async process(nftBucket: string, csvBucket: string): Promise<APIResponse> {
    try {
      const isQueueBusy = await this.isQueueProcessing();
      if (isQueueBusy) {
        throw new Error('Queue is currently processing. Please try again later.');
      }
      // Combine listing files and enqueueing to SQS in one operation
      console.log('Starting NFT processing workflow');
      const nft = await this.streamFilesToSqs(nftBucket);

      const csv = await this.streamFilesToSqs(csvBucket);

      return {
        success: true,
        data: `Total NFT: ${nft} and CSV: ${csv} files enqueued for Lambda processing`,
      };
    } catch (error) {
      console.error('Error processing NFT data:', error);
      throw new Error(
        `NFT processing failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Streams files from S3 directly to SQS as they're listed
   */
  private async streamFilesToSqs(bucketName: string): Promise<number> {
    const queueUrl = this.configService.sqsUploadsQueueUrl;
    let continuation: string | undefined;
    let totalEnqueued = 0;
    let batchNumber = 0;

    try {
      console.log(`Streaming files from bucket ${bucketName} to SQS queue ${queueUrl}`);

      do {
        // List a batch of objects from S3
        const listCommand = new ListObjectsV2Command({
          Bucket: bucketName,
          ContinuationToken: continuation,
          MaxKeys: 1000,
        });

        const listResponse = await this.s3Client.send(listCommand);
        continuation = listResponse.NextContinuationToken;

        if (!listResponse.Contents || listResponse.Contents.length === 0) {
          throw new Error('No objects found in S3 bucket');
        }

        const files = listResponse.Contents.filter((obj) => obj.Key).map((obj) => obj.Key!);
        console.log(`Listed ${files.length} files from S3`);

        const sqsBatches = Array.from(
          { length: Math.ceil(files.length / this.BATCH_SIZE) },
          (_, i) => files.slice(i * this.BATCH_SIZE, (i + 1) * this.BATCH_SIZE)
        );

        await Promise.all(
          sqsBatches.map(async (batch) => {
            batchNumber++;
            const entries = batch.map((key, index) => ({
              Id: `batch-${batchNumber}-${index}`,
              MessageBody: JSON.stringify({ bucketName, key }),
              MessageGroupId: 'default',
            }));

            await this.sqsClient.send(
              new SendMessageBatchCommand({
                QueueUrl: queueUrl,
                Entries: entries,
              })
            );

            totalEnqueued += batch.length;
            console.log(`Enqueued batch ${batchNumber}. Running total: ${totalEnqueued}`);
          })
        );
      } while (continuation);

      console.log(`Completed streaming. Total files enqueued: ${totalEnqueued}`);
      return totalEnqueued;
    } catch (error) {
      console.error('Error streaming files to SQS:', error);
      throw new Error(
        `Failed to stream files to SQS: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async isQueueProcessing(): Promise<boolean> {
    try {
      const queueUrl = this.configService.sqsUploadsQueueUrl;

      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: [
          'ApproximateNumberOfMessages',
          'ApproximateNumberOfMessagesNotVisible',
          'ApproximateNumberOfMessagesDelayed',
        ],
      });

      const response = await this.sqsClient.send(command);
      const attributes = response.Attributes;

      if (!attributes) {
        return false;
      }

      const availableMessages = parseInt(attributes.ApproximateNumberOfMessages || '0', 10);
      const inFlightMessages = parseInt(
        attributes.ApproximateNumberOfMessagesNotVisible || '0',
        10
      );
      const delayedMessages = parseInt(attributes.ApproximateNumberOfMessagesDelayed || '0', 10);

      const totalMessages = availableMessages + inFlightMessages + delayedMessages;

      return totalMessages > 0;
    } catch (error) {
      console.error('Error checking queue status:', error);
      return false;
    }
  }
}
