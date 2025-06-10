import express from 'express';
import serverless from 'serverless-http';
import { createTokenRoutes } from '@/modules/auth/token.routes';
import { globalErrorHandler } from '@/modules/core/errorHandler';
import { createGeoNftRoutes } from '@/modules/geonft/geonft.routes';
import { createHealthCheckRoutes } from '@/modules/healthcheck/healthcheck.routes';
import { createMintRoutes } from '@/modules/minting/mint.routes';

const app = express();

// Global middleware
app.use(express.json());

// Module routes
app.use('/', createHealthCheckRoutes());
app.use('/', createTokenRoutes());
app.use('/', createGeoNftRoutes());
app.use('/', createMintRoutes());

// Global error handler
app.use(globalErrorHandler);

export const handler = serverless(app);
export default app;
