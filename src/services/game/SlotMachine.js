// src/services/game/SlotMachine.js
import config from '../../config/environment.js';
import { logger } from '../../utils/logger.js';

export class SlotMachine {
  constructor(initialBankLamports, initialPlayerBalanceChips) {
    this.symbolWeights = config.SYMBOL_WEIGHTS;
    this.payoutTable = config.PAYOUT_TABLE;
    this.bankLamports = initialBankLamports || 0;
    this.playerBalance = initialPlayerBalanceChips || 0;
    this.symbols = Object.keys(this.symbolWeights);
    this.weightedSymbolList = this.buildWeightedSymbolList();

    logger.debug('SlotMachine initialized', {
      bankLamports: this.bankLamports,
      playerBalance: this.playerBalance,
      symbolsCount: this.symbols.length
    });
  }

  buildWeightedSymbolList() {
    const list = [];
    for (const [symbol, weight] of Object.entries(this.symbolWeights)) {
      for (let i = 0; i < weight; i++) {
        list.push(symbol);
      }
    }
    return list;
  }

  getRandomSymbol() {
    const index = Math.floor(Math.random() * this.weightedSymbolList.length);
    return this.weightedSymbolList[index];
  }

  spinReel() {
    return [this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol()];
  }

  getNonWinningCombo() {
    const nonWinners = [
      "CHLEBE", "LECHSE", "BEDICH", "DISELE", "SEBECH",
      "LEBEDI", "CHCHBE", "LECHCH", "DISEBE"
    ];
    const index = Math.floor(Math.random() * nonWinners.length);
    return nonWinners[index];
  }

  spin(bet = 1) {
    logger.debug(`Spinning with bet: ${bet}, player balance: ${this.playerBalance}`);

    // Validar se o jogador tem fichas suficientes
    if (this.playerBalance < bet) {
      return {
        bet: 0,
        win: false,
        forcedLoss: false,
        message: 'NoChipsToBet',
        combo: null,
        multiplier: 0,
        payout: 0,
        payoutLamports: 0,
        playerBalance: this.playerBalance,
      };
    }

    // Deduzir a aposta do saldo do jogador
    this.playerBalance -= bet;

    // Girar os rolos
    const result = this.spinReel();
    const combo = result.join('');
    const multiplier = this.payoutTable[combo] || 0;
    const payout = multiplier * bet;
    const payoutLamports = payout * config.CHIP_PRICE_LAMPORTS;

    logger.debug('Spin result', { combo, multiplier, payout, payoutLamports });

    // Verificar se é uma combinação vencedora mas o banco não tem fundos
    if (payout > 0 && payoutLamports > this.bankLamports) {
      const forcedCombo = this.getNonWinningCombo();
      
      logger.warn('Forced loss due to insufficient bank balance', {
        originalCombo: combo,
        forcedCombo,
        payoutLamports,
        bankLamports: this.bankLamports
      });

      return {
        bet,
        win: false,
        forcedLoss: true,
        message: 'forcedLoss',
        combo: forcedCombo,
        multiplier: 0,
        payout: 0,
        payoutLamports: 0,
        playerBalance: this.playerBalance,
      };
    }

    // Resultado vencedor
    if (payout > 0) {
      logger.info('Winning spin!', { combo, multiplier, payout, payoutLamports });
      
      return {
        bet,
        win: true,
        forcedLoss: false,
        message: 'win',
        combo,
        multiplier,
        payout,
        payoutLamports,
        playerBalance: this.playerBalance,
      };
    }

    // Resultado perdedor
    logger.debug('Losing spin', { combo });
    
    return {
      bet,
      win: false,
      forcedLoss: false,
      message: 'loss',
      combo,
      multiplier: 0,
      payout: 0,
      payoutLamports: 0,
      playerBalance: this.playerBalance,
    };
  }

  getStats() {
    return {
      bankLamports: this.bankLamports,
      playerBalance: this.playerBalance,
      symbols: this.symbols.length,
      payoutCombinations: Object.keys(this.payoutTable).length
    };
  }
}
