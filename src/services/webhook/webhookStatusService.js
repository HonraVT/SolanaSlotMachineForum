// src/services/webhook/webhookStatusService.js
import axios from 'axios';
import config from '../../config/environment.js';
import { logger } from '../../utils/logger.js';

export class WebhookStatusService {
  constructor() {
    this.baseUrl = `http://localhost:${config.PORT}`;
    this.healthEndpoint = '/health';
    this.timeout = 5000; // 5 segundos timeout
  }

  async checkWebhookHealth() {
    try {
      const response = await axios.get(`${this.baseUrl}${this.healthEndpoint}`, {
        timeout: this.timeout,
        validateStatus: function (status) {
          return status === 200;
        }
      });

      if (response.data && response.data.status === 'ok') {
        logger.debug('Webhook health check: OK');
        return {
          isOnline: true,
          status: 'ok',
          timestamp: response.data.timestamp
        };
      }

      return {
        isOnline: false,
        status: 'error',
        error: 'Invalid response from webhook'
      };

    } catch (error) {
      logger.warn('Webhook health check failed:', error.message);

      return {
        isOnline: false,
        status: 'error',
        error: error.code === 'ECONNREFUSED' ? 'Connection refused' : error.message
      };
    }
  }

  getStatusDisplay(language = 'pt_br') {
    return this.checkWebhookHealth().then(result => {
      const messages = {
        pt_br: {
          online: '[COLOR=rgb(65, 168, 95)]FUNCIONANDO[/COLOR]',
          offline: '[COLOR=rgb(184, 49, 47)]FORA DO AR[/COLOR]'
        },
        en: {
          online: '[COLOR=rgb(65, 168, 95)]WORKING[/COLOR]',
          offline: '[COLOR=rgb(184, 49, 47)]OFFLINE[/COLOR]'
        }
      };

      const langMessages = messages[language] || messages['pt_br'];
      return result.isOnline ? langMessages.online : langMessages.offline;
    });
  }
}

export const webhookStatusService = new WebhookStatusService();
