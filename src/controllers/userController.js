// src/controllers/userController.js
import { User } from '../models/User.js';
import { validateWallet } from '../services/solana/validationService.js';
import { sendWelcomeMessage } from '../services/forum/welcomeMessageService.js';
import { logger } from '../utils/logger.js';
import config from '../config/environment.js';

const messages = {
  pt_br: {
    registered: '[CENTER][COLOR=rgb(65, 168, 95)][SIZE=6]Usuário cadastrado com sucesso![/SIZE][/COLOR]\n[COLOR=rgb(44, 130, 201)][SIZE=5]Você pode comprar fichas e jogar![/SIZE][/COLOR]\n[SIZE=4]Carteira cadastrada: {wallet}[/SIZE]\n\n[SIZE=4]📬 Uma mensagem privada com instruções foi enviada para você![/SIZE][/CENTER]',
    alreadyRegistered: '[CENTER][SIZE=4]Usuário já cadastrado, renovando a mensagem privada.\nCarteira cadastrada: {wallet}[/SIZE][/CENTER]',
    walletInvalid: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=5]Não foi possível cadastrar o usuário.[/COLOR]\n\nCarteira inválida ou não fornecida.\n\nUse: cadastrar <sua_carteira_solana>[/SIZE][/CENTER]',
    walletAlreadyExists: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]CARTEIRA JÁ CADASTRADA[/SIZE][/COLOR]\n[SIZE=4]Esta carteira já está sendo usada por outro usuário.[/SIZE]\n[SIZE=4]Cada carteira só pode ser cadastrada uma vez.[/SIZE]\n\n[SIZE=4]💡 Se esta é sua carteira, entre em contato com a administração.[/SIZE][/CENTER]',
    systemError: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]Erro do sistema.[/SIZE][/COLOR]\n[SIZE=4]Tente novamente em alguns instantes.[/SIZE][/CENTER]',
    registeredNoMessage: '[CENTER][COLOR=rgb(65, 168, 95)][SIZE=6]Usuário cadastrado com sucesso![/SIZE][/COLOR]\n[COLOR=rgb(44, 130, 201)][SIZE=5]Você pode comprar fichas e jogar![/SIZE][/COLOR]\n[SIZE=4]Carteira cadastrada: {wallet}[/SIZE]\n\n[SIZE=4]⚠️ Não foi possível enviar a mensagem de boas-vindas, mas seu cadastro foi realizado![/SIZE][/CENTER]'
  },
  en: {
    registered: '[CENTER][COLOR=rgb(65, 168, 95)][SIZE=6]User registered successfully![/SIZE][/COLOR]\n[COLOR=rgb(44, 130, 201)][SIZE=5]You can buy chips and play![/SIZE][/COLOR]\n[SIZE=4]Registered wallet: {wallet}[/SIZE]\n\n[SIZE=4]📬 A private message with instructions has been sent to you![/SIZE][/CENTER]',
    alreadyRegistered: '[CENTER][SIZE=5]User already registered, renewing private message.\nRegistered wallet: {wallet}[/SIZE][/CENTER]',
    walletInvalid: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=5]Unable to register user.[/SIZE][/COLOR]\n\n[COLOR=rgb(250, 197, 28)]Invalid or missing wallet.[/COLOR]\n\n[COLOR=rgb(97, 189, 109)]Use: register <your_solana_wallet>[/COLOR][/CENTER]',
    walletAlreadyExists: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]WALLET ALREADY REGISTERED[/SIZE][/COLOR]\n[SIZE=4]This wallet is already being used by another user.[/SIZE]\n[SIZE=4]Each wallet can only be registered once.[/SIZE]\n\n[SIZE=4]💡 If this is your wallet, contact administration.[/SIZE][/CENTER]',
    systemError: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]System error.[/SIZE][/COLOR]\n[SIZE=4]Please try again in a few moments.[/SIZE][/CENTER]',
    registeredNoMessage: '[CENTER][COLOR=rgb(65, 168, 95)][SIZE=6]User registered successfully![/SIZE][/COLOR]\n[COLOR=rgb(44, 130, 201)][SIZE=5]You can buy chips and play![/SIZE][/COLOR]\n[SIZE=4]Registered wallet: {wallet}[/SIZE]\n\n[SIZE=4]⚠️ Could not send welcome message, but your registration was completed![/SIZE][/CENTER]'
  }
};

class UserController {
  constructor() {
    this.userModel = new User();
  }

  async join(db, conversationData, wallet = '') {
    try {
      logger.info(`User registration attempt: ${conversationData.messageData.user_name} with wallet: ${wallet}`);

      // Validar carteira
      if (!wallet || !validateWallet(wallet)) {
        logger.warn(`Invalid wallet provided: ${wallet}`);
        return this.getMessage('walletInvalid', config.LANGUAGE);
      }

      // Tentar criar usuário
      const result = await this.userModel.create(
        db,
        conversationData.messageData.user_id,
        wallet,
        conversationData.messageData.user_name
      );

      const userName = conversationData.messageData.user_name;

      // Verificar se a carteira já está sendo usada por outro usuário
      if (result.success === false && result.reason === 'wallet_exists') {
        logger.warn(`User ${conversationData.messageData.user_id} tried to register with wallet ${wallet} that belongs to user ${result.data.id}`);
        return this.getMessage('walletAlreadyExists', config.LANGUAGE);
      }

      // Usuário já existe (mesmo ID)
      if (result.exists === true && result.reason === 'user_exists') {
        logger.info(`User ${conversationData.messageData.user_id} already exists`);

        // Tentar enviar mensagem de boas-vindas mesmo para usuário existente
        try {
          await sendWelcomeMessage(userName, config.LANGUAGE);
          logger.info(`Welcome message sent to existing user: ${userName}`);
        } catch (welcomeError) {
          logger.warn(`Failed to send welcome message to existing user ${userName}:`, welcomeError.message);
        }

        return this.getMessage('alreadyRegistered', config.LANGUAGE).replace('{wallet}', result.data.wallet);
      }

      // Novo usuário criado com sucesso
      if (result.success === true && result.exists === false && result.reason === 'created') {
        logger.info(`User ${conversationData.messageData.user_id} registered successfully`);

        let messageKey = 'registered';

        // Tentar enviar mensagem de boas-vindas para novo usuário
        try {
          await sendWelcomeMessage(userName, config.LANGUAGE);
          logger.info(`Welcome message sent to new user: ${userName}`);
        } catch (welcomeError) {
          logger.warn(`Failed to send welcome message to new user ${userName}:`, welcomeError.message);
          messageKey = 'registeredNoMessage'; // Usar mensagem alternativa
        }

        return this.getMessage(messageKey, config.LANGUAGE).replace('{wallet}', wallet);
      }

      // Caso inesperado
      logger.error('Unexpected result from user creation:', result);
      return this.getMessage('systemError', config.LANGUAGE);

    } catch (error) {
      logger.error('Error in user controller join:', error);
      return this.getMessage('systemError', config.LANGUAGE);
    }
  }

  getMessage(key, language = 'pt_br') {
    const langMessages = messages[language] || messages['pt_br'];
    return langMessages[key] || langMessages['systemError'];
  }
}

export const userController = new UserController();