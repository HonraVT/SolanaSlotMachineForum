// scripts/scheduler.js - Apenas Bot Scheduler
import { initDatabase } from '../src/config/database.js';
import { BotScheduler } from '../src/services/scheduler/BotScheduler.js';
import { logger } from '../src/utils/logger.js';
import config from '../src/config/environment.js';

async function startScheduler() {
  try {
    // Inicializar banco de dados
    await initDatabase();
    logger.info('✅ Database initialized for scheduler');

    // Inicializar o bot scheduler
    const botScheduler = new BotScheduler();
    await botScheduler.start();

    logger.info('🤖 Bot scheduler started successfully');
    logger.info(`⏰ Bot interval: ${config.BOT_INTERVAL_MS}ms (${config.BOT_INTERVAL_MS / 1000}s)`);
    logger.info(`🌐 Forum URL: ${config.FORUM_URL}`);
    logger.info(`👤 Bot Name: ${config.BOT_NAME}`);

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, shutting down bot scheduler gracefully`);

      try {
        await botScheduler.stop();
        logger.info('Bot scheduler terminated');
        process.exit(0);
      } catch (error) {
        logger.error('Error stopping bot scheduler:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception in scheduler process:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // Keep the process alive
    process.stdin.resume();

  } catch (error) {
    logger.error('Failed to start bot scheduler:', error);
    process.exit(1);
  }
}

startScheduler();
