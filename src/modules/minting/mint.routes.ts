import express from 'express';
import { csvUpload } from '../../config/multer-config';
import { MintController } from './mint.controller';

export function createMintRoutes() {
  const router = express.Router();
  const controller = new MintController();

  // NFT Collection endpoints
  router.get('/collections/:projectUid/:state/:count/:page', controller.getNftCollection);

  // Minting endpoints
  router.get('/mint/random', controller.mintRandom); // Uses .env config
  router.get('/mint/random/:projectUid/:count/:receiver', controller.mintRandomWithParams);
  router.post('/mint/specific/:projectUid/:receiver', csvUpload, controller.mintSpecific);

  return router;
}
