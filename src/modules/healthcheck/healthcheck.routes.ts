import { HealthCheckController } from '@/modules/healthcheck/healthcheck.controller';
import express from 'express';

export function createHealthCheckRoutes() {
  const router = express.Router();
  const controller = new HealthCheckController();

  router.get('/liveness', controller.liveness);
  router.get('/health', controller.checkHealth);

  return router;
}
