// sqs.service.ts
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { ConfigService } from '@/config/config.service';
import { AwsClientProvider, AwsClientType } from '@/modules/core/AwsClients';

export class SqsService {
  private readonly sqs: SQSClient;
  private readonly queueUrl: string;

  constructor(private readonly configService = new ConfigService()) {
    this.sqs = AwsClientProvider.getClient(AwsClientType.SQS) as SQSClient;
    this.queueUrl = this.configService.sqsReportQueueUrl;
  }

  async sendReportGenerationMessage(reportId: string): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify({ reportId }),
    });

    try {
      await this.sqs.send(command);
    } catch (error) {
      console.error('Failed to send SQS message:', error);
      throw new Error('Failed to queue report generation');
    }
  }
}
