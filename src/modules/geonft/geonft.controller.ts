import { NextFunction, Request, Response } from 'express';
import { GeoNftService } from '@/modules/geonft/geonft.service';

export class GeoNftController {
  constructor(private readonly geoNftService = new GeoNftService()) {
    this.handleGeoNftProcess = this.handleGeoNftProcess.bind(this);
  }

  async handleGeoNftProcess(req: Request, res: Response, next: NextFunction) {
    try {
      const { nftBucket, csvBucket } = req.body;
      if (!nftBucket || !csvBucket) {
        res.status(400).json({ error: 'nftBucket and csvBucket parameters are required' });
      }

      const data = await this.geoNftService.process(nftBucket, csvBucket);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
}
