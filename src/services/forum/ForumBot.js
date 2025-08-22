// src/services/forum/ForumBot.js
import { ForumScraper } from './ForumScraper.js';
import { GameEngine } from '../game/GameEngine.js';
import { getDatabase } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import config from '../../config/environment.js';

export class ForumBot {
  constructor() {
    this.scraper = new ForumScraper({
      url: config.FORUM_URL,
      cookie: config.FORUM_XF_USER_COOKIE
    });

    this.gameEngine = new GameEngine();
    this.db = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Obter referência do banco de dados
      this.db = getDatabase();

      // Autenticar no fórum
      await this.scraper.getAuthorization();

      this.isInitialized = true;
      logger.info('Forum bot initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize forum bot:', error);
      throw error;
    }
  }

  async processMessages() {
    if (!this.isInitialized) {
      throw new Error('Bot not initialized. Call initialize() first.');
    }

    try {
      const unreadConversations = await this.scraper.latestUnreadConversations();

      if (unreadConversations.length === 0) {
        return 0;
      }

      logger.info(`Processing ${unreadConversations.length} unread conversations`);

      let index = 0;
      let processedCount = 0;

      for (const conversation of unreadConversations) {
        ++index;
        let delay = config.BOT_FLOOD_DELAY;

        try {
          await this.processConversation(conversation);
          processedCount++;

          // Delay entre mensagens para evitar rate limiting
          if (index === unreadConversations.length) {
            if (config.BOT_FLOOD_DELAY <= config.BOT_INTERVAL_MS) {
              delay = 0;
            } else {
              delay = Math.max(0, config.BOT_FLOOD_DELAY - config.BOT_INTERVAL_MS);
            }
          }
          logger.debug(`Anti flood: Interval between responses: ${delay}`);
          await this.delay(delay);

        } catch (error) {
          logger.error(`Failed to process conversation ${conversation.uri}:`, error);
        }
      }

      return processedCount;

    } catch (error) {
      logger.error('Error processing messages:', error);
      throw error;
    }
  }

  async processConversation(conversation) {
    const { uri, messageData } = conversation;

    // Verificar se a mensagem tem conteúdo válido
    if (!messageData || !messageData.msg || Object.keys(messageData).length === 0) {
      logger.debug(`Skipping conversation ${uri} - no valid message data`);
      return;
    }

    logger.info(`Processing message from ${messageData.user_name}: "${messageData.msg}"`);

    try {
      // Processar comando através do game engine
      const response = await this.gameEngine.processCommand(
        this.db,
        conversation,
        messageData.msg,
        config.LANGUAGE
      );

      // Enviar resposta se houver
      if (response) {
        await this.scraper.replyConversation(uri, response);
        logger.info(`Sent response to ${messageData.user_name}`);
      }

    } catch (error) {
      logger.error(`Error processing conversation ${uri}:`, error);

      // Enviar mensagem de erro para o usuário
      try {
        const errorMessage = this.getErrorMessage(config.LANGUAGE);
        await this.scraper.replyConversation(uri, errorMessage);
      } catch (replyError) {
        logger.error('Failed to send error message to user:', replyError);
      }
    }
  }

  getErrorMessage(language = 'pt_br') {
    const messages = {
      pt_br: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]Erro interno do sistema.[/SIZE][/COLOR]\n[SIZE=4]Tente novamente em alguns minutos.[/SIZE][/CENTER]',
      en: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]Internal system error.[/SIZE][/COLOR]\n[SIZE=4]Please try again in a few minutes.[/SIZE][/CENTER]'
    };

    return messages[language] || messages['en'];
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
