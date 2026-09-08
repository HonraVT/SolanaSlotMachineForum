// src/controllers/predictionController.js
import { PredictionMarket } from '../models/PredictionMarket.js';
import { Prediction } from '../models/Prediction.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';
import config from '../config/environment.js';

const messages = {
  pt_br: {
    help: '[CENTER][COLOR=rgb(44, 130, 201)][SIZE=6]MERCADO DE PREVISÕES[/SIZE][/COLOR]\n\n[SIZE=4]Comandos:\n• previsoes - listar mercados abertos\n• prever <id> sim|nao <fichas> - apostar em uma previsão\n• criar_previsao <pergunta> - admin cria mercado\n• resolver_previsao <id> sim|nao - admin encerra e distribui prêmios[/SIZE][/CENTER]',
    noMarkets: '[CENTER][SIZE=5]Nenhum mercado de previsão aberto no momento.[/SIZE][/CENTER]',
    marketList: '[CENTER][COLOR=rgb(44, 130, 201)][SIZE=6]PREVISÕES ABERTAS[/SIZE][/COLOR]\n\n{markets}\n\n[SIZE=4]Use: prever <id> sim|nao <fichas>[/SIZE][/CENTER]',
    created: '[CENTER][COLOR=rgb(65, 168, 95)][SIZE=6]PREVISÃO CRIADA[/SIZE][/COLOR]\n\n[SIZE=5]#{id}: {question}[/SIZE]\n\n[SIZE=4]Usuários podem usar: prever {id} sim|nao <fichas>[/SIZE][/CENTER]',
    resolved: '[CENTER][COLOR=rgb(65, 168, 95)][SIZE=6]PREVISÃO RESOLVIDA[/SIZE][/COLOR]\n\n[SIZE=5]#{id}: {question}[/SIZE]\n[SIZE=5]Resultado: {winningOption}[/SIZE]\n\n[SIZE=4]Pool total: {totalPool} fichas\nVencedores: {winnerCount}\nPerdedores: {loserCount}\nDistribuído: {distributed} fichas[/SIZE][/CENTER]',
    predicted: '[CENTER][COLOR=rgb(65, 168, 95)][SIZE=6]PREVISÃO REGISTRADA[/SIZE][/COLOR]\n\n[SIZE=5]#{id}: {question}[/SIZE]\n[SIZE=5]Sua escolha: {option}\nFichas apostadas: {stake}[/SIZE]\n\n[SIZE=4]Pool SIM: {yesPool} fichas\nPool NÃO: {noPool} fichas\nSeu saldo: {balance} fichas[/SIZE][/CENTER]',
    adminOnly: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=5]Apenas administradores podem executar este comando.[/SIZE][/COLOR][/CENTER]',
    notRegistered: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=5]Você precisa se cadastrar primeiro.[/SIZE][/COLOR][/CENTER]',
    invalidCreate: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=5]Use: criar_previsao <pergunta>[/SIZE][/COLOR][/CENTER]',
    invalidPredict: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=5]Use: prever <id> sim|nao <fichas>[/SIZE][/COLOR][/CENTER]',
    invalidResolve: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=5]Use: resolver_previsao <id> sim|nao[/SIZE][/COLOR][/CENTER]',
    marketNotFound: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=5]Mercado não encontrado ou já resolvido.[/SIZE][/COLOR][/CENTER]',
    alreadyPredicted: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=5]Você já fez uma previsão neste mercado.[/SIZE][/COLOR][/CENTER]',
    insufficientBalance: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=5]Saldo insuficiente. Seu saldo: {balance} fichas.[/SIZE][/COLOR][/CENTER]',
    systemError: '[CENTER][COLOR=rgb(184, 49, 47)][SIZE=5]Erro no mercado de previsões. Tente novamente.[/SIZE][/COLOR][/CENTER]'
  }
};

const optionAliases = {
  sim: 'yes',
  yes: 'yes',
  y: 'yes',
  nao: 'no',
  não: 'no',
  no: 'no',
  n: 'no'
};

class PredictionController {
  constructor() {
    this.marketModel = new PredictionMarket();
    this.predictionModel = new Prediction();
    this.userModel = new User();
  }

  async help() {
    return this.getMessage('help');
  }

  async list(db) {
    try {
      const markets = await this.marketModel.getOpen(db, 10);
      if (markets.length === 0) return this.getMessage('noMarkets');

      const lines = [];
      for (const market of markets) {
        const stats = await this.marketModel.getStats(db, market.id);
        lines.push(`[B]#${market.id}[/B] ${market.question}\nSIM: ${stats.yesPool} fichas | NÃO: ${stats.noPool} fichas | Total: ${stats.totalPool}`);
      }

      return this.getMessage('marketList').replace('{markets}', lines.join('\n\n'));
    } catch (error) {
      logger.error('Error listing prediction markets:', error);
      return this.getMessage('systemError');
    }
  }

  async create(db, conversationData, argument = '') {
    try {
      if (!this.isAdmin(conversationData)) return this.getMessage('adminOnly');
      const question = argument.trim();
      if (!question) return this.getMessage('invalidCreate');

      const market = await this.marketModel.create(db, question, conversationData.messageData.user_id);
      return this.getMessage('created')
        .replaceAll('{id}', market.id)
        .replace('{question}', market.question);
    } catch (error) {
      logger.error('Error creating prediction market:', error);
      return this.getMessage('systemError');
    }
  }

  async predict(db, conversationData, argument = '') {
    try {
      const parts = argument.trim().split(/\s+/);
      const marketId = Number.parseInt(parts[0], 10);
      const option = this.normalizeOption(parts[1]);
      const stake = Number.parseInt(parts[2], 10);

      if (!marketId || !option || !Number.isInteger(stake) || stake <= 0) {
        return this.getMessage('invalidPredict');
      }

      const market = await this.marketModel.findById(db, marketId);
      if (!market || market.status !== 'open') return this.getMessage('marketNotFound');

      const userId = conversationData.messageData.user_id;
      const user = await this.userModel.findById(db, userId);
      if (!user) return this.getMessage('notRegistered');

      const existingPrediction = await this.predictionModel.findByUserAndMarket(db, userId, marketId);
      if (existingPrediction) return this.getMessage('alreadyPredicted');

      if (user.balance < stake) {
        return this.getMessage('insufficientBalance').replace('{balance}', user.balance || 0);
      }

      await db.exec('BEGIN TRANSACTION');
      try {
        await this.userModel.updateBalance(db, userId, user.balance - stake);
        await this.predictionModel.create(db, marketId, userId, option, stake);
        await db.exec('COMMIT');
      } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
      }

      const stats = await this.marketModel.getStats(db, marketId);
      return this.getMessage('predicted')
        .replace('{id}', market.id)
        .replace('{question}', market.question)
        .replace('{option}', this.displayOption(option))
        .replace('{stake}', stake)
        .replace('{yesPool}', stats.yesPool)
        .replace('{noPool}', stats.noPool)
        .replace('{balance}', user.balance - stake);
    } catch (error) {
      logger.error('Error registering prediction:', error);
      return this.getMessage('systemError');
    }
  }

  async resolve(db, conversationData, argument = '') {
    try {
      if (!this.isAdmin(conversationData)) return this.getMessage('adminOnly');

      const parts = argument.trim().split(/\s+/);
      const marketId = Number.parseInt(parts[0], 10);
      const winningOption = this.normalizeOption(parts[1]);
      if (!marketId || !winningOption) return this.getMessage('invalidResolve');

      const market = await this.marketModel.findById(db, marketId);
      if (!market || market.status !== 'open') return this.getMessage('marketNotFound');

      const predictions = await this.predictionModel.findByMarket(db, marketId);
      const winners = predictions.filter(prediction => prediction.option === winningOption);
      const losers = predictions.filter(prediction => prediction.option !== winningOption);
      const winnerStake = winners.reduce((sum, prediction) => sum + prediction.stake, 0);
      const loserPool = losers.reduce((sum, prediction) => sum + prediction.stake, 0);
      let distributed = 0;

      await db.exec('BEGIN TRANSACTION');
      try {
        await this.marketModel.resolve(db, marketId, winningOption);

        for (const winner of winners) {
          const share = winnerStake > 0 ? (winner.stake / winnerStake) * loserPool : 0;
          const payout = winner.stake + share;
          distributed += payout;
          await this.userModel.addBalance(db, winner.userId, payout);
          await this.predictionModel.markResolved(db, winner.id, 'won', payout);
        }

        for (const loser of losers) {
          await this.predictionModel.markResolved(db, loser.id, 'lost', 0);
        }

        await db.exec('COMMIT');
      } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
      }

      return this.getMessage('resolved')
        .replace('{id}', market.id)
        .replace('{question}', market.question)
        .replace('{winningOption}', this.displayOption(winningOption))
        .replace('{totalPool}', winnerStake + loserPool)
        .replace('{winnerCount}', winners.length)
        .replace('{loserCount}', losers.length)
        .replace('{distributed}', Number(distributed.toFixed(4)));
    } catch (error) {
      logger.error('Error resolving prediction market:', error);
      return this.getMessage('systemError');
    }
  }

  normalizeOption(option) {
    return optionAliases[(option || '').toLowerCase()] || null;
  }

  displayOption(option) {
    return option === 'yes' ? 'SIM' : 'NÃO';
  }

  isAdmin(conversationData) {
    const userId = conversationData.messageData?.user_id?.toString();
    return config.ADMIN_USER_IDS.includes(userId);
  }

  getMessage(key) {
    const langMessages = messages[config.LANGUAGE] || messages.pt_br;
    return langMessages[key] || langMessages.systemError;
  }
}

export const predictionController = new PredictionController();
