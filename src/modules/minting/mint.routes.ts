import express from 'express';
import { csvUpload } from '../../config/multer-config';
import { MintController } from './mint.controller';

export function createMintRoutes() {
  const router = express.Router();
  const controller = new MintController();

  // NFT Collection endpoints
  router.get('/collections/:projectUid/:state/:count/:page', controller.getNftCollection);

  // Minting endpoints
  router.get('/mint/random-batch', controller.mintRandom);
  router.post('/mint/specific-batch', csvUpload, controller.mintSpecific);

  return router;
}
