import express from 'express';
import { GeoNftController } from './geonft.controller';
import { csvUpload } from '../../config/multer-config';

export function createGeoNftRoutes() {
  const router = express.Router();
  const controller = new GeoNftController();

  router.post('/get-nft/process-csv', csvUpload, controller.handleGeoNftProcess);
  return router;
}
