// src/controllers/buyController.js
import { User } from '../models/User.js';
import { webhookStatusService } from '../services/webhook/webhookStatusService.js';
import { logger } from '../utils/logger.js';
import config from '../config/environment.js';

const messages = {
  pt_br: {
    buy: `[CENTER][COLOR=rgb(44, 130, 201)][SIZE=6]COMPRAR FICHAS[/SIZE][/COLOR]

[SIZE=5]💎 Suas fichas atuais: {userChips}[/SIZE]

[SIZE=5]VALORES PARA DEPÓSITO:[/SIZE]

[TABLE]
[TR]
{paymentOptions}
[/TR]
[/TABLE]

📱 [B]Como usar os QR Codes:[/B]
• Escaneie com o App sua carteira Solana (Phantom, Solflare, etc.)

ou

[SIZE=5]📱 Envie o valor [B]exato[/B] para a carteira Solana:[/SIZE]
[SIZE=5][FONT=courier][B]{appWallet}[/B][/FONT][/SIZE]

[SIZE=5]💰 Pagamento: {webhookStatus}[/SIZE]

[SIZE=4]⚡ As fichas serão creditadas automaticamente![/SIZE]
[SIZE=4]Última atualização: {timestamp}[/SIZE][/CENTER]`,

    notRegistered: `[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]USUÁRIO NÃO CADASTRADO[/SIZE][/COLOR]

[SIZE=4]Você precisa se cadastrar primeiro.
Use: cadastrar [sua_carteira][/SIZE][/CENTER]`,

    buyError: `[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]ERRO AO CARREGAR[/SIZE][/COLOR]

[SIZE=4]Não foi possível carregar as opções de compra.
Tente novamente em alguns minutos.[/SIZE][/CENTER]`
  },

  en: {
    buy: `[CENTER][COLOR=rgb(44, 130, 201)][SIZE=6]BUY CHIPS[/SIZE][/COLOR]

[SIZE=5]💎 Your current chips: {userChips}[/SIZE]

[SIZE=5]DEPOSIT VALUES:[/SIZE]

{paymentOptions}

or

[SIZE=5]📱 Send [B]exact[/B] amount to Solana wallet:[/SIZE]
[SIZE=5][FONT=courier][B]{appWallet}[/B][/FONT][/SIZE]

[SIZE=5]💰 Payment: {webhookStatus}[/SIZE]

[SIZE=4]⚡ Chips will be credited automatically![/SIZE]
[SIZE=4]Last update: {timestamp}[/SIZE][/CENTER]`,

    notRegistered: `[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]USER NOT REGISTERED[/SIZE][/COLOR]

[SIZE=4]You need to register first.
Use: join [your_wallet][/SIZE][/CENTER]`,

    buyError: `[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]LOADING ERROR[/SIZE][/COLOR]

[SIZE=4]Could not load purchase options.
Please try again in a few minutes.[/SIZE][/CENTER]`
  }
};

class BuyController {
  constructor() {
    this.userModel = new User();
  }

  async buy(db, conversationData, argument = '') {
    try {
      logger.info(`Buy request from user ${conversationData.messageData?.user_name}`);

      // Buscar usuário
      const user = await this.userModel.findById(db, conversationData.messageData.user_id);
      if (!user) {
        logger.warn(`User ${conversationData.messageData.user_id} not found for buy`);
        return this.getMessage('notRegistered', config.LANGUAGE);
      }

      // Verificar status do webhook
      const webhookStatus = await webhookStatusService.getStatusDisplay(config.LANGUAGE);

      // Gerar opções de pagamento
      const paymentOptions = await this.generatePaymentOptions();

      const timestamp = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const buyMessage = this.getMessage('buy', config.LANGUAGE)
        .replace('{userChips}', user.balance || 0)
        .replace('{paymentOptions}', paymentOptions)
        .replace('{appWallet}', config.APP_PUBLIC_KEY)
        .replace('{webhookStatus}', webhookStatus)
        .replace('{timestamp}', timestamp);

      return buyMessage;

    } catch (error) {
      logger.error('Error in buy controller:', error);
      return this.getMessage('buyError', config.LANGUAGE);
    }
  }

  async generatePaymentOptions() {
    try {
      let options = '';
      const language = config.LANGUAGE || 'pt_br';

      Object.entries(config.LAMPORTS_TO_CHIPS).forEach(([lamports, chips], index) => {
        const sol = (parseInt(lamports) / 1_000_000_000).toFixed(4);

        const qrLink = config.QRCODES;
        let qrImg = '';

        if (qrLink) {
          qrImg = `\n[ISPOILER][IMG]${qrLink[index]}[/IMG][/ISPOILER]`
        }

        if (language === 'pt_br') {
          options += `[TD][CENTER][SIZE=5]💰 ${sol} SOL = ${chips} Fichas[/SIZE]\n${qrImg}[/CENTER][/TD]`;
        } else {
          options += `[TD][CENTER][SIZE=5]💰 ${sol} SOL = ${chips} Chips[/SIZE]\n${qrImg}[/CENTER][/TD]`;
        }

        options += '\n';

      });

      return options.trim();

    } catch (error) {
      logger.error('Error generating payment options:', error);
      const language = config.LANGUAGE || 'pt_br';
      return language === 'pt_br' ?
        '[SIZE=4]❌ Erro ao carregar opções de pagamento[/SIZE]' :
        '[SIZE=4]❌ Error loading payment options[/SIZE]';
    }
  }


  getMessage(key, language = 'pt_br') {
    const langMessages = messages[language] || messages['pt_br'];
    return langMessages[key] || langMessages['buyError'];
  }
}

export const buyController = new BuyController();
