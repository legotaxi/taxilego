# Legotaxii - Melhorias Realizadas

## Visão Geral

O Legotaxii é uma plataforma de mobilidade premium para Angola, permitindo passageiros pedir corridas e motoristas aceitarem pedidos em tempo real.

## Melhorias Implementadas

### 1. **Correção Crítica: Aceitação de Corridas por Motoristas** ✅

**Problema:** Os motoristas não conseguiam aceitar corridas porque a política RLS do Supabase não permitia atualizar a coluna `driver_id` quando ela era NULL.

**Solução:** Criada nova migração SQL (`20260526_fix_driver_ride_acceptance.sql`) que adiciona uma política RLS especial permitindo motoristas aceitarem corridas não atribuídas:

- Motoristas podem visualizar corridas com `status = 'requested'` e `driver_id = NULL`
- Motoristas podem atualizar essas corridas para `status = 'accepted'` e definir `driver_id`

### 2. **Refatoração do Painel do Motorista** 🎨

**Melhorias:**

- Separação clara entre "Corridas Disponíveis" e "Corridas Ativas"
- Botões contextuais baseados no estado da corrida:
  - **Aceitar** - para corridas solicitadas
  - **Iniciar Corrida** - para corridas aceites
  - **Concluir Corrida** - para corridas em curso
  - **Cancelar** - para corridas aceites
- Melhor visualização de status com cores e descrições
- Indicadores de distância e duração estimada
- Feedback visual melhorado com ícones e estados

### 3. **Novas Funções Backend para Motoristas** 🔧

**Adicionadas em `src/lib/driver.functions.ts`:**

- `getMyRides()` - Retorna corridas ativas do motorista (aceites, a chegar, em curso)
- Suporte para status `arriving` no `updateRideStatus()`
- Melhor tratamento de timestamps para cada estado

### 4. **Página "Minhas Corridas" Melhorada** 📱

**Novas funcionalidades:**

- Separação entre "Corridas Ativas" e "Histórico"
- Seção destacada para corridas em progresso
- Botão "Cancelar" para corridas solicitadas
- Botão "Chamar" para motoristas que já aceitaram
- Melhor visualização de status com cores consistentes
- Descrição do estado da corrida em linguagem natural
- Link rápido para pedir nova corrida

### 5. **Validações Melhoradas na Página de Login** ✔️

**Adicionadas:**

- Validação de campos vazios
- Validação de comprimento mínimo de palavra-passe (6 caracteres)
- Limpeza de formulário após sucesso
- Melhor tratamento de erros do Google OAuth
- Feedback claro ao utilizador

### 6. **Dependências Corrigidas** 📦

- Adicionado `@tanstack/query-core` para resolver erro de build
- Configuração correta de `pnpm` com aprovação de builds

## Arquitetura Técnica

### Stack Tecnológico

- **Frontend:** React 19 + TanStack Router + TanStack Query
- **Backend:** TanStack Start (SSR)
- **Base de Dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth + Lovable Cloud Auth
- **Styling:** Tailwind CSS + Radix UI

### Fluxo de Corrida

#### Para Passageiros:

1. Login/Signup
2. Pedir corrida (origem, destino, tipo, pagamento)
3. Acompanhar estado: `requested` → `accepted` → `arriving` → `in_progress` → `completed`
4. Avaliar motorista (em desenvolvimento)

#### Para Motoristas:

1. Login/Signup como motorista
2. Ver corridas disponíveis (`requested`)
3. Aceitar corrida → `accepted`
4. Iniciar corrida → `in_progress`
5. Concluir corrida → `completed`
6. Receber ganhos

## Como Executar

### Pré-requisitos

- Node.js 22+
- pnpm 11+
- Conta Supabase configurada

### Instalação

```bash
# Clonar repositório
git clone https://github.com/mfitnutri-ui/legotaxii.git
cd legotaxii

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais Supabase
```

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
pnpm run dev

# Abrir em http://localhost:8080
```

### Build para Produção

```bash
# Build
pnpm run build

# Preview
pnpm run preview
```

## Commits Realizados

1. `fix: add @tanstack/query-core to resolve build error`
2. `fix: allow drivers to accept unassigned rides via RLS policy`
3. `refactor: improve driver panel with better state management and UI/UX`
4. `feat: add getMyRides function and improve ride status handling`
5. `refactor: enhance my rides page with active rides section and better UX`
6. `refactor: improve login page with better validation and error handling`

## Próximas Melhorias Sugeridas

### Curto Prazo

- [ ] Implementar rastreamento em tempo real do motorista (WebSocket/Realtime)
- [ ] Adicionar sistema de avaliações (passageiro → motorista, motorista → passageiro)
- [ ] Notificações push quando motorista aceita corrida
- [ ] Integração com mapas (Google Maps/Mapbox)
- [ ] Suporte para múltiplos idiomas (pt-AO, pt-BR, en)

### Médio Prazo

- [ ] Painel administrativo completo (estatísticas, gestão de motoristas)
- [ ] Sistema de wallet com top-up
- [ ] Histórico de transações detalhado
- [ ] Suporte para múltiplos métodos de pagamento
- [ ] Programa de referência

### Longo Prazo

- [ ] App mobile nativa (React Native)
- [ ] Integração com serviços de entrega
- [ ] Sistema de preços dinâmicos
- [ ] Análise de dados e ML para otimização
- [ ] Expansão para outras cidades

## Notas Importantes

### Segurança

- Todas as operações usam autenticação Supabase
- RLS (Row Level Security) garante que utilizadores só veem seus dados
- Funções server-side protegem operações críticas

### Performance

- Queries otimizadas com índices no Supabase
- Polling de 8 segundos no painel do motorista (ajustável)
- React Query para cache e sincronização de dados

### Escalabilidade

- Arquitetura preparada para múltiplas cidades
- Suporte para diferentes categorias de serviço
- Sistema de roles (admin, driver, passenger) extensível

## Suporte

Para reportar bugs ou sugerir melhorias, abra uma issue no GitHub.

---

**Desenvolvido com ❤️ para Angola** 🇦🇴
