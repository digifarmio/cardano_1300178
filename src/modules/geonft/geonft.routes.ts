import express from 'express';
import { GeoNftController } from './geonft.controller';

export function createGeoNftRoutes() {
  const router = express.Router();
  const controller = new GeoNftController();

  router.get('/process-csv', controller.handleGeoNftProcess);
  return router;
}
