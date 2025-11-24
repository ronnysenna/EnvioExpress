# 🚀 EnvioExpress - Micro SaaS de Envio de Mensagens em Massa

> **Status**: 🔄 Em transformação para micro SaaS  
> **Versão**: 1.0.0  
> **Licença**: MIT

Uma plataforma completa para envio de mensagens em massa via WhatsApp, desenvolvida em Next.js com foco em escalabilidade e automação.

## ✨ Funcionalidades Atuais

### 🔐 **Sistema de Autenticação**
- Login/registro seguro com JWT
- Middleware de proteção de rotas
- Hash de senhas com bcrypt

### 📞 **Gerenciamento de Contatos**
- CRUD completo de contatos
- Organização em grupos personalizados
- Import massivo via CSV/Excel
- Sistema de seleção inteligente

### 📷 **Upload de Imagens**
- Upload local ou AWS S3
- Compressão automática
- Galeria integrada

### 📨 **Envio de Mensagens**
- Integração com N8N via webhook
- Envio em massa personalizado
- Suporte a imagens e texto

### 📊 **Dashboard**
- Métricas básicas de uso
- Relatórios de envios
- Interface responsiva

## 🛠️ Stack Tecnológica

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

## 🚀 Quick Start

### **Pré-requisitos**
- Node.js 18+
- PostgreSQL
- N8N (para envios)

### **Instalação**

```bash
# Clone o repositório
git clone https://github.com/ronnysenna/EnvioExpress.git
cd EnvioExpress

# Instale as dependências
npm install

# Configure o ambiente
cp .env.example .env
# Edite as variáveis necessárias

# Execute as migrações do banco
npx prisma migrate dev

# Inicie o servidor de desenvolvimento
npm run dev
```

### **Configuração do Ambiente**

```bash
# Database
DATABASE_URL="postgres://user:pass@localhost:5432/envioexpress"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# N8N Webhook
WEBHOOK_URL="https://your-n8n-instance.com/webhook/express"

# URLs
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Uploads (opcional S3)
S3_BUCKET=""
S3_REGION=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
```

## 📋 Roadmap - Transformação em Micro SaaS

> **📄 Consulte o [ROADMAP_SAAS.md](./ROADMAP_SAAS.md) para detalhes completos**

### **🏗️ FASE 1: Fundação SaaS** (Semanas 1-2)
- [ ] **Multi-tenancy** - Isolamento de dados por cliente
- [ ] **Sistema de assinaturas** - Integração com Stripe
- [ ] **Planos e limitações** - Freemium + Premium
- [ ] **Interface de cobrança** - Portal do cliente

### **💎 FASE 2: Funcionalidades Premium** (Semanas 3-4)
- [ ] **Analytics avançado** - ROI, conversões, tracking
- [ ] **Automações** - Campanhas programadas, follow-ups
- [ ] **API pública** - Endpoints RESTful documentados
- [ ] **Integrações** - Zapier, HubSpot, Google Sheets

### **📈 FASE 3: Growth & Otimização** (Semanas 5-6)
- [ ] **Landing page** - Conversão otimizada
- [ ] **Onboarding** - Tutorial interativo
- [ ] **SEO & Conteúdo** - Blog, casos de uso
- [ ] **Sistema de referral** - Afiliados e comissões

## 💰 Planos de Preços (Futuros)

| Plano | Preço | Contatos | Envios/mês | Usuários |
|-------|-------|----------|------------|----------|
| **Gratuito** | R$ 0 | 100 | 50 | 1 |
| **Starter** | R$ 29 | 1.000 | 1.000 | 3 |
| **Professional** | R$ 79 | 10.000 | 10.000 | 10 |
| **Enterprise** | R$ 199 | ∞ | 50.000 | ∞ |

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   Next.js       │◄──►│   API Routes    │◄──►│   PostgreSQL    │
│   TypeScript    │    │   Prisma ORM    │    │   + Prisma      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Integrações   │    │   Autenticação  │    │   Files/Upload  │
│   N8N Webhook   │    │   JWT + bcrypt  │    │   Local/S3      │
│   Stripe API    │    │   Middleware    │    │   Images        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor de produção

# Qualidade de código
npm run lint         # Verificar code style (Biome)
npm run format       # Formatar código (Biome)

# Database
npx prisma studio    # Interface visual do banco
npx prisma generate  # Gerar cliente Prisma
npx prisma migrate   # Executar migrações
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🎯 Próximos Passos

1. **Começar Fase 1** - Implementação de multi-tenancy
2. **Setup Stripe** - Configurar webhooks e produtos
3. **Testes** - Cobertura de testes automatizados
4. **CI/CD** - Pipeline de deploy automático

---

**🚀 Transformando uma ideia em um micro SaaS de sucesso!**

Para mais informações sobre o roadmap detalhado, consulte [ROADMAP_SAAS.md](./ROADMAP_SAAS.md).
