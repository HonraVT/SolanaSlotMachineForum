// src/services/forum/welcomeMessageService.js
import { ForumScraper } from './ForumScraper.js';
import { logger } from '../../utils/logger.js';
import config from '../../config/environment.js';

let forumScraper = null;

// Inicializar scraper quando necessário
async function initializeScraper() {
  if (!forumScraper) {
    forumScraper = new ForumScraper({
      url: config.FORUM_URL,
      cookie: config.FORUM_XF_USER_COOKIE
    });

    try {
      await forumScraper.getAuthorization();
      logger.debug('Forum scraper initialized for welcome messages');
    } catch (error) {
      logger.error('Failed to initialize forum scraper for welcome messages:', error);
      forumScraper = null;
      throw error;
    }
  }

  return forumScraper;
}

const welcomeMessages = {
  pt_br: {
    title: "Solana's Slot Machine",
    message: `[CENTER][COLOR=rgb(44, 130, 201)][SIZE=7]🎰 Bem-vindo ao Cassino![/SIZE][/COLOR]

[SIZE=5]Parabéns! Seu cadastro foi realizado com sucesso! 🎉[/SIZE]

[COLOR=rgb(65, 168, 95)][SIZE=6]COMO JOGAR:[/SIZE][/COLOR]

[SIZE=5]1️⃣ [B]Compre fichas
envie:[/B] [COLOR=rgb(44, 130, 201)]comprar[/COLOR][/SIZE]
[SIZE=4]• Deposite SOL e receba fichas automaticamente
• Valores aceitos: 0.0005, 0.001, 0.0015 SOL[/SIZE]

[SIZE=5]2️⃣ [B]Jogue o caça-níqueis
envie [/B][/SIZE][SIZE=4]( apenas por esta MP )[/SIZE][SIZE=5][B]:[/B] [COLOR=rgb(44, 130, 201)]jogar [quantidade] [/COLOR][/SIZE]
[SIZE=4]• Aposte de 1 a 15 fichas por rodada
• Exemplo: "jogar 5" para apostar 5 fichas[/SIZE]

[SIZE=5]3️⃣ [B]Verifique seu status
[B]envie:[/B] [/B][COLOR=rgb(44, 130, 201)]status[/COLOR][/SIZE]
[SIZE=4]• Veja suas fichas atuais
• Consulte o status dos pagamentos[/SIZE]

[COLOR=rgb(250, 197, 28)][SIZE=6]TABELA DE PRÊMIOS:[/SIZE][/COLOR][/CENTER]
[TABLE]
[TR]
[TD][CENTER][SIZE=5]🍒🍒🍒 = 2x[/SIZE][/CENTER][/TD]
[/TR]
[TR]
[TD][CENTER][SIZE=5]🍋🍋🍋 = 3x[/SIZE][/CENTER][/TD]
[/TR]
[TR]
[TD][CENTER][SIZE=5]🔔🔔🔔 = 5x[/SIZE][/CENTER][/TD]
[/TR]
[TR]
[TD][CENTER][SIZE=5]💎💎💎 = 8x[/SIZE][/CENTER][/TD]
[/TR]
[TR]
[TD][CENTER][SIZE=5]7️⃣7️⃣7️⃣ = 15x[/SIZE][/CENTER][/TD]
[/TR]
[/TABLE]

[CENTER]
[SIZE=5]💰 [B]Pagamentos automáticos em SOL![/B][/SIZE]
[SIZE=4]Suas vitórias são pagas diretamente na sua carteira Solana.[/SIZE]

[SIZE=5]🎯 [B]Comandos disponíveis:[/B][/SIZE]
[SIZE=4]• [COLOR=rgb(44, 130, 201)]comprar[/COLOR] - Comprar fichas
• [COLOR=rgb(44, 130, 201)]jogar [fichas][/COLOR] - Apostar no caça-níqueis  
• [COLOR=rgb(44, 130, 201)]status[/COLOR] - Ver suas informações

[B]Boa sorte e divirta-se responsavelmente! 🍀[/B][/SIZE][/CENTER]`
  },

  en: {
    title: "Solana's Slot Machine", 
    message: `[CENTER][COLOR=rgb(44, 130, 201)][SIZE=7]🎰 Welcome to the Casino![/SIZE][/COLOR]

[SIZE=5]Congratulations! Your registration was successful! 🎉[/SIZE]

[COLOR=rgb(65, 168, 95)][SIZE=6]HOW TO PLAY:[/SIZE][/COLOR]

[SIZE=5]1️⃣ [B]Buy chips:[/B] [COLOR=rgb(44, 130, 201)]buy[/COLOR][/SIZE]
[SIZE=4]• Deposit SOL and receive chips automatically
• Accepted values: 0.0005, 0.001, 0.0015 SOL[/SIZE]

[SIZE=5]2️⃣ [B]Play the slots:[/B] [COLOR=rgb(44, 130, 201)]play [amount][/COLOR][/SIZE]
[SIZE=4]• Bet from 1 to 15 chips per round
• Example: "play 5" to bet 5 chips[/SIZE]

[SIZE=5]3️⃣ [B]Check your status:[/B] [COLOR=rgb(44, 130, 201)]status[/COLOR][/SIZE]
[SIZE=4]• See your current chips
• Check payment status[/SIZE]

[COLOR=rgb(250, 197, 28)][SIZE=6]PRIZE TABLE:[/SIZE][/COLOR]

[TABLE]
[TR]
[TD][CENTER][SIZE=5]🍒🍒🍒 = 2x[/SIZE][/CENTER][/TD]
[TD][CENTER][SIZE=5]🍋🍋🍋 = 3x[/SIZE][/CENTER][/TD]
[/TR]
[TR]
[TD][CENTER][SIZE=5]🔔🔔🔔 = 5x[/SIZE][/CENTER][/TD]
[TD][CENTER][SIZE=5]💎💎💎 = 8x[/SIZE][/CENTER][/TD]
[/TR]
[TR]
[TD][CENTER][SIZE=5]7️⃣7️⃣7️⃣ = 15x[/SIZE][/CENTER][/TD]
[/TR]
[/TABLE]

[SIZE=5]💰 [B]Automatic SOL payments![/B][/SIZE]
[SIZE=4]Your winnings are paid directly to your Solana wallet.[/SIZE]

[SIZE=5]🎯 [B]Available commands:[/B][/SIZE]
[SIZE=4]• [COLOR=rgb(44, 130, 201)]buy[/COLOR] - Buy chips
• [COLOR=rgb(44, 130, 201)]play [chips][/COLOR] - Bet on slots
• [COLOR=rgb(44, 130, 201)]status[/COLOR] - View your information[/SIZE]

[SIZE=4][B]Good luck and play responsibly! 🍀[/B][/SIZE][/CENTER]`
  }
};

/**
 * Envia mensagem de boas-vindas para um usuário
 * @param {string} userName - Nome do usuário no fórum
 * @param {string} language - Idioma da mensagem (pt_br ou en)
 * @returns {Promise<boolean>} - true se enviada com sucesso
 */
export async function sendWelcomeMessage(userName, language = 'pt_br') {
  try {
    logger.info(`Sending welcome message to user: ${userName}`);

    // Inicializar scraper se necessário
    const scraper = await initializeScraper();

    // Obter mensagem no idioma correto
    const langMessages = welcomeMessages[language] || welcomeMessages['pt_br'];
    const title = config.WELCOME_MESSAGE_TITLE || langMessages.title;
    const message = langMessages.message;

    // Enviar mensagem privada
    const success = await scraper.createConversation(
      [userName], // recipients array
      title,
      message
    );

    if (success) {
      logger.info(`✅ Welcome message sent successfully to ${userName}`);
      return true;
    } else {
      logger.warn(`❌ Failed to send welcome message to ${userName}`);
      return false;
    }

  } catch (error) {
    logger.error(`Error sending welcome message to ${userName}:`, error);
    throw error;
  }
}

/**
 * Obter a mensagem de boas-vindas formatada (para testes)
 * @param {string} language - Idioma da mensagem
 * @returns {object} - {title, message}
 */
export function getWelcomeMessageContent(language = 'pt_br') {
  const langMessages = welcomeMessages[language] || welcomeMessages['pt_br'];
  return {
    title: config.WELCOME_MESSAGE_TITLE || langMessages.title,
    message: langMessages.message
  };
}

/**
 * Verificar se o envio de mensagens de boas-vindas está habilitado
 * @returns {boolean}
 */
export function isWelcomeMessageEnabled() {
  return config.SEND_WELCOME_MESSAGE === true;
}
