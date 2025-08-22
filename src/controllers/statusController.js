// src/controllers/statusController.js
import { getAppWalletBalance } from '../services/solana/balanceService.js';
import { webhookStatusService } from '../services/webhook/webhookStatusService.js';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { GamePlay } from '../models/GamePlay.js';
import { logger } from '../utils/logger.js';
import config from '../config/environment.js';

const messages = {
  pt_br: {
    status: `[CENTER][COLOR=rgb(44, 130, 201)][SIZE=6]STATUS[/SIZE][/COLOR]

[SIZE=5]💎 Suas fichas: {userChips}[/SIZE]
[SIZE=5]👤 Wallet: {userWallet}[/SIZE]

[SIZE=5]💰 Pagamento: {webhookStatus}[/SIZE]

[SIZE=4]Última verificação: {timestamp}[/SIZE][/CENTER]`,

    statusError: `[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]ERRO NO STATUS[/SIZE][/COLOR]

[SIZE=4]Não foi possível verificar suas informações.
Tente novamente em alguns minutos.[/SIZE][/CENTER]`,

    notRegistered: `[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]USUÁRIO NÃO CADASTRADO[/SIZE][/COLOR]

[SIZE=4]Você precisa se cadastrar primeiro.
Use: cadastrar [sua_carteira][/SIZE][/CENTER]`
  },

  en: {
    status: `[CENTER][COLOR=rgb(44, 130, 201)][SIZE=6]STATUS[/SIZE][/COLOR]

[SIZE=5]💎 Your chips: {userChips}[/SIZE]
[SIZE=5]👤 Wallet: {userWallet}[/SIZE]

[SIZE=5]💰 Payment: {webhookStatus}[/SIZE]

[SIZE=4]Last check: {timestamp}[/SIZE][/CENTER]`,

    statusError: `[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]STATUS ERROR[/SIZE][/COLOR]

[SIZE=4]Could not verify your information.
Please try again in a few minutes.[/SIZE][/CENTER]`,

    notRegistered: `[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]USER NOT REGISTERED[/SIZE][/COLOR]

[SIZE=4]You need to register first.
Use: join [your_wallet][/SIZE][/CENTER]`
  }
};

class StatusController {
  constructor() {
    this.userModel = new User();
    this.transactionModel = new Transaction();
    this.gamePlayModel = new GamePlay();
  }

  async getStatus(db, conversationData, argument = '') {
    try {
      logger.info(`Status request from user ${conversationData.messageData?.user_name}`);

      // Buscar usuário
      const user = await this.userModel.findById(db, conversationData.messageData.user_id);
      if (!user) {
        logger.warn(`User ${conversationData.messageData.user_id} not found for status`);
        return this.getMessage('notRegistered', config.LANGUAGE);
      }

      // Verificar status do webhook
      const webhookStatus = await webhookStatusService.getStatusDisplay(config.LANGUAGE);

      // Formatar wallet (primeiros 4 e últimos 4 caracteres)
      const wallet = user.wallet;
      const formattedWallet = `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;

      const timestamp = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const statusMessage = this.getMessage('status', config.LANGUAGE)
        .replace('{userChips}', user.balance || 0)
        .replace('{userWallet}', formattedWallet)
        .replace('{webhookStatus}', webhookStatus)
        .replace('{timestamp}', timestamp);

      return statusMessage;

    } catch (error) {
      logger.error('Error in status controller:', error);
      return this.getMessage('statusError', config.LANGUAGE);
    }
  }

  getMessage(key, language = 'pt_br') {
    const langMessages = messages[language] || messages['pt_br'];
    return langMessages[key] || langMessages['statusError'];
  }
}

export const statusController = new StatusController();
