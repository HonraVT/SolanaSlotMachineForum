// src/services/game/GameEngine.js
import { CommandParser } from './CommandParser.js';
import { gameController } from '../../controllers/gameController.js';
import { userController } from '../../controllers/userController.js';
import { statusController } from '../../controllers/statusController.js';
import { buyController } from '../../controllers/buyController.js';
import { predictionController } from '../../controllers/predictionController.js';
import { logger } from '../../utils/logger.js';

export class GameEngine {
  constructor() {
    this.commandParser = new CommandParser();
    this.controllers = {
      play: gameController.play.bind(gameController),
      join: userController.join.bind(userController),
      status: statusController.getStatus.bind(statusController),
      buy: buyController.buy.bind(buyController),
      predictionHelp: predictionController.help.bind(predictionController),
      predictionList: predictionController.list.bind(predictionController),
      predictionPredict: predictionController.predict.bind(predictionController),
      predictionCreate: predictionController.create.bind(predictionController),
      predictionResolve: predictionController.resolve.bind(predictionController),
      error: this.handleError.bind(this)
    };
  }

  async processCommand(db, conversationData, input, language = 'pt_br') {
    try {
      // Parse do comando
      const { command, argument } = this.commandParser.parse(input, language);

      logger.debug(`Processing command: ${command} with argument: ${argument}`, {
        userId: conversationData.messageData?.user_id,
        userName: conversationData.messageData?.user_name,
        input: input.trim()
      });

      // Verificar se o comando existe
      if (!this.controllers[command]) {
        logger.warn(`Unknown command: ${command}`);
        return this.getErrorMessage(language, 'unknownCommand');
      }

      // Executar o controlador correspondente
      const controller = this.controllers[command];
      const result = await controller(db, conversationData, argument);

      // Log do resultado
      if (result) {
        logger.info(`Command ${command} executed successfully for user ${conversationData.messageData?.user_name}`);
      }

      return result;

    } catch (error) {
      logger.error('Error in game engine processCommand:', error);
      return this.getErrorMessage(language, 'systemError');
    }
  }

  async handleError(db, conversationData, argument = '') {
    const language = conversationData.language || 'pt_br';
    return this.getErrorMessage(language, 'invalidCommand');
  }

  getErrorMessage(language = 'pt_br', errorType = 'systemError') {
    const messages = {
      pt_br: {
        invalidCommand: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]Comando inválido.[/SIZE][/COLOR]\n[SIZE=4]Comandos disponíveis:\n• cadastrar [sua_carteira] - Para se registrar\n• jogar [fichas] - Para jogar (1-15 fichas)\n• status - Ver seu status\n• comprar - Comprar fichas\n• previsoes - Mercados de previsão\n• prever <id> sim|nao <fichas> - Fazer previsão[/SIZE][/CENTER]',
        unknownCommand: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]Comando não reconhecido.[/SIZE][/COLOR]\n[SIZE=4]Use "cadastrar" para se registrar, "jogar" para apostar, "status", "comprar" ou "previsoes".[/SIZE][/CENTER]',
        systemError: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]Erro do sistema.[/SIZE][/COLOR]\n[SIZE=4]Tente novamente em alguns instantes.[/SIZE][/CENTER]'
      },
      en: {
        invalidCommand: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]Invalid command.[/SIZE][/COLOR]\n[SIZE=4]Available commands:\n• join [your_wallet] - To register\n• play [chips] - To play (1-15 chips)\n• status - Check your status\n• buy - Purchase chips\n• markets - Prediction markets\n• predict <id> yes|no <chips> - Make prediction[/SIZE][/CENTER]',
        unknownCommand: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]Unknown command.[/SIZE][/COLOR]\n[SIZE=4]Use "join" to register, "play" to bet, "status", "buy" or "markets".[/SIZE][/CENTER]',
        systemError: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]System error.[/SIZE][/COLOR]\n[SIZE=4]Please try again in a few moments.[/SIZE][/CENTER]'
      }
    };

    const langMessages = messages[language] || messages['pt_br'];
    return langMessages[errorType] || langMessages['systemError'];
  }

  getSupportedCommands(language = 'pt_br') {
    return this.commandParser.getSupportedCommands(language);
  }

  isValidCommand(command, language = 'pt_br') {
    return this.commandParser.isValidCommand(command, language);
  }

  getStats() {
    return {
      supportedControllers: Object.keys(this.controllers),
      supportedLanguages: ['pt_br', 'en']
    };
  }
}
