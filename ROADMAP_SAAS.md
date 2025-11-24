# 🚀 Acesso

   Login credentials:
   Email: <admin@demo.com>
   Password: admin123

# 🚀 Roadmap de Transformação: EnvioExpress → Micro SaaS

> **Projeto**: Transformação da aplicação EnvioExpress em um micro SaaS de envio de mensagens em massa
>
> **Data de Início**: 17 de novembro de 2025
> **Duração Estimada**: 6 semanas (42 dias)

---

## 📋 **Resumo Executivo**

O EnvioExpress será transformado de uma aplicação single-tenant para um micro SaaS completo com sistema de assinaturas, multi-tenancy e funcionalidades premium. O objetivo é criar uma solução escalável e rentável para empresas que precisam de envio de mensagens em massa.

### **Proposta de Valor**

- 🎯 **Envio de mensagens em massa** com alta entregabilidade
- 📊 **Analytics detalhado** de campanhas e engajamento
- 🤖 **Automações inteligentes** para follow-ups
- 🔗 **Integrações** com principais CRMs e ferramentas
- 👥 **Colaboração em equipe** com roles diferenciados

---

## 📊 **Análise da Situação Atual**

### **Stack Tecnológica Existente**

```typescript
// Frontend & Backend
Next.js 16 (App Router) + TypeScript
Tailwind CSS + Lucide Icons

// Database & ORM
PostgreSQL + Prisma
Migrações versionadas

// Autenticação & Segurança
JWT + bcrypt
Middleware de proteção

// Integração Externa
N8N Webhook para envios
AWS S3 (opcional) para uploads

// Ferramentas de Desenvolvimento
Biome (linting/formatting)
```

### **Funcionalidades Atuais**

✅ Sistema de autenticação (login/registro)  
✅ Gerenciamento de contatos e grupos  
✅ Upload e gerenciamento de imagens  
✅ Envio de mensagens via webhook (N8N)  
✅ Dashboard com métricas básicas  
✅ Import de contatos (CSV/Excel)  
✅ Sistema de seleção de contatos  

### **Limitações Identificadas**

❌ Single-tenant (um usuário por instância)  
❌ Sem sistema de cobrança  
❌ Analytics limitado  
❌ Sem automações  
❌ Sem API pública  
❌ Sem integrações externas  
❌ Interface não otimizada para conversão  

---

## 🗓️ **Cronograma Detalhado**

## **FASE 1: Fundação SaaS**

*Semanas 1-2 | 17 Nov - 01 Dez 2025*

### **Semana 1: Multi-tenancy (18-24 Nov)**

#### **Dia 1 (18/11) - Reestruturação do Schema**

- [ ] **Backup completo** do banco de dados atual
- [ ] **Criar modelo `Tenant`** no Prisma schema
- [ ] **Adicionar `tenantId`** em todos os modelos existentes
- [ ] **Criar migração** para reestruturação

```prisma
// Novos modelos a serem adicionados
model Tenant {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  domain      String?  @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Configurações
  settings    Json?
  
  // Relacionamentos
  users       User[]
  contacts    Contact[]
  groups      Group[]
  images      Image[]
  
  @@map("tenants")
}

model Invitation {
  id        String   @id @default(cuid())
  email     String
  role      String   @default("user")
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  @@unique([email, tenantId])
  @@map("invitations")
}
```

#### **Dia 2 (19/11) - Migração de Dados**

- [ ] **Criar tenant padrão** para dados existentes
- [ ] **Migrar usuários existentes** para o tenant padrão
- [ ] **Atualizar todas as relações** com tenantId
- [ ] **Testar integridade** dos dados migrados

#### **Dias 3-4 (20-21/11) - Autenticação Multi-tenant**

- [ ] **Atualizar middleware** de autenticação
- [ ] **Implementar seleção de tenant** no login
- [ ] **Sistema de convites** para novos membros
- [ ] **Roles avançados** (owner, admin, user, viewer)

```typescript
// Novos tipos de roles
export enum TenantRole {
  OWNER = 'owner',     // Pode tudo, incluindo billing
  ADMIN = 'admin',     // Pode tudo exceto billing
  USER = 'user',       // Pode usar funcionalidades básicas
  VIEWER = 'viewer'    // Apenas visualizar dados
}
```

#### **Dias 5-7 (22-24/11) - Refatoração de APIs**

- [ ] **Middleware de tenant isolation** em todas as rotas
- [ ] **Atualizar todas as queries** com tenantId
- [ ] **Validação de acesso** por tenant
- [ ] **Testes de isolamento** entre tenants

### **Semana 2: Sistema de Planos e Cobrança (25 Nov - 01 Dez)**

#### **Dias 1-2 (25-26/11) - Integração com Stripe**

- [ ] **Configurar conta Stripe** (webhook endpoints)
- [ ] **Modelos de `Plan` e `Subscription`**
- [ ] **Webhook handlers** para eventos do Stripe
- [ ] **Páginas de checkout** com Stripe Elements

```prisma
model Plan {
  id                String   @id @default(cuid())
  name              String
  description       String?
  price             Int      // Preço em centavos
  currency          String   @default("BRL")
  interval          String   // monthly, yearly
  features          Json     // Lista de features
  limits            Json     // Limites do plano
  stripePriceId     String?  @unique
  active            Boolean  @default(true)
  createdAt         DateTime @default(now())
  
  subscriptions     Subscription[]
  
  @@map("plans")
}

model Subscription {
  id                String   @id @default(cuid())
  tenantId          String
  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  planId            String
  plan              Plan     @relation(fields: [planId], references: [id])
  stripeCustomerId  String?
  stripeSubscriptionId String? @unique
  status            String   // active, canceled, past_due, etc
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([tenantId])
  @@map("subscriptions")
}
```

#### **Dias 3-4 (27-28/11) - Limitações por Plano**

- [ ] **Middleware de verificação** de limites
- [ ] **Contadores de uso** (contatos, envios mensais)
- [ ] **Bloqueios por limite** excedido
- [ ] **Sistema de notificações** de limite

#### **Dias 5-7 (29 Nov - 01 Dez) - Interface de Cobrança**

- [ ] **Página de planos e preços** otimizada para conversão
- [ ] **Portal do cliente** integrado com Stripe
- [ ] **Notificações de pagamento** (email + in-app)
- [ ] **Gerenciamento de assinatura** no dashboard

---

## **FASE 2: Funcionalidades Premium**

*Semanas 3-4 | 02-15 Dez 2025*

### **Semana 3: Analytics Avançado (02-08 Dez)**

#### **Dias 1-2 (02-03/12) - Tracking de Envios**

- [ ] **Modelo de `Campaign` e `MessageLog`**
- [ ] **Tracking de status** de entrega
- [ ] **Webhooks de status** do N8N
- [ ] **Sistema de callbacks** para tracking

```prisma
model Campaign {
  id            String   @id @default(cuid())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  name          String
  message       String
  imageUrl      String?
  status        String   // draft, sending, completed, failed
  scheduledFor  DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  messageLogs   MessageLog[]
  
  @@map("campaigns")
}

model MessageLog {
  id          String   @id @default(cuid())
  campaignId  String
  campaign    Campaign @relation(fields: [campaignId], references: [id])
  contactId   String
  contact     Contact  @relation(fields: [contactId], references: [id])
  status      String   // sent, delivered, failed, read
  sentAt      DateTime?
  deliveredAt DateTime?
  readAt      DateTime?
  failureReason String?
  
  @@map("message_logs")
}
```

#### **Dias 3-4 (04-05/12) - Dashboard Executivo**

- [ ] **Métricas de ROI** e conversão
- [ ] **Gráficos de performance** (Chart.js ou Recharts)
- [ ] **Comparativos por período**
- [ ] **Exportação de relatórios** (PDF/CSV)

#### **Dias 5-7 (06-08/12) - Automações**

- [ ] **Sistema de automações** baseado em triggers
- [ ] **Campanhas programadas**
- [ ] **Sequências de follow-up**
- [ ] **Triggers baseados** em comportamento

### **Semana 4: Integrações e API (09-15 Dez)**

#### **Dias 1-3 (09-11/12) - API Pública**

- [ ] **Endpoints RESTful** documentados (OpenAPI/Swagger)
- [ ] **Sistema de API keys** por tenant
- [ ] **Rate limiting** por plano
- [ ] **Documentação interativa**

```typescript
// Estrutura da API pública
/api/v1/contacts       // GET, POST, PUT, DELETE
/api/v1/groups         // GET, POST, PUT, DELETE
/api/v1/campaigns      // GET, POST, PUT, DELETE
/api/v1/messages/send  // POST
/api/v1/analytics      // GET
/api/v1/webhooks       // POST (configurar webhooks)
```

#### **Dias 4-5 (12-13/12) - Integrações Populares**

- [ ] **Zapier/Make.com** triggers e actions
- [ ] **Google Sheets** import/export
- [ ] **HubSpot** sincronização de contatos
- [ ] **Pipedrive** integração básica

#### **Dias 6-7 (14-15/12) - Webhooks Outbound**

- [ ] **Sistema de webhooks** configuráveis
- [ ] **Notificações de status** para sistemas externos
- [ ] **Retry logic** com backoff exponencial
- [ ] **Logs de webhook** para debugging

---

## **FASE 3: Otimização e Growth**

*Semanas 5-6 | 16-29 Dez 2025*

### **Semana 5: Marketing Website (16-22 Dez)**

#### **Dias 1-2 (16-17/12) - Landing Page de Conversão**

- [ ] **Hero section** com proposta de valor clara
- [ ] **Demonstrações** do produto (screenshots/videos)
- [ ] **Depoimentos** e social proof
- [ ] **CTA otimizados** para conversão

#### **Dias 3-4 (18-19/12) - Onboarding Guiado**

- [ ] **Tutorial interativo** para novos usuários
- [ ] **Quick wins** nas primeiras sessões
- [ ] **Checklist de setup** inicial
- [ ] **Tooltips e hints** contextuais

#### **Dias 5-7 (20-22/12) - SEO e Conteúdo**

- [ ] **Blog** sobre marketing digital e WhatsApp
- [ ] **Páginas de casos de uso** específicos
- [ ] **Otimização técnica** de SEO
- [ ] **Schema markup** para rich snippets

### **Semana 6: Growth Features (23-29 Dez)**

#### **Dias 1-2 (23-24/12) - Sistema de Referral**

- [ ] **Códigos de desconto** para indicações
- [ ] **Comissões** para indicadores
- [ ] **Dashboard de afiliados**
- [ ] **Tracking de conversões** por referral

#### **Dias 3-4 (25-26/12) - Estratégia Freemium**

- [ ] **Plano gratuito** com limitações claras
- [ ] **Trial periods** para planos pagos
- [ ] **Upgrade prompts** estratégicos
- [ ] **Feature gating** inteligente

#### **Dias 5-7 (27-29/12) - Analytics de Produto**

- [ ] **Google Analytics 4** implementação completa
- [ ] **Hotjar** para análise de comportamento
- [ ] **Framework de A/B testing**
- [ ] **Métricas de produto** (DAU, MAU, churn, LTV)

---

## 💰 **Estrutura de Planos e Preços**

### **🆓 Gratuito (Forever Free)**

```yaml
Preço: R$ 0/mês
Contatos: 100
Envios/mês: 50
Usuários: 1
Grupos: 3
Imagens: 10
Analytics: Básico
Suporte: Email (72h)
```

### **🚀 Starter (R$ 29/mês)**

```yaml
Preço: R$ 29/mês (R$ 290/ano - 17% desc)
Contatos: 1.000
Envios/mês: 1.000
Usuários: 3
Grupos: Ilimitados
Imagens: 100
Analytics: Avançado
Automações: 3 ativas
API: Básica (1000 req/dia)
Suporte: Email (24h)
```

### **💼 Professional (R$ 79/mês)**

```yaml
Preço: R$ 79/mês (R$ 790/ano - 17% desc)
Contatos: 10.000
Envios/mês: 10.000
Usuários: 10
Grupos: Ilimitados
Imagens: Ilimitadas
Analytics: Completo + Relatórios
Automações: Ilimitadas
API: Completa (10k req/dia)
Integrações: Todas
Suporte: Chat + Email (4h)
```

### **🏢 Enterprise (R$ 199/mês)**

```yaml
Preço: R$ 199/mês (R$ 1990/ano - 17% desc)
Contatos: Ilimitados
Envios/mês: 50.000
Usuários: Ilimitados
Grupos: Ilimitados
Imagens: Ilimitadas
Analytics: Completo + Custom
Automações: Avançadas
API: Premium (100k req/dia)
Integrações: Todas + Custom
White-label: Disponível
Suporte: Telefone + Dedicado (1h)
```

---

## 🛠️ **Especificações Técnicas**

### **Arquitetura de Multi-tenancy**

```typescript
// Estratégia: Row-level security com tenantId
interface TenantIsolation {
  strategy: 'row_level_security';
  field: 'tenantId';
  enforcement: 'middleware' | 'database';
  fallback: 'block_request';
}
```

### **Sistema de Limitações**

```typescript
interface PlanLimits {
  contacts: number;
  monthlyMessages: number;
  users: number;
  groups: number | 'unlimited';
  images: number | 'unlimited';
  apiRequests: number;
  automations: number | 'unlimited';
  features: string[];
}
```

### **Métricas de Negócio**

```typescript
interface BusinessMetrics {
  // Crescimento
  monthlyRecurringRevenue: number;
  customerAcquisitionCost: number;
  lifetimeValue: number;
  
  // Engajamento
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  churnRate: number;
  
  // Produto
  messagesPerUser: number;
  conversionRate: number;
  featureAdoption: Record<string, number>;
}
```

---

## 📈 **Métricas de Sucesso**

### **Mês 1-3 (Validação)**

- [ ] **10 clientes pagantes** nos primeiros 30 dias
- [ ] **R$ 1.000 MRR** até final do mês 2
- [ ] **Churn < 10%** nos primeiros 90 dias
- [ ] **NPS > 50** entre early adopters

### **Mês 4-6 (Crescimento)**

- [ ] **50 clientes ativos**
- [ ] **R$ 5.000 MRR**
- [ ] **CAC < R$ 100**
- [ ] **LTV:CAC > 3:1**

### **Mês 7-12 (Escala)**

- [ ] **200 clientes ativos**
- [ ] **R$ 20.000 MRR**
- [ ] **Churn < 5%**
- [ ] **Expansão para 3+ verticais**

---

## 🚨 **Riscos e Mitigações**

### **Riscos Técnicos**

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Performance com multi-tenancy | Média | Alto | Indexação adequada + caching |
| Isolamento de dados | Baixa | Crítico | Testes automatizados extensivos |
| Downtime durante migração | Média | Médio | Blue-green deployment |

### **Riscos de Negócio**

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Competição com WhatsApp Business | Alta | Alto | Foco em automação e analytics |
| Regulamentações LGPD | Média | Alto | Compliance desde o design |
| Dependência do N8N | Média | Médio | Implementar backup providers |

---

## 📚 **Recursos Adicionais**

### **Documentação Técnica**

- [ ] **API Reference** (OpenAPI 3.0)
- [ ] **Webhook Guide** para integrações
- [ ] **Migration Guide** para clientes existentes
- [ ] **Best Practices** para campanhas

### **Materiais de Marketing**

- [ ] **Case Studies** de clientes beta
- [ ] **Comparison Charts** vs concorrentes
- [ ] **ROI Calculator** para prospects
- [ ] **Video Demos** das principais features

### **Suporte e Comunidade**

- [ ] **Knowledge Base** com FAQs
- [ ] **Community Forum** (Discord/Slack)
- [ ] **Webinars** mensais de onboarding
- [ ] **Email Sequences** de nurturing

---

## ✅ **Checklist de Lançamento**

### **Pré-lançamento**

- [ ] Testes de carga e performance
- [ ] Auditoria de segurança completa
- [ ] Backup e recovery testados
- [ ] Documentação completa
- [ ] Suporte estruturado

### **Lançamento Soft (Beta)**

- [ ] 10-20 clientes beta selecionados
- [ ] Feedback loops estruturados
- [ ] Métricas de performance monitoradas
- [ ] Ajustes baseados em feedback

### **Lançamento Público**

- [ ] Press release e comunicação
- [ ] Campanhas de marketing ativas
- [ ] Suporte escalado
- [ ] Métricas de negócio monitoradas

---

## 🎯 **Próximos Passos**

1. **Aprovação do roadmap** - Confirmar cronograma e prioridades
2. **Setup do ambiente** - Configurar Stripe e ferramentas de desenvolvimento
3. **Início da Fase 1** - Começar com reestruturação do banco de dados
4. **Team setup** - Definir responsabilidades e processo de desenvolvimento

---

*Documento criado em: 17 de novembro de 2025*  
*Última atualização: 17 de novembro de 2025*  
*Versão: 1.0*

---

**🚀 Pronto para transformar o EnvioExpress no próximo unicórnio do marketing digital brasileiro!**
