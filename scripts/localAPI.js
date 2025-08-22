// scripts/localAPI.js
import { LocalAPI } from '../src/services/api/LocalAPI.js';
import { initDatabase } from '../src/config/database.js';
import { logger } from '../src/utils/logger.js';

async function startLocalAPI() {
  try {
    // Inicializar banco de dados
    await initDatabase();
    logger.info('Database initialized for Local API');

    // Iniciar API local
    const api = new LocalAPI();
    await api.start();

  } catch (error) {
    console.error('❌ Erro ao iniciar API local:', error.message);
    process.exit(1);
  }
}

// Capturar CTRL+C para sair graciosamente
process.on('SIGINT', () => {
  console.log('\n👋 Saindo da API local...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Encerrando API local...');
  process.exit(0);
});

startLocalAPI();
