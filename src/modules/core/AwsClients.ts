import { S3, S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export enum AwsClientType {
  S3 = 'S3',
  SQS = 'SQS',
  DynamoDB = 'DynamoDB',
}

type AwsClientInstance = S3Client | SQSClient | DynamoDBClient;

type AwsClientMap = Partial<Record<AwsClientType, AwsClientInstance>>;

export class AwsClientProvider {
  private static clients: AwsClientMap = {};

  private constructor() {}

  public static getClient(type: AwsClientType): AwsClientInstance {
    if (!this.clients[type]) {
      switch (type) {
        case AwsClientType.S3:
          this.clients[type] = new S3({});
          break;
        case AwsClientType.SQS:
          this.clients[type] = new SQSClient({});
          break;
        case AwsClientType.DynamoDB:
          this.clients[type] = new DynamoDBClient({});
          break;
        default:
          throw new Error(`Unsupported AWS client type: ${type}`);
      }
    }
    return this.clients[type] as AwsClientInstance;
  }
}
