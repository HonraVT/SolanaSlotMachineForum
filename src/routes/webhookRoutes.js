// src/routes/webhookRoutes.js
import express from 'express';
import { webhookController } from '../controllers/webhookController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import config from '../config/environment.js';

const router = express.Router();

// Webhook principal para receber transações da Solana
router.post(config.WEBHOOK_PATH, authMiddleware, webhookController.handleSolanaWebhook.bind(webhookController));

// Rota protegida para estatísticas
router.get('/stats', authMiddleware, webhookController.getWebhookStats.bind(webhookController));

export default router;
