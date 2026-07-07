# Guia de Integração - Autenticação por Telefone

## Passo 1: Aplicar Migração SQL

Execute a migração SQL para adicionar suporte a autenticação por telefone:

```bash
# No Supabase Dashboard:
# 1. Vá para SQL Editor
# 2. Crie uma nova query
# 3. Cole o conteúdo de: supabase/migrations/20260612_add_phone_auth.sql
# 4. Execute
```

Ou via CLI:
```bash
supabase migration up
```

## Passo 2: Atualizar Configuração de Autenticação

No Supabase Dashboard:

1. **Auth → Providers**
   - Certifique-se de que "Email" está ativado
   - Configure as políticas de confirmação de email (desativar se necessário)

2. **Auth → Email Templates**
   - Personalizar templates se necessário

## Passo 3: Atualizar Página Inicial

Adicione link para `/phone-auth` na página inicial (`src/routes/index.tsx`):

```tsx
import { Link } from "@tanstack/react-router";

// Na seção de CTA:
<Link
  to="/phone-auth"
  className="inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-4 text-sm font-bold text-background transition hover:opacity-90"
>
  Começar Agora
</Link>
```

## Passo 4: Atualizar Painel de Admin

Se tiver um painel de admin (`src/routes/admin.tsx`), adicione a seção de aprovação de motoristas:

```tsx
import { AdminDriverApprovalPanel } from "@/components/lego/AdminDriverApprovalPanel";

export function AdminPage() {
  return (
    <div className="space-y-8">
      {/* Outras seções... */}
      
      <section>
        <h2 className="font-display text-2xl font-bold mb-6">Aprovação de Motoristas</h2>
        <AdminDriverApprovalPanel />
      </section>
    </div>
  );
}
```

## Passo 5: Proteger Rotas de Motorista

Atualize as rotas de motorista para usar `DriverStatusGuard`:

```tsx
import { DriverStatusGuard } from "@/components/lego/DriverStatusGuard";

export const Route = createFileRoute("/painel-motorista")({
  component: PainelMotoristaPage,
});

function PainelMotoristaPage() {
  return (
    <DriverStatusGuard requiredStatus="approved">
      {/* Conteúdo do painel */}
    </DriverStatusGuard>
  );
}
```

## Passo 6: Testar Fluxo Completo

### Teste 1: Registo de Passageiro
1. Aceda a `http://localhost:5173/phone-auth`
2. Selecione "Criar conta" → "Passageiro"
3. Preencha: Nome, Telefone (+244 923 456 789), Senha
4. Clique "Criar conta"
5. Verifique se é redirecionado para `/minhas-corridas`

### Teste 2: Registo de Motorista
1. Aceda a `http://localhost:5173/phone-auth`
2. Selecione "Criar conta" → "Motorista"
3. Preencha: Nome, Telefone, Senha
4. Clique "Criar conta"
5. Verifique se vê ecrã "Candidatura em Análise"

### Teste 3: Login
1. Aceda a `http://localhost:5173/phone-auth`
2. Selecione "Entrar"
3. Preencha: Telefone, Senha (do teste anterior)
4. Clique "Entrar"
5. Verifique se é redirecionado corretamente

### Teste 4: Aprovação de Motorista
1. Aceda a `http://localhost:5173/admin`
2. Vá para "Aprovação de Motoristas"
3. Clique em motorista pendente
4. Clique "Aprovar Candidatura"
5. Verifique se status muda para "approved"
6. Faça login com motorista
7. Verifique se agora tem acesso completo

## Passo 7: Variáveis de Ambiente

Certifique-se de que `.env` tem:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Passo 8: Dependências

Certifique-se de que tem instaladas:

```bash
npm install sonner @tanstack/react-router lucide-react
```

## Troubleshooting

### Erro: "Phone number already registered"
- Verifique se o número já existe na base de dados
- Use um número diferente para testes

### Erro: "Invalid phone format"
- O formato esperado é: +244 XXX XXX XXX
- Verifique se o país é correto (Angola = +244)

### Motorista não consegue fazer login
- Verifique se a conta foi criada corretamente
- Confirme que o email interno `{phone}@legotaxi.local` existe no Supabase Auth

### Admin não consegue aprovar motorista
- Verifique se tem role "admin"
- Confirme que tem permissões no Supabase RLS

## Próximas Melhorias

1. **Autenticação por SMS**
   - Integrar Twilio ou similar para OTP por SMS

2. **Recuperação de Senha**
   - Implementar fluxo de reset por telefone

3. **Notificações**
   - Email/SMS quando motorista é aprovado
   - Notificações in-app

4. **Validação de Telefone**
   - Integrar API de validação de números
   - Verificar se número é válido em Angola

5. **Documentação de Motorista**
   - Adicionar fluxo de upload de documentos após registo
   - Permitir reedição de documentos se rejeitado

## Suporte

Para dúvidas ou problemas:
- Consulte `PHONE_AUTH_IMPLEMENTATION.md`
- Verifique logs do Supabase
- Teste com dados de exemplo
