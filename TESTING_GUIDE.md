# Guia de Testes - Notificações Imediatas de Corridas

## 🎯 Objetivo
Validar que os motoristas recebem notificações imediatas de pedidos de viagem sem necessidade de scroll, com alertas multissensoriais.

## 📋 Pré-requisitos

- Dois utilizadores registados: 1 passageiro e 1 motorista
- Motorista com status `approved` (aprovado)
- Ambos os utilizadores com permissão de notificações do navegador ativada
- Aplicação rodando em ambiente de desenvolvimento ou produção

## 🧪 Cenários de Teste

### Teste 1: Notificação Imediata Básica

**Objetivo**: Verificar se a notificação aparece imediatamente quando um passageiro pede uma corrida.

**Passos**:
1. Abrir a aplicação em dois navegadores/dispositivos
2. Login como **Motorista** em um (aceder a `/painel-motorista`)
3. Login como **Passageiro** no outro
4. Passageiro acede a `/pedir`
5. Passageiro seleciona origem e destino no mapa
6. Passageiro escolhe tipo de serviço (ex: "Normal")
7. Passageiro escolhe método de pagamento
8. Passageiro clica em "Confirmar Corrida"

**Resultado Esperado**:
- ✅ Notificação aparece imediatamente no painel do motorista em overlay full-screen
- ✅ Notificação mostra: origem, destino, tarifa, distância, tempo estimado
- ✅ Som de notificação toca (se volume ativado)
- ✅ Dispositivo vibra (se em dispositivo móvel)
- ✅ Notificação do navegador/SO aparece
- ✅ Contador de pedidos aumenta no título do painel

---

### Teste 2: Aceitar Notificação

**Objetivo**: Verificar se o motorista consegue aceitar um pedido diretamente da notificação.

**Passos**:
1. Seguir Teste 1 até receber a notificação
2. Motorista clica no botão "Aceitar" na notificação
3. Aguardar resposta do servidor

**Resultado Esperado**:
- ✅ Botão mostra estado de carregamento ("Aceitando...")
- ✅ Toast de sucesso: "Corrida aceite! Dirija-se ao passageiro."
- ✅ Notificação desaparece
- ✅ Painel do motorista atualiza com a corrida aceite
- ✅ Passageiro recebe notificação que motorista aceitou

---

### Teste 3: Recusar Notificação

**Objetivo**: Verificar se o motorista consegue recusar um pedido e se a próxima notificação aparece.

**Passos**:
1. Seguir Teste 1 até receber a notificação
2. Motorista clica no botão "Recusar" na notificação
3. Aguardar

**Resultado Esperado**:
- ✅ Notificação desaparece
- ✅ Painel continua mostrando o pedido na lista (ainda disponível para outros motoristas)
- ✅ Se houver múltiplos pedidos, a próxima notificação aparece

---

### Teste 4: Fila de Notificações

**Objetivo**: Verificar se múltiplos pedidos são geridos corretamente em fila.

**Passos**:
1. Ter 2-3 passageiros prontos para pedir corridas
2. Motorista no painel
3. Passageiro 1 pede corrida
4. Aguardar 2 segundos
5. Passageiro 2 pede corrida
6. Aguardar 2 segundos
7. Passageiro 3 pede corrida
8. Motorista recusa a primeira notificação

**Resultado Esperado**:
- ✅ Primeira notificação aparece
- ✅ Após recusar, segunda notificação aparece imediatamente
- ✅ Após recusar, terceira notificação aparece
- ✅ Contador de pedidos no painel reflete o número correto

---

### Teste 5: Timeout de Notificação

**Objetivo**: Verificar se a notificação desaparece automaticamente após 30 segundos.

**Passos**:
1. Seguir Teste 1 até receber a notificação
2. Não clicar em nada
3. Aguardar 30 segundos

**Resultado Esperado**:
- ✅ Contador regressivo mostra 30s, 29s, 28s... 1s, 0s
- ✅ Após 0s, notificação desaparece automaticamente
- ✅ Painel volta ao normal
- ✅ Pedido continua disponível para outros motoristas

---

### Teste 6: Som e Vibração

**Objetivo**: Verificar se os alertas multissensoriais funcionam.

**Passos**:
1. Motorista no painel com volume ativado
2. Passageiro pede corrida
3. Observar som e vibração

**Resultado Esperado**:
- ✅ Som de notificação toca (frequência 800Hz, duração ~0.5s)
- ✅ Em dispositivo móvel, dispositivo vibra com padrão [200ms, pausa, 200ms, pausa, 200ms]

---

### Teste 7: Notificação do Navegador

**Objetivo**: Verificar se a notificação do SO aparece.

**Passos**:
1. Motorista com permissão de notificações ativada
2. Passageiro pede corrida
3. Observar notificação do SO

**Resultado Esperado**:
- ✅ Notificação do SO aparece com título "Nova Corrida Disponível! 🚗"
- ✅ Notificação mostra categoria, origem, destino e tarifa
- ✅ Notificação requer interação (não desaparece automaticamente)

---

### Teste 8: Integração com Painel

**Objetivo**: Verificar se a notificação se integra bem com o painel existente.

**Passos**:
1. Motorista no painel com corrida ativa
2. Passageiro pede nova corrida
3. Observar notificação enquanto painel está visível

**Resultado Esperado**:
- ✅ Notificação aparece em overlay acima do painel
- ✅ Painel continua acessível atrás da notificação
- ✅ Título do painel mostra contador de pedidos atualizado
- ✅ Após aceitar/recusar, painel atualiza corretamente

---

### Teste 9: Realtime Updates

**Objetivo**: Verificar se as atualizações em tempo real funcionam.

**Passos**:
1. Motorista aceita corrida
2. Passageiro observa em `/minhas-corridas`
3. Motorista muda status para "A Chegar"
4. Passageiro observa atualização em tempo real

**Resultado Esperado**:
- ✅ Passageiro vê atualização imediata (sem refresh)
- ✅ Status muda de "À procura de motorista" para "Motorista a caminho"
- ✅ Informações do motorista aparecem

---

### Teste 10: Comportamento com App em Background

**Objetivo**: Verificar se notificações funcionam com app em background (dispositivo móvel).

**Passos**:
1. Motorista no painel em dispositivo móvel
2. Minimizar app (enviar para background)
3. Passageiro pede corrida
4. Observar notificação do SO

**Resultado Esperado**:
- ✅ Notificação do SO aparece mesmo com app em background
- ✅ Som toca
- ✅ Dispositivo vibra
- ✅ Ao clicar na notificação, app abre no painel

---

## 🐛 Cenários de Erro

### Erro 1: Motorista não tem permissão de notificações

**Passos**:
1. Motorista nega permissão de notificações ao aceder ao painel
2. Passageiro pede corrida

**Resultado Esperado**:
- ✅ Notificação em overlay ainda aparece
- ✅ Som e vibração funcionam
- ✅ Notificação do SO não aparece (esperado)

---

### Erro 2: Motorista não aprovado

**Passos**:
1. Tentar aceder a `/painel-motorista` com motorista não aprovado

**Resultado Esperado**:
- ✅ Página mostra mensagem apropriada
- ✅ Redireciona ou mostra status do motorista

---

### Erro 3: Falha de Conexão

**Passos**:
1. Motorista no painel
2. Desativar internet
3. Passageiro tenta pedir corrida

**Resultado Esperado**:
- ✅ Passageiro vê erro apropriado
- ✅ Motorista não recebe notificação (esperado)
- ✅ Ao restaurar conexão, notificações funcionam novamente

---

## 📊 Checklist de Validação

- [ ] Notificação aparece imediatamente (< 1 segundo)
- [ ] Notificação mostra todas as informações corretas
- [ ] Som toca
- [ ] Dispositivo vibra (em móvel)
- [ ] Notificação do SO aparece
- [ ] Motorista consegue aceitar
- [ ] Motorista consegue recusar
- [ ] Próxima notificação aparece após recusar
- [ ] Notificação desaparece após 30 segundos
- [ ] Contador de pedidos atualiza
- [ ] Painel continua funcional durante notificação
- [ ] Realtime updates funcionam
- [ ] App em background recebe notificações

---

## 🔍 Debugging

### Verificar Logs do Navegador

Abrir Developer Tools (F12) e verificar:

```javascript
// Verificar se hook está funcionando
console.log("New rides:", newRides);

// Verificar notificações
console.log("Current notification:", currentNotification);

// Verificar fila
console.log("Notification queue:", notificationQueue);
```

### Verificar Supabase Realtime

```sql
-- Verificar se tabela rides tem realtime ativado
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Verificar se há pedidos com status 'requested'
SELECT id, category, status, created_at FROM rides 
WHERE status = 'requested' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Verificar Permissões de Notificação

```javascript
// No console do navegador
console.log("Notification permission:", Notification.permission);
// Resultado esperado: "granted"
```

---

## 📝 Relatório de Testes

Ao completar os testes, preencher:

| Teste | Status | Notas |
|-------|--------|-------|
| 1. Notificação Imediata | ✅/❌ | |
| 2. Aceitar | ✅/❌ | |
| 3. Recusar | ✅/❌ | |
| 4. Fila | ✅/❌ | |
| 5. Timeout | ✅/❌ | |
| 6. Som/Vibração | ✅/❌ | |
| 7. Notificação SO | ✅/❌ | |
| 8. Integração Painel | ✅/❌ | |
| 9. Realtime Updates | ✅/❌ | |
| 10. Background | ✅/❌ | |

---

## 🎓 Conclusão

Após completar todos os testes com sucesso, a implementação de notificações imediatas está pronta para produção.

**Contato**: Para reportar problemas, abrir issue no repositório.
