import { Request, Response } from 'express';
import { NmkrClient } from '../core/nmkr.client';

export class HealthCheckController {
  private readonly nmkrClient: NmkrClient;

  constructor() {
    this.nmkrClient = new NmkrClient();

    // Auto-bind methods
    this.liveness = this.liveness.bind(this);
    this.checkHealth = this.checkHealth.bind(this);
  }

  async liveness(_req: Request, res: Response) {
    res.status(200).json({ status: 'alive' });
  }

  async checkHealth(_req: Request, res: Response) {
    try {
      const healthStatus = {
        api: 'healthy',
        dependencies: {
          nmkrService: await this.nmkrClient.getServerState(),
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(healthStatus);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      res.status(503).json({
        api: 'healthy',
        dependencies: {
          nmkrService: {
            status: 'unavailable',
            error: errorMessage,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
