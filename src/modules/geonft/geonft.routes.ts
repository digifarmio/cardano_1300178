import express from 'express';
import { authenticate } from '@/modules/auth/auth.middleware';
import { requireRole } from '@/modules/auth/roles.middleware';
import { GeoNftController } from '@/modules/geonft/geonft.controller';
import { Role } from '@/types';

export function createGeoNftRoutes() {
  const router = express.Router();
  const controller = new GeoNftController();

  const minterOrAdminAuth = [authenticate, requireRole(Role.admin, Role.minter)];

  router.post('/get-nft/process-csv', ...minterOrAdminAuth, controller.handleGeoNftProcess);

  return router;
}
