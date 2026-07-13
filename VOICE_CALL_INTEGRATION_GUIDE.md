# Guia de Integração de Chamadas de Voz

## Visão Geral

A funcionalidade de chamadas de voz foi implementada utilizando **WebRTC** para comunicação de áudio em tempo real e **Supabase Realtime** para sinalização (troca de ofertas SDP e ICE candidates).

## Arquitetura

### Componentes Principais

1. **`useVoiceCall` Hook** (`src/hooks/use-voice-call.ts`)
   - Gerencia toda a lógica de WebRTC
   - Cria e gerencia a conexão peer-to-peer
   - Envia/recebe mensagens de sinalização via Supabase Realtime
   - Controla o estado da chamada (ativa, em espera, etc.)

2. **`VoiceCallWidget` Componente** (`src/components/lego/VoiceCallWidget.tsx`)
   - Interface visual durante a chamada
   - Mostra tela de chamada recebida
   - Mostra tela de chamada em progresso
   - Controles de mudo e término

3. **`VoiceCallButton` Componente** (`src/components/lego/VoiceCallButton.tsx`)
   - Botão para iniciar chamada
   - Integra-se facilmente em qualquer componente

4. **Server Functions** (`src/lib/voice-call.functions.ts`)
   - `notifyIncomingCall`: Envia notificação push
   - `logVoiceCall`: Registra histórico de chamadas
   - `getVoiceCallHistory`: Recupera histórico

5. **Database** (`supabase/migrations/20260713_add_voice_calls.sql`)
   - Tabela `voice_calls` para histórico
   - RLS policies para segurança
   - Índices para performance

## Como Usar

### 1. Integração Básica no RideChat

```tsx
import { VoiceCallWidget, VoiceCallButton } from "@/components/lego";
import { useVoiceCall } from "@/hooks/use-voice-call";

export function RideChatWithVoice({
  rideId,
  myUserId,
  remoteUserId,
  remoteUserName,
  onClose,
}: Props) {
  const [showVoiceCall, setShowVoiceCall] = useState(false);

  return (
    <>
      {/* Chat existente */}
      <div className="flex items-center gap-3">
        {/* ... header do chat ... */}
        <VoiceCallButton
          userId={myUserId}
          remoteUserId={remoteUserId}
          remoteUserName={remoteUserName}
          onCallStart={(remoteId) => {
            setShowVoiceCall(true);
            // Notificar o outro utilizador
            notifyIncomingCall({
              recipientId: remoteId,
              callerId: myUserId,
              callerName: "Seu Nome",
            });
          }}
        />
      </div>

      {/* Widget de chamada */}
      {showVoiceCall && (
        <VoiceCallWidget
          userId={myUserId}
          remoteUserId={remoteUserId}
          remoteUserName={remoteUserName}
          onCallEnd={() => setShowVoiceCall(false)}
        />
      )}
    </>
  );
}
```

### 2. Integração no Fluxo de Corrida

```tsx
// Em painel-motorista.tsx ou pedir.tsx
import { VoiceCallWidget } from "@/components/lego/VoiceCallWidget";

export function RidePanel() {
  const [activeCall, setActiveCall] = useState<string | null>(null);

  return (
    <>
      {/* Conteúdo da corrida */}
      <div className="flex gap-2">
        <button onClick={() => setActiveCall(driverId)}>
          Chamar Motorista
        </button>
      </div>

      {/* Widget de chamada */}
      {activeCall && (
        <VoiceCallWidget
          userId={userId}
          remoteUserId={activeCall}
          remoteUserName={driverName}
          onCallEnd={() => setActiveCall(null)}
        />
      )}
    </>
  );
}
```

### 3. Notificações de Chamada Recebida

```tsx
// Usar Supabase Realtime para ouvir chamadas recebidas
useEffect(() => {
  const channel = supabase
    .channel(`voice_calls:${userId}`)
    .on("broadcast", { event: "incoming_call" }, ({ payload }) => {
      // Mostrar tela de chamada recebida
      setIncomingCall({
        callerId: payload.callerId,
        callerName: payload.callerName,
      });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);
```

## Fluxo de Sinalização WebRTC

```
Chamador                          Supabase Realtime                    Receptor
   |                                    |                                 |
   |------ Cria Oferta SDP ------------->|                                 |
   |                                    |------ Envia Oferta ------------->|
   |                                    |                                 |
   |                                    |<------ Cria Resposta SDP --------|
   |<------ Recebe Resposta ------------|                                 |
   |                                    |                                 |
   |------ ICE Candidates 1 ----------->|                                 |
   |                                    |------ ICE Candidates 1 -------->|
   |                                    |                                 |
   |<------ ICE Candidates 2 ----------|                                 |
   |                                    |<------ ICE Candidates 2 --------|
   |                                    |                                 |
   |============ Conexão P2P Estabelecida ============|
   |                                    |                                 |
   |<========== Áudio em Tempo Real ========>|
```

## Configuração do Supabase

### 1. Criar Tabela de Chamadas

Execute a migration:
```bash
supabase migration up
```

### 2. Ativar Realtime

Certifique-se de que o Realtime está ativado para a tabela `voice_calls`:

```sql
ALTER TABLE voice_calls REPLICA IDENTITY FULL;
```

### 3. Configurar RLS Policies

As políticas já estão definidas na migration, mas pode verificar:

```sql
SELECT * FROM pg_policies WHERE tablename = 'voice_calls';
```

## Tratamento de Erros

O hook `useVoiceCall` retorna um campo `error` que contém mensagens de erro:

```tsx
const { error, isCallActive } = useVoiceCall(userId, remoteUserId);

if (error) {
  console.error("Erro na chamada:", error);
  // Mostrar mensagem ao utilizador
}
```

## Performance e Otimizações

### 1. ICE Candidates em Fila

Os ICE candidates são enfileirados até que a descrição remota seja definida, evitando erros.

### 2. Throttling de Sinalização

Cada mensagem de sinalização é enviada uma vez, evitando duplicatas.

### 3. Limpeza de Recursos

Todos os recursos (streams, conexões, timers) são limpos quando a chamada termina.

### 4. STUN Servers

Múltiplos servidores STUN do Google são utilizados para melhor conectividade:
- stun.l.google.com:19302
- stun1.l.google.com:19302
- stun2.l.google.com:19302
- stun3.l.google.com:19302
- stun4.l.google.com:19302

## Segurança

### 1. RLS Policies

- Utilizadores só podem ver suas próprias chamadas
- Apenas o chamador pode inserir registos

### 2. Validação de Dados

- Zod schemas validam todos os inputs
- UUIDs são verificados

### 3. Autenticação

- Todas as server functions requerem autenticação Supabase
- O middleware `requireSupabaseAuth` valida tokens

## Testes

### 1. Teste Local

```bash
# Terminal 1 - Motorista
npm run dev

# Terminal 2 - Passageiro (em outra janela/dispositivo)
npm run dev
```

### 2. Teste de Conectividade

- Abrir DevTools (F12)
- Ir para Network
- Filtrar por "webrtc" ou "signaling"
- Iniciar chamada e verificar mensagens

### 3. Teste de Áudio

- Permitir acesso ao microfone quando solicitado
- Verificar que o áudio é transmitido em ambas as direções

## Troubleshooting

### Problema: Sem Som

**Solução:**
1. Verificar permissões de microfone
2. Verificar volume do sistema
3. Verificar que `<audio>` tag tem `autoPlay` e `playsInline`

### Problema: Conexão Recusada

**Solução:**
1. Verificar que Supabase Realtime está ativo
2. Verificar que ambos os clientes estão no mesmo canal
3. Verificar firewall/NAT

### Problema: Chamada Não Conecta

**Solução:**
1. Verificar console para erros de WebRTC
2. Verificar que ICE candidates estão sendo trocados
3. Tentar com TURN servers (se necessário)

## Próximos Passos

1. **Adicionar TURN Servers**: Para melhor conectividade através de NAT/Firewall
2. **Implementar Gravação de Chamadas**: Registar áudio para compliance
3. **Adicionar Vídeo**: Estender para chamadas de vídeo
4. **Implementar Conferência**: Suportar múltiplos participantes
5. **Otimizar Banda**: Ajustar bitrate baseado em conexão

## Referências

- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [WebRTC Best Practices](https://www.html5rocks.com/en/tutorials/webrtc/basics/)
