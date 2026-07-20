# Guia de Integração de Chamadas de Voz

## Visão Geral

Este guia descreve como integrar a funcionalidade de chamadas de voz entre motorista e passageiro na aplicação LegoTaxi.

## Componentes Criados

### 1. Hook `useVoiceCallEnhanced`
**Localização:** `src/hooks/use-voice-call-enhanced.ts`

Hook melhorado para gerenciar chamadas de voz WebRTC usando PeerJS com signaling via Supabase Realtime.

**Funcionalidades:**
- Iniciar e aceitar chamadas
- Gerir mudo e volume
- Cronómetro de chamada
- Tratamento de erros
- Signaling via Supabase

**Uso:**
```typescript
const voiceCall = useVoiceCallEnhanced(userId, remoteUserId);
const {
  isCallActive,
  isRinging,
  isMuted,
  callDuration,
  startCall,
  acceptCall,
  rejectCall,
  endCall,
  toggleMute,
  toggleAudio,
} = voiceCall;
```

### 2. Componente `VoiceCallWidgetEnhanced`
**Localização:** `src/components/lego/VoiceCallWidgetEnhanced.tsx`

Widget de interface para chamadas de voz com três estados:
- **Chamada Ativa:** Mostra avatar, duração, controles de mudo/volume
- **Chamada Recebida:** Tela de toque com opções aceitar/rejeitar
- **Chamando:** Tela de espera com indicador de carregamento

### 3. Componente `RideWithVoiceCallEnhanced`
**Localização:** `src/components/lego/RideWithVoiceCallEnhanced.tsx`

Componente que integra chamadas de voz com o sistema de corridas.

**Funcionalidades:**
- Botão flutuante para iniciar chamada
- Receber chamadas via Supabase Realtime
- Registar histórico de chamadas
- Notificações push
- Som de chamada e vibração

## Integração nas Rotas Existentes

### Para Passageiros (minhas-corridas.tsx)

1. **Importar o componente:**
```typescript
import { RideWithVoiceCallEnhanced } from "@/components/lego/RideWithVoiceCallEnhanced";
```

2. **Usar no componente de corrida ativa:**
```typescript
{activeRides.map((ride) => (
  <RideWithVoiceCallEnhanced
    key={ride.id}
    rideId={ride.id}
    userId={user?.id || ""}
    remoteUserId={ride.driver_id || null}
    remoteUserName={driverInfo?.profile?.full_name || "Motorista"}
    userRole="passenger"
    onCallStart={() => console.log("Chamada iniciada")}
    onCallEnd={() => console.log("Chamada terminada")}
  />
))}
```

### Para Motoristas (painel-motorista.tsx)

1. **Importar o componente:**
```typescript
import { RideWithVoiceCallEnhanced } from "@/components/lego/RideWithVoiceCallEnhanced";
```

2. **Usar no componente de corrida ativa:**
```typescript
{activeRides.map((ride) => (
  <RideWithVoiceCallEnhanced
    key={ride.id}
    rideId={ride.id}
    userId={user?.id || ""}
    remoteUserId={ride.passenger_id || null}
    remoteUserName={passengerInfo?.full_name || "Passageiro"}
    userRole="driver"
    onCallStart={() => console.log("Chamada iniciada")}
    onCallEnd={() => console.log("Chamada terminada")}
  />
))}
```

## Configuração do PeerJS

O PeerJS está configurado com servidores STUN públicos do Google:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

Para produção, considere usar servidores TURN privados para melhor confiabilidade.

## Banco de Dados

A tabela `voice_calls` já foi criada com a seguinte estrutura:

```sql
CREATE TABLE public.voice_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE,
    caller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    duration_seconds INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('completed', 'missed', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now()
);
```

## Funções de Servidor

As seguintes funções estão disponíveis em `src/lib/voice-call.functions.ts`:

### `notifyIncomingCall`
Envia notificação push quando há uma chamada de voz recebida.

```typescript
await notifyIncomingCall({
  data: {
    recipientId: string,
    callerId: string,
    callerName: string,
  },
});
```

### `logVoiceCall`
Registra o histórico de chamadas de voz.

```typescript
await logVoiceCall({
  data: {
    rideId: string,
    remoteUserId: string,
    duration: number,
    status: 'completed' | 'missed' | 'rejected',
  },
});
```

### `getVoiceCallHistory`
Obtém o histórico de chamadas de voz do utilizador.

```typescript
const { calls, error } = await getVoiceCallHistory();
```

## Fluxo de Chamada

### Iniciar Chamada (Chamador)

1. Utilizador clica no botão "Chamar"
2. `startCall()` é chamado
3. Solicita permissão de microfone
4. Envia notificação push via `notifyIncomingCall`
5. Envia sinal via Supabase Realtime
6. Aguarda resposta

### Receber Chamada (Receptor)

1. Supabase Realtime entrega o sinal `incoming_call`
2. Som de chamada é reproduzido
3. Dispositivo vibra
4. Utilizador vê modal com opções aceitar/rejeitar
5. Se aceitar: `acceptCall()` é chamado
6. Solicita permissão de microfone
7. Responde à chamada PeerJS

### Terminar Chamada

1. Utilizador clica em "Terminar Chamada"
2. `endCall()` é chamado
3. Streams de áudio são parados
4. Conexão PeerJS é fechada
5. Histórico é registado via `logVoiceCall`

## Permissões e Privacidade

### Permissões Necessárias

- **Microfone:** Necessário para enviar áudio
- **Notificações:** Necessário para alertar sobre chamadas recebidas

### Políticas de Segurança (RLS)

A tabela `voice_calls` tem as seguintes políticas:

- Utilizadores só podem ver suas próprias chamadas (como chamador ou receptor)
- Apenas o chamador pode inserir registos

## Troubleshooting

### Chamada não conecta

1. Verificar se o PeerJS está inicializado corretamente
2. Verificar conexão de internet
3. Verificar se os IDs de utilizador são válidos
4. Verificar permissões de microfone no navegador

### Áudio não é ouvido

1. Verificar se o volume do dispositivo está ligado
2. Verificar se o áudio remoto está sendo reproduzido
3. Verificar se a stream remota foi recebida

### Erro de permissão de microfone

1. Verificar se o navegador tem permissão de microfone
2. Verificar se o HTTPS está ativado (obrigatório para getUserMedia)
3. Verificar se o dispositivo tem microfone

## Melhorias Futuras

1. **Gravação de Chamadas:** Adicionar opção de gravar chamadas
2. **Chamadas em Grupo:** Suporte para múltiplos participantes
3. **Qualidade de Áudio:** Ajustar bitrate baseado na conexão
4. **Histórico Melhorado:** Interface para visualizar histórico de chamadas
5. **Relatórios:** Análise de duração e qualidade de chamadas

## Referências

- [PeerJS Documentation](https://peerjs.com/)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [getUserMedia API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
