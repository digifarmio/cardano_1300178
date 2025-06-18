import express from 'express';
import { authenticate } from '@/modules/auth/auth.middleware';
import { requireRole } from '@/modules/auth/roles.middleware';
import { TokenController } from '@/modules/auth/token.controller';
import { Role } from '@/types';

export const createTokenRoutes = () => {
  const router = express.Router();
  const controller = new TokenController();

  const minterOrAdminAuth = [authenticate, requireRole(Role.admin, Role.minter)];

  router
    .post('/tokens/admin', ...minterOrAdminAuth, controller.issueAdminToken)
    .post('/tokens/user', ...minterOrAdminAuth, controller.issueUserToken);

  return router;
};
