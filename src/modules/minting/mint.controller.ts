import { NextFunction, Request, Response } from 'express';
import { ConfigService } from '../../config/config.service';
import { ValidationError } from '../../modules/core/errors';
import { BatchMintParams, BatchMintRequest, BlockchainType, GetNftsParams } from '../../types';
import { MintHelper } from '../core/MintHelper';
import { MintService } from './mint.service';

export class MintController {
  private readonly mintService: MintService;
  private readonly configService: ConfigService;

  constructor() {
    this.mintService = new MintService();
    this.configService = new ConfigService();

    // Auto-bind methods
    this.getNftCollection = this.getNftCollection.bind(this);
    this.mintRandom = this.mintRandom.bind(this);
    this.mintRandomWithParams = this.mintRandomWithParams.bind(this);
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
        count: this.configService.batchSize.toString(),
        receiver: this.configService.receiverAddress,
        blockchain: this.configService.blockchain,
      };

      const result = await this.mintService.mintRandomBatch(params);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async mintRandomWithParams(req: Request, res: Response, next: NextFunction) {
    try {
      const blockchain = this.validateBlockchain(req.query.blockchain);

      const params: BatchMintParams = {
        projectUid: req.params.projectUid,
        count: req.params.count,
        receiver: req.params.receiver,
        blockchain,
      };

      const result = await this.mintService.mintRandomBatch(params);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async mintSpecific(req: Request, res: Response, next: NextFunction) {
    try {
      const blockchain = this.validateBlockchain(req.query.blockchain);
      const params: BatchMintParams = {
        projectUid: req.params.projectUid,
        receiver: req.params.receiver,
        blockchain,
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

  private validateBlockchain(blockchain: unknown): BlockchainType {
    if (!blockchain || typeof blockchain !== 'string') {
      throw new ValidationError('Blockchain parameter is required');
    }
    return blockchain as BlockchainType;
  }
}
