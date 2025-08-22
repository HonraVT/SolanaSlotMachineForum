// src/utils/logger.js
import config from "../config/environment.js"

class Logger {
  constructor() {
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };

    // Obter nível do log da variável de ambiente ou usar INFO como padrão
    const envLevel = config.LOG_LEVEL
    this.currentLevel = this.levels[envLevel] !== undefined ? this.levels[envLevel] : this.levels.INFO;

    // Log inicial para confirmar configuração
    console.log(`[LOGGER] Log level set to: ${envLevel} (${this.currentLevel})`);
  }

  _shouldLog(level) {
    const levelValue = this.levels[level];
    return levelValue <= this.currentLevel;
  }

  _log(level, message, ...args) {
    if (!this._shouldLog(level)) {
      return; // Não loggar se o nível atual não permitir
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;

    switch (level) {
      case 'ERROR':
        console.error(prefix, message, ...args);
        break;
      case 'WARN':
        console.warn(prefix, message, ...args);
        break;
      case 'INFO':
        console.info(prefix, message, ...args);
        break;
      case 'DEBUG':
        console.debug(prefix, message, ...args);
        break;
      default:
        console.log(prefix, message, ...args);
    }
  }

  error(message, ...args) {
    this._log('ERROR', message, ...args);
  }

  warn(message, ...args) {
    this._log('WARN', message, ...args);
  }

  info(message, ...args) {
    this._log('INFO', message, ...args);
  }

  debug(message, ...args) {
    this._log('DEBUG', message, ...args);
  }

  // Método utilitário para mudar o nível em runtime (opcional)
  setLevel(level) {
    const upperLevel = level.toUpperCase();
    if (this.levels[upperLevel] !== undefined) {
      this.currentLevel = this.levels[upperLevel];
      console.log(`[LOGGER] Log level changed to: ${upperLevel} (${this.currentLevel})`);
    } else {
      console.warn(`[LOGGER] Invalid log level: ${level}. Valid levels: ${Object.keys(this.levels).join(', ')}`);
    }
  }

  // Método para obter o nível atual (útil para debug)
  getCurrentLevel() {
    const levelName = Object.keys(this.levels).find(key => this.levels[key] === this.currentLevel);
    return { name: levelName, value: this.currentLevel };
  }
}

export const logger = new Logger();
