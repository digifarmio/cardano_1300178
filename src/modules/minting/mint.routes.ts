import express from 'express';
import { MintController } from './mint.controller';

export function createMintRoutes() {
  const router = express.Router();
  const controller = new MintController();

  router.post('/batch', controller.handleBatchMint);
  return router;
}
