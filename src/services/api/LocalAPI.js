// src/services/api/LocalAPI.js
import readline from 'readline';
import { getDatabase } from '../../config/database.js';
import { User } from '../../models/User.js';
import { Transaction } from '../../models/Transaction.js';
import { GamePlay } from '../../models/GamePlay.js';
import { getAppWalletBalance } from '../solana/balanceService.js';
import { logger } from '../../utils/logger.js';
import config from '../../config/environment.js';

export class LocalAPI {
  constructor() {
    this.userModel = new User();
    this.transactionModel = new Transaction();
    this.gamePlayModel = new GamePlay();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('\n🎰 Slot Machine Local API');
    console.log('==========================');
    console.log('Comandos disponíveis:');
    console.log('  help           - Mostrar ajuda');
    console.log('  status         - Status do sistema');
    console.log('  users          - Listar usuários');
    console.log('  user <id>      - Detalhes do usuário');
    console.log('  chips <id> <quantidade> - Adicionar/remover fichas');
    console.log('  balance <id> <novo_saldo> - Definir saldo');
    console.log('  stats          - Estatísticas gerais');
    console.log('  transactions   - Últimas transações');
    console.log('  games          - Últimos jogos');
    console.log('  exit           - Sair\n');

    this.startCommandLoop();
  }

  startCommandLoop() {
    this.rl.question('> ', async (input) => {
      const [command, ...args] = input.trim().split(' ');

      try {
        await this.executeCommand(command.toLowerCase(), args);
      } catch (error) {
        console.error('❌ Erro:', error.message);
      }

      // Continuar o loop
      this.startCommandLoop();
    });
  }

  async executeCommand(command, args) {
    const db = getDatabase();

    switch (command) {
      case 'help':
        this.showHelp();
        break;

      case 'status':
        await this.showStatus(db);
        break;

      case 'users':
        await this.listUsers(db);
        break;

      case 'user':
        if (args.length === 0) {
          console.log('❌ Usage: user <user_id>');
          break;
        }
        await this.showUser(db, args[0]);
        break;

      case 'chips':
        if (args.length !== 2) {
          console.log('❌ Usage: chips <user_id> <quantidade>');
          console.log('   Quantidade positiva adiciona, negativa remove');
          break;
        }
        await this.addChips(db, args[0], parseFloat(args[1]));
        break;

      case 'balance':
        if (args.length !== 2) {
          console.log('❌ Usage: balance <user_id> <novo_saldo>');
          break;
        }
        await this.setBalance(db, args[0], parseFloat(args[1]));
        break;

      case 'stats':
        await this.showStats(db);
        break;

      case 'transactions':
        await this.showTransactions(db);
        break;

      case 'games':
        await this.showGames(db);
        break;

      case 'exit':
        console.log('👋 Saindo...');
        this.rl.close();
        process.exit(0);
        break;

      case '':
        // Comando vazio, não fazer nada
        break;

      default:
        console.log(`❌ Comando desconhecido: ${command}`);
        console.log('Digite "help" para ver comandos disponíveis.');
        break;
    }
  }

  showHelp() {
    console.log('\n📚 Ajuda - Comandos Disponíveis');
    console.log('================================');
    console.log('status                    - Mostra status geral do sistema');
    console.log('users                     - Lista todos os usuários');
    console.log('user <id>                 - Mostra detalhes de um usuário');
    console.log('chips <id> <quantidade>   - Adiciona/remove fichas do usuário');
    console.log('balance <id> <saldo>      - Define saldo específico do usuário');
    console.log('stats                     - Estatísticas gerais do sistema');
    console.log('transactions              - Últimas 10 transações');
    console.log('games                     - Últimos 10 jogos');
    console.log('exit                      - Sair da API local\n');
    console.log('Exemplos:');
    console.log('  user 123456             # Ver detalhes do usuário 123456');
    console.log('  chips 123456 10         # Adicionar 10 fichas ao usuário');
    console.log('  chips 123456 -5         # Remover 5 fichas do usuário');
    console.log('  balance 123456 50       # Definir saldo como 50 fichas\n');
  }

  async showStatus(db) {
    try {
      console.log('\n📊 Status do Sistema');
      console.log('====================');

      const [appBalance, userStats, gameStats, transactionStats] = await Promise.all([
        getAppWalletBalance(),
        this.userModel.getStats(db),
        this.gamePlayModel.getStats(db),
        this.transactionModel.getStats(db, config.APP_PUBLIC_KEY)
      ]);

      console.log(`🤖 Bot Status: ONLINE`);
      console.log(`💰 Carteira App: ${appBalance.sol.toFixed(6)} SOL (${appBalance.lamports} lamports)`);
      console.log(`👥 Total de Usuários: ${userStats.totalUsers || 0}`);
      console.log(`💎 Total de Fichas: ${userStats.totalBalance || 0}`);
      console.log(`🎰 Total de Jogos: ${gameStats.totalGames || 0}`);
      console.log(`🏆 Taxa de Vitória: ${gameStats.winRate || 0}%`);
      console.log(`💸 Total Transações: ${transactionStats.totalTransactions || 0}`);
      console.log(`📈 Depósitos: ${transactionStats.totalDeposits || 0} SOL`);
      console.log(`📉 Saques: ${transactionStats.totalWithdrawals || 0} SOL`);
      console.log(`⚖️  Fluxo Líquido: ${transactionStats.netFlow || 0} SOL\n`);

    } catch (error) {
      console.error('❌ Erro ao obter status:', error.message);
    }
  }

  async listUsers(db) {
    try {
      console.log('\n👥 Lista de Usuários');
      console.log('====================');

      const users = await this.userModel.getAll(db, 20);

      if (users.length === 0) {
        console.log('Nenhum usuário encontrado.\n');
        return;
      }

      console.log(`${'ID'.padEnd(12)} ${'Nome'.padEnd(20)} ${'Fichas'.padEnd(8)} ${'Carteira'.padEnd(20)}`);
      console.log('-'.repeat(80));

      for (const user of users) {
        const id = user.id.toString().padEnd(12);
        const name = (user.name || 'N/A').padEnd(20);
        const balance = user.balance.toString().padEnd(8);
        const wallet = `${user.wallet.slice(0,8)}...${user.wallet.slice(-8)}`;

        console.log(`${id} ${name} ${balance} ${wallet}`);
      }
      console.log(`\nTotal: ${users.length} usuários\n`);

    } catch (error) {
      console.error('❌ Erro ao listar usuários:', error.message);
    }
  }

  async showUser(db, userId) {
    try {
      console.log(`\n👤 Usuário: ${userId}`);
      console.log('===================');

      const user = await this.userModel.findById(db, userId);

      if (!user) {
        console.log('❌ Usuário não encontrado.\n');
        return;
      }

      console.log(`ID: ${user.id}`);
      console.log(`Nome: ${user.name}`);
      console.log(`Carteira: ${user.wallet}`);
      console.log(`Fichas: ${user.balance}`);
      console.log(`Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
      console.log(`Atualizado em: ${new Date(user.updated_at).toLocaleString('pt-BR')}`);

      // Últimas transações
      const transactions = await this.transactionModel.findByUserId(db, userId, 5);
      if (transactions.length > 0) {
        console.log('\n💸 Últimas Transações:');
        for (const tx of transactions) {
          const type = tx.destinationWallet === config.APP_PUBLIC_KEY ? 'Depósito' : 'Saque';
          const date = new Date(tx.processedAt).toLocaleString('pt-BR');
          console.log(`  ${type}: ${tx.amount} SOL - ${date}`);
        }
      }

      // Últimos jogos
      const games = await this.gamePlayModel.findByUserId(db, userId, 5);
      if (games.length > 0) {
        console.log('\n🎰 Últimos Jogos:');
        for (const game of games) {
          const result = game.status === 'win' ? '🏆 Vitória' : '❌ Derrota';
          const date = new Date(game.created_at).toLocaleString('pt-BR');
          console.log(`  ${result} - ${game.messageText} - ${date}`);
        }
      }

      console.log();

    } catch (error) {
      console.error('❌ Erro ao buscar usuário:', error.message);
    }
  }

  async addChips(db, userId, amount) {
    try {
      console.log(`\n💎 Modificando fichas do usuário: ${userId}`);
      console.log('=====================================');

      const user = await this.userModel.findById(db, userId);

      if (!user) {
        console.log('❌ Usuário não encontrado.\n');
        return;
      }

      const oldBalance = user.balance;
      const newBalance = Math.max(0, oldBalance + amount);

      const result = await this.userModel.updateBalance(db, userId, newBalance);

      if (result.success) {
        const action = amount > 0 ? 'Adicionadas' : 'Removidas';
        console.log(`✅ ${action} ${Math.abs(amount)} fichas`);
        console.log(`Saldo anterior: ${oldBalance}`);
        console.log(`Saldo atual: ${newBalance}`);
        console.log(`Diferença: ${amount > 0 ? '+' : ''}${amount}\n`);

        logger.info(`Local API: Modified chips for user ${userId}: ${oldBalance} -> ${newBalance} (${amount})`);
      } else {
        console.log('❌ Erro ao modificar fichas.\n');
      }

    } catch (error) {
      console.error('❌ Erro ao modificar fichas:', error.message);
    }
  }

  async setBalance(db, userId, newBalance) {
    try {
      console.log(`\n💰 Definindo saldo do usuário: ${userId}`);
      console.log('=====================================');

      const user = await this.userModel.findById(db, userId);

      if (!user) {
        console.log('❌ Usuário não encontrado.\n');
        return;
      }

      if (newBalance < 0) {
        console.log('❌ Saldo não pode ser negativo.\n');
        return;
      }

      const oldBalance = user.balance;
      const result = await this.userModel.updateBalance(db, userId, newBalance);

      if (result.success) {
        const difference = newBalance - oldBalance;
        console.log(`✅ Saldo definido com sucesso`);
        console.log(`Saldo anterior: ${oldBalance}`);
        console.log(`Saldo atual: ${newBalance}`);
        console.log(`Diferença: ${difference > 0 ? '+' : ''}${difference}\n`);

        logger.info(`Local API: Set balance for user ${userId}: ${oldBalance} -> ${newBalance}`);
      } else {
        console.log('❌ Erro ao definir saldo.\n');
      }

    } catch (error) {
      console.error('❌ Erro ao definir saldo:', error.message);
    }
  }

  async showStats(db) {
    try {
      console.log('\n📈 Estatísticas Gerais');
      console.log('======================');

      const [userStats, gameStats, transactionStats] = await Promise.all([
        this.userModel.getStats(db),
        this.gamePlayModel.getStats(db),
        this.transactionModel.getStats(db, config.APP_PUBLIC_KEY)
      ]);

      // Estatísticas de usuários
      console.log('👥 Usuários:');
      console.log(`  Total: ${userStats.totalUsers || 0}`);
      console.log(`  Fichas totais: ${userStats.totalBalance || 0}`);
      console.log(`  Média por usuário: ${(userStats.avgBalance || 0).toFixed(2)}`);
      console.log(`  Maior saldo: ${userStats.maxBalance || 0}`);

      // Estatísticas de jogos
      console.log('\n🎰 Jogos:');
      console.log(`  Total de jogos: ${gameStats.totalGames || 0}`);
      console.log(`  Vitórias: ${gameStats.totalWins || 0}`);
      console.log(`  Derrotas: ${gameStats.totalLosses || 0}`);
      console.log(`  Taxa de vitória: ${gameStats.winRate || 0}%`);
      console.log(`  Jogadores únicos: ${gameStats.uniquePlayers || 0}`);

      // Estatísticas de transações
      console.log('\n💸 Transações:');
      console.log(`  Total: ${transactionStats.totalTransactions || 0}`);
      console.log(`  Depósitos: ${(transactionStats.totalDeposits || 0).toFixed(6)} SOL`);
      console.log(`  Saques: ${(transactionStats.totalWithdrawals || 0).toFixed(6)} SOL`);
      console.log(`  Fluxo líquido: ${(transactionStats.netFlow || 0).toFixed(6)} SOL`);
      console.log(`  Últimas 24h: ${transactionStats.recentTransactions || 0}\n`);

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error.message);
    }
  }

  async showTransactions(db) {
    try {
      console.log('\n💸 Últimas Transações');
      console.log('=====================');

      const transactions = await this.transactionModel.getAll(db, 10);

      if (transactions.length === 0) {
        console.log('Nenhuma transação encontrada.\n');
        return;
      }

      console.log(`${'Tipo'.padEnd(10)} ${'Valor'.padEnd(12)} ${'Data'.padEnd(20)} ${'Signature'.padEnd(20)}`);
      console.log('-'.repeat(80));

      for (const tx of transactions) {
        const type = tx.destinationWallet === config.APP_PUBLIC_KEY ? 'Depósito' : 'Saque';
        const amount = `${tx.amount.toFixed(6)} SOL`.padEnd(12);
        const date = new Date(tx.processedAt).toLocaleString('pt-BR').padEnd(20);
        const signature = `${tx.signature.slice(0,8)}...${tx.signature.slice(-8)}`;

        console.log(`${type.padEnd(10)} ${amount} ${date} ${signature}`);
      }

      console.log(`\nTotal: ${transactions.length} transações\n`);

    } catch (error) {
      console.error('❌ Erro ao listar transações:', error.message);
    }
  }

  async showGames(db) {
    try {
      console.log('\n🎰 Últimos Jogos');
      console.log('================');

      const games = await this.gamePlayModel.getRecentActivity(db, 10);

      if (games.length === 0) {
        console.log('Nenhum jogo encontrado.\n');
        return;
      }

      console.log(`${'Usuário'.padEnd(15)} ${'Resultado'.padEnd(10)} ${'Comando'.padEnd(15)} ${'Data'.padEnd(20)}`);
      console.log('-'.repeat(75));

      for (const game of games) {
        const userName = (game.userName || 'N/A').padEnd(15);
        const status = (game.status === 'win' ? '🏆 Win' : '❌ Loss').padEnd(10);
        const command = (game.messageText || 'N/A').padEnd(15);
        const date = new Date(game.created_at).toLocaleString('pt-BR').padEnd(20);

        console.log(`${userName} ${status} ${command} ${date}`);
      }

      console.log(`\nTotal: ${games.length} jogos\n`);

    } catch (error) {
      console.error('❌ Erro ao listar jogos:', error.message);
    }
  }

  close() {
    this.rl.close();
  }
}
