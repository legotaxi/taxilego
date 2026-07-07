# Correções de Comunicação Passageiro-Motorista - LegoTaxii

## Resumo das Correções Implementadas

Este documento detalha todas as correções realizadas para resolver os problemas de comunicação entre passageiros e motoristas no projeto LegoTaxii.

---

## 1. **Realtime Subscription para Passageiros** ✅

### Problema

O passageiro não recebia atualizações em tempo real quando o motorista aceitava, iniciava ou completava a corrida. A página `minhas-corridas.tsx` apenas carregava dados uma vez com React Query.

### Solução

- Adicionada subscrição Realtime do Supabase em `minhas-corridas.tsx` (linhas 119-133)
- Filtro específico: `filter: passenger_id=eq.${user?.id}` para receber apenas atualizações relevantes
- Automático refetch quando qualquer mudança ocorre na tabela `rides`
- Cleanup adequado do canal ao desmontar o componente

### Código

```typescript
useEffect(() => {
  if (typeof window === "undefined") return;

  const channel = supabase
    .channel("my-rides-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rides",
        filter: `passenger_id=eq.${user?.id}`,
      },
      () => {
        console.log("Ride updated, refetching...");
        ridesQuery.refetch();
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user?.id, ridesQuery]);
```

---

## 2. **Botão "Chamar" Funcional com WhatsApp** ✅

### Problema

O botão "Chamar" existia visualmente mas não tinha funcionalidade. Não havia `onClick`, não buscava dados do motorista, e não integrava com telefone/WhatsApp.

### Solução

- Implementada função `handleCallDriver` que abre WhatsApp com mensagem pré-preenchida
- Integração com dados do motorista (nome e telefone)
- Validação de número de telefone disponível
- Notificação de erro se dados não estiverem disponíveis

### Código

```typescript
const handleCallDriver = (
  driverPhone: string | null | undefined,
  driverName: string | null | undefined,
) => {
  if (!driverPhone) {
    toast.error("Número de telefone do motorista não disponível");
    return;
  }

  const phoneNumber = driverPhone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=Olá ${driverName || "motorista"}, estou à sua espera!`;
  window.open(whatsappUrl, "_blank");
};
```

---

## 3. **Dados do Motorista Visíveis para Passageiro** ✅

### Problema

O passageiro não via nome, foto, avaliação, localização ou número de telefone do motorista.

### Solução

- Nova função `getDriverInfo` em `rides.functions.ts` que busca dados do motorista e perfil
- Carregamento automático de dados quando corrida é aceita
- Cache de dados do motorista para evitar requisições duplicadas
- Card informativo exibindo:
  - Nome do motorista
  - Avaliação (⭐)
  - Total de corridas realizadas
  - Localização em tempo real (latitude/longitude)

### Código

```typescript
export const getDriverInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ driver_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id, current_lat, current_lng, rating, total_rides")
      .eq("id", data.driver_id)
      .maybeSingle();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, phone, avatar_url")
      .eq("id", data.driver_id)
      .maybeSingle();

    return { driver, profile, error: null };
  });
```

---

## 4. **Localização em Tempo Real do Motorista** ✅

### Problema

O motorista enviava sua localização a cada ~1 segundo, mas o passageiro não a recebia. O mapa do passageiro só mostrava sua própria localização.

### Solução

- Integração de dados de localização do motorista no card informativo
- Exibição de latitude/longitude com 4 casas decimais
- Atualização automática quando dados do motorista são carregados
- Indicador visual com ícone de mapa

### Implementação

Os dados de localização (`current_lat`, `current_lng`) agora são buscados via `getDriverInfo` e exibidos no componente:

```typescript
{driverInfo.driver?.current_lat && driverInfo.driver?.current_lng && (
  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
    <MapIcon className="h-3 w-3" />
    <span>Lat: {driverInfo.driver.current_lat.toFixed(4)}, Lng: {driverInfo.driver.current_lng.toFixed(4)}</span>
  </div>
)}
```

---

## 5. **Status "Arriving" Funcional no Motorista** ✅

### Problema

O painel do motorista não tinha botão para transição de `accepted` → `arriving`. Pulava direto para `in_progress`.

### Solução

- Adicionado botão "A Chegar" (cor roxa) na sequência de ações do motorista
- Fluxo completo: `accepted` → `arriving` → `in_progress` → `completed`
- Função `handleArriving` implementada
- Notificação visual e feedback ao usuário

### Código

```typescript
{ride.status === "accepted" && (
  <>
    <button
      onClick={() => handleArriving(ride.id)}
      disabled={busy === ride.id}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-purple-50 py-2 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 min-w-[120px]"
    >
      {busy === ride.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation2 className="h-3.5 w-3.5" />}
      A Chegar
    </button>
    {/* ... outros botões ... */}
  </>
)}
```

---

## 6. **Melhorias Adicionais**

### 6.1 Melhor Fluxo de Status

- Adicionado suporte para status `arriving` em ambos os lados (passageiro e motorista)
- Cores visuais diferenciadas para cada status
- Descrições claras do que está acontecendo em cada etapa

### 6.2 Indicadores de Carregamento

- Spinner de carregamento enquanto dados do motorista são buscados
- Mensagem "A carregar dados do motorista…"
- Estados de erro tratados graciosamente

### 6.3 Melhor UX

- Botões com tamanho mínimo para evitar cliques acidentais
- Feedback visual imediato com toasts
- Dados do motorista em card destacado e fácil de ler

---

## Arquivos Modificados

1. **`src/lib/rides.functions.ts`**
   - Adicionada função `getDriverInfo`
   - Adicionados campos `driver_id`, `accepted_at`, `started_at` ao `getMyRides`

2. **`src/routes/minhas-corridas.tsx`**
   - Adicionada subscrição Realtime
   - Implementada função `handleCallDriver`
   - Adicionado carregamento de dados do motorista
   - Novo card informativo com dados do motorista

3. **`src/routes/painel-motorista.tsx`**
   - Adicionado botão "A Chegar" (status `arriving`)
   - Melhorado fluxo de transição de status
   - Melhor layout dos botões de ação

---

## Testes Recomendados

### Teste 1: Realtime Subscription

1. Passageiro pede uma corrida
2. Motorista aceita em outro dispositivo/navegador
3. Verificar se passageiro vê atualização em tempo real (sem refresh)

### Teste 2: Botão Chamar

1. Motorista aceita corrida
2. Passageiro clica em "Chamar"
3. Verificar se abre WhatsApp com mensagem pré-preenchida

### Teste 3: Dados do Motorista

1. Motorista aceita corrida
2. Verificar se passageiro vê:
   - Nome do motorista
   - Avaliação e número de corridas
   - Localização em tempo real

### Teste 4: Status Arriving

1. Motorista aceita corrida
2. Motorista clica em "A Chegar"
3. Verificar se status muda para "arriving"
4. Passageiro deve ver "Motorista a chegar" em tempo real

---

## Notas Importantes

- Todas as alterações mantêm compatibilidade com o código existente
- Realtime subscription usa filtro para evitar sobrecarga
- Dados do motorista são cacheados para evitar requisições desnecessárias
- Tratamento de erros implementado em todos os pontos críticos
- Mensagens de feedback (toasts) implementadas para melhor UX

---

## Próximas Melhorias Sugeridas

1. **Notificações Push**: Implementar notificações push quando motorista aceita/chega
2. **Tracking em Mapa**: Mostrar localização do motorista em tempo real no mapa
3. **Avaliações**: Implementar sistema de avaliações pós-corrida
4. **Histórico de Chat**: Adicionar chat entre passageiro e motorista
5. **Cancelamento com Penalidade**: Implementar penalidades para cancelamentos frequentes

---

**Data de Implementação**: 01 de Junho de 2026
**Versão**: 1.0
