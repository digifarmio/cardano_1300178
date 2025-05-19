import { ConfigService } from '@/config/config.service';
import { BatchRecord, ReportStatus } from '@/types';
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';

export class StorageService {
  private readonly s3: S3Client;
  private readonly dynamoDB: DynamoDBClient;
  private readonly bucketName: string;
  private readonly batchTableName: string;
  private readonly statusTableName: string;

  constructor(private readonly config = new ConfigService()) {
    this.s3 = new S3Client({
      region: this.config.awsRegion,
      credentials: {
        accessKeyId: this.config.awsAccessKeyId,
        secretAccessKey: this.config.awsSecretAccessKey,
      },
    });

    this.dynamoDB = new DynamoDBClient({
      region: this.config.awsRegion,
      credentials: {
        accessKeyId: this.config.awsAccessKeyId,
        secretAccessKey: this.config.awsSecretAccessKey,
      },
    });

    this.bucketName = this.config.awsS3Bucket;
    this.batchTableName = this.config.awsDynamoBatchRecords;
    this.statusTableName = this.config.awsDynamoRecordsStatus;
  }

  async storeBatchRecord(record: BatchRecord): Promise<BatchRecord> {
    const fullRecord: BatchRecord = {
      ...record,
      id: record.id ?? uuidv4(),
      createdAt: record.createdAt ?? new Date().toISOString(),
    };

    await this.dynamoDB.send(
      new PutItemCommand({
        TableName: this.batchTableName,
        Item: marshall(fullRecord),
      })
    );

    return fullRecord;
  }

  async getBatchRecords(): Promise<BatchRecord[]> {
    try {
      const result = await this.dynamoDB.send(
        new ScanCommand({
          TableName: this.batchTableName,
        })
      );

      return (result.Items || []).map((item) => unmarshall(item) as BatchRecord);
    } catch (error) {
      console.error('Error fetching batch records:', error);
      throw new Error('Failed to fetch batch records');
    }
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

  async getStatus(reportId: string): Promise<Partial<ReportStatus>> {
    const result = await this.dynamoDB.send(
      new GetItemCommand({
        TableName: this.statusTableName,
        Key: marshall({ id: reportId }),
      })
    );

    return result.Item ? (unmarshall(result.Item) as Partial<ReportStatus>) : {};
  }

  async storeReportFile(
    reportId: string,
    content: Buffer | string,
    type: 'csv' | 'pdf'
  ): Promise<string> {
    const key = `reports/${reportId}.${type}`;
    const body = typeof content === 'string' ? Buffer.from(content) : content;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: type === 'csv' ? 'text/csv' : 'application/pdf',
      })
    );

    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }

  async getReportFileUrl(reportId: string, type: 'csv' | 'pdf'): Promise<string> {
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
