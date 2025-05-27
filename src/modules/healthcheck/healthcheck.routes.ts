import express from 'express';
import { HealthCheckController } from '@/modules/healthcheck/healthcheck.controller';

export function createHealthCheckRoutes() {
  const router = express.Router();
  const controller = new HealthCheckController();

  router.get('/liveness', controller.liveness);
  router.get('/health', controller.checkHealth);

  return router;
}
