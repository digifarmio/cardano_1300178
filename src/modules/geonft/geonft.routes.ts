import { GeoNftController } from '@/modules/geonft/geonft.controller';
import express from 'express';

export function createGeoNftRoutes() {
  const router = express.Router();
  const controller = new GeoNftController();

  router.post('/get-nft/process-csv', controller.handleGeoNftProcess);
  return router;
}
