import { csvUpload } from '@/config/multer-config';
import { MintController } from '@/modules/minting/mint.controller';
import express from 'express';

export const createMintRoutes = () => {
  const router = express.Router();
  const controller = new MintController();

  router
    .get('/balance', controller.getBalance)
    .get('/counts', controller.getCounts)
    .get('/nfts/:state/:count/:page', controller.getNfts)
    .get('/nfts/:uid', controller.getNftDetailsById)
    .post('/mint/random-batch', controller.mintRandomBatch)
    .post('/mint/specific-batch', csvUpload, controller.mintSpecificBatch)
    .post('/reports', controller.generateReport)
    .get('/reports/:reportId', controller.getReportStatus)
    .get('/reports/:reportId/download/:type', controller.downloadReport);

  return router;
};
