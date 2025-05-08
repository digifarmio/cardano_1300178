import express from 'express';
import serverless from 'serverless-http';
import { createGeoNftRoutes } from './modules/geonft/geonft.routes';
import { createMintRoutes } from './modules/minting/mint.routes';

const app = express();

// Global middleware
app.use(express.json());

// Module routes
app.use('/geo-nft', createGeoNftRoutes());
app.use('/mint', createMintRoutes());

// 404 Not Found
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response) => {
  console.error(`[${new Date().toISOString()}] Error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

export const handler = serverless(app);
