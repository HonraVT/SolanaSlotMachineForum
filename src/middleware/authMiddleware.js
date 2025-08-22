// src/middleware/authMiddleware.js
import config from '../config/environment.js';
import { logger } from '../utils/logger.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    logger.warn('Missing authorization header');
    return res.status(401).json({ error: 'Authorization header required' });
  }

  if (authHeader !== config.AUTH_HEADER) {
    logger.warn(`Invalid authorization header: ${authHeader}`);
    return res.status(401).json({ error: 'Invalid authorization' });
  }

  next();
}
