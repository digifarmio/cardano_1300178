import express from 'express';
import { authenticate } from '@/modules/auth/auth.middleware';
import { requireRole } from '@/modules/auth/roles.middleware';
import { GeoNftController } from '@/modules/geonft/geonft.controller';
import { Role } from '@/types';
import { fileUploads } from '@/config/multer-config';

export function createGeoNftRoutes() {
  const router = express.Router();
  const controller = new GeoNftController();

  const adminAuth = [authenticate, requireRole(Role.admin)];

  router.post('/get-nft/process-csv', ...adminAuth, fileUploads, controller.handleGeoNftProcess);

  return router;
}
