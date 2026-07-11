# Resumo das Mudanças Implementadas — Taxilego

## Data: 11 de Julho de 2026

Este documento descreve todas as alterações implementadas no app Taxilego conforme solicitado.

---

## 1. Botão Online/Offline — Funcionalidade Real

### Problema anterior
O botão de Online/Offline apenas gravava o estado `is_online` na base de dados, mas **não controlava o tracking GPS**. O hook `useGeolocationWatch` iniciava o rastreamento automaticamente no mount do componente, independentemente do estado online. Consequentemente, o motorista permanecia visível no mapa e recebia pedidos mesmo quando "offline".

### Solução implementada

**`src/hooks/use-geolocation.ts`**
- O hook `useGeolocationWatch` agora aceita um segundo parâmetro `active: boolean`
- Quando `active = true`: inicia o `watchPosition` do GPS normalmente
- Quando `active = false`: para o tracking GPS, limpa coordenadas e distancia percorrida
- Foram adicionados métodos `startTracking()` e `stopTracking()` públicos

**`src/components/lego/DriverMapView.tsx`**
- O tracking GPS agora é controlado pelo estado `isOnline`
- Quando o motorista fica **offline**: GPS pára, rotas são limpas, localização no backend é removida
- Quando o motorista fica **online**: GPS inicia, coordenadas são enviadas ao servidor, rotas são calculadas
- O botão mostra mensagens claras: "Estás Online — Recebendo Pedidos" / "Estás Offline — Clique para Ativar"
- Toast notifications informam o estado de forma explícita

**`src/hooks/use-ride-notifications.ts`**
- O hook aceita um parâmetro `isOnline` nas opções
- Motoristas offline **não recebem** notificações de novos pedidos (som, vibração, browser notification)
- Compatibilidade mantida: se `isOnline` não for passado, comporta-se como antes (recebe tudo)

**`src/routes/painel-motorista.tsx`**
- O estado `isOnline` é agora passado ao `useRideNotifications` para filtrar pedidos

---

## 2. Passageiro Vê Carros Disponíveis no Mapa

### Problema anterior
Os motoristas online eram consultados na BD e mostrados como pontos genéricos no mapa, sem ícones de carro, sem cores por categoria, e sem informação clicável.

### Solução implementada

**`src/components/lego/MapView.tsx`**
- Novos ícones SVG de **carros coloridos** para cada categoria:
  - Normal → Rosa (`#ec4899`)
  - XL → Azul (`#3b82f6`)
  - Moto → Laranja (`#f59e0b`)
  - Delivery → Verde (`#10b981`)
  - Premium → Roxo (`#8b5cf6`)
  - Shared → Ciano (`#06b6d4`)
- Os marcadores são **clicáveis** e mostram um InfoWindow com o nome do motorista
- Compatibilidade mantida: continua a aceitar `Array<[number, number]>` simples

**`src/components/lego/PassengerMapView.tsx`**
- Adicionado **contador de carros disponíveis** no canto superior esquerdo do mapa
- Adicionado badge informativo "Trajeto origem → destino" quando há rota traçada
- A interface `NearbyDriver` exportada permite passar dados ricos (categoria, nome, rating)

---

## 3. Traçado de Trajeto Origem → Destino no Mapa

### Problema anterior
A rota entre origem e destino era desenhada em verde (`#10b981`), o que não correspondia ao design do app conforme a imagem fornecida (linha rosa/magenta).

### Solução implementada

**`src/components/lego/MapView.tsx`**
- A polyline de `originToDestinationRoute` agora usa cor **rosa/magenta (`#ec4899`)**, conforme a imagem do app
- Stroke weight aumentado para `6` para melhor visibilidade
- O `drawDirections` (Directions API auto-draw) também usa a mesma cor rosa/magenta
- A legenda do mapa indica "Rota: Origem → Destino" com o ponto rosa

---

## 4. Resumo dos Ficheiros Alterados

| Ficheiro | Alteração Principal |
|----------|-------------------|
| `src/hooks/use-geolocation.ts` | Parâmetro `active` no hook + métodos `startTracking()`/`stopTracking()` |
| `src/components/lego/DriverMapView.tsx` | GPS controlado por estado online; UI do botão melhorada |
| `src/components/lego/MapView.tsx` | Ícones de carro coloridos; rota rosa/magenta; tipo `NearbyDriver` |
| `src/components/lego/PassengerMapView.tsx` | Contador de carros; badge de trajeto |
| `src/hooks/use-ride-notifications.ts` | Filtro `isOnline` para silenciar motoristas offline |
| `src/routes/painel-motorista.tsx` | Passa `isOnline` ao hook de notificações |

---

## 5. Build e Verificação

- `npx tsc --noEmit` → **0 erros**
- `npm run build` → **build bem-sucedido** em 8.60s
- Commit pushed para `origin/main`
