import { NextFunction, Request, Response } from 'express';
import { GeoNftService } from '@/modules/geonft/geonft.service';

export class GeoNftController {
  constructor(private readonly geoNftService = new GeoNftService()) {
    this.handleGeoNftProcess = this.handleGeoNftProcess.bind(this);
  }

  async handleGeoNftProcess(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.geoNftService.process();
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
}
