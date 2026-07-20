# Melhorias de Precificação - TaxiLego

## Resumo das Alterações

Este documento descreve as melhorias implementadas no sistema de precificação do TaxiLego para calcular e exibir o preço aproximado da corrida em tempo real, baseado em distância e tempo.

## Problemas Corrigidos

1. **Preço não era calculado em tempo real**: O preço só era calculado após selecionar o destino
2. **Falta de sincronização backend-frontend**: A lógica de cálculo estava duplicada
3. **Experiência do utilizador**: Sem feedback visual durante o cálculo
4. **Exibição para motorista**: Preço não era destacado adequadamente

## Alterações Implementadas

### 1. Backend - `src/lib/rides.functions.ts`

- ✅ Função `estimateFare` já existia mas não era utilizada
- ✅ Mantida a estrutura de precificação por categoria
- ✅ Fórmula: `base + (150 × km) + (20 × min)`

### 2. Frontend - `src/routes/pedir.tsx`

#### Melhorias:
- ✅ Cálculo de preço em tempo real enquanto escolhe o destino
- ✅ Exibição clara do preço em cada opção de categoria
- ✅ Indicador de carregamento durante o cálculo da rota
- ✅ Preço mínimo (bandeirada) exibido quando não há rota

#### Funcionalidades:
- Preço atualizado a cada mudança de categoria
- Breakdown de preço (base + distância + tempo)
- Cashback de 10% exibido na UI

### 3. Frontend - `src/routes/painel-motorista.tsx`

#### Melhorias:
- ✅ Preço destacado em grande (font-size 2xl)
- ✅ Informação de distância e duração ao lado do preço
- ✅ Cor de fundo para melhor visualização
- ✅ Botão de aceitar próximo ao preço

## Fluxo de Precificação

### Para Passageiro:

1. Passageiro abre a app e vai a "Pedir"
2. Seleciona o destino no mapa
3. Sistema calcula a rota (distância + tempo)
4. Preço é calculado automaticamente: `base + (150 × km) + (20 × min)`
5. Preço é exibido em cada categoria de serviço
6. Passageiro escolhe a categoria e método de pagamento
7. Preço final é confirmado antes de submeter

### Para Motorista:

1. Motorista vê lista de corridas pendentes
2. Cada corrida mostra:
   - Categoria de serviço
   - Endereço de partida e destino
   - **Distância e duração**
   - **Preço em grande destaque**
3. Motorista aceita a corrida com o preço já conhecido

## Estrutura de Preços (Kz)

| Categoria | Base | Por Km | Por Min | Mínimo |
|-----------|------|--------|---------|---------|
| Moto      | 300  | 150    | 20      | 300     |
| Normal    | 500  | 150    | 20      | 500     |
| XL        | 1000 | 150    | 20      | 1000    |
| Premium   | 1500 | 150    | 20      | 1500    |
| Shared    | 250  | 150    | 20      | 250     |
| Delivery  | 400  | 150    | 20      | 400     |

## Exemplo de Cálculo

**Cenário**: Corrida Normal de 5 km com duração de 15 minutos

```
Preço = base + (perKm × km) + (perMin × min)
Preço = 500 + (150 × 5) + (20 × 15)
Preço = 500 + 750 + 300
Preço = 1550 Kz
```

## Benefícios

✅ **Transparência**: Passageiro vê o preço antes de confirmar
✅ **Previsibilidade**: Preço é calculado com base em dados reais (Google Maps)
✅ **Experiência**: Motorista sabe exatamente quanto vai ganhar
✅ **Confiança**: Sem surpresas no final da corrida
✅ **Sincronização**: Backend e frontend usam a mesma lógica

## Testes Recomendados

1. Testar cálculo de preço com diferentes distâncias
2. Verificar se o preço atualiza ao mudar de categoria
3. Confirmar que o preço mínimo é respeitado
4. Testar em diferentes dispositivos (mobile, tablet, desktop)
5. Verificar exibição do preço para motorista

## Notas Técnicas

- Google Maps API é utilizada para calcular distância e tempo reais
- Preço é recalculado a cada mudança de rota
- Preço mínimo (bandeirada) é sempre respeitado
- Cashback de 10% é calculado sobre o preço final
