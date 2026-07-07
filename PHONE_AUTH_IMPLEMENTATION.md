# Implementação de Autenticação por Telefone - Lego Taxi

## Resumo das Mudanças

Este documento descreve a implementação do novo sistema de autenticação simplificado por telefone para o app Lego Taxi.

### Objetivo
- ✅ Login/Registo apenas com número de telefone e senha (sem email)
- ✅ Entrada automática após registo (sem confirmação de email)
- ✅ Motoristas entram automaticamente após preenchimento dos dados
- ✅ Funcionalidades de motorista bloqueadas até aprovação do admin
- ✅ Passageiros têm acesso imediato após registo

---

## Arquivos Criados

### 1. **Migração SQL** (`supabase/migrations/20260612_add_phone_auth.sql`)
- Adiciona constraint único no campo `phone` da tabela `profiles`
- Cria funções SQL para validação de registo por telefone
- Cria índice para otimizar buscas por telefone

### 2. **Hook de Autenticação** (`src/hooks/use-phone-auth.ts`)
- `signUpWithPhone()`: Registo com telefone, senha e nome
  - Valida inputs
  - Cria utilizador no Supabase Auth
  - Atualiza perfil com telefone
  - Cria registo de motorista (se aplicável)
  - **Faz login automático** (sem confirmação de email)
  
- `signInWithPhone()`: Login com telefone e senha
  - Valida inputs
  - Verifica se telefone existe
  - Faz login com credenciais
  
- `signOut()`: Logout do utilizador

### 3. **Página de Autenticação** (`src/routes/phone-auth.tsx`)
- Nova rota `/phone-auth` com interface unificada
- Abas para alternar entre "Entrar" e "Criar conta"
- Seletor de tipo de utilizador (Passageiro/Motorista) no registo
- Formatação automática do número de telefone
- Ecrã de sucesso com redirecionamento automático
- Redirecionamento inteligente baseado no tipo de utilizador

### 4. **Componente de Proteção** (`src/components/lego/DriverStatusGuard.tsx`)
- Verifica o status de aprovação do motorista
- Mostra ecrã de "Candidatura em Análise" se pendente
- Mostra ecrã de "Candidatura Rejeitada" se rejeitada
- Mostra ecrã de "Conta Suspensa" se suspensa
- Permite acesso completo apenas se aprovado

---

## Fluxo de Autenticação

### Para Passageiros
```
1. Acede a /phone-auth
2. Seleciona "Criar conta" → "Passageiro"
3. Preenche: Nome, Telefone, Senha
4. Clica "Criar conta"
5. ✅ Registo + Login automático
6. Redirecionado para /minhas-corridas
7. Acesso imediato a todas as funcionalidades
```

### Para Motoristas
```
1. Acede a /phone-auth
2. Seleciona "Criar conta" → "Motorista"
3. Preenche: Nome, Telefone, Senha
4. Clica "Criar conta"
5. ✅ Registo + Login automático
6. Redirecionado para /painel-motorista
7. ⚠️ Vê ecrã "Candidatura em Análise"
8. Após aprovação do admin:
   - Status muda para "approved"
   - Acesso completo a todas as funcionalidades
```

### Para Login
```
1. Acede a /phone-auth
2. Seleciona "Entrar"
3. Preenche: Telefone, Senha
4. Clica "Entrar"
5. ✅ Login realizado
6. Redirecionado conforme role:
   - Admin → /admin
   - Motorista → /painel-motorista
   - Passageiro → /minhas-corridas
```

---

## Integração no App

### 1. Atualizar Rota de Login Existente
O arquivo `src/routes/login.tsx` pode ser mantido para compatibilidade com login por email (admin).
Adicionar link para `/phone-auth` como método principal de autenticação.

### 2. Proteger Rotas de Motorista
Envolver componentes de motorista com `<DriverStatusGuard requiredStatus="approved">`:

```tsx
import { DriverStatusGuard } from "@/components/lego/DriverStatusGuard";

export function PainelMotoristaPage() {
  return (
    <DriverStatusGuard requiredStatus="approved">
      {/* Conteúdo do painel de motorista */}
    </DriverStatusGuard>
  );
}
```

### 3. Atualizar Redirecionamento
A função `redirectByRole()` em `/phone-auth` já trata o redirecionamento automático.

---

## Fluxo de Aprovação de Motorista (Admin)

### No Painel Admin
1. Admin acede a `/admin`
2. Vê lista de motoristas com status "pending"
3. Revisa documentos (BI, Carta, Registo Criminal, Foto)
4. Clica "Aprovar" → Status muda para "approved"
5. Motorista recebe notificação (opcional)
6. Motorista agora tem acesso completo

### SQL para Aprovação
```sql
UPDATE public.drivers 
SET status = 'approved', approved_at = now() 
WHERE id = '<user_id>';
```

---

## Segurança

### Validações Implementadas
- ✅ Telefone único por utilizador
- ✅ Senha mínimo 6 caracteres
- ✅ Validação de formato de telefone
- ✅ Verificação de telefone existente antes de registo
- ✅ RLS (Row Level Security) no Supabase

### Considerações
- Email interno gerado como `{phone}@legotaxi.local` para compatibilidade com Supabase Auth
- Senha armazenada com hash pelo Supabase Auth
- Telefone único garante identificação única
- Status de motorista controlado por admin

---

## Próximas Etapas

1. **Testar fluxo completo**
   - Registo de passageiro
   - Registo de motorista
   - Login com telefone
   - Redirecionamento correto

2. **Implementar notificações**
   - Email/SMS quando motorista é aprovado
   - Notificações in-app

3. **Adicionar recuperação de senha**
   - Link de reset por telefone/email

4. **Atualizar UI**
   - Adicionar link para `/phone-auth` na página inicial
   - Remover ou manter login por email (admin)

5. **Testes de carga**
   - Validar performance com muitos utilizadores

---

## Troubleshooting

### Erro: "Este número de telefone já está registado"
- Utilizador já tem conta
- Sugerir login em vez de registo

### Erro: "Número de telefone não encontrado"
- Utilizador não tem conta
- Sugerir registo em vez de login

### Motorista não consegue aceder ao painel
- Verificar status em `drivers.status`
- Confirmar que admin aprovou a candidatura

### Login automático não funciona
- Verificar se email `{phone}@legotaxi.local` foi criado
- Verificar credenciais no Supabase Auth

---

## Referências

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Database](https://supabase.com/docs/guides/database)
- [React Router](https://tanstack.com/router/latest)
