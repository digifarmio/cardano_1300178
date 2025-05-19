import { ConfigService } from '@/config/config.service';
import { ValidationError } from '@/modules/core/errors';
import { BatchProcessingService } from '@/modules/minting/batch-processing.service';
import { MintService } from '@/modules/minting/mint.service';
import { NextFunction, Request, Response } from 'express';

export class MintController {
  constructor(
    private readonly mintService = new MintService(),
    private readonly configService = new ConfigService(),
    private readonly batchService = new BatchProcessingService()
  ) {
    this.getNftCollection = this.getNftCollection.bind(this);
    this.mintRandomBatch = this.mintRandomBatch.bind(this);
    this.mintSpecificBatch = this.mintSpecificBatch.bind(this);
    this.generateReport = this.generateReport.bind(this);
    this.getReportStatus = this.getReportStatus.bind(this);
    this.downloadReport = this.downloadReport.bind(this);
  }

  async getNftCollection({ params }: Request, res: Response, next: NextFunction) {
    try {
      const { projectUid, state, count = 100, page = 1 } = params;
      const collection = await this.mintService.getNftCollection({
        projectUid,
        state,
        count: Number(count),
        page: Number(page),
      });
      res.json({ success: true, data: collection });
    } catch (error) {
      next(error);
    }
  }

  async mintRandomBatch(_: Request, res: Response, next: NextFunction) {
    try {
      const { projectUid, mintTotalCount, receiverAddress, blockchain } = this.configService;
      const result = await this.mintService.mintRandomBatch({
        projectUid,
        count: mintTotalCount,
        receiver: receiverAddress,
        blockchain,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async mintSpecificBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectUid, mintTotalCount, receiverAddress, blockchain } = this.configService;
      const params = { projectUid, count: mintTotalCount, receiver: receiverAddress, blockchain };

      let payload;

      if (req.file) {
        payload = await this.batchService.createMintRequestFromCSV(req.file.buffer.toString());
      } else if (req.body.bulkTemplate) {
        const { nftUid, count, lovelace } = req.body.bulkTemplate;
        payload = this.batchService.createMintRequestFromTemplate(nftUid, count, lovelace);
      } else if (req.body.reserveNfts) {
        payload = req.body;
      } else {
        throw new ValidationError('Provide a CSV file, bulk template, or reserveNfts array');
      }

      const result = await this.mintService.mintSpecificBatch(params, payload);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async generateReport(_: Request, res: Response, next: NextFunction) {
    try {
      const { reportId, statusUrl } = await this.mintService.initiateReportGeneration();
      res.json({ success: true, data: { reportId, statusUrl } });
    } catch (error) {
      next(error);
    }
  }

  async getReportStatus({ params }: Request, res: Response, next: NextFunction) {
    try {
      const status = await this.mintService.getReportStatus(params.reportId);
      res.json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }

  async downloadReport({ params }: Request, res: Response, next: NextFunction) {
    try {
      const type = params.type === 'csv' || params.type === 'pdf' ? params.type : 'csv';
      const fileUrl = await this.mintService.getReportFile(params.reportId, type);
      res.redirect(fileUrl);
    } catch (error) {
      next(error);
    }
  }
}
