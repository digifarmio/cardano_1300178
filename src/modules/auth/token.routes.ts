import express from 'express';
import { authenticate } from '@/modules/auth/auth.middleware';
import { requireRole } from '@/modules/auth/roles.middleware';
import { TokenController } from '@/modules/auth/token.controller';
import { Role } from '@/types';

export const createTokenRoutes = () => {
  const router = express.Router();
  const controller = new TokenController();

  const adminAuth = [authenticate, requireRole(Role.admin)];

  router
    .post('/tokens/admin', ...adminAuth, controller.issueAdminToken)
    .post('/tokens/user', ...adminAuth, controller.issueUserToken);

  return router;
};
