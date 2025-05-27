import { NextFunction, Request, Response } from 'express';
import { GeoNftService } from '@/modules/geonft/geonft.service';

export class GeoNftController {
  constructor(private readonly geoNftService = new GeoNftService()) {
    this.handleGeoNftProcess = this.handleGeoNftProcess.bind(this);
  }

  async handleGeoNftProcess(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.files) {
        throw new Error('No file uploaded');
      }
      const data = await this.geoNftService.process(req.files as Express.Multer.File[]);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
}
