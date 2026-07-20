# Exemplo de Integração de Chamadas de Voz

## Integração na Rota de Passageiro (minhas-corridas.tsx)

### Passo 1: Importar o Componente

Adicione o import no topo do ficheiro:

```typescript
import { RideWithVoiceCallEnhanced } from "@/components/lego/RideWithVoiceCallEnhanced";
```

### Passo 2: Integrar no Componente de Corrida Ativa

Localize a seção onde as corridas ativas são renderizadas (por volta da linha 373):

**Antes:**
```typescript
{activeRides.map((r) => {
  const Icon = categoryIcon[r.category as keyof typeof categoryIcon] ?? Car;
  const driverInfo = r.driver_id ? driverInfoMap[r.driver_id] : undefined;
  const isLoadingDriver = r.driver_id ? loadingDrivers.has(r.driver_id) : false;

  return (
    <div key={r.id} className="group relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-card shadow-lg transition-all duration-300 hover:shadow-xl animate-slide-up">
      {/* Conteúdo da corrida */}
      ...
    </div>
  );
})}
```

**Depois:**
```typescript
{activeRides.map((r) => {
  const Icon = categoryIcon[r.category as keyof typeof categoryIcon] ?? Car;
  const driverInfo = r.driver_id ? driverInfoMap[r.driver_id] : undefined;
  const isLoadingDriver = r.driver_id ? loadingDrivers.has(r.driver_id) : false;

  return (
    <div key={r.id} className="relative">
      {/* Widget de Chamada de Voz */}
      <RideWithVoiceCallEnhanced
        rideId={r.id}
        userId={user?.id || ""}
        remoteUserId={r.driver_id || null}
        remoteUserName={driverInfo?.profile?.full_name || "Motorista"}
        userRole="passenger"
        onCallStart={() => {
          toast.info("Chamada iniciada com o motorista");
        }}
        onCallEnd={() => {
          toast.info("Chamada terminada");
        }}
      />

      {/* Conteúdo da corrida */}
      <div className="group relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-card shadow-lg transition-all duration-300 hover:shadow-xl animate-slide-up">
        {/* ... resto do conteúdo ... */}
      </div>
    </div>
  );
})}
```

### Passo 3: Adicionar Botão de Chamada no Painel de Informações do Motorista

Se quiser adicionar um botão de chamada explícito no painel de informações do motorista, adicione:

```typescript
{/* Botões de ação */}
<div className="grid grid-cols-2 gap-2">
  <button
    onClick={() => {
      // Iniciar chamada de voz
      const voiceCallButton = document.querySelector('[title="Chamar ' + driverInfo?.profile?.full_name + '"]') as HTMLButtonElement;
      voiceCallButton?.click();
    }}
    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border-2 border-yellow-600 text-yellow-600 font-semibold hover:bg-yellow-50 transition"
  >
    <Phone className="h-4 w-4" />
    Chamar
  </button>
  <button
    onClick={onContact}
    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-yellow-600 text-white font-semibold hover:bg-yellow-700 transition"
  >
    <MessageCircle className="h-4 w-4" />
    Mensagem
  </button>
</div>
```

## Integração na Rota de Motorista (painel-motorista.tsx)

### Passo 1: Importar o Componente

Adicione o import no topo do ficheiro:

```typescript
import { RideWithVoiceCallEnhanced } from "@/components/lego/RideWithVoiceCallEnhanced";
```

### Passo 2: Integrar no Componente de Corrida Ativa

Localize a seção de corridas ativas (por volta da linha 177):

**Antes:**
```typescript
{activeRides.map((ride) => (
  <div key={ride.id} className="bg-white rounded-xl shadow-sm border-l-4 border-yellow-500 overflow-hidden">
    {/* Conteúdo da corrida */}
    ...
  </div>
))}
```

**Depois:**
```typescript
{activeRides.map((ride) => (
  <div key={ride.id} className="relative">
    {/* Widget de Chamada de Voz */}
    <RideWithVoiceCallEnhanced
      rideId={ride.id}
      userId={user?.id || ""}
      remoteUserId={ride.passenger_id || null}
      remoteUserName={ride.passenger_name || "Passageiro"}
      userRole="driver"
      onCallStart={() => {
        toast.info("Chamada iniciada com o passageiro");
      }}
      onCallEnd={() => {
        toast.info("Chamada terminada");
      }}
    />

    <div className="bg-white rounded-xl shadow-sm border-l-4 border-yellow-500 overflow-hidden">
      {/* ... resto do conteúdo ... */}
    </div>
  </div>
))}
```

## Teste Manual

### Teste 1: Passageiro Inicia Chamada

1. Abra a app como passageiro
2. Peça uma corrida
3. Aguarde até que um motorista aceite
4. Clique no botão "Chamar"
5. Verifique se o motorista recebe a chamada

### Teste 2: Motorista Recebe Chamada

1. Abra a app como motorista
2. Aceite uma corrida
3. Aguarde que o passageiro inicie a chamada
4. Verifique se a tela de chamada recebida aparece
5. Clique em "Aceitar"

### Teste 3: Conversa de Voz

1. Ambos aceitam a chamada
2. Verifique se o áudio é transmitido
3. Teste os controles de mudo
4. Teste o controle de volume
5. Termine a chamada

## Verificação de Permissões

Certifique-se de que o `manifest.json` inclui as permissões necessárias:

```json
{
  "permissions": [
    "microphone",
    "notifications"
  ]
}
```

## Debugging

Para ativar logs de debug, adicione ao componente:

```typescript
useEffect(() => {
  console.log("Estado da chamada:", {
    isCallActive,
    isRinging,
    isMuted,
    callDuration,
    callStatus,
  });
}, [isCallActive, isRinging, isMuted, callDuration, callStatus]);
```

## Próximos Passos

1. Testar em dispositivos reais (mobile)
2. Testar com diferentes tipos de conexão (WiFi, 4G)
3. Monitorar qualidade de áudio
4. Recolher feedback dos utilizadores
5. Otimizar baseado em feedback
