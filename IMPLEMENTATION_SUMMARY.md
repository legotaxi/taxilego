# Implementação de Notificações Imediatas de Corridas para Motoristas

## 📋 Resumo das Mudanças

Este documento descreve a implementação da funcionalidade de notificações imediatas de pedidos de viagem para motoristas no app LegoTaxi.

## ✅ Funcionalidades Implementadas

### 1. Notificações em Tempo Real (Sem Scroll)
- **Componente**: `RideNotificationCard` em overlay full-screen
- **Comportamento**: Quando um passageiro pede uma corrida, o motorista recebe uma notificação imediata em overlay
- **Sem scroll necessário**: A notificação aparece no centro da tela, bloqueando interações até ser aceita ou recusada
- **Countdown**: 30 segundos para aceitar (auto-dismiss após timeout)

### 2. Fila de Notificações
- Múltiplos pedidos podem chegar simultaneamente
- Quando o motorista aceita ou recusa um pedido, a próxima notificação na fila aparece automaticamente
- Gerenciamento eficiente de múltiplos pedidos

### 3. Alertas Multissensoriais
- **Som**: Toque de notificação automático (800Hz, 0.5s)
- **Vibração**: Padrão de vibração (200ms, pausa, 200ms, pausa, 200ms)
- **Notificação do Navegador**: Notificação nativa do sistema operativo com permissão do utilizador

### 4. Integração com Supabase Realtime
- Subscrição automática a mudanças na tabela `rides` com status `requested`
- Atualização em tempo real sem necessidade de polling
- Suporte a múltiplas conexões simultâneas

### 5. Painel do Motorista Melhorado
- Contador de pedidos disponíveis no título
- Integração perfeita com o painel existente
- Botão de atualização manual
- Mapa em tempo real com localização do pedido

## 🔧 Arquitetura Técnica

### Componentes Modificados

#### `/src/routes/painel-motorista.tsx`
```typescript
// Novo estado para gerenciar notificações
const [notificationQueue, setNotificationQueue] = useState<RideNotification[]>([]);
const [currentNotification, setCurrentNotification] = useState<RideNotification | null>(null);

// Hook para receber notificações em tempo real
const { newRides, clearNotification } = useRideNotifications(
  (ride) => {
    // Quando uma nova corrida chega
    setNotificationQueue((prev) => [ride, ...prev]);
    if (!currentNotification) {
      setCurrentNotification(ride);
    }
  },
  () => {
    // Quando uma corrida é atualizada
    load();
  },
);

// Handlers para aceitar/recusar notificações
const handleAcceptNotification = useCallback(async (rideId: string) => {
  // Aceita a corrida e mostra a próxima notificação
}, [user, acceptFn, load, clearNotification]);

const handleDismissNotification = useCallback((rideId: string) => {
  // Recusa a corrida e mostra a próxima notificação
}, [clearNotification]);
```

### Componentes Existentes Utilizados

#### `/src/hooks/use-ride-notifications.ts`
- Hook que gerencia subscrição Realtime
- Toca som de notificação
- Faz vibração do dispositivo
- Mostra notificações do navegador

#### `/src/components/lego/RideNotificationCard.tsx`
- Componente visual da notificação
- Mostra informações da corrida (origem, destino, tarifa, distância)
- Botões de aceitar/recusar
- Countdown de 30 segundos

## 🚀 Fluxo de Funcionamento

### Para o Passageiro
1. Passageiro acede a `/pedir`
2. Seleciona origem e destino no mapa
3. Escolhe tipo de serviço e método de pagamento
4. Clica em "Confirmar Corrida"
5. Corrida é criada com status `requested` na base de dados

### Para o Motorista
1. Motorista está no `/painel-motorista`
2. Supabase Realtime detecta novo pedido com status `requested`
3. Hook `useRideNotifications` recebe a notificação
4. `RideNotificationCard` aparece em overlay full-screen
5. Som toca, dispositivo vibra, notificação do navegador aparece
6. Motorista pode:
   - **Aceitar**: Corrida muda para `accepted`, motorista é atribuído
   - **Recusar**: Notificação é descartada, próxima da fila aparece
   - **Timeout**: Após 30s, notificação é automaticamente descartada

## 📊 Base de Dados

### Tabela `rides`
```sql
- id: UUID (chave primária)
- passenger_id: UUID (referência ao passageiro)
- driver_id: UUID (referência ao motorista, NULL até aceitar)
- category: ENUM (moto, normal, xl, premium, shared, delivery)
- status: ENUM (requested, accepted, arriving, in_progress, completed, cancelled)
- pickup_address: VARCHAR
- pickup_lat: FLOAT
- pickup_lng: FLOAT
- dropoff_address: VARCHAR
- dropoff_lat: FLOAT
- dropoff_lng: FLOAT
- fare_kz: INTEGER
- distance_km: FLOAT
- duration_min: INTEGER
- payment_method: ENUM (cash, mcx_express, reference, card, wallet)
- created_at: TIMESTAMP
- accepted_at: TIMESTAMP (NULL até aceitar)
- started_at: TIMESTAMP (NULL até iniciar)
- completed_at: TIMESTAMP (NULL até concluir)
- cancelled_at: TIMESTAMP (NULL até cancelar)
```

### RLS Policies
- Motoristas podem ver pedidos com status `requested`
- Motoristas podem aceitar pedidos (mudar status para `accepted`)
- Motoristas podem atualizar status de corridas que aceitaram

## 🔐 Segurança

- Autenticação via Supabase Auth (middleware `requireSupabaseAuth`)
- RLS (Row Level Security) garante que motoristas só veem pedidos apropriados
- Validação de entrada com Zod
- Permissões de notificação do navegador requerem consentimento do utilizador

## 📱 Experiência do Utilizador

### Motorista
- Recebe notificações imediatas sem necessidade de scroll
- Pode aceitar/recusar pedidos com um clique
- Feedback visual com countdown
- Som e vibração para alertar mesmo com aplicação em background

### Passageiro
- Feedback imediato após pedir corrida
- Pode acompanhar status em `/minhas-corridas`
- Notificações em tempo real quando motorista aceita

## 🧪 Testes Recomendados

1. **Teste de Notificação Imediata**
   - Pedir corrida como passageiro
   - Verificar se notificação aparece imediatamente no motorista

2. **Teste de Fila de Notificações**
   - Pedir múltiplas corridas
   - Aceitar/recusar pedidos
   - Verificar se próximo pedido aparece

3. **Teste de Timeout**
   - Aguardar 30 segundos sem aceitar/recusar
   - Verificar se notificação desaparece

4. **Teste de Som e Vibração**
   - Verificar se som toca
   - Verificar se dispositivo vibra (em dispositivo real)

5. **Teste de Notificação do Navegador**
   - Verificar se notificação do SO aparece
   - Testar com app em background

## 📦 Dependências

- `@tanstack/react-router`: Roteamento
- `@tanstack/react-start`: Server functions
- `supabase-js`: Cliente Supabase
- `sonner`: Toast notifications
- `lucide-react`: Ícones

## 🔄 Próximas Melhorias (Sugestões)

1. **Filtros de Pedidos**: Permitir motorista filtrar por categoria/distância
2. **Histórico de Recusas**: Rastrear quantas vezes um pedido foi recusado
3. **Notificações Persistentes**: Guardar histórico de notificações
4. **Analytics**: Rastrear tempo de resposta do motorista
5. **Priorização**: Mostrar pedidos mais próximos primeiro
6. **Configurações**: Permitir motorista desativar som/vibração

## 📝 Notas Importantes

- O hook `useRideNotifications` já estava implementado no projeto
- O componente `RideNotificationCard` já estava implementado no projeto
- Esta implementação apenas integra os componentes existentes no painel do motorista
- Todas as funções de servidor (`acceptRide`, `updateRideStatus`) já existiam

## ✨ Conclusão

A implementação fornece uma experiência de utilizador superior para motoristas, permitindo receber e responder a pedidos de corrida imediatamente sem necessidade de scroll ou navegação adicional. A integração com Supabase Realtime garante que as notificações são entregues em tempo real, enquanto os alertas multissensoriais (som, vibração, notificação do SO) garantem que o motorista não perde nenhum pedido.
