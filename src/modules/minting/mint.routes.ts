import express from 'express';
import { csvUpload } from '@/config/multer-config';
import { authenticate } from '@/modules/auth/auth.middleware';
import { requireRole } from '@/modules/auth/roles.middleware';
import { MintController } from '@/modules/minting/mint.controller';
import { Role } from '@/types';

export const createMintRoutes = () => {
  const router = express.Router();
  const controller = new MintController();

  const adminAuth = [authenticate, requireRole(Role.admin)];

  router.get('/user/nfts', authenticate, controller.getUserNfts);

  // Admin-only routes
  router
    .get('/balance', ...adminAuth, controller.getBalance)
    .get('/counts', ...adminAuth, controller.getCounts)
    .get('/nfts/:state/:count/:page', ...adminAuth, controller.getNfts)
    .get('/nfts/:uid', ...adminAuth, controller.getNftDetailsById)
    .get('/transactions', ...adminAuth, controller.getTransactions)
    .post('/mint/random-batch', ...adminAuth, controller.mintRandomBatch)
    .post('/mint/specific-batch', ...adminAuth, csvUpload, controller.mintSpecificBatch)
    .post('/reports', ...adminAuth, controller.generateReport)
    .get('/reports/:reportId', ...adminAuth, controller.getReportStatus)
    .get('/reports/:reportId/download', ...adminAuth, controller.downloadReport);

  return router;
};
