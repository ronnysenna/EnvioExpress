# Sistema de Trial de 7 Dias - EnvioExpress

Este documento descreve o sistema completo de trial de 7 dias implementado no EnvioExpress.

## 📋 Visão Geral

O sistema de trial permite que novos usuários tenham acesso completo aos recursos premium por 7 dias após o registro, sem precisar inserir informações de pagamento.

## 🚀 Funcionalidades Implementadas

### ✅ Registro e Ativação Automática
- **Auto-criação de tenant**: Cada usuário registrado recebe automaticamente uma empresa
- **Trial automático**: 7 dias de acesso premium iniciado no registro
- **Página de boas-vindas**: Onboarding personalizado para novos usuários

### ✅ Gerenciamento de Trial
- **Verificação de acesso**: Sistema que verifica se usuário pode acessar recursos premium
- **Alertas visuais**: Componentes que mostram status do trial no dashboard
- **Expiração automática**: Trials expirados são movidos para plano Free automaticamente

### ✅ Interface Administrativa
- **Dashboard admin**: Página para gerenciar todos os trials (`/admin/trials`)
- **Estatísticas**: Visão geral de trials ativos, expirando e expirados
- **Ações manuais**: Possibilidade de iniciar trial manualmente para tenants

### ✅ Sistema de Notificações
- **Alertas automáticos**: Notificações quando trial está expirando
- **Emails de lembrete**: Sistema para enviar emails (configurável)
- **Diferentes estados**: Notificações para 3 dias, 1 dia e expiração

### ✅ Verificação Automatizada
- **Script de cron**: Verificação automática de trials expirados
- **API endpoints**: Rotas para verificação manual e automática
- **Logs detalhados**: Sistema de log para monitoramento

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
```
/lib/trial.ts                              # Biblioteca principal de trial
/lib/trialNotifications.ts                 # Sistema de notificações
/components/TrialAlert.tsx                 # Componente de alerta de trial
/components/TrialExpiredBlocker.tsx        # Bloqueador para recursos expirados
/hooks/useTrialStatus.ts                   # Hook para verificação de trial
/app/welcome/page.tsx                      # Página de onboarding
/app/admin/trials/page.tsx                 # Interface administrativa
/scripts/check-trials.js                   # Script para cron job
/app/api/subscription/start-trial/route.ts
/app/api/subscription/check-expired-trials/route.ts
/app/api/subscription/details/route.ts
/app/api/subscription/check-limits/route.ts
/app/api/admin/trial-status/route.ts
/app/api/admin/start-trial/[tenantId]/route.ts
/app/api/trials/notifications/route.ts
/app/api/cron/check-trials/route.ts
```

### Arquivos Modificados
```
/prisma/schema.prisma                      # Campos de trial adicionados
/app/api/auth/register/route.ts            # Integração com trial
/app/register/page.tsx                     # Campos adicionais
/app/dashboard/page.tsx                    # Integração com alertas
/lib/planLimits.ts                         # Verificação baseada em trial
/app/api/subscription/status/route.ts     # Dados de trial incluídos
/app/api/analytics/summary/route.ts       # Correção BigInt serialization
/middleware.ts                             # Headers para verificação
```

## 🔧 APIs Disponíveis

### Trial Management
- `POST /api/subscription/start-trial` - Iniciar trial para tenant atual
- `POST /api/subscription/check-expired-trials` - Verificar trials expirados
- `GET /api/subscription/details` - Detalhes completos da assinatura
- `POST /api/subscription/check-limits` - Verificar limites do plano

### Administração
- `GET /api/admin/trial-status` - Status de todos os trials
- `POST /api/admin/start-trial/[tenantId]` - Iniciar trial para tenant específico
- `POST /api/trials/notifications` - Processar notificações de trial

### Automação
- `GET|POST /api/cron/check-trials` - Verificação automática (cron job)

## 🏗️ Estrutura do Banco de Dados

### Novos Campos no Subscription
```sql
model Subscription {
  -- Campos existentes...
  
  -- Campos de trial
  trialStartsAt DateTime? 
  trialEndsAt   DateTime?
  isTrialUsed   Boolean   @default(false)
  
  -- Novo status
  status        SubscriptionStatus @default(FREE) 
}

enum SubscriptionStatus {
  FREE
  TRIAL    -- Novo status
  ACTIVE
  INACTIVE
  CANCELLED
}
```

## ⚙️ Configuração e Uso

### 1. Executar Migração
```bash
npx prisma db push
```

### 2. Testar o Sistema
```bash
# Servidor em desenvolvimento
npm run dev

# Acessar páginas:
# - Registro: http://localhost:3000/register
# - Welcome: http://localhost:3000/welcome  
# - Admin: http://localhost:3000/admin/trials
```

### 3. Verificação Automática (Cron Job)
```bash
# Executar manualmente
node scripts/check-trials.js

# Configurar cron job (executar diariamente às 9:00)
# Adicionar ao crontab:
0 9 * * * cd /caminho/para/projeto && node scripts/check-trials.js >> /var/log/trial-check.log 2>&1
```

### 4. Configuração de Email (Opcional)
Para ativar o envio de emails, modifique `/lib/trialNotifications.ts`:

```typescript
// Exemplo com nodemailer
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Na função sendTrialNotification:
await transporter.sendMail({
    to: data.email,
    subject: getEmailSubject(data.daysRemaining),
    html: getEmailTemplate(data)
});
```

## 🧪 Fluxo de Teste

### 1. Registro de Novo Usuário
1. Acesse `/register`
2. Preencha dados (email, username, password, nome, empresa)
3. Clique "Criar Conta"
4. Verifique redirecionamento para `/welcome`
5. Complete onboarding
6. Vá para dashboard e veja alerta de trial

### 2. Verificação de Trial
1. Acesse `/dashboard` - deve mostrar "Trial ativo (7 dias)"
2. Teste funcionalidades premium (contatos, grupos, etc.)
3. Acesse `/admin/trials` para ver status administrativo

### 3. Simulação de Expiração
```sql
-- No banco de dados, modifique um trial para expirar
UPDATE "Subscription" 
SET "trialEndsAt" = NOW() - INTERVAL '1 day'
WHERE "tenantId" = 'SEU_TENANT_ID';
```

Depois execute:
```bash
node scripts/check-trials.js
```

## 📊 Monitoramento

### Logs do Sistema
- Trial iniciado: Console log com tenant ID
- Trial expirado: Log automático na verificação
- Notificações: Log de emails enviados (simulados)

### Métricas Administrativas
- Trials ativos
- Expirando hoje  
- Trials expirados
- Assinantes pagos

### APIs de Status
- `GET /api/admin/trial-status` - Visão geral completa
- `GET /api/cron/check-trials` - Status da verificação automática

## 🔐 Segurança e Limitações

### Verificação de Acesso
- Middleware verifica rotas protegidas
- Função `canAccessPremiumFeatures()` em todas as operações críticas
- Bloqueio automático quando trial expira

### Prevenção de Abuso
- `isTrialUsed` impede múltiplos trials para mesmo tenant
- Verificação de email/username únicos no registro
- Logs de todas as ações de trial

### Limitações Implementadas
- Envio de mensagens bloqueado após expiração
- Criação de contatos limitada
- Upload de imagens bloqueado
- Acesso à API restrito
- Interface mostra bloqueadores visuais

## 🚀 Próximos Passos Possíveis

1. **Integração de Pagamento**: Conectar com Stripe/PayPal para upgrade automático
2. **Email Service**: Configurar SendGrid/Nodemailer para emails reais
3. **Métricas Avançadas**: Analytics de conversão trial → pagante
4. **A/B Testing**: Testar diferentes durações de trial
5. **Extender Trial**: Permitir extensão de trial em casos específicos
6. **Notificações Push**: Alerts em tempo real no browser
7. **Relatórios**: Dashboard com métricas de negócio do trial

## 🐛 Troubleshooting

### Trial não inicia no registro
- Verificar se `startTrial()` está sendo chamado na API de registro
- Confirmar se tabela Subscription tem os novos campos

### Alertas não aparecem
- Verificar se `TrialAlert` está no dashboard
- Confirmar se API `/subscription/status` retorna dados de trial

### Script de cron não funciona
- Verificar se script tem permissões de execução: `chmod +x scripts/check-trials.js`
- Testar manualmente: `node scripts/check-trials.js`
- Verificar logs do cron: `tail -f /var/log/trial-check.log`

### BigInt serialization error
- Verificado e corrigido em `/app/api/analytics/summary/route.ts`
- Converter BigInt para string antes de retornar JSON

---

**Desenvolvido para EnvioExpress** - Sistema completo de trial gratuito de 7 dias 🚀
