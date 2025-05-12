import { Request, Response } from 'express';
import { MintService } from './mint.service';

export class MintController {
  constructor(private readonly mintService = new MintService()) {
    this.handleBatchMint = this.handleBatchMint.bind(this);
  }

  async handleBatchMint(req: Request, res: Response) {
    try {
      const result = await this.mintService.processBatchMint(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Batch minting failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
