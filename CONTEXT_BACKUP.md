# Backup de Contexto - Projeto TaxiLego

## Credenciais e Acessos
- **Repositório**: `https://github.com/legotaxi/taxilego.git`
- **Token Atual**: `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`
- **Username Git**: `legotaxi`

## Estrutura de Precificação Identificada
- **Fórmula**: `base + (150 * km) + (20 * min)`
- **Categorias**: moto (300), normal (500), xl (1000), premium (1500), shared (250), delivery (400).
- **Cashback**: 10% fixo.

## Lacunas Críticas Identificadas
1. **Onboarding**: DriverStatusGuard é um beco sem saída para motoristas pendentes.
2. **Realtime**: Falta suavização no mapa (interpolation).
3. **Negociação**: Falta "Turbo Boost" para corridas não aceites.
4. **Gamificação**: Cashback é passivo, sem níveis de fidelidade.
5. **Admin**: Promoções e Gestão Financeira são maioritariamente mockups ou observacionais.

## Ficheiros Chave Analisados
- `src/lib/rides.functions.ts`: Lógica de cálculo.
- `src/routes/pedir.tsx`: Fluxo do passageiro.
- `src/routes/painel-motorista.tsx`: Fluxo do motorista.
- `src/routes/carteira.tsx`: Lógica financeira.
- `src/components/lego/AppShell.tsx`: Navegação global.
