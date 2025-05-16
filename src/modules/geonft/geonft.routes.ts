import express from 'express';
import { GeoNftController } from './geonft.controller';
import { fileUploads } from '../../config/multer-config';

export function createGeoNftRoutes() {
  const router = express.Router();
  const controller = new GeoNftController();

  router.post('/get-nft/process-csv', fileUploads, controller.handleGeoNftProcess);
  return router;
}
