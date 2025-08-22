// src/controllers/gameController.js
import { SlotMachine } from '../services/game/SlotMachine.js';
import { User } from '../models/User.js';
import { GamePlay } from '../models/GamePlay.js';
import { getAppWalletBalance } from '../services/solana/balanceService.js';
import { processPayout } from '../services/solana/payoutService.js';
import { parseSymbolString } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';
import config from '../config/environment.js';

const messages = {
  pt_br: {
    win: '[CENTER][SIZE=6][COLOR=rgb(250, 197, 28)]GANHOU![/COLOR]\n\n{combo}[/SIZE]\n\n[COLOR=rgb(65, 168, 95)][SIZE=5]PRÊMIO: {prize} SOL[/SIZE][/COLOR]\n[SIZE=5]Multiplicador[/SIZE]:[SIZE=6] {multiplier}[/SIZE]\n[SIZE=5]Fichas restantes: {chipsLeft}[/SIZE][/CENTER]',
    loss: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]PERDEU![/SIZE]\n\n[/COLOR][SIZE=6]{combo}[/SIZE]\n\n[SIZE=5]Fichas restantes: {chipsLeft}[/SIZE][/CENTER]',
    insufficientBalance: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]Saldo insuficiente para jogar.[/SIZE][/COLOR]\n[SIZE=4]Você precisa de pelo menos 1 ficha para jogar.[/SIZE]\n[SIZE=5]Fichas restantes: {chipsLeft}[/SIZE][/CENTER]',
    notRegistered: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]Usuário não cadastrado.[/SIZE][/COLOR]\n[SIZE=4]Use o comando "cadastrar [sua_carteira]" para se registrar primeiro.[/SIZE][/CENTER]',
    systemError: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]Erro do sistema.[/SIZE][/COLOR]\n[SIZE=4]Tente novamente em alguns instantes.[/SIZE][/CENTER]'
  },
  en: {
    win: '[CENTER][SIZE=6][COLOR=rgb(250, 197, 28)]WIN![/COLOR]\n\n{combo}[/SIZE]\n\n[COLOR=rgb(65, 168, 95)][SIZE=5]PRIZE: {prize} SOL[/SIZE][/COLOR]\n[SIZE=5]Multiplier[/SIZE]:[SIZE=6] {multiplier}[/SIZE]\n[SIZE=5]Remaining chips: {chipsLeft}[/SIZE][/CENTER]',
    loss: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]YOU LOSE![/SIZE][/COLOR]\n\n[SIZE=6]{combo}[/SIZE]\n\n[SIZE=5]Remaining chips: {chipsLeft}[/SIZE][/CENTER]',
    insufficientBalance: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]Insufficient balance to play.[/SIZE][/COLOR]\n[SIZE=4]You need at least 1 chip to play.[/SIZE]\n[SIZE=5]Remaining chips: {chipsLeft}[/SIZE][/CENTER]',
    notRegistered: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]User not registered.[/SIZE][/COLOR]\n[SIZE=4]Use the command "join [your_wallet]" to register first.[/SIZE][/CENTER]',
    systemError: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=6]System error.[/SIZE][/COLOR]\n[SIZE=4]Please try again in a few moments.[/SIZE][/CENTER]'
  }
};

class GameController {
  constructor() {
    this.userModel = new User();
    this.gamePlayModel = new GamePlay();
  }

  async play(db, conversationData, argument = '') {
    try {
      // Verificar se a mensagem foi originalmente criada pelo bot
      if (conversationData.author !== config.BOT_NAME) {
        logger.debug("Ignoring message not started by bot");
        return null;
      }

      // Parse da aposta
      const rawChips = parseInt(argument, 10);
      const chips = (rawChips >= 1 && rawChips <= 15) ? rawChips : 1;

      logger.info(`User ${conversationData.messageData.user_name} wants to play with ${chips} chips`);

      // Buscar usuário
      const user = await this.userModel.findById(db, conversationData.messageData.user_id);
      if (!user) {
        logger.warn(`User ${conversationData.messageData.user_id} not found`);
        return this.getMessage('notRegistered');
      }

      // Verificar saldo suficiente
      if (user.balance < chips) {
        logger.warn(`User ${user.id} has insufficient balance: ${user.balance} < ${chips}`);
        return this.getMessage('insufficientBalance').replace('{chipsLeft}', user.balance);
      }

      // Obter saldo da carteira do app
      const appBalance = await getAppWalletBalance();
      logger.debug(`App wallet balance: ${appBalance.lamports} lamports (${appBalance.sol} SOL)`);

      // Criar máquina caça-níqueis e jogar
      const slot = new SlotMachine(appBalance.lamports, user.balance);
      const result = slot.spin(chips);

      logger.info('Game result:', {
        userId: user.id,
        bet: chips,
        win: result.win,
        combo: result.combo,
        payout: result.payout,
        newBalance: result.playerBalance
      });

      // Atualizar saldo do usuário
      await this.userModel.updateBalance(db, user.id, result.playerBalance);

      // Registrar gameplay
      await this.gamePlayModel.create(
        db,
        conversationData.messageId,
        conversationData.messageData.user_id,
        `play ${chips}`,
        result.win ? 'win' : 'loss'
      );

      const combo = parseSymbolString(result.combo);

      // Processar pagamento se ganhou
      if (result.win === true) {
        logger.info(`Processing payout: ${result.payoutLamports} lamports to ${user.wallet}`);

        try {
          const payoutResult = await processPayout(user.wallet, result.payoutLamports);
          if (payoutResult.success) {
            logger.info(`Payout successful: ${payoutResult.signature}`);
          } else {
            logger.error(`Payout failed: ${payoutResult.error}`);
          }
        } catch (payoutError) {
          logger.error('Payout processing error:', payoutError);
        }

        const prize = result.payoutLamports / 1_000_000_000;
        return this.getMessage('win')
          .replace('{combo}', combo)
          .replace('{prize}', prize.toFixed(6))
          .replace('{multiplier}', result.multiplier)
          .replace('{chipsLeft}', result.playerBalance);
      }

      // Resultado perdedor
      return this.getMessage('loss')
        .replace('{combo}', combo)
        .replace('{chipsLeft}', result.playerBalance);

    } catch (error) {
      logger.error('Error in game controller play:', error);
      return this.getMessage('systemError');
    }
  }

  getMessage(key, language = 'pt_br') {
    const langMessages = messages[language] || messages['pt_br'];
    return langMessages[key] || langMessages['systemError'];
  }
}

export const gameController = new GameController();
