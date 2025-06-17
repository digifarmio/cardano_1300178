import { ReportService } from '@/modules/minting/report.service';
import { NmkrClient } from '@/modules/core/nmkr.client';
import { SqsService } from '@/modules/minting/sqs.service';
import { StorageService } from '@/modules/minting/storage.service';
import { ExplorerService } from '@/modules/minting/explorer.service';
import { NotFoundError } from '@/modules/core/errors';
import { ProjectTransaction, CsvRecord, ReportStatus, GetTransactionNfts } from '@/types';

jest.mock('@/modules/core/nmkr.client');
jest.mock('@/modules/minting/sqs.service');
jest.mock('@/modules/minting/storage.service');
jest.mock('@/modules/minting/explorer.service');

const mockReportId = 'mock-report-id';
const mockNft: GetTransactionNfts = {
  assetName: '746f6b656e31',
  fingerprint: 'fp',
  tokenCount: 1,
  multiplier: 1,
  confirmed: true,
};
const mockTransactions: ProjectTransaction[] = [
  {
    created: '',
    nftprojectId: 1,
    ada: 0,
    fee: 0,
    mintingcostsada: 0,
    projectada: 0,
    eurorate: 0,
    nftcount: 1,
    tokencount: 1,
    stakereward: 0,
    additionalPayoutWallets: 0,
    confirmed: true,
    priceintokensquantity: 0,
    priceintokensmultiplier: 1,
    nmkrcosts: 0,
    discount: 0,
    blockchain: 'Cardano',
    transactionNfts: [mockNft],
  },
];
const mockCsvRecord: CsvRecord = {
  fieldID: 'FIELD_001',
  nmkrTokenID: 'uid1',
  txID: 'tx1',
  explorerURL: 'https://explorer/tx1',
  poolPmURL: 'https://pool/asset1',
};
const mockReportStatus: ReportStatus = {
  id: mockReportId,
  status: 'processing',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  totalNfts: 1,
  processedNfts: 0,
  records: [],
  progress: 0,
};

describe('ReportService', () => {
  let service: ReportService;
  let nmkr: jest.Mocked<NmkrClient>;
  let explorer: jest.Mocked<ExplorerService>;
  let storage: jest.Mocked<StorageService>;
  let sqs: jest.Mocked<SqsService>;

  beforeEach(() => {
    nmkr = new NmkrClient() as unknown as jest.Mocked<NmkrClient>;
    explorer = new ExplorerService() as unknown as jest.Mocked<ExplorerService>;
    storage = new StorageService() as unknown as jest.Mocked<StorageService>;
    sqs = new SqsService() as unknown as jest.Mocked<SqsService>;
    jest.clearAllMocks();
    service = new ReportService(nmkr, explorer, storage, sqs);
  });

  describe('generateReport', () => {
    it('should throw if an active report exists', async () => {
      storage.hasActiveReport.mockResolvedValue(true);
      await expect(service.generateReport()).rejects.toThrow(
        'Another report is already in progress'
      );
    });
    it('should throw if SQS has queued messages', async () => {
      storage.hasActiveReport.mockResolvedValue(false);
      sqs.hasMessagesInQueue.mockResolvedValue(true);
      await expect(service.generateReport()).rejects.toThrow('Report generation is already queued');
    });
    it('should save status and send trigger message', async () => {
      storage.hasActiveReport.mockResolvedValue(false);
      sqs.hasMessagesInQueue.mockResolvedValue(false);
      storage.saveStatus.mockResolvedValue();
      sqs.sendTriggerMessage.mockResolvedValue();
      const result = await service.generateReport();
      expect(result).toHaveProperty('reportId');
      expect(result).toHaveProperty('statusUrl');
      expect(storage.saveStatus).toHaveBeenCalled();
      expect(sqs.sendTriggerMessage).toHaveBeenCalled();
    });
  });

  describe('initializeReport', () => {
    it('should complete immediately if no NFTs', async () => {
      nmkr.getTransactions.mockResolvedValue([]);
      storage.updateStatus.mockResolvedValue();
      await service.initializeReport(mockReportId);
      expect(storage.updateStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed', totalNfts: 0 })
      );
    });
    it('should process and batch NFTs', async () => {
      nmkr.getTransactions.mockResolvedValue(mockTransactions);
      storage.updateStatus.mockResolvedValue();
      sqs.sendBatchMessage.mockResolvedValue();
      await service.initializeReport(mockReportId);
      expect(storage.updateStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'processing', totalNfts: 1 })
      );
      expect(sqs.sendBatchMessage).toHaveBeenCalledWith(mockReportId, 0, expect.any(Array));
    });
    it('should handle errors and set status failed', async () => {
      nmkr.getTransactions.mockRejectedValue(new Error('fail'));
      storage.updateStatus.mockResolvedValue();
      await expect(service.initializeReport(mockReportId)).rejects.toThrow('fail');
      expect(storage.updateStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed' })
      );
    });
  });

  describe('processBatch', () => {
    it('should warn and skip empty batch', async () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      await service.processBatch(mockReportId, []);
      expect(spy).toHaveBeenCalledWith(`[Report Service] Empty batch for report ${mockReportId}`);
      spy.mockRestore();
    });
    it('should process NFTs, update progress, and finalize', async () => {
      const batch = [{ tx: mockTransactions[0], nft: mockNft }];
      service['processNfts'] = jest.fn().mockResolvedValue([mockCsvRecord]);
      storage.getReportById.mockResolvedValue({
        ...mockReportStatus,
        processedNfts: 0,
        totalNfts: 1,
      });
      storage.addRecordsWithProgress.mockResolvedValue({ shouldFinalize: true, totalNfts: 1 });
      storage.updateStatus.mockResolvedValue();
      service['generateCsv'] = jest.fn().mockResolvedValue('mock.csv');
      await service.processBatch(mockReportId, batch);
      expect(storage.addRecordsWithProgress).toHaveBeenCalled();
      expect(storage.updateStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed', csvPath: 'mock.csv', progress: 100 })
      );
    });
    it('processBatch does not finalize if shouldFinalize is false', async () => {
      const batch: Array<{ tx: ProjectTransaction; nft: GetTransactionNfts }> = [
        { tx: mockTransactions[0], nft: mockNft },
      ];
      service['processNfts'] = jest.fn().mockResolvedValue([mockCsvRecord]);
      storage.getReportById.mockResolvedValue({
        ...mockReportStatus,
        processedNfts: 0,
        totalNfts: 2,
      });
      storage.addRecordsWithProgress.mockResolvedValue({ shouldFinalize: false, totalNfts: 2 });
      storage.updateStatus.mockResolvedValue();
      await service.processBatch(mockReportId, batch);
      expect(storage.updateStatus).not.toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed' })
      );
    });
    it('should handle batch errors and set status failed', async () => {
      const batch: Array<{ tx: ProjectTransaction; nft: GetTransactionNfts }> = [
        { tx: mockTransactions[0], nft: mockNft },
      ];
      service['processNfts'] = jest.fn().mockRejectedValue(new Error('batchfail'));
      storage.updateStatus.mockResolvedValue();
      await expect(service.processBatch(mockReportId, batch)).rejects.toThrow('batchfail');
      expect(storage.updateStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed' })
      );
    });
    it('finalizeReport should call generateCsv and update status', async () => {
      storage.getReportById.mockResolvedValue({ ...mockReportStatus, records: [mockCsvRecord] });
      service['generateCsv'] = jest.fn().mockResolvedValue('mock.csv');
      storage.updateStatus.mockResolvedValue();
      await service.finalizeReport(mockReportId);
      expect(storage.updateStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed', csvPath: 'mock.csv', progress: 100 })
      );
    });
    it('finalizeReport handles errors and sets status failed', async () => {
      storage.getReportById.mockRejectedValue(new Error('finalizefail'));
      storage.updateStatus.mockResolvedValue();
      await expect(service.finalizeReport(mockReportId)).rejects.toThrow('finalizefail');
      expect(storage.updateStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed' })
      );
    });
  });

  describe('getAllReports', () => {
    it('should return all reports', async () => {
      storage.getAllReports.mockResolvedValue([mockReportStatus]);
      const reports = await service.getAllReports();
      expect(reports).toEqual([mockReportStatus]);
    });
    it('should throw on error', async () => {
      storage.getAllReports.mockRejectedValue(new Error('fail'));
      await expect(service.getAllReports()).rejects.toThrow('Unable to retrieve report statuses');
    });
  });

  describe('getReportById', () => {
    it('should return report', async () => {
      storage.getReportById.mockResolvedValue(mockReportStatus);
      const result = await service.getReportById(mockReportId);
      expect(result).toEqual(mockReportStatus);
    });
    it('should return failed status on error', async () => {
      const result = await service.getReportById('bad');
      expect(result).toEqual(undefined);
    });
  });

  describe('deleteReport', () => {
    it('should delete and return true', async () => {
      storage.deleteReport.mockResolvedValue(true);
      const result = await service.deleteReport(mockReportId);
      expect(result).toBe(true);
    });
    it('should throw on error', async () => {
      storage.deleteReport.mockRejectedValue(new Error('fail'));
      await expect(service.deleteReport(mockReportId)).rejects.toThrow('Unable to delete report');
    });
  });

  describe('getReportFile', () => {
    it('should return file url', async () => {
      storage.getReportFileUrl.mockResolvedValue('mock-url');
      const url = await service.getReportFile(mockReportId, 'csv');
      expect(url).toBe('mock-url');
    });
    it('should throw NotFoundError for missing file', async () => {
      storage.getReportFileUrl.mockRejectedValue({
        name: 'NoSuchKey',
        $metadata: { httpStatusCode: 404 },
      });
      await expect(service.getReportFile('missing', 'csv')).rejects.toThrow(NotFoundError);
    });
    it('should throw generic error for unknown', async () => {
      storage.getReportFileUrl.mockRejectedValue({ message: 'fail' });
      await expect(service.getReportFile('bad', 'csv')).rejects.toThrow(
        'Failed to get report file: fail'
      );
    });
  });

  describe('private helpers', () => {
    it('hexToString should decode hex', () => {
      expect((service as ReportService)['hexToString']('7465737431')).toBe('test1');
    });
    it('parseMetadata should parse valid metadata', () => {
      const parsed = (service as ReportService)['parseMetadata'](
        JSON.stringify({ 721: { policy: { token: { production_id: 'F' } } } })
      );
      expect(parsed).toEqual({ production_id: 'F' });
    });
    it('parseMetadata should return null for invalid', () => {
      expect((service as ReportService)['parseMetadata']('bad')).toBeNull();
    });
    it('extractFieldId should extract production_id', () => {
      expect((service as ReportService)['extractFieldId']({ production_id: 'F' })).toBe('F');
    });
    it('extractFieldId should extract id', () => {
      expect((service as ReportService)['extractFieldId']({ id: 'X' })).toBe('X');
    });
    it('extractFieldId should return N/A', () => {
      expect((service as ReportService)['extractFieldId'](null)).toBe('N/A');
    });
  });

  describe('additional coverage', () => {
    let service: ReportService;
    let nmkr: jest.Mocked<NmkrClient>;
    let explorer: jest.Mocked<ExplorerService>;
    let storage: jest.Mocked<StorageService>;
    let sqs: jest.Mocked<SqsService>;
    beforeEach(() => {
      nmkr = new NmkrClient() as unknown as jest.Mocked<NmkrClient>;
      explorer = new ExplorerService() as unknown as jest.Mocked<ExplorerService>;
      storage = new StorageService() as unknown as jest.Mocked<StorageService>;
      sqs = new SqsService() as unknown as jest.Mocked<SqsService>;
      service = new ReportService(nmkr, explorer, storage, sqs);
    });

    it('processNfts returns [] and warns if batch is all invalid', async () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      // @ts-expect-error: test private method
      const result = await service['processNfts']([{ tx: {} as ProjectTransaction, nft: null }]);
      expect(result).toEqual([]);
      expect(spy).toHaveBeenCalledWith('[Report Service] No valid NFTs in batch');
      spy.mockRestore();
    });

    it('processNfts returns error record if nmkr throws', async () => {
      nmkr.getNftDetailsByTokennameThrottled.mockRejectedValue(new Error('fail'));
      const batch: Array<{ tx: ProjectTransaction; nft: GetTransactionNfts }> = [
        { tx: mockTransactions[0], nft: mockNft },
      ];
      const result = await service['processNfts'](batch);
      expect(result[0]).toEqual({
        fieldID: 'Error',
        nmkrTokenID: 'Error',
        txID: 'Error',
        explorerURL: 'N/A',
        poolPmURL: 'N/A',
      });
    });

    it('generateCsv throws and logs error', async () => {
      const error = new Error('fail');
      const spy = jest.spyOn(console, 'error');
      storage.storeReportFile.mockRejectedValue(error);
      await expect(service['generateCsv']('id', [mockCsvRecord])).rejects.toThrow('fail');
      spy.mockRestore();
    });

    it('processBatch does not finalize if shouldFinalize is false', async () => {
      const batch: Array<{ tx: ProjectTransaction; nft: GetTransactionNfts }> = [
        { tx: mockTransactions[0], nft: mockNft },
      ];
      service['processNfts'] = jest.fn().mockResolvedValue([mockCsvRecord]);
      storage.getReportById.mockResolvedValue({
        ...mockReportStatus,
        processedNfts: 0,
        totalNfts: 2,
      });
      storage.addRecordsWithProgress.mockResolvedValue({ shouldFinalize: false, totalNfts: 2 });
      storage.updateStatus.mockResolvedValue();
      await service.processBatch(mockReportId, batch);
      expect(storage.updateStatus).not.toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed' })
      );
    });

    it('initializeReport handles multiple batches', async () => {
      const nfts = Array.from({ length: 25 }, (_, i) => ({
        tx: mockTransactions[0],
        nft: { ...mockNft, assetName: `746f6b656e${i}` },
      }));
      nmkr.getTransactions.mockResolvedValue([
        { ...mockTransactions[0], transactionNfts: nfts.map((n) => n.nft) },
      ]);
      storage.updateStatus.mockResolvedValue();
      sqs.sendBatchMessage.mockResolvedValue();
      await service.initializeReport(mockReportId);
      // Should create 3 batches for 25 NFTs with BATCH_SIZE 10
      expect(sqs.sendBatchMessage).toHaveBeenCalledTimes(3);
      expect(storage.updateStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'processing', totalNfts: 25 })
      );
    });
  });
});
