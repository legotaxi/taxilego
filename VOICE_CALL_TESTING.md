# Guia de Testes - Chamadas de Voz

## Pré-requisitos

- Dois navegadores ou dois dispositivos com acesso ao aplicativo
- Microfones funcionando em ambos os dispositivos
- Conexão de internet estável
- Permissões de microfone ativadas

## Teste 1: Iniciar Chamada (Cenário Básico)

### Passos

1. **Abrir aplicativo em dois navegadores**
   - Navegador 1: Abrir como Motorista (ID: driver-123)
   - Navegador 2: Abrir como Passageiro (ID: passenger-456)

2. **Aceitar uma corrida**
   - Passageiro: Pedir uma corrida
   - Motorista: Aceitar a corrida

3. **Iniciar chamada de voz**
   - Passageiro: Clicar no botão "Chamar" no painel de corrida
   - Motorista: Deverá receber notificação de chamada recebida

4. **Aceitar chamada**
   - Motorista: Clicar em "Aceitar" na tela de chamada recebida
   - Ambos: Deverão ver a tela de chamada ativa

5. **Testar áudio**
   - Passageiro: Falar algo
   - Motorista: Verificar se consegue ouvir
   - Motorista: Falar algo
   - Passageiro: Verificar se consegue ouvir

6. **Terminar chamada**
   - Qualquer um: Clicar no botão vermelho de terminar
   - Ambos: Deverão voltar ao estado anterior

### Resultado Esperado

- ✅ Ambos conseguem ouvir-se claramente
- ✅ Sem lag perceptível
- ✅ Chamada termina corretamente em ambos os lados

---

## Teste 2: Rejeitar Chamada

### Passos

1. **Iniciar chamada**
   - Passageiro: Clicar em "Chamar"

2. **Rejeitar chamada**
   - Motorista: Clicar em "Rejeitar" na tela de chamada recebida

3. **Verificar estado**
   - Passageiro: Deverá ver que a chamada foi rejeitada
   - Motorista: Deverá voltar ao estado anterior

### Resultado Esperado

- ✅ Ambos voltam ao estado anterior
- ✅ Sem erros no console

---

## Teste 3: Cancelar Chamada em Progresso

### Passos

1. **Iniciar chamada**
   - Passageiro: Clicar em "Chamar"
   - Motorista: Aceitar

2. **Cancelar antes de conectar**
   - Passageiro: Clicar em "Cancelar" enquanto está "Chamando..."
   - Motorista: Deverá receber notificação de término

3. **Verificar estado**
   - Ambos: Deverão voltar ao estado anterior

### Resultado Esperado

- ✅ Chamada é terminada corretamente
- ✅ Sem áudio residual

---

## Teste 4: Mudo (Mute)

### Passos

1. **Iniciar chamada**
   - Passageiro: Clicar em "Chamar"
   - Motorista: Aceitar

2. **Ativar mudo**
   - Passageiro: Clicar no ícone de microfone para mutar
   - Motorista: Tentar ouvir o passageiro (não deverá ouvir)

3. **Desativar mudo**
   - Passageiro: Clicar novamente para desmutar
   - Motorista: Deverá ouvir novamente

### Resultado Esperado

- ✅ Áudio é cortado quando mutar
- ✅ Áudio volta quando desmutar
- ✅ Indicador visual muda de cor (azul/vermelho)

---

## Teste 5: Duração da Chamada

### Passos

1. **Iniciar chamada**
   - Passageiro: Clicar em "Chamar"
   - Motorista: Aceitar

2. **Observar timer**
   - Ambos: Verificar que o timer está a contar (MM:SS)

3. **Terminar chamada**
   - Qualquer um: Clicar para terminar
   - Ambos: Verificar que o tempo foi registado

### Resultado Esperado

- ✅ Timer conta corretamente
- ✅ Tempo é registado no histórico

---

## Teste 6: Múltiplas Chamadas Consecutivas

### Passos

1. **Primeira chamada**
   - Passageiro: Chamar
   - Motorista: Aceitar
   - Ambos: Terminar após 10 segundos

2. **Segunda chamada (imediatamente)**
   - Passageiro: Chamar novamente
   - Motorista: Aceitar
   - Ambos: Terminar

3. **Verificar histórico**
   - Ambos: Deverão ver duas chamadas no histórico

### Resultado Esperado

- ✅ Múltiplas chamadas funcionam sem problemas
- ✅ Sem vazamento de recursos
- ✅ Histórico é atualizado corretamente

---

## Teste 7: Conexão Instável

### Passos

1. **Iniciar chamada**
   - Passageiro: Chamar
   - Motorista: Aceitar

2. **Simular perda de conexão**
   - Abrir DevTools (F12)
   - Ir para Network
   - Throttle: "Offline" por 5 segundos

3. **Verificar comportamento**
   - Ambos: Deverão ver mensagem de erro ou reconexão
   - Ambos: Tentar reconectar

### Resultado Esperado

- ✅ Aplicação não congela
- ✅ Mensagem de erro clara
- ✅ Possibilidade de reconectar

---

## Teste 8: Permissões de Microfone

### Passos

1. **Negar permissão de microfone**
   - Abrir DevTools
   - Ir para Sensors
   - Desativar microfone

2. **Tentar iniciar chamada**
   - Passageiro: Clicar em "Chamar"

3. **Verificar mensagem de erro**
   - Deverá aparecer mensagem: "Erro ao aceder ao microfone"

### Resultado Esperado

- ✅ Mensagem de erro clara
- ✅ Sem crash da aplicação

---

## Teste 9: Performance em Dispositivos Móveis

### Passos

1. **Abrir em smartphone/tablet**
   - Usar Chrome DevTools para emular dispositivo móvel
   - Ou usar dispositivo real

2. **Iniciar chamada**
   - Passageiro: Chamar
   - Motorista: Aceitar

3. **Verificar performance**
   - Consumo de CPU
   - Consumo de memória
   - Qualidade de áudio

### Resultado Esperado

- ✅ Funciona sem lag
- ✅ Consumo de recursos razoável
- ✅ Interface responsiva

---

## Teste 10: Histórico de Chamadas

### Passos

1. **Fazer várias chamadas**
   - Completar 3-5 chamadas de diferentes durações

2. **Verificar histórico**
   - Abrir página de histórico de chamadas
   - Verificar que todas as chamadas aparecem

3. **Filtrar histórico**
   - Filtrar por status (completas, perdidas, rejeitadas)
   - Filtrar por data

### Resultado Esperado

- ✅ Histórico mostra todas as chamadas
- ✅ Duração é exata
- ✅ Status é correto

---

## Checklist de Testes

- [ ] Teste 1: Iniciar Chamada
- [ ] Teste 2: Rejeitar Chamada
- [ ] Teste 3: Cancelar Chamada
- [ ] Teste 4: Mudo
- [ ] Teste 5: Duração
- [ ] Teste 6: Múltiplas Chamadas
- [ ] Teste 7: Conexão Instável
- [ ] Teste 8: Permissões
- [ ] Teste 9: Performance Móvel
- [ ] Teste 10: Histórico

---

## Debugging

### Ativar Logs Detalhados

```javascript
// No console do navegador
localStorage.setItem('DEBUG_VOICE_CALL', 'true');
```

### Monitorar Conexão WebRTC

```javascript
// No console
window.DEBUG_WEBRTC = true;
```

### Verificar Estado da Conexão

```javascript
// No console
navigator.mediaDevices.enumerateDevices().then(devices => {
  console.log('Dispositivos de áudio:', devices.filter(d => d.kind === 'audioinput'));
});
```

---

## Relatório de Bugs

Se encontrar um bug, por favor reporte com:

1. **Descrição do problema**
2. **Passos para reproduzir**
3. **Resultado esperado vs. real**
4. **Screenshots/vídeo**
5. **Logs do console**
6. **Informações do dispositivo** (OS, navegador, versão)

---

## Performance Esperada

| Métrica | Esperado |
|---------|----------|
| Latência de Sinalização | < 100ms |
| Latência de Áudio | 50-150ms |
| Jitter | < 50ms |
| Perda de Pacotes | < 1% |
| CPU (por chamada) | 5-15% |
| Memória (por chamada) | 20-50MB |

---

## Notas Importantes

1. **Testes em Produção**: Sempre testar em ambiente de staging primeiro
2. **Múltiplos Navegadores**: Testar em Chrome, Firefox, Safari
3. **Dispositivos Reais**: Emuladores podem não reproduzir problemas reais
4. **Conexões Reais**: Testar com 3G/4G, não apenas WiFi
5. **Carga**: Testar com múltiplas chamadas simultâneas

---

## Suporte

Para dúvidas ou problemas, contacte a equipa de desenvolvimento.
