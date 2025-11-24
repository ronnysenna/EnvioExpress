import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createMissingPlans() {
  console.log("Criando planos faltantes...");

  // Verificar se o plano Professional já existe
  const professionalExists = await prisma.plan.findFirst({
    where: { name: "Professional" },
  });

  if (!professionalExists) {
    await prisma.plan.create({
      data: {
        name: "Professional",
        description: "Para equipes que precisam de recursos avançados",
        price: 7900, // R$ 79,00 em centavos
        currency: "BRL",
        interval: "MONTHLY",
        features: [
          "Até 10.000 contatos",
          "Até 10.000 envios por mês",
          "10 usuários",
          "Grupos ilimitados",
          "Imagens ilimitadas",
          "Analytics completo + Relatórios",
          "Automações ilimitadas",
          "API completa (10k req/dia)",
          "Todas as integrações",
          "Suporte chat + email (4h)",
        ],
        limits: {
          contacts: 10000,
          monthlyMessages: 10000,
          users: 10,
          groups: "unlimited",
          images: "unlimited",
          automations: "unlimited",
        },
        stripePriceId: null, // Será preenchido quando criar no Stripe
        active: true,
      },
    });
    console.log("Plano Professional criado");
  }

  // Verificar se o plano Enterprise já existe
  const enterpriseExists = await prisma.plan.findFirst({
    where: { name: "Enterprise" },
  });

  if (!enterpriseExists) {
    await prisma.plan.create({
      data: {
        name: "Enterprise",
        description: "Para grandes empresas com necessidades customizadas",
        price: 19900, // R$ 199,00 em centavos
        currency: "BRL",
        interval: "MONTHLY",
        features: [
          "Contatos ilimitados",
          "Até 50.000 envios por mês",
          "Usuários ilimitados",
          "Grupos ilimitados",
          "Imagens ilimitadas",
          "Analytics completo + customizado",
          "Automações avançadas",
          "API premium (100k req/dia)",
          "Todas as integrações + customizadas",
          "White-label disponível",
          "Suporte telefônico + dedicado (1h)",
        ],
        limits: {
          contacts: "unlimited",
          monthlyMessages: 50000,
          users: "unlimited",
          groups: "unlimited",
          images: "unlimited",
          automations: "unlimited",
        },
        stripePriceId: null, // Será preenchido quando criar no Stripe
        active: true,
      },
    });
    console.log("Plano Enterprise criado");
  }

  console.log("Planos criados com sucesso!");
}

createMissingPlans()
  .catch((error) => {
    console.error("Erro ao criar planos:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
