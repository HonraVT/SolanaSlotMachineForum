// src/services/scheduler/BotScheduler.js
import { ForumBot } from '../forum/ForumBot.js';
import { logger } from '../../utils/logger.js';
import config from '../../config/environment.js';

export class BotScheduler {
  constructor() {
    this.bot = new ForumBot();
    this.isRunning = false;

    // tempos de espera entre as tentativas de reinicialização (em ms)
    this.retryDelays = [
      10000,      // 10 segundos
      10000,      // 10 segundos
      30000,      // 30 segundos
      5 * 60000,  // 5 minutos
      60 * 60000  // 1 hora
    ];
  }

  async start() {
    if (this.isRunning) return logger.warn('Bot scheduler already running');
    this.isRunning = true;
    logger.info('Bot scheduler started');

    // Inicialização antes do loop principal
    if (!(await this.initializeWithRetries())) {
      logger.error('Bot could not be initialized after retries. Stopping scheduler.');
      this.isRunning = false;
      return;
    }

    while (this.isRunning) {
      try {
        const processedMessages = await this.bot.processMessages();
        logger.info(`Processed ${processedMessages} messages`);
      } catch (err) {
        logger.error('Error in bot cycle:', err);
        if (!(await this.initializeWithRetries())) {
          logger.error('Failed to reinitialize bot after retries. Stopping scheduler.');
          this.isRunning = false;
          break;
        }
      }

      await this.delay(config.BOT_INTERVAL_MS);
    }
  }

  async initializeWithRetries() {
    for (let attempt = 1; attempt <= this.retryDelays.length; attempt++) {
      try {
        await this.bot.initialize();
        logger.info(`Bot initialized successfully (attempt ${attempt})`);
        return true;
      } catch (err) {
        logger.warn(`Initialization failed (attempt ${attempt}/${this.retryDelays.length}):`, err);
        if (attempt < this.retryDelays.length) {
          const delayTime = this.retryDelays[attempt - 1];
          logger.info(`Retrying in ${delayTime / 1000} seconds...`);
          await this.delay(delayTime);
        }
      }
    }
    return false; // falhou todas as tentativas
  }

  stop() {
    this.isRunning = false;
    logger.info('Bot scheduler stopped');
  }

  delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }
}
