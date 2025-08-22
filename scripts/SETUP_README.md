# 🔧 Gerenciamento PM2 - Solana Slot Machine Bot

## 🚀 Configuração Inicial

### 1. Setup automático (recomendado)
```bash
npm run pm2:setup
```

### 2. Setup manual
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Criar diretório de logs
mkdir -p logs

# Iniciar processos
npm run pm2:start
```

---

## 📊 Comandos de Monitoramento

### Status dos processos
```bash
npm run pm2:status
# ou
pm2 status
```

### Logs em tempo real
```bash
# Todos os logs
npm run pm2:logs

# Apenas servidor
npm run pm2:logs:server

# Apenas scheduler
npm run pm2:logs:scheduler

# Monitor interativo
npm run pm2:monit
```

---

## 🔄 Comandos de Controle

### Reiniciar processos
```bash
# Reiniciar tudo
npm run pm2:restart

# Apenas servidor (webhook continua funcionando)
npm run pm2:restart:server

# Apenas bot (servidor continua funcionando)
npm run pm2:restart:scheduler
```

### Parar processos
```bash
# Parar tudo
npm run pm2:stop

# Parar processo específico
pm2 stop slot-server
pm2 stop slot-scheduler
```

### Remover processos
```bash
npm run pm2:delete
```

---

## 🛠️ Cenários de Uso Prático

### 1. **Bot travado, servidor OK**
```bash
npm run pm2:restart:scheduler
```
*O webhook continua funcionando, apenas o bot é reiniciado*

### 2. **Atualização do código do servidor**
```bash
npm run pm2:restart:server
```
*O bot continua funcionando, apenas o servidor é reiniciado*

### 3. **Problemas de memória**
```bash
pm2 restart all
```

### 4. **Deploy completo**
```bash
git pull
npm install
npm run pm2:restart
```

### 5. **Monitoramento em produção**
```bash
pm2 monit
```

### 6. **Auto-startup no boot (produção)**
```bash
sudo pm2 startup
pm2 save
```

---

## 📁 Estrutura de Logs

```
logs/
├── server.log          # Logs combinados do servidor
├── server-out.log      # Stdout do servidor
├── server-error.log    # Stderr do servidor
├── scheduler.log       # Logs combinados do scheduler
├── scheduler-out.log   # Stdout do scheduler
└── scheduler-error.log # Stderr do scheduler
```

---

## ⚡ Recursos Avançados

### 1. **Restart automático por cron**
O scheduler é reiniciado automaticamente às 3h da manhã para prevenir vazamentos de memória.

### 2. **Limites de memória**
- Servidor: 512MB máximo
- Scheduler: 256MB máximo

### 3. **Restart inteligente**
- Mínimo 10s/30s de uptime antes de considerar estável
- Máximo 10/15 restarts automáticos
- Delay entre restarts: 5s/10s

### 4. **Monitoramento de saúde**
```bash
# Verificar se processos estão rodando
pm2 ping

# Info detalhada
pm2 describe slot-server
pm2 describe slot-scheduler
```

---

## 🚨 Troubleshooting

### Bot não está respondendo
```bash
# Verificar status
pm2 status

# Ver logs do scheduler
npm run pm2:logs:scheduler

# Reiniciar apenas o bot
npm run pm2:restart:scheduler
```

### Webhook não recebe transações
```bash
# Verificar se servidor está rodando
curl http://localhost:3000/health

# Ver logs do servidor
npm run pm2:logs:server

# Reiniciar servidor se necessário
npm run pm2:restart:server
```

### Ambos com problema
```bash
# Restart completo
npm run pm2:restart

# Ou recriar tudo
npm run pm2:delete
npm run pm2:start
```

---

## 💡 Dicas de Produção

1. **Use `pm2 save`** após qualquer mudança para persistir configurações
2. **Configure `pm2 startup`** para auto-start no boot
3. **Monitor regularmente** com `pm2 monit`
4. **Backup dos logs** periodicamente
5. **Teste restarts** em ambiente de desenvolvimento primeiro

---

## 🔍 Debugging

### Logs detalhados
```bash
# Seguir logs em tempo real
tail -f logs/scheduler.log

# Buscar erros específicos
grep "ERROR" logs/*.log

# Últimas 100 linhas
tail -100 logs/server.log
```

### Informações do processo
```bash
pm2 show slot-server
pm2 show slot-scheduler
```
