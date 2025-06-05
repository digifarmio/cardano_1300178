import express from 'express';
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
    .post('/mintRandom', ...adminAuth, controller.mintRandom)
    .post('/mintSpecific', ...adminAuth, controller.mintSpecific)
    .post('/reports', ...adminAuth, controller.generateReport)
    .get('/reports', ...adminAuth, controller.getAllReports)
    .get('/reports/:reportId', ...adminAuth, controller.getReportById)
    .get('/reports/:reportId/download', ...adminAuth, controller.downloadReport)
    .delete('/reports/:reportId', ...adminAuth, controller.deleteReport);

  return router;
};
