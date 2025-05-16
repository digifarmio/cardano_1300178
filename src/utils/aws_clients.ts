import { S3, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '../config/config.service';

export enum AwsClientType {
  S3 = 'S3',
}

type AwsClientInstance = S3Client;

type AwsClientMap = Partial<Record<AwsClientType, AwsClientInstance>>;

export class AwsClientProvider {
  private static clients: AwsClientMap = {};
  private static configService = new ConfigService();

  private constructor() {}

  public static getClient(type: AwsClientType): AwsClientInstance {
    if (!this.clients[type]) {
      const region = this.configService.awsRegion;
      switch (type) {
        case AwsClientType.S3:
          this.clients[type] = new S3({
            region: region,
          });
          break;
        default:
          throw new Error(`Unsupported AWS client type: ${type}`);
      }
    }
    return this.clients[type] as AwsClientInstance;
  }
}
