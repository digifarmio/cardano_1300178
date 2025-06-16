import {
  SendMessageCommand,
  SQSClient,
  SendMessageCommandInput,
  GetQueueAttributesCommand,
} from '@aws-sdk/client-sqs';
import { ConfigService } from '@/config/config.service';
import { AwsClientProvider, AwsClientType } from '@/modules/core/AwsClients';

interface TriggerMessage {
  reportId: string;
  trigger: true;
}

interface BatchMessage {
  reportId: string;
  batchIndex: number;
  nfts: unknown[];
}

interface FinalizationMessage {
  reportId: string;
  finalize: true;
}

type ReportMessage = TriggerMessage | BatchMessage | FinalizationMessage;

export class SqsService {
  private readonly sqs: SQSClient;
  private readonly queueUrl: string;

  constructor(private readonly configService = new ConfigService()) {
    this.sqs = AwsClientProvider.getClient(AwsClientType.SQS) as SQSClient;
    this.queueUrl = this.configService.sqsReportQueueUrl;
  }

  async hasMessagesInQueue(): Promise<boolean> {
    try {
      const result = await this.sqs.send(
        new GetQueueAttributesCommand({
          QueueUrl: this.queueUrl,
          AttributeNames: [
            'ApproximateNumberOfMessages',
            'ApproximateNumberOfMessagesNotVisible',
            'ApproximateNumberOfMessagesDelayed',
          ],
        })
      );

      const attributes = result.Attributes || {};
      const visible = parseInt(attributes.ApproximateNumberOfMessages || '0');
      const notVisible = parseInt(attributes.ApproximateNumberOfMessagesNotVisible || '0');
      const delayed = parseInt(attributes.ApproximateNumberOfMessagesDelayed || '0');

      return visible > 0 || notVisible > 0 || delayed > 0;
    } catch (error) {
      console.error('Failed to check queue status:', error);
      return true;
    }
  }

  async sendTriggerMessage(reportId: string): Promise<void> {
    console.log(`[SQS Service] Sending trigger message for report ${reportId}`);

    const message: TriggerMessage = {
      reportId,
      trigger: true,
    };

    await this.sendMessage(message, `${reportId}-trigger`);
  }

  async sendBatchMessage(reportId: string, batchIndex: number, nfts: unknown[]): Promise<void> {
    console.log(
      `[SQS Service] Sending batch ${batchIndex} for report ${reportId} with ${nfts.length} NFTs`
    );

    const message: BatchMessage = {
      reportId,
      batchIndex,
      nfts,
    };

    await this.sendMessage(message, `${reportId}-batch-${batchIndex}`);
  }

  async sendFinalizationMessage(reportId: string): Promise<void> {
    console.log(`[SQS Service] Sending finalization message for report ${reportId}`);

    const message: FinalizationMessage = {
      reportId,
      finalize: true,
    };

    await this.sendMessage(message, `${reportId}-finalize`);
  }

  private async sendMessage(message: ReportMessage, deduplicationId: string): Promise<void> {
    const isFifo = this.queueUrl.endsWith('.fifo');
    const params: SendMessageCommandInput = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(message),
    };

    if (isFifo) {
      params.MessageGroupId = message.reportId;
      params.MessageDeduplicationId = deduplicationId;
    }

    const command = new SendMessageCommand(params);
    await this.sqs.send(command);
  }
}
