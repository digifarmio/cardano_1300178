import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { AwsClientProvider, AwsClientType } from '@/modules/core/AwsClients';
import { ReportStatus } from '@/types';
import { ConfigService } from '@/config/config.service';

export class StorageService {
  private readonly s3: S3Client;
  private readonly dynamoDB: DynamoDBClient;
  private readonly bucketName: string;
  private readonly statusTableName: string;

  constructor(private readonly config = new ConfigService()) {
    this.s3 = AwsClientProvider.getClient(AwsClientType.S3) as S3Client;
    this.dynamoDB = AwsClientProvider.getClient(AwsClientType.DynamoDB) as DynamoDBClient;

    this.bucketName = this.config.awsS3Bucket;
    this.statusTableName = this.config.awsDynamoRecordsStatus;
  }

  async saveStatus(reportId: string, reportStatus: Partial<ReportStatus>): Promise<void> {
    const fullStatus = {
      ...reportStatus,
      id: reportId,
      createdAt: new Date().toISOString(),
    };

    await this.dynamoDB.send(
      new PutItemCommand({
        TableName: this.statusTableName,
        Item: marshall(fullStatus),
      })
    );
  }

  async updateStatus(reportStatus: Partial<ReportStatus>): Promise<void> {
    if (!reportStatus.id) {
      throw new Error('Report ID is required for status update');
    }

    const { id, ...updateFields } = reportStatus;

    const fieldsToUpdate = {
      ...updateFields,
      updatedAt: new Date().toISOString(),
    };

    const updateParts = Object.keys(fieldsToUpdate).map((key) => `#${key} = :${key}`);

    const expressionAttributeNames = Object.keys(fieldsToUpdate).reduce(
      (acc, key) => {
        acc[`#${key}`] = key;
        return acc;
      },
      {} as Record<string, string>
    );

    const expressionAttributeValues = Object.entries(fieldsToUpdate).reduce(
      (acc, [key, value]) => {
        acc[`:${key}`] = value;
        return acc;
      },
      {} as Record<string, unknown>
    );

    await this.dynamoDB.send(
      new UpdateItemCommand({
        TableName: this.statusTableName,
        Key: marshall({ id }),
        UpdateExpression: `SET ${updateParts.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
      })
    );
  }

  async getAllReports(): Promise<ReportStatus[]> {
    const result = await this.dynamoDB.send(
      new ScanCommand({
        TableName: this.statusTableName,
      })
    );

    if (!result.Items) {
      return [];
    }

    return result.Items.map((item) => unmarshall(item) as ReportStatus);
  }

  async getReportById(reportId: string): Promise<ReportStatus> {
    const result = await this.dynamoDB.send(
      new GetItemCommand({
        TableName: this.statusTableName,
        Key: marshall({ id: reportId }),
      })
    );

    if (!result.Item) {
      throw new Error(`Report with ID ${reportId} not found`);
    }

    const { status, createdAt, updatedAt, csvPath, error } = unmarshall(result.Item);

    if (!status || !createdAt) {
      throw new Error(`Incomplete report data for ID ${reportId}`);
    }

    return {
      id: reportId,
      status,
      createdAt,
      updatedAt,
      csvPath,
      error,
    };
  }

  async deleteReport(reportId: string): Promise<boolean> {
    const key = `reports/${reportId}.csv`;
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );
    } catch (err) {
      console.warn(`Warning: Failed to delete S3 file for report ${reportId}:`, err);
      // Proceed
    }

    try {
      await this.dynamoDB.send(
        new DeleteItemCommand({
          TableName: this.statusTableName,
          Key: marshall({ id: reportId }),
        })
      );
      return true;
    } catch (err) {
      console.error(`Error deleting report ${reportId} from DynamoDB:`, err);
      throw new Error(
        `Failed to delete report: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }

  async storeReportFile(reportId: string, content: Buffer | string, type: 'csv'): Promise<string> {
    const key = `reports/${reportId}.${type}`;
    const body = typeof content === 'string' ? Buffer.from(content) : content;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: 'text/csv',
      })
    );

    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }

  async hasActiveReport(): Promise<boolean> {
    const result = await this.dynamoDB.send(
      new ScanCommand({
        TableName: this.statusTableName,
        FilterExpression: '#status IN (:queued, :processing)',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: marshall({
          ':queued': 'queued',
          ':processing': 'processing',
        }),
        Limit: 1,
      })
    );

    return !!result.Items && result.Items.length > 0;
  }

  async getReportFileUrl(reportId: string, type: 'csv'): Promise<string> {
    const key = `reports/${reportId}.${type}`;

    try {
      await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );
      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } catch (error) {
      console.error('🚀 ~ StorageService ~ getReportFileUrl ~ error:', error);
      throw new Error('Report file not found');
    }
  }
}
