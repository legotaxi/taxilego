# Autenticação por Telefone - Mudanças Finais

## Resumo
Sistema de autenticação **100% por telefone e senha**, sem qualquer referência a email ou confirmações para passageiros e motoristas.

---

## Mudanças Realizadas

### 1. **Página Inicial** (`src/routes/index.tsx`)
- ✅ Link "Pedir Boleia" agora aponta para `/phone-auth`
- ✅ Sem referências a email

### 2. **Página de Motoristas** (`src/routes/motoristas.tsx`)
- ✅ Link "Já sou motorista" agora aponta para `/phone-auth`
- ✅ Link "Quero ser motorista" redireciona para `/motoristas-registo` (que depois vai para `/phone-auth`)

### 3. **Página de Registo de Motorista** (`src/routes/motoristas-registo.tsx`)
- ✅ Redireciona automaticamente para `/phone-auth` após 2 segundos
- ✅ Mantém informações sobre benefícios e requisitos
- ✅ Botão de fallback caso redirecionamento não funcione

### 4. **Hook de Autenticação** (`src/hooks/use-phone-auth.ts`)
- ✅ `signUpWithPhone()`: Cria conta e faz login automático
  - Sem confirmação de email
  - Email interno gerado automaticamente (`{phone}@legotaxi.local`)
  - Motoristas recebem role "driver" imediatamente
  - Motoristas têm status "pending" até aprovação
  
- ✅ `signInWithPhone()`: Login apenas com telefone e senha
  - Sem confirmação de email
  - Sem OTP
  - Acesso imediato
  
- ✅ `signOut()`: Logout simples

### 5. **Página de Autenticação** (`src/routes/phone-auth.tsx`)
- ✅ Interface unificada para login e registo
- ✅ Seletor de tipo (Passageiro/Motorista)
- ✅ Formatação automática de telefone
- ✅ Ecrã de sucesso com redirecionamento automático
- ✅ Sem qualquer campo de email
- ✅ Sem confirmações de email

### 6. **Componentes de Proteção** (sem alterações)
- ✅ `DriverStatusGuard.tsx`: Protege rotas de motorista aprovados
- ✅ `AdminDriverApprovalPanel.tsx`: Painel de aprovação de motoristas

---

## Fluxo Completo

### Passageiro
```
1. Clica "Pedir Boleia" na página inicial
   ↓
2. Vai para /phone-auth
   ↓
3. Seleciona "Criar conta" → "Passageiro"
   ↓
4. Preenche: Nome, Telefone, Senha
   ↓
5. Clica "Criar conta"
   ↓
6. ✅ Conta criada + Login automático (SEM EMAIL)
   ↓
7. Redirecionado para /minhas-corridas
   ↓
8. Acesso imediato a todas as funcionalidades
```

### Motorista
```
1. Clica "Sou Motorista" na página inicial
   ↓
2. Vai para /motoristas
   ↓
3. Clica "Quero ser motorista"
   ↓
4. Vai para /motoristas-registo (redireciona para /phone-auth)
   ↓
5. Seleciona "Criar conta" → "Motorista"
   ↓
6. Preenche: Nome, Telefone, Senha
   ↓
7. Clica "Criar conta"
   ↓
8. ✅ Conta criada + Login automático (SEM EMAIL)
   ↓
9. Redirecionado para /painel-motorista
   ↓
10. Vê ecrã "Candidatura em Análise"
    ↓
11. Admin aprova na interface de admin
    ↓
12. Motorista tem acesso completo após aprovação
```

### Login
```
1. Clica "Pedir Boleia" ou "Já sou motorista"
   ↓
2. Vai para /phone-auth
   ↓
3. Seleciona "Entrar"
   ↓
4. Preenche: Telefone, Senha
   ↓
5. Clica "Entrar"
   ↓
6. ✅ Login realizado (SEM EMAIL)
   ↓
7. Redirecionado conforme role:
   - Admin → /admin
   - Motorista → /painel-motorista
   - Passageiro → /minhas-corridas
```

---

## Segurança

### Validações
- ✅ Telefone único por utilizador
- ✅ Senha mínimo 6 caracteres
- ✅ Validação de formato de telefone
- ✅ Verificação de telefone existente antes de registo
- ✅ RLS (Row Level Security) no Supabase

### Email Interno
- Email interno: `{phone}@legotaxi.local`
- Não é mostrado ao utilizador
- Usado apenas para compatibilidade com Supabase Auth
- Utilizador nunca precisa de confirmar email

### Sem Confirmações
- ✅ Sem email de confirmação
- ✅ Sem OTP por SMS
- ✅ Sem links de ativação
- ✅ Entrada imediata após registo

---

## Próximas Etapas

1. **Testar fluxo completo**
   - [ ] Registo de passageiro
   - [ ] Registo de motorista
   - [ ] Login com telefone
   - [ ] Redirecionamento correto
   - [ ] Aprovação de motorista

2. **Implementar no Supabase**
   - [ ] Aplicar migração SQL
   - [ ] Testar em produção

3. **Opcional - Melhorias Futuras**
   - [ ] Recuperação de senha por SMS
   - [ ] Notificações quando motorista é aprovado
   - [ ] Validação de telefone em tempo real
   - [ ] Limite de tentativas de login

---

## Ficheiros Modificados

```
src/routes/
  ├── index.tsx (link para /phone-auth)
  ├── motoristas.tsx (link para /phone-auth)
  ├── motoristas-registo.tsx (redireciona para /phone-auth)
  └── phone-auth.tsx (sem email, sem confirmações)

src/hooks/
  └── use-phone-auth.ts (atualizado com melhorias)

src/components/lego/
  ├── DriverStatusGuard.tsx (sem alterações)
  └── AdminDriverApprovalPanel.tsx (sem alterações)

supabase/migrations/
  └── 20260612_add_phone_auth.sql (sem alterações)
```

---

## Notas Importantes

1. **Email Interno**: O sistema gera automaticamente um email interno (`{phone}@legotaxi.local`) para compatibilidade com Supabase Auth. Isto é **transparente** para o utilizador.

2. **Sem Confirmação de Email**: O utilizador entra imediatamente após criar conta, sem precisar de confirmar email.

3. **Motoristas Automáticos**: Motoristas recebem acesso imediato após criar conta, mas com funcionalidades bloqueadas até aprovação do admin.

4. **Passageiros Imediatos**: Passageiros têm acesso completo imediatamente após criar conta.

5. **Login Simples**: Login é apenas com telefone e senha, sem email, sem OTP, sem confirmações.

---

## Suporte

Para dúvidas ou problemas:
- Consulte `PHONE_AUTH_IMPLEMENTATION.md`
- Consulte `INTEGRATION_GUIDE.md`
- Verifique logs do Supabase
- Teste com dados de exemplo
