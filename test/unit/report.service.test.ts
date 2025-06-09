import { mockClient } from 'aws-sdk-client-mock';
import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ReportService } from '@/modules/minting/report.service';
import { NmkrClient } from '@/modules/core/nmkr.client';
import { SqsService } from '@/modules/minting/sqs.service';
import { StorageService } from '@/modules/minting/storage.service';
import { ExplorerService } from '@/modules/minting/explorer.service';
import { NotFoundError, ReportGenerationError } from '@/modules/core/errors';
import { ProjectTransaction, NftDetailsResponse } from '@/types';

const s3Mock = mockClient(S3Client);
const ddbMock = mockClient(DynamoDBClient);
const sqs = new SqsService();
const nmkr = new NmkrClient();
const storage = new StorageService();
const explorer = new ExplorerService();

describe('ReportService', () => {
  let service: ReportService;

  beforeEach(() => {
    s3Mock.reset();
    ddbMock.reset();

    service = new ReportService(nmkr, explorer, storage, sqs);
  });

  it('should queue a report if none is active', async () => {
    ddbMock.on(ScanCommand).resolves({ Items: [] });
    ddbMock.on(PutItemCommand).resolves({});

    const sqsSpy = jest.spyOn(sqs, 'sendReportGenerationMessage').mockResolvedValue();

    const result = await service.generateReport();

    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('statusUrl');
    expect(sqsSpy).toHaveBeenCalled();
  });

  it('should throw if report is already active', async () => {
    ddbMock.on(ScanCommand).resolves({
      Items: [{ id: { S: 'existing' }, status: { S: 'processing' } }],
    });

    await expect(service.generateReport()).rejects.toThrow(ReportGenerationError);
  });

  it('should return all reports', async () => {
    ddbMock.on(ScanCommand).resolves({
      Items: [
        { id: { S: 'r1' }, status: { S: 'completed' }, createdAt: { S: new Date().toISOString() } },
      ],
    });

    const reports = await service.getAllReports();
    expect(reports.length).toBeGreaterThan(0);
    expect(reports[0].id).toBe('r1');
  });

  it('should return specific report', async () => {
    ddbMock.on(GetItemCommand).resolves({
      Item: {
        id: { S: 'abc' },
        status: { S: 'queued' },
        createdAt: { S: new Date().toISOString() },
      },
    });

    const status = await service.getReportById('abc');
    expect(status.id).toBe('abc');
  });

  it('should throw NotFoundError if report not found', async () => {
    ddbMock.on(GetItemCommand).resolves({ Item: undefined });

    await expect(service.getReportById('notexist')).rejects.toThrow(NotFoundError);
  });

  it('should delete a report', async () => {
    ddbMock.on(DeleteItemCommand).resolves({});
    const result = await service.deleteReport('some-id');
    expect(result).toBe(true);
  });

  it('should get a report file URL', async () => {
    s3Mock.on(GetObjectCommand).resolves({});

    const url = await service.getReportFile('abc', 'csv');
    expect(url).toBe('https://digifarm-reports.s3.amazonaws.com/reports/abc.csv');
  });

  it('should throw NotFoundError for missing report file', async () => {
    s3Mock.on(GetObjectCommand).rejects({
      name: 'NoSuchKey',
      $metadata: { httpStatusCode: 404 },
    });

    await expect(service.getReportFile('missing', 'csv')).rejects.toThrow(NotFoundError);
  });

  it('should process a report end-to-end (simulate success)', async () => {
    ddbMock.on(PutItemCommand).resolves({});
    ddbMock.on(UpdateItemCommand).resolves({});

    jest.spyOn(nmkr, 'getTransactions').mockResolvedValue([
      {
        transactionNfts: [
          { assetName: '746f6b656e31' }, // "token1" in hex
        ],
      },
    ] as ProjectTransaction[]);

    jest.spyOn(nmkr, 'getNftDetailsByTokennameThrottled').mockResolvedValue({
      uid: 'uid1',
      initialminttxhash: 'tx1',
      mintedOnBlockchain: 'Cardano',
      metadata: JSON.stringify({
        721: {
          somePolicy: {
            token1: {
              id_long: 'FIELD_001',
            },
          },
        },
      }),
    } as NftDetailsResponse);

    jest.spyOn(storage, 'storeReportFile').mockResolvedValue('s3://bucket/report.csv');

    await service.processReport('mock-report');
  });

  it('should fail gracefully if NMKR returns no txs', async () => {
    jest.spyOn(nmkr, 'getTransactions').mockResolvedValue([]);

    await expect(service.processReport('mock')).rejects.toThrow(
      'No transactions available for report'
    );
  });

  it('should generate CSV correctly', async () => {
    const path = await service['generateCsv']('csv-id', [
      {
        fieldID: 'F1',
        tokenID: 'T1',
        txID: 'TX1',
        explorerURL: 'https://explorer',
      },
    ]);

    expect(path).toContain('s3://bucket/report.csv');
  });

  it('should convert hex to string', () => {
    const result = service['hexToString']('7465737431'); // "test1"
    expect(result).toBe('test1');
  });

  it('should parse and extract metadata', () => {
    const parsed = service['parseMetadata'](
      JSON.stringify({
        721: {
          somePolicyId: {
            someToken: {
              id_long: 'FIELD_X',
            },
          },
        },
      })
    );

    const fieldId = service['extractFieldId'](parsed!);
    expect(fieldId).toBe('FIELD_X');
  });

  it('should return "N/A" if metadata is invalid', () => {
    const result = service['extractFieldId'](null);
    expect(result).toBe('N/A');
  });
});
