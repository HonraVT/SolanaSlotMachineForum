// src/services/game/CommandParser.js
export class CommandParser {
  constructor() {
    this.commands = {
      pt_br: {
        error: "error",
        play: "play",
        bet: "play",
        spin: "play",
        jogar: "play",
        girar: "play",
        apostar: "play",
        join: "join",
        register: "join",
        signup: "join",
        cadastrar: "join",
        entrar: "join",
        status: "status",
        sistema: "status",
        info: "status",
        buy: "buy",
        comprar: "buy",
        depositar: "buy",
        fichas: "buy"
      },
      en: {
        error: "error",
        play: "play",
        bet: "play",
        spin: "play",
        join: "join",
        register: "join",
        signup: "join",
        status: "status",
        system: "status",
        info: "status",
        buy: "buy",
        purchase: "buy",
        deposit: "buy",
        chips: "buy"
      }
    };
  }

  parse(input, language = 'pt_br') {
    if (!input || typeof input !== 'string') {
      return { command: 'error', argument: '' };
    }

    const [rawCommand = '', rawArgument = ''] = input.trim().split(/\s+/);
    const normalizedCommand = rawCommand.toLowerCase();

    const languageCommands = this.commands[language] || this.commands['pt_br'];
    const mappedCommand = languageCommands[normalizedCommand] || 'error';

    return {
      command: mappedCommand,
      argument: rawArgument
    };
  }

  getSupportedCommands(language = 'pt_br') {
    return this.commands[language] || this.commands['pt_br'];
  }

  isValidCommand(command, language = 'pt_br') {
    const languageCommands = this.commands[language] || this.commands['pt_br'];
    return Object.keys(languageCommands).includes(command.toLowerCase());
  }
}
