# 💎 Garantia de Preço Certo TaxiLego

Implementei um sistema de "Price Lock" (Preço Blindado) para eliminar o problema comum de discrepância entre o valor estimado e o valor final cobrado.

---

## 🛡️ Como eliminamos o "Preço Surpresa"

Ao contrário de outros apps que recalculam o preço no final da viagem, o TaxiLego agora utiliza uma **Fonte Única de Verdade**:

### 1. Unificação de Lógica (SSoT)
*   Removi a lógica de cálculo duplicada no telemóvel (Frontend).
*   Agora, tanto o passageiro como o motorista utilizam a **mesma função oficial no servidor** (`computeFare`).
*   Isso garante que 10km em qualquer dispositivo resultem sempre no mesmo valor em Kwanzas, sem erros de arredondamento.

### 2. Sistema de Price Lock (Tarifa Fixada)
*   No momento em que o passageiro clica em "Pedir", o servidor calcula o preço final baseado na rota e **grava esse valor na base de dados**.
*   Esse valor é imutável durante a viagem. O motorista recebe o pedido já com o valor exato que o passageiro viu.
*   No ecrã final, o sistema valida se o valor a pagar é o mesmo que foi acordado no início.

### 3. Transparência Visual
*   Adicionei o selo **"Preço Garantido LegoTaxi"** nos recibos finais.
*   Atualizei as tabelas de preços para serem mais realistas em relação ao mercado de Luanda/Lubango, evitando que o preço seja demasiado baixo na estimativa e suba depois.

---

## 📊 Nova Tabela de Preços (Exemplos)

| Categoria | Bandeirada (Base) | Por Km | Por Minuto | Preço Mínimo |
| :--- | :--- | :--- | :--- | :--- |
| **Lego Baza** | 500 Kz | 180 Kz | 25 Kz | 600 Kz |
| **Lego Cool** | 1000 Kz | 250 Kz | 35 Kz | 1200 Kz |
| **Lego Moto** | 300 Kz | 150 Kz | 20 Kz | 400 Kz |

---

## ✅ O que o Utilizador Ganha
*   **Confiança**: O valor que aparece no pedido é exatamente o que sai da carteira ou é entregue em dinheiro.
*   **Sem Taxas Ocultas**: Não há surpresas de "taxa de trânsito" extra no final, pois o tempo estimado já é incluído no cálculo inicial blindado.
