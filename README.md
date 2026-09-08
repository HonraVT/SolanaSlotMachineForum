# 🎰 Solana Slot Machine Bot

Um bot de caça-níqueis integrado ao fórum XenForo, permitindo jogos com criptomoedas SOL na blockchain Solana.

---

## 📋 Características

- 🎲 Jogo de caça-níqueis com símbolos e multiplicadores variados
- 💰 Depósitos e saques automáticos em SOL
- 🤖 Interação via mensagens privadas no XenForo
- 📊 Conversão automática de SOL para fichas do jogo
- 🔒 Validação de transações e carteiras
- 📈 Estatísticas completas de jogos e transações
- 🔍 Comando de status do usuário e sistema
- 🛠️ API local para administração

---

## 🏗️ Arquitetura

```
src/
├── config/          # Configurações (DB, Solana, Environment)
├── controllers/     # Lógica de controle (Game, User, Webhook, Status)
├── models/          # Modelos de dados (User, Transaction, GamePlay)
├── services/        # Serviços especializados
│   ├── solana/      # Serviços da blockchain Solana
│   ├── forum/       # Integração com XenForo
│   ├── game/        # Motor do jogo
│   └── scheduler/   # Agendador do bot
├── utils/           # Utilitários e helpers
├── middleware/      # Middleware Express
├── routes/          # Rotas da API
└── app.js           # Configuração do Express
```

---


## ⚙️ Instalação

1. **Clone o repositório**:
  ```bash
  git clone <repository-url>
  cd slot_machine_solana_game
  ```
2. **Instale as dependências**:
  ```bash
  npm install
  ```

3. **Configuração do Webhook Helius**:

Para que o bot receba notificações de transações Solana, é necessário configurar um webhook na [Helius](https://www.helius.dev/):

- Crie uma conta na Helius.

- No painel da Helius, acesse "Webhooks" e clique em "Create Webhook".

> ### Configure Webhook
>
> **Network**  
> - [x] mainnet  
> - [ ] devnet  
> ---
> **Webhook Type**
>
> `enhanced`
>
> ---
> **Transaction Type(s)**
> 
> `TRANSFER` 
>
> ---
>
> **Webhook URL**
>
> `https://seu-dominio.com/api/webhook_helius_eb8ef4b2` 
>
> _Enter the URL of your webhook. This could be a lambda, a custom API endpoint, etc._  
>
> ---
>
> **Authentication Header**  
> 
> `Bearer sua_chave_secreta_aqui`
>   
> _Enter an `Authorization` authentication header to pass into the post requests to your webhook._  
>
> ---
>
> **Account Addresses**
> 
> `sua_chave_publica_da_carteira_principal` 
>
> ---
>
> ⚠️ **Each webhook push consumes 1 credit from your plan.**  
>
> ---
>
> [ Cancel ]  [[x] Confirm ]

- Configure o endpoint do webhook para o seu servidor, usando o caminho definido em `WEBHOOK_PATH` no `.env` (exemplo: `https://seu-dominio.com/api/webhook_helius_eb8ef4b2`).

- Adicione a carteira pública principal (`APP_PUBLIC_KEY`) para monitoramento.

- Selecione os tipos de evento `TRANSFER`.

- Salve e teste o webhook.

**Dica:** O caminho do webhook pode ser customizado para maior segurança, evitando spam e ataques.

No arquivo `.env`:
```
WEBHOOK_PATH=/webhook_helius_eb8ef4b2
```

## ⚠️ Atencão:
O caminho completo sempre incluirá automaticamente a uri `/api`. Ex: `/api/webhook_ef3b7bfe`

O bot irá processar automaticamente as notificações recebidas neste endpoint.

---

4. **Configure o arquivo `.env`**:
  ```bash
  cp .env.example .env
  ```
5. **Preencha as variáveis de ambiente**:
```env
# .env.example - Copie para .env e preencha com seus valores

# ==============================================
# CONFIGURAÇÕES DO SERVIDOR WEBHOOK
# ==============================================
PORT=3000
AUTH_HEADER=Bearer sua_chave_secreta_aqui
# Caminho do webhook obfuscado para evitar spam (padão: /webhook)
# Atencão: O caminho completo sempre incluirá a uri "/api" ex: /api/webhook_ef3b7bfe
WEBHOOK_PATH=/webhook_helius_eb8ef4b2

# ==============================================
# CONFIGURAÇÕES SOLANA
# ==============================================
SOLANA_RPC=https://api.mainnet-beta.solana.com
APP_PUBLIC_KEY=sua_chave_publica_da_carteira_principal
APP_SECRET_KEY=sua_chave_privada_da_carteira_principal_em_base58
APP_FEE_ESTEEM_PUBLIC_KEY=chave_publica_para_estimar_taxas

# ==============================================
# CONFIGURAÇÕES DO JOGO
# ==============================================
# Preço de 1 ficha em lamports (100000 = 0.0001 SOL)
CHIP_PRICE_LAMPORTS=100000

# Conversão de lamports para fichas (JSON)
# Formato: {"lamports": fichas}
LAMPORTS_TO_CHIPS={"500000":5,"1000000":10,"1500000":15}

# Opcional: Rode "npm run qrcodegen" e faça o upload dos qrcodes gerados na pasta "qr_image" e coloque os links abaixo para exibir no comando "buy"
QRCODES=["https://i.imgur.com/wRc14uM.png","https://i.imgur.com/d3JFfmB.png","https://i.imgur.com/5dhFD5K.png"]

# Pesos dos símbolos (maior peso = mais frequente)
SYMBOL_WEIGHTS={"CH":50,"LE":25,"BE":20,"DI":12,"SE":8}

# Tabela de pagamento (combinação: multiplicador)
PAYOUT_TABLE={"CHCHCH":2,"LELELE":3,"BEBEBE":5,"DIDIDI":8,"SESESE":15}

# Emojis dos símbolos
SYMBOLS_EMOJI={"CH":"🍒","LE":"🍋","BE":"🔔","DI":"💎","SE":"7️⃣"}

# ==============================================
# CONFIGURAÇÕES DO MERCADO DE PREVISÕES
# ==============================================
# IDs de usuários do fórum que podem criar e resolver previsões, separados por vírgula
ADMIN_USER_IDS=123456,789012

# ==============================================
# CONFIGURAÇÕES DO FÓRUM XENFORO
# ==============================================
FORUM_URL=https://seu-forum.com
FORUM_XF_USER_COOKIE=cookie_do_usuario_bot_do_xenforo
BOT_NAME=Nome-Do-Seu-Bot
LANGUAGE=pt_br
# Intervalo entre respostas do Bot, necessario para evitar o anti-flood do fórum
# em milissegundos (padrão: 30000 = 30 segundos)
BOT_FLOOD_DELAY=30000

# ==============================================
# CONFIGURAÇÕES OPCIONAIS
# ==============================================
# Intervalo do bot em milissegundos (padrão: 20000 = 20 segundos)
# BOT_INTERVAL_MS=20000

# ==============================================
# CONFIGURAÇÕES DE LOG
# ==============================================
# ERROR, WARN, INFO, DEBUG
LOG_LEVEL=ERROR
```
6. Gere os QR Codes de pagamento (opcional):
  ```bash
  npm run qrcodegen
  ```
7. Inicie o servidor:
  ```bash
  npm start
  ```

---

## 🚀 Uso

- O bot interage via mensagens privadas no XenForo.
- Comandos: cadastrar, status, buy, withdraw, etc.
- Quando um usuário se cadastra com sucesso, o bot automaticamente envia uma mensagem privada
  o usuário **deve jogar através dessa MP.**
- Consulte `.env.example` para configurações detalhadas.

### Exemplos de respostas do bot

**jogar:**

```
     GANHOU!

    🍒🍒🍒

PRÊMIO: 0.000200 SOL
  Multiplicador: 2
Fichas restantes: 3
```

**Status**

```
        STATUS

   💎 Suas fichas: 3
👤 Wallet: EnrD...KM3B

💰 Pagamento: FUNCIONANDO

Última verificação: 16/08/2025, 08:34
```

## 🎯 Sistema de Fichas

| Valor em SOL | Fichas | Lamports |
|--------------|--------|----------|
| 0.0005       | 5      | 500000   |
| 0.001        | 10     | 1000000  |
| 0.0015       | 15     | 1500000  |

---

## 🏆 Tabela de Pagamentos

| Combinação | Multiplicador | Emoji |
|------------|---------------|-------|
| CHCHCH     | 2x            | 🍒🍒🍒 |
| LELELE     | 3x            | 🍋🍋🍋 |
| BEBEBE     | 5x            | 🔔🔔🔔 |
| DIDIDI     | 8x            | 💎💎💎 |
| SESESE     | 15x           | 7️⃣7️⃣7️⃣ |

---


### Mercado de previsões simplificado

Além do caça-níqueis, o bot inclui um modo simples de previsões administradas pelo fórum:

- **previsoes** — lista mercados abertos.
- **previsao** — mostra ajuda do mercado de previsões.
- **prever `<id>` `sim|nao` `<fichas>`** — registra uma previsão do usuário e trava as fichas apostadas no pool.
- **criar_previsao `<pergunta>`** — cria um mercado, apenas para usuários listados em `ADMIN_USER_IDS`.
- **resolver_previsao `<id>` `sim|nao`** — encerra o mercado e distribui o pool dos usuários que erraram proporcionalmente entre os usuários que acertaram.

Cada usuário pode prever apenas uma vez por mercado. Não há compra e venda de posições: é apenas uma previsão simples usando fichas.

### API Local de Administração
```bash
npm run api
```
A API local oferece:
- **status**: status do sistema  
- **stats**: estatísticas detalhadas  
- **users**: listar usuários  
- **user <id>**: detalhes de um usuário  
- **chips <id> <qtd>**: adicionar/remover fichas  
- **balance <id> <saldo>**: definir saldo específico  
- **transactions**: últimas transações  
- **games**: últimos jogos  

#### Exemplos de Uso

**Adicionar fichas a um usuário:**
```bash
> chips 123456 50
✅ Adicionadas 50 fichas
Saldo anterior: 10
Saldo atual: 60
Diferença: +50
```

> Todas as ações da API local são logadas para auditoria.

---

## 📊 Monitoramento

**Via API:**
```bash
curl -H "Authorization: Bearer seu_token" https://seu-dominio.com/api/stats
```
Retorna:
- Total de usuários  
- Saldo da carteira  
- Jogos/vitórias/derrotas  
- Transações processadas  

**Via Logs:**
```bash
npm run logs
```

---

## 🔐 Segurança

- Validação de carteiras Solana  
- Autenticação via headers  
- Verificação de duplicatas de transação  
- Logs de segurança  
- API local restrita a execução interna  

---

## ⚙️ Configuração do PM2

O projeto inclui scripts para gerenciar processos com [PM2](https://pm2.keymetrics.io/):

- `npm run pm2:setup` — Prepara o ambiente PM2
- `npm run pm2:start` — Inicia todos os processos definidos em `ecosystem.config.js`
- `npm run pm2:stop` — Para todos os processos
- `npm run pm2:restart` — Reinicia todos os processos
- `npm run pm2:restart:server` — Reinicia apenas o servidor
- `npm run pm2:restart:scheduler` — Reinicia apenas o agendador
- `npm run pm2:delete` — Remove todos os processos do PM2
- `npm run pm2:status` — Mostra o status dos processos
- `npm run logs:scheduler` — Exibe logs do agendador

O arquivo `ecosystem.config.js` define os processos do servidor e do agendador do bot.

---

## 📝 Licença

Apache-2.0

---

# 🎰 Solana Slot Machine Bot

A slot machine bot integrated with the XenForo forum, allowing games with SOL cryptocurrency on the Solana blockchain.

---

## 📋 Features

- 🎲 Slot machine game with various symbols and multipliers
- 💰 Automatic deposits and withdrawals in SOL
- 🤖 Interaction via private messages in XenForo
- 📊 Automatic conversion of SOL into game chips
- 🔒 Transaction and wallet validation
- 📈 Complete game and transaction statistics
- 🔍 User and system status command
- 🛠️ Local API for administration

---

## 🏗️ Architecture

```
src/
├── config/          # Configurations (DB, Solana, Environment)
├── controllers/     # Control logic (Game, User, Webhook, Status)
├── models/          # Data models (User, Transaction, GamePlay)
├── services/        # Specialized services
│   ├── solana/      # Solana blockchain services
│   ├── forum/       # XenForo integration
│   ├── game/        # Game engine
│   └── scheduler/   # Bot scheduler
├── utils/           # Utilities and helpers
├── middleware/      # Express middleware
├── routes/          # API routes
└── app.js           # Express configuration
```

---


## ⚙️ Installation

1. **Clone the repository**:
  ```bash
  git clone <repository-url>
  cd slot_machine_solana_game
  ```
2. **Install dependencies**:
  ```bash
  npm install
  ```

3. **Helius Webhook Setup**:

To allow the bot to receive Solana transaction notifications, configure a webhook in [Helius](https://www.helius.dev/):

- Create a Helius account.

- In the Helius dashboard, go to "Webhooks" and click "Create Webhook".

> ### Configure Webhook
>
> **Network**  
> - [x] mainnet  
> - [ ] devnet  
> ---
> **Webhook Type**
>
> `enhanced`
>
> ---
> **Transaction Type(s)**
> 
> `TRANSFER` 
>
> ---
>
> **Webhook URL**
>
> `https://your-domain.com/api/webhook_helius_eb8ef4b2` 
>
> _Enter the URL of your webhook. This could be a lambda, a custom API endpoint, etc._  
>
> ---
>
> **Authentication Header**  
> 
> `Bearer your_secret_key_here`
>   
> _Enter an `Authorization` authentication header to pass into the post requests to your webhook._  
>
> ---
>
> **Account Addresses**
> 
> `your_main_wallet_public_key` 
>
> ---
>
> ⚠️ **Each webhook push consumes 1 credit from your plan.**  
>
> ---
>
> [ Cancel ]  [[x] Confirm ]

- Configure the webhook endpoint for your server, using the path defined in `WEBHOOK_PATH` in `.env` (example: `https://your-domain.com/api/webhook_helius_eb8ef4b2`).

- Add the main public wallet (`APP_PUBLIC_KEY`) for monitoring.

- Select event types `TRANSFER`.

- Save and test the webhook.

**Tip:** The webhook path can be customized for extra security to prevent spam and attacks.

In the `.env` file:
```
WEBHOOK_PATH=/webhook_helius_eb8ef4b2
```

## ⚠️ Attention:
The full path will always automatically include the `/api` prefix. Example: `/api/webhook_ef3b7bfe`

The bot will automatically process notifications received at this endpoint.

---

4. **Configure the `.env` file**:
  ```bash
  cp .env.example .env
  ```
5. **Fill in the environment variables**:
```env
# .env.example - Copy to .env and fill with your values

# ==============================================
# WEBHOOK SERVER CONFIG
# ==============================================
PORT=3000
AUTH_HEADER=Bearer your_secret_key_here
# Obfuscated webhook path to avoid spam (default: /webhook)
# Note: The full path will always include the "/api" prefix, e.g. /api/webhook_ef3b7bfe
WEBHOOK_PATH=/webhook_helius_eb8ef4b2

# ==============================================
# SOLANA CONFIG
# ==============================================
SOLANA_RPC=https://api.mainnet-beta.solana.com
APP_PUBLIC_KEY=your_main_wallet_public_key
APP_SECRET_KEY=your_main_wallet_private_key_in_base58
APP_FEE_ESTEEM_PUBLIC_KEY=public_key_for_fee_estimation

# ==============================================
# GAME CONFIG
# ==============================================
# Price of 1 chip in lamports (100000 = 0.0001 SOL)
CHIP_PRICE_LAMPORTS=100000

# Lamports-to-chips conversion (JSON)
# Format: {"lamports": chips}
LAMPORTS_TO_CHIPS={"500000":5,"1000000":10,"1500000":15}

# Optional: Run "npm run qrcodegen" and upload the generated QR codes from "qr_image",
# then put the links below to display in the "buy" command
QRCODES=["https://i.imgur.com/wRc14uM.png","https://i.imgur.com/d3JFfmB.png","https://i.imgur.com/5dhFD5K.png"]

# Symbol weights (higher weight = more frequent)
SYMBOL_WEIGHTS={"CH":50,"LE":25,"BE":20,"DI":12,"SE":8}

# Payout table (combination: multiplier)
PAYOUT_TABLE={"CHCHCH":2,"LELELE":3,"BEBEBE":5,"DIDIDI":8,"SESESE":15}

# Symbol emojis
SYMBOLS_EMOJI={"CH":"🍒","LE":"🍋","BE":"🔔","DI":"💎","SE":"7️⃣"}

# ==============================================
# XENFORO FORUM CONFIG
# ==============================================
FORUM_URL=https://your-forum.com
FORUM_XF_USER_COOKIE=xenforo_bot_user_cookie
BOT_NAME=Your-Bot-Name
LANGUAGE=en_us
# Bot response delay to avoid forum anti-flood
# in milliseconds (default: 30000 = 30 seconds)
BOT_FLOOD_DELAY=30000

# ==============================================
# OPTIONAL CONFIG
# ==============================================
# Bot interval in milliseconds (default: 20000 = 20 seconds)
# BOT_INTERVAL_MS=20000

# ==============================================
# LOG CONFIG
# ==============================================
# ERROR, WARN, INFO, DEBUG
LOG_LEVEL=ERROR
```
6. Generate payment QR Codes (optional):
  ```bash
  npm run qrcodegen
  ```
7. Start the server:
  ```bash
  npm start
  ```

---

## 🚀 Usage

- The bot interacts via private messages in XenForo.
- Commands: register, status, buy, withdraw, etc.
- Check `.env.example` for detailed configuration.

### Example bot responses

**play:**

```
     YOU WON!

    🍒🍒🍒

PRIZE: 0.000200 SOL
  Multiplier: 2
Remaining chips: 3
```

**status**

```
        STATUS

   💎 Your chips: 3
👤 Wallet: EnrD...KM3B

💰 Payment: WORKING

Last check: 08/16/2025, 08:34
```

## 🎯 Chip System

| SOL Value | Chips | Lamports |
|-----------|-------|----------|
| 0.0005    | 5     | 500000   |
| 0.001     | 10    | 1000000  |
| 0.0015    | 15    | 1500000  |

---

## 🏆 Payout Table

| Combination | Multiplier | Emoji   |
|-------------|------------|---------|
| CHCHCH      | 2x         | 🍒🍒🍒 |
| LELELE      | 3x         | 🍋🍋🍋 |
| BEBEBE      | 5x         | 🔔🔔🔔 |
| DIDIDI      | 8x         | 💎💎💎 |
| SESESE      | 15x        | 7️⃣7️⃣7️⃣ |

---

### Local Admin API
```bash
npm run api
```
The local API offers:
- **status**: system status  
- **stats**: detailed statistics  
- **users**: list users  
- **user <id>**: user details  
- **chips <id> <qty>**: add/remove chips  
- **balance <id> <amount>**: set specific balance  
- **transactions**: recent transactions  
- **games**: recent games  

#### Usage Examples

**Add chips to a user:**
```bash
> chips 123456 50
✅ Added 50 chips
Previous balance: 10
Current balance: 60
Difference: +50
```

> All local API actions are logged for auditing.

---

## 📊 Monitoring

**Via API:**
```bash
curl -H "Authorization: Bearer your_token" https://your-domain.com/api/stats
```
Returns:
- Total users  
- Wallet balance  
- Games/wins/losses  
- Processed transactions  

**Via Logs:**
```bash
npm run logs
```

---

## 🔐 Security

- Solana wallet validation  
- Authentication via headers  
- Duplicate transaction verification  
- Security logs  
- Local API restricted to internal execution  

---

## ⚙️ PM2 Setup

The project includes scripts to manage processes with [PM2](https://pm2.keymetrics.io/):

- `npm run pm2:setup` — Setup PM2 environment
- `npm run pm2:start` — Start all processes defined in `ecosystem.config.js`
- `npm run pm2:stop` — Stop all processes
- `npm run pm2:restart` — Restart all processes
- `npm run pm2:restart:server` — Restart server only
- `npm run pm2:restart:scheduler` — Restart scheduler only
- `npm run pm2:delete` — Remove all PM2 processes
- `npm run pm2:status` — Show process status
- `npm run logs:scheduler` — Show scheduler logs

The `ecosystem.config.js` file defines the server and scheduler bot processes.

---

## 📝 License

Apache-2.0
