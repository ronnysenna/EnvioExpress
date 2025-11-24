import { PrismaClient, TenantRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting multi-tenant seed...");

  // Criar planos
  const freePlan = await prisma.plan.upsert({
    where: { name: "Free" },
    update: {},
    create: {
      name: "Free",
      description: "Plano gratuito para testar a plataforma",
      price: 0,
      currency: "BRL",
      interval: "MONTHLY",
      features: JSON.stringify([
        "Até 100 contatos",
        "Até 50 envios por mês",
        "1 usuário",
        "Suporte básico",
      ]),
      limits: JSON.stringify({
        contacts: 100,
        monthlyMessages: 50,
        users: 1,
        groups: 3,
        images: 10,
      }),
      active: true,
    },
  });

  const starterPlan = await prisma.plan.upsert({
    where: { name: "Starter" },
    update: {},
    create: {
      name: "Starter",
      description: "Ideal para pequenas empresas",
      price: 2900, // R$ 29,00 em centavos
      currency: "BRL",
      interval: "MONTHLY",
      features: JSON.stringify([
        "Até 1.000 contatos",
        "Até 1.000 envios por mês",
        "3 usuários",
        "Analytics avançado",
        "3 automações ativas",
      ]),
      limits: JSON.stringify({
        contacts: 1000,
        monthlyMessages: 1000,
        users: 3,
        groups: "unlimited",
        images: 100,
        automations: 3,
      }),
      active: true,
    },
  });

  // Criar tenant de demonstração
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: "demo-empresa" },
    update: {},
    create: {
      name: "Empresa Demonstração",
      slug: "demo-empresa",
      domain: null,
      settings: JSON.stringify({
        theme: "light",
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
      }),
    },
  });

  // Criar usuário administrador
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      username: "admin",
      password: hashedPassword,
      name: "Administrador Demo",
    },
  });

  // Associar usuário ao tenant como OWNER
  await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: demoTenant.id,
        userId: adminUser.id,
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      userId: adminUser.id,
      role: TenantRole.OWNER,
    },
  });

  // Criar assinatura gratuita para o tenant
  await prisma.subscription.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      planId: freePlan.id,
      status: "ACTIVE",
    },
  });

  // Criar alguns contatos de exemplo
  const contacts = [
    {
      nome: "João Silva",
      telefone: "+5511999999999",
      email: "joao@exemplo.com",
    },
    {
      nome: "Maria Santos",
      telefone: "+5511888888888",
      email: "maria@exemplo.com",
    },
    {
      nome: "Pedro Oliveira",
      telefone: "+5511777777777",
      email: "pedro@exemplo.com",
    },
  ];

  for (const contactData of contacts) {
    await prisma.contact.upsert({
      where: {
        tenantId_telefone: {
          tenantId: demoTenant.id,
          telefone: contactData.telefone,
        },
      },
      update: {},
      create: {
        ...contactData,
        tenantId: demoTenant.id,
      },
    });
  }

  // Criar grupo de exemplo
  const clientesGroup = await prisma.group.upsert({
    where: {
      tenantId_nome: {
        tenantId: demoTenant.id,
        nome: "Clientes VIP",
      },
    },
    update: {},
    create: {
      nome: "Clientes VIP",
      descricao: "Nossos melhores clientes",
      tenantId: demoTenant.id,
    },
  });

  console.log("✅ Seed completed!");
  console.log(
    `📊 Created plans: Free (${freePlan.id}) and Starter (${starterPlan.id})`
  );
  console.log(`🏢 Created tenant: ${demoTenant.name} (${demoTenant.slug})`);
  console.log(`👤 Created admin user: ${adminUser.email}`);
  console.log(`📞 Created ${contacts.length} demo contacts`);
  console.log(`👥 Created group: ${clientesGroup.nome}`);
  console.log("");
  console.log("🔐 Login credentials:");
  console.log("   Email: admin@demo.com");
  console.log("   Password: admin123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
