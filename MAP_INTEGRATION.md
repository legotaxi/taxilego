# Integração de Mapas Reais - LegoTaxi

## Visão Geral

O aplicativo LegoTaxi agora possui integração completa de mapas reais usando **Leaflet** e **OpenStreetMap**, substituindo o mapa estilizado anterior por mapas interativos em tempo real.

## Componentes Implementados

### 1. **MapView.tsx** (Componente Base)

O componente principal que renderiza o mapa com todas as funcionalidades básicas.

**Funcionalidades:**

- Renderização de mapa interativo usando Leaflet
- Marcadores customizados para:
  - **Ponto de Recolha** (azul)
  - **Destino** (vermelho)
  - **Localização do Motorista** (verde)
- Desenho de rotas (polyline com linha tracejada)
- Botão flutuante para centrar no local atual
- Suporte a cliques no mapa para seleção de localização

**Props:**

```typescript
interface MapViewProps {
  pickupLocation?: [number, number]; // Latitude, Longitude
  destinationLocation?: [number, number]; // Latitude, Longitude
  driverLocation?: [number, number]; // Latitude, Longitude
  route?: [number, number][]; // Array de coordenadas para a rota
  onLocationSelect?: (location: [number, number]) => void;
}
```

**Exemplo de Uso:**

```tsx
<MapView
  pickupLocation={[-8.8383, 13.2344]}
  destinationLocation={[-8.8241, 13.2381]}
  driverLocation={[-8.836, 13.235]}
  route={[
    [-8.8383, 13.2344],
    [-8.836, 13.235],
    [-8.8241, 13.2381],
  ]}
/>
```

### 2. **DriverMapView.tsx** (Mapa do Motorista)

Componente especializado para motoristas com rastreamento em tempo real.

**Funcionalidades:**

- Rastreamento contínuo da localização do motorista
- Exibição de precisão do GPS
- Indicador de velocidade
- Mensagens de erro de geolocalização
- Atualização automática a cada segundo

**Exemplo de Uso:**

```tsx
<DriverMapView
  pickupLocation={pickupCoords}
  destinationLocation={destinationCoords}
  route={routeCoordinates}
/>
```

### 3. **PassengerMapView.tsx** (Mapa do Passageiro)

Componente especializado para passageiros com seleção interativa de localização.

**Funcionalidades:**

- Modo de seleção de ponto de recolha
- Modo de seleção de destino
- Geocodificação reversa (conversão de coordenadas em endereços)
- Exibição de endereços selecionados
- Indicadores visuais de modo de seleção
- Callbacks para quando localização é selecionada

**Exemplo de Uso:**

```tsx
<PassengerMapView
  onPickupLocationSelect={(location, address) => {
    console.log("Recolha:", location, address);
  }}
  onDestinationLocationSelect={(location, address) => {
    console.log("Destino:", location, address);
  }}
/>
```

### 4. **use-geolocation.ts** (Hook de Geolocalização)

Hook customizado para gerenciar a Geolocation API do navegador.

**Hooks Disponíveis:**

#### `useGeolocation(options?)`

Obtém a localização do utilizador uma única vez.

```typescript
const { coordinates, loading, error, requestLocation } = useGeolocation();

// coordinates: { latitude, longitude, accuracy, altitude, heading, speed }
// loading: boolean
// error: string | null
// requestLocation: () => void
```

#### `useGeolocationWatch(options?)`

Rastreia a localização em tempo real.

```typescript
const { coordinates, loading, error, stopTracking } = useGeolocationWatch();

// Atualiza automaticamente quando a localização muda
// stopTracking() para parar o rastreamento
```

**Opções:**

```typescript
{
  enableHighAccuracy: boolean; // Usar GPS de alta precisão (padrão: true)
  timeout: number; // Tempo limite em ms (padrão: 10000)
  maximumAge: number; // Máxima idade do cache em ms (padrão: 0)
}
```

## Dependências Instaladas

```json
{
  "leaflet": "^1.9.x",
  "react-leaflet": "^4.x",
  "@types/leaflet": "^1.9.x"
}
```

## Configuração do Mapa

### Tile Layer (Mapa Base)

O projeto usa **OpenStreetMap** como provedor de tiles:

```
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

Para usar outro provedor:

- **Mapbox**: Requer chave de API
- **Google Maps**: Requer chave de API
- **CartoDB**: Gratuito com atribuição

### Estilos CSS

O Leaflet requer CSS para funcionar corretamente:

```tsx
import "leaflet/dist/leaflet.css";
```

## Localização Padrão

A localização padrão é configurada para **Luanda, Angola**:

- Latitude: `-8.8383`
- Longitude: `13.2344`

Para alterar, modifique as props dos componentes.

## Recursos Avançados

### 1. Geocodificação Reversa

O `PassengerMapView` usa a API Nominatim (OpenStreetMap) para converter coordenadas em endereços:

```typescript
const address = await getAddressFromCoordinates(lat, lng);
// Retorna: "Rua Amílcar Cabral, Maianga, Luanda"
```

### 2. Rotas

Para desenhar rotas no mapa, passe um array de coordenadas:

```tsx
<MapView
  route={[
    [-8.8383, 13.2344],
    [-8.836, 13.235],
    [-8.8241, 13.2381],
  ]}
/>
```

### 3. Marcadores Customizados

Os marcadores usam `L.divIcon` para renderização customizada com HTML/CSS:

```typescript
const customIcon = L.divIcon({
  html: `<div>Conteúdo customizado</div>`,
  iconSize: [24, 32],
  iconAnchor: [12, 32],
  popupAnchor: [0, -32],
  className: "custom-marker",
});
```

## Permissões Necessárias

### No Navegador

O aplicativo requer permissão do utilizador para:

- Acessar localização (Geolocation API)
- Usar HTTPS em produção (requisito de segurança)

### No Manifest (PWA)

```json
{
  "permissions": ["geolocation"]
}
```

## Tratamento de Erros

### Erros de Geolocalização

- `PERMISSION_DENIED`: Utilizador negou acesso
- `POSITION_UNAVAILABLE`: Posição não disponível
- `TIMEOUT`: Tempo limite excedido

Todos os erros são capturados e exibidos ao utilizador.

## Performance

### Otimizações Implementadas

1. **Lazy Loading**: Mapa carrega apenas quando necessário
2. **Debouncing**: Atualizações de localização limitadas a 1 segundo
3. **Cleanup**: Listeners removidos ao desmontar componente
4. **Tile Caching**: OpenStreetMap cache automático

### Recomendações

- Use `maximumAge: 1000` para reduzir requisições GPS
- Limite atualizações de rota a mudanças significativas
- Use `enableHighAccuracy: false` em conexões lentas

## Testes

### Testar Geolocalização

1. Abrir DevTools (F12)
2. Ir para Sensors > Location
3. Selecionar localização customizada

### Testar Sem Permissão

1. DevTools > Privacy > Location > Block

## Próximas Melhorias

- [ ] Integração com Google Maps Directions API para rotas otimizadas
- [ ] Suporte a múltiplos marcadores de motoristas disponíveis
- [ ] Histórico de rotas
- [ ] Modo offline com cache de tiles
- [ ] Integração com Mapbox para estilos customizados
- [ ] Animações suaves de movimento do marcador
- [ ] Clustering de marcadores para muitos pontos

## Referências

- [Leaflet Documentation](https://leafletjs.com/)
- [React-Leaflet Documentation](https://react-leaflet.js.org/)
- [Geolocation API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Nominatim (OpenStreetMap) API](https://nominatim.org/)
- [OpenStreetMap](https://www.openstreetmap.org/)

## Troubleshooting

### Mapa não aparece

- Verificar se `leaflet.css` está importado
- Verificar console para erros de CORS
- Verificar se container tem altura definida

### Geolocalização não funciona

- Verificar permissões do navegador
- Verificar se está em HTTPS (em produção)
- Verificar console para mensagens de erro

### Marcadores não aparecem

- Verificar se coordenadas estão no formato `[lat, lng]`
- Verificar se ícones estão carregando corretamente
- Verificar z-index dos elementos

## Suporte

Para problemas ou sugestões, abra uma issue no repositório.
