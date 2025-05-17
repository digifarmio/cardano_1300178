import { ConfigService } from '@/config/config.service';
import { ValidationError } from '@/modules/core/errors';
import { MintHelper } from '@/modules/core/MintHelper';
import { MintService } from '@/modules/minting/mint.service';
import { BatchMintParams, BatchMintRequest, GetNftsParams } from '@/types';
import { NextFunction, Request, Response } from 'express';

export class MintController {
  private readonly mintService: MintService;
  private readonly configService: ConfigService;

  constructor() {
    this.mintService = new MintService();
    this.configService = new ConfigService();

    // Auto-bind methods
    this.getNftCollection = this.getNftCollection.bind(this);
    this.mintRandom = this.mintRandom.bind(this);
    this.mintSpecific = this.mintSpecific.bind(this);
  }

  async getNftCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const params: GetNftsParams = {
        projectUid: req.params.projectUid,
        state: req.params.state,
        count: Number(req.params.count) || 100,
        page: Number(req.params.page) || 1,
      };

      const collection = await this.mintService.getNftCollection(params);
      res.json({ success: true, data: collection });
    } catch (error) {
      next(error);
    }
  }

  async mintRandom(req: Request, res: Response, next: NextFunction) {
    try {
      const params: BatchMintParams = {
        projectUid: this.configService.projectUid,
        count: this.configService.mintTotalCount,
        receiver: this.configService.receiverAddress,
        blockchain: this.configService.blockchain,
      };

      const result = await this.mintService.mintRandomBatch(params);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async mintSpecific(req: Request, res: Response, next: NextFunction) {
    try {
      const params: BatchMintParams = {
        projectUid: this.configService.projectUid,
        count: this.configService.mintTotalCount,
        receiver: this.configService.receiverAddress,
        blockchain: this.configService.blockchain,
      };

      let payload: BatchMintRequest;

      if (req.file) {
        payload = await MintHelper.fromCSV(req.file.buffer.toString());
      } else if (req.body.bulkTemplate) {
        const { nftUid, count, lovelace } = req.body.bulkTemplate;
        payload = MintHelper.bulkTemplate(nftUid, count, lovelace);
      } else if (req.body.reserveNfts) {
        payload = req.body;
      } else {
        throw new ValidationError('Either provide a CSV file, bulk template, or reserveNfts array');
      }

      const result = await this.mintService.mintSpecificBatch(params, payload);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
