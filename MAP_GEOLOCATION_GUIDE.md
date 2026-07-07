# Guia Completo - Sistema de Mapas e Geolocalização LegoTaxi

## 📍 Visão Geral

O LegoTaxi implementa um sistema completo de mapas e geolocalização em tempo real usando:

- **Leaflet**: Biblioteca de mapas interativa
- **OpenStreetMap**: Dados de mapas gratuitos
- **Geolocation API**: Acesso à localização do navegador (navigator)
- **Reverse Geocoding**: Conversão de coordenadas em endereços

---

## 🎯 Funcionalidades Principais

### 1. **Geolocalização com Navigator**

O sistema utiliza a API de Geolocalização do navegador (`navigator.geolocation`) para obter a localização do utilizador.

#### Características:
- ✅ Localização de alta precisão (< 5 metros)
- ✅ Rastreamento em tempo real
- ✅ Detecção de velocidade e direção
- ✅ Cálculo de distância percorrida
- ✅ Retry automático em caso de falha
- ✅ Tratamento de erros com mensagens claras

#### Permissões Necessárias:
O navegador solicitará permissão ao utilizador para aceder à localização. Isto é essencial para:
- Passageiros: Selecionar ponto de recolha e destino
- Motoristas: Rastreamento em tempo real

### 2. **Componentes de Mapa**

#### MapView
Componente base de mapa com suporte para:
- Múltiplos marcadores (recolha, destino, motorista)
- Rotas personalizadas
- Círculos de precisão
- Controles interativos
- Carregamento dinâmico do Leaflet

#### PassengerMapView
Mapa especializado para passageiros com:
- Seleção de ponto de recolha
- Seleção de destino
- Reverse geocoding automático
- Rastreamento de localização
- Cálculo de distância percorrida

#### DriverMapView
Mapa especializado para motoristas com:
- Status online/offline
- Sincronização com backend
- Estatísticas de sessão (tempo, distância, velocidade)
- Rastreamento contínuo
- Indicadores de precisão

### 3. **Hooks de Geolocalização**

#### useGeolocation()
Obtém a localização actual do utilizador uma única vez.

```typescript
const { coordinates, loading, error, requestLocation } = useGeolocation({
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
});
```

**Retorna:**
- `coordinates`: Coordenadas actuais (lat, lng, accuracy, altitude, speed, heading, timestamp)
- `loading`: Estado de carregamento
- `error`: Mensagem de erro (se houver)
- `requestLocation()`: Função para solicitar localização manualmente

#### useGeolocationWatch()
Rastreia a localização em tempo real com atualizações contínuas.

```typescript
const { 
  coordinates, 
  loading, 
  error, 
  isTracking, 
  distanceTraveled, 
  stopTracking 
} = useGeolocationWatch({
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
});
```

**Retorna:**
- `coordinates`: Coordenadas actualizadas continuamente
- `isTracking`: Se o rastreamento está activo
- `distanceTraveled`: Distância total percorrida (em km)
- `stopTracking()`: Função para parar o rastreamento

#### useGeolocationWithRetry()
Obtém a localização com retry automático em caso de falha.

```typescript
const { 
  coordinates, 
  loading, 
  error, 
  requestLocation, 
  retryCount 
} = useGeolocationWithRetry(options, maxRetries);
```

#### useHighAccuracyGeolocation()
Otimizado para aplicações que requerem alta precisão.

```typescript
const { 
  coordinates, 
  loading, 
  error, 
  accuracy 
} = useHighAccuracyGeolocation();
```

---

## 🗺️ Usando os Componentes de Mapa

### PassengerMapView - Exemplo

```typescript
import { PassengerMapView } from "@/components/lego/PassengerMapView";

export function PassengerApp() {
  const handlePickupSelect = (location, address) => {
    console.log("Recolha:", address, location);
  };

  const handleDestinationSelect = (location, address) => {
    console.log("Destino:", address, location);
  };

  return (
    <div className="h-screen w-full">
      <PassengerMapView
        onPickupLocationSelect={handlePickupSelect}
        onDestinationLocationSelect={handleDestinationSelect}
        pickupLocation={[-8.8383, 13.2344]}
        destinationLocation={[-8.8241, 13.2381]}
      />
    </div>
  );
}
```

### DriverMapView - Exemplo

```typescript
import { DriverMapView } from "@/components/lego/DriverMapView";

export function DriverApp() {
  const handleLocationUpdate = (location, accuracy, speed) => {
    console.log("Localização actualizada:", location, accuracy, speed);
  };

  const handleOnlineStatusChange = (isOnline) => {
    console.log("Status online:", isOnline);
  };

  return (
    <div className="h-screen w-full">
      <DriverMapView
        onLocationUpdate={handleLocationUpdate}
        onOnlineStatusChange={handleOnlineStatusChange}
        initialOnlineStatus={false}
      />
    </div>
  );
}
```

---

## 🔍 Reverse Geocoding

O sistema converte automaticamente coordenadas em endereços legíveis usando o Nominatim (OpenStreetMap).

### Como Funciona:
1. Utilizador clica no mapa para selecionar localização
2. Sistema obtém coordenadas (lat, lng)
3. Faz requisição HTTP para Nominatim
4. Recebe endereço formatado
5. Apresenta ao utilizador

### Exemplo:

```typescript
const getAddressFromCoordinates = async (lat: number, lng: number) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
  );
  const data = await response.json();
  return data.address?.road || data.address?.city || `${lat}, ${lng}`;
};
```

---

## 📊 Dados de Localização

### Estrutura de Coordenadas

```typescript
interface GeolocationCoordinates {
  latitude: number;        // Latitude em graus decimais
  longitude: number;       // Longitude em graus decimais
  accuracy: number;        // Precisão em metros
  altitude: number | null; // Altitude em metros
  altitudeAccuracy: number | null; // Precisão de altitude
  heading: number | null;  // Direção em graus (0-360)
  speed: number | null;    // Velocidade em m/s
  timestamp: number;       // Timestamp em ms
}
```

### Exemplo de Dados:

```json
{
  "latitude": -8.8383,
  "longitude": 13.2344,
  "accuracy": 12.5,
  "altitude": 45.2,
  "altitudeAccuracy": 3.1,
  "heading": 45,
  "speed": 5.2,
  "timestamp": 1718100000000
}
```

---

## ⚙️ Configuração de Opções

### PositionOptions

```typescript
interface PositionOptions {
  enableHighAccuracy: boolean;  // Usar alta precisão (mais lento, mais preciso)
  timeout: number;              // Tempo máximo em ms
  maximumAge: number;           // Usar cache se mais recente que X ms
}
```

### Recomendações:

**Para Passageiros (Seleção de Localização):**
```typescript
{
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
}
```

**Para Motoristas (Rastreamento):**
```typescript
{
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,  // Sem cache para dados sempre actualizados
}
```

**Para Aplicações Leves:**
```typescript
{
  enableHighAccuracy: false,
  timeout: 5000,
  maximumAge: 5000,  // Usar cache de 5 segundos
}
```

---

## 🔐 Permissões e Privacidade

### Solicitação de Permissão

O navegador solicita permissão automaticamente quando:
1. `useGeolocation()` é chamado
2. `useGeolocationWatch()` é chamado
3. Utilizador clica em botão que requer localização

### Estados de Permissão:

| Estado | Descrição |
|--------|-----------|
| **Granted** | Utilizador permitiu acesso |
| **Denied** | Utilizador negou acesso |
| **Prompt** | Primeira vez (mostra diálogo) |

### Mensagens de Erro:

| Erro | Causa | Solução |
|------|-------|---------|
| **PERMISSION_DENIED** | Utilizador negou permissão | Pedir para ativar nas definições |
| **POSITION_UNAVAILABLE** | Localização indisponível | Tentar novamente mais tarde |
| **TIMEOUT** | Tempo limite excedido | Aumentar timeout ou tentar novamente |

---

## 🚀 Funcionalidades Avançadas

### 1. **Cálculo de Distância (Haversine Formula)**

O sistema calcula automaticamente a distância percorrida entre pontos:

```typescript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distância em km
};
```

### 2. **Conversão de Velocidade**

De m/s para km/h:
```typescript
const speedKmh = speedMs * 3.6;
```

### 3. **Níveis de Precisão**

| Precisão | Nível | Caso de Uso |
|----------|-------|-----------|
| < 5m | Muito Alta | Navegação precisa |
| 5-10m | Alta | Localização de motorista |
| 10-50m | Média | Localização geral |
| 50-100m | Baixa | Localização aproximada |
| > 100m | Muito Baixa | Apenas referência |

---

## 📱 Responsividade e Performance

### Mobile-First Design

- ✅ Mapas otimizados para toque
- ✅ Controles adaptados para dispositivos pequenos
- ✅ Carregamento eficiente de tiles
- ✅ Minimização de requisições de localização

### Performance

- ✅ Debouncing de atualizações (1 segundo)
- ✅ Lazy loading de Leaflet
- ✅ Cache de endereços
- ✅ Otimização de requisições HTTP

---

## 🐛 Troubleshooting

### "Permissão de localização negada"

**Solução:**
1. Abra as definições do navegador
2. Procure por "Localização" ou "Permissões"
3. Ative a localização para o site
4. Recarregue a página

### "Localização indisponível"

**Possíveis causas:**
- GPS desligado no dispositivo
- Sem sinal de GPS/WiFi
- Localização desabilitada no navegador

**Solução:**
- Ativar GPS no dispositivo
- Tentar em local aberto
- Aguardar alguns segundos

### "Tempo limite excedido"

**Solução:**
- Aumentar o `timeout` nas opções
- Tentar novamente
- Verificar conexão com a internet

### Mapa não carrega

**Solução:**
1. Verificar conexão com internet
2. Verificar se OpenStreetMap está acessível
3. Recarregar a página
4. Limpar cache do navegador

---

## 📚 Referências

- [MDN - Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Leaflet Documentation](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Nominatim API](https://nominatim.org/release-docs/latest/api/Overview/)

---

## 🔄 Próximas Melhorias

- [ ] Suporte para múltiplas rotas
- [ ] Integração com Google Maps (opcional)
- [ ] Cálculo de tempo de percurso
- [ ] Alertas de zona de perigo
- [ ] Histórico de localizações
- [ ] Exportação de dados de rastreamento
- [ ] Modo offline com cache de mapas
- [ ] Integração com serviços de navegação

---

**Versão**: 1.0  
**Data**: Junho 2026  
**Status**: ✅ Completo e Funcional
