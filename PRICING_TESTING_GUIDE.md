# Guia de Testes - Sistema de Precificação

## Cenários de Teste para Passageiro

### Teste 1: Cálculo de Preço Básico
**Objetivo**: Verificar se o preço é calculado corretamente com base em distância e tempo

**Passos**:
1. Abrir a app e ir a "Pedir"
2. Selecionar um destino a ~5 km de distância
3. Observar o cálculo da rota
4. Verificar se o preço é exibido em tempo real

**Resultado Esperado**:
- Preço aparece após ~2-3 segundos de cálculo da rota
- Indicador "A calcular…" é exibido durante o cálculo
- Preço é atualizado quando muda de categoria

### Teste 2: Breakdown de Preço Detalhado
**Objetivo**: Verificar se o breakdown de preço é exibido corretamente

**Passos**:
1. Selecionar um destino
2. Ir para o passo "Oferta"
3. Observar o resumo de preço

**Resultado Esperado**:
- Bandeirada é exibida
- Custo por distância é calculado corretamente
- Custo por tempo é calculado corretamente
- Total é a soma de todos os componentes

### Teste 3: Preço Mínimo (Bandeirada)
**Objetivo**: Verificar se o preço mínimo é respeitado

**Passos**:
1. Selecionar um destino muito próximo (<500m)
2. Observar o preço

**Resultado Esperado**:
- Preço não é inferior à bandeirada da categoria
- Preço mínimo é exibido mesmo para distâncias curtas

### Teste 4: Mudança de Categoria
**Objetivo**: Verificar se o preço é atualizado ao mudar de categoria

**Passos**:
1. Selecionar um destino
2. Ir para "Oferta"
3. Clicar em diferentes categorias (Normal, XL, Moto, Delivery)
4. Observar o preço em cada categoria

**Resultado Esperado**:
- Preço muda para cada categoria
- Preço respeita a bandeirada de cada categoria
- Preço é sempre maior ou igual à bandeirada

### Teste 5: Método de Pagamento
**Objetivo**: Verificar se o preço é exibido corretamente em cada método de pagamento

**Passos**:
1. Ir para o passo "Pagamento"
2. Clicar em cada método de pagamento
3. Observar o preço

**Resultado Esperado**:
- Preço é o mesmo em todos os métodos
- Preço é exibido com clareza

## Cenários de Teste para Motorista

### Teste 6: Exibição de Preço no Painel
**Objetivo**: Verificar se o preço é exibido com destaque no painel do motorista

**Passos**:
1. Fazer login como motorista
2. Ir para "Painel do Motorista"
3. Observar a lista de corridas pendentes

**Resultado Esperado**:
- Preço é exibido em grande (3xl)
- Preço tem fundo verde para destaque
- Preço é acompanhado por "Ganho Estimado"
- Botão "Aceitar" é próximo ao preço

### Teste 7: Informações de Distância e Tempo
**Objetivo**: Verificar se a distância e tempo são exibidos para o motorista

**Passos**:
1. Observar uma corrida pendente no painel
2. Verificar as informações exibidas

**Resultado Esperado**:
- Distância é exibida em km
- Tempo é exibido em minutos
- Ambos têm fundo azul claro para destaque

### Teste 8: Endereços Claros
**Objetivo**: Verificar se os endereços de recolha e destino são claros

**Passos**:
1. Observar uma corrida pendente
2. Ler os endereços

**Resultado Esperado**:
- "Recolha" é claramente identificado
- "Destino" é claramente identificado
- Endereços são legíveis e completos

## Testes de Cálculo Matemático

### Teste 9: Validação de Fórmula
**Objetivo**: Verificar se a fórmula de cálculo está correta

**Cenário**: Corrida Normal de 10 km com duração de 20 minutos

**Cálculo Esperado**:
```
Preço = base + (perKm × km) + (perMin × min)
Preço = 500 + (150 × 10) + (20 × 20)
Preço = 500 + 1500 + 400
Preço = 2400 Kz
```

**Passos**:
1. Criar uma corrida com estes parâmetros
2. Verificar se o preço é 2400 Kz

**Resultado Esperado**:
- Preço é exatamente 2400 Kz

### Teste 10: Validação de Categorias
**Objetivo**: Verificar se cada categoria tem o preço correto

**Cenário**: Corrida de 5 km com duração de 10 minutos

**Cálculos Esperados**:
- Moto: 300 + (150 × 5) + (20 × 10) = 1150 Kz
- Normal: 500 + (150 × 5) + (20 × 10) = 1350 Kz
- XL: 1000 + (150 × 5) + (20 × 10) = 1850 Kz
- Premium: 1500 + (150 × 5) + (20 × 10) = 2350 Kz
- Shared: 250 + (150 × 5) + (20 × 10) = 1100 Kz
- Delivery: 400 + (150 × 5) + (20 × 10) = 1200 Kz

**Passos**:
1. Para cada categoria, criar uma corrida com estes parâmetros
2. Verificar se o preço corresponde ao esperado

**Resultado Esperado**:
- Todos os preços correspondem aos cálculos esperados

## Testes de Performance

### Teste 11: Tempo de Resposta
**Objetivo**: Verificar se o cálculo de preço é rápido

**Passos**:
1. Selecionar um destino
2. Medir o tempo até o preço aparecer
3. Repetir 5 vezes

**Resultado Esperado**:
- Tempo de resposta é consistente (<3 segundos)
- Sem lag ou travamentos

### Teste 12: Atualização em Tempo Real
**Objetivo**: Verificar se o preço é atualizado suavemente

**Passos**:
1. Mudar de categoria várias vezes
2. Observar a atualização do preço

**Resultado Esperado**:
- Preço é atualizado instantaneamente
- Sem lag ou atraso

## Testes de Compatibilidade

### Teste 13: Diferentes Dispositivos
**Objetivo**: Verificar se a exibição de preço funciona em todos os dispositivos

**Passos**:
1. Testar em smartphone (iOS e Android)
2. Testar em tablet
3. Testar em desktop

**Resultado Esperado**:
- Preço é exibido corretamente em todos os dispositivos
- Layout é responsivo

### Teste 14: Diferentes Resoluções
**Objetivo**: Verificar se a exibição de preço é legível em diferentes resoluções

**Passos**:
1. Testar em resolução baixa (320px)
2. Testar em resolução média (768px)
3. Testar em resolução alta (1920px)

**Resultado Esperado**:
- Preço é legível em todas as resoluções
- Sem truncamento ou sobreposição

## Checklist de Validação

- [ ] Preço é calculado corretamente para cada categoria
- [ ] Preço mínimo (bandeirada) é respeitado
- [ ] Breakdown de preço é exibido corretamente
- [ ] Preço é atualizado em tempo real
- [ ] Indicador de carregamento é exibido
- [ ] Preço é destacado no painel do motorista
- [ ] Distância e tempo são exibidos corretamente
- [ ] Endereços são claros e legíveis
- [ ] Funcionamento em todos os dispositivos
- [ ] Sem erros no console
- [ ] Sem lag ou travamentos
- [ ] Cashback é calculado corretamente (10% do preço)

## Relatório de Testes

Após executar todos os testes, preencher o seguinte relatório:

| Teste | Status | Notas |
|-------|--------|-------|
| 1 - Cálculo Básico | ✓/✗ | |
| 2 - Breakdown | ✓/✗ | |
| 3 - Preço Mínimo | ✓/✗ | |
| 4 - Mudança Categoria | ✓/✗ | |
| 5 - Método Pagamento | ✓/✗ | |
| 6 - Exibição Motorista | ✓/✗ | |
| 7 - Distância/Tempo | ✓/✗ | |
| 8 - Endereços | ✓/✗ | |
| 9 - Fórmula Validação | ✓/✗ | |
| 10 - Categorias | ✓/✗ | |
| 11 - Performance | ✓/✗ | |
| 12 - Atualização Real | ✓/✗ | |
| 13 - Compatibilidade | ✓/✗ | |
| 14 - Resoluções | ✓/✗ | |
