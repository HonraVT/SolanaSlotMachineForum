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
        fichas: "buy",
        previsoes: "predictionList",
        previsões: "predictionList",
        mercados: "predictionList",
        previsao: "predictionHelp",
        previsão: "predictionHelp",
        prever: "predictionPredict",
        criar_previsao: "predictionCreate",
        criar_previsão: "predictionCreate",
        resolver_previsao: "predictionResolve",
        resolver_previsão: "predictionResolve"
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
        chips: "buy",
        markets: "predictionList",
        predictions: "predictionList",
        market: "predictionHelp",
        predict: "predictionPredict",
        create_market: "predictionCreate",
        resolve_market: "predictionResolve"
      }
    };
  }

  parse(input, language = 'pt_br') {
    if (!input || typeof input !== 'string') {
      return { command: 'error', argument: '' };
    }

    const [rawCommand = '', ...rawArgumentParts] = input.trim().split(/\s+/);
    const rawArgument = rawArgumentParts.join(' ');
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
