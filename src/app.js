// src/app.js
import express from 'express';
import bodyParser from 'body-parser';
import webhookRoutes from './routes/webhookRoutes.js';
import { logger } from './utils/logger.js';

const app = express();

// Middleware
app.use(bodyParser.json());

// Middleware de logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Rotas
app.use('/api', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
