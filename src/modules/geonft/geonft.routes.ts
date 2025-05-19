import { GeoNftController } from '@/modules/geonft/geonft.controller';
import express from 'express';
import { fileUploads } from '../../config/multer-config';

export function createGeoNftRoutes() {
  const router = express.Router();
  const controller = new GeoNftController();

  router.post('/get-nft/process-csv', fileUploads, controller.handleGeoNftProcess);
  return router;
}
