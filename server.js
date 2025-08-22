// server.js - Ponto de entrada principal
import app from './src/app.js';
import { initDatabase } from './src/config/database.js';
import { BotScheduler } from './src/services/scheduler/BotScheduler.js';
import { logger } from './src/utils/logger.js';
import config from './src/config/environment.js';

async function startServer() {
  try {
    // Inicializar banco de dados
    await initDatabase();
    logger.info('✅ Database initialized successfully');

    // Iniciar servidor Express
    const server = app.listen(config.PORT, () => {
      logger.info(`🚀 Server running on port ${config.PORT}`);
    });

    // Inicializar o bot scheduler
    const botScheduler = new BotScheduler();
    await botScheduler.start();
    logger.info('🤖 Bot scheduler started successfully');

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');

      botScheduler.stop();
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');

      botScheduler.stop();
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
