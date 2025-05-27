import { Request, Response } from 'express';
import { NmkrClient } from '@/modules/core/nmkr.client';

export class HealthCheckController {
  private readonly nmkrClient = new NmkrClient();

  liveness = (_req: Request, res: Response) => {
    res.status(200).json({ status: 'alive' });
  };

  checkHealth = async (_req: Request, res: Response) => {
    try {
      const nmkrService = await this.nmkrClient.getServerState();
      res.status(200).json({
        api: 'healthy',
        dependencies: { nmkrService },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        api: 'healthy',
        dependencies: {
          nmkrService: {
            status: 'unavailable',
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          },
        },
        timestamp: new Date().toISOString(),
      });
    }
  };
}
