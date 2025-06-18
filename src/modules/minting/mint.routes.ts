import express from 'express';
import { authenticate } from '@/modules/auth/auth.middleware';
import { requireRole } from '@/modules/auth/roles.middleware';
import { MintController } from '@/modules/minting/mint.controller';
import { Role } from '@/types';

export const createMintRoutes = () => {
  const router = express.Router();
  const controller = new MintController();

  const userAuth = [authenticate, requireRole(Role.user)];
  const minterOrAdminAuth = [authenticate, requireRole(Role.admin, Role.minter)];
  const minterOnlyAuth = [authenticate, requireRole(Role.minter)];

  // User routes
  router.get('/user/nfts', userAuth, controller.getUserNfts);

  // Admin + Minter routes (both can access)
  router
    .get('/balance', ...minterOrAdminAuth, controller.getBalance)
    .get('/counts', ...minterOrAdminAuth, controller.getCounts)
    .get('/nfts/:state/:count/:page', ...minterOrAdminAuth, controller.getNfts)
    .get('/nfts/:uid', ...minterOrAdminAuth, controller.getNftDetailsById)
    .get('/transactions', ...minterOrAdminAuth, controller.getTransactions)
    .post('/reports', ...minterOrAdminAuth, controller.generateReport)
    .get('/reports', ...minterOrAdminAuth, controller.getAllReports)
    .get('/reports/:reportId', ...minterOrAdminAuth, controller.getReportById)
    .get('/reports/:reportId/download', ...minterOrAdminAuth, controller.downloadReport)
    .delete('/reports/:reportId', ...minterOrAdminAuth, controller.deleteReport);

  // Minting routes (minter-only)
  router
    .post('/mintRandom', ...minterOnlyAuth, controller.mintRandom)
    .post('/mintSpecific', ...minterOnlyAuth, controller.mintSpecific);

  return router;
};
