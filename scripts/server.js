// scripts/server.js - Apenas servidor Express
import app from '../src/app.js';
import { initDatabase } from '../src/config/database.js';
import { logger } from '../src/utils/logger.js';
import config from '../src/config/environment.js';

async function startServer() {
  try {
    // Inicializar banco de dados
    await initDatabase();
    logger.info('✅ Database initialized successfully');

    // Iniciar servidor Express
    const server = app.listen(config.PORT, () => {
      logger.info(`🚀 Express Server running on port ${config.PORT}`);
      logger.info(`📡 Webhook endpoint: http://localhost:${config.PORT}/api/webhook_sol_d6b35afe`);
      logger.info(`💚 Health check: http://localhost:${config.PORT}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received, shutting down Express server gracefully`);

      server.close(() => {
        logger.info('Express server terminated');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception in server process:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start Express server:', error);
    process.exit(1);
  }
}

startServer();
