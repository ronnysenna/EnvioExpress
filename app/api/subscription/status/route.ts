import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/serverAuth";
import { getUsageStats } from "@/lib/planLimits";
import { getTrialInfo } from "@/lib/trial";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { tenant } = await requireAuth();

    // Buscar assinatura e plano
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: tenant.id },
      include: {
        plan: true,
        tenant: {
          include: {
            _count: {
              select: {
                users: true,
              },
            },
          },
        },
      },
    });

    // Buscar informações de trial
    const trialInfo = await getTrialInfo(tenant.id);

    if (!subscription) {
      // Se não há assinatura, retornar plano Free por padrão
      const freePlan = await prisma.plan.findFirst({
        where: { name: "Free" },
      });

      if (!freePlan) {
        return NextResponse.json(
          { error: "Plano Free não encontrado" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        id: null,
        status: "INACTIVE",
        currentPeriodStart: null,
        currentPeriodEnd: null,
        plan: {
          id: freePlan.id,
          name: freePlan.name,
          description: freePlan.description,
          price: freePlan.price,
          currency: freePlan.currency,
          interval: freePlan.interval,
          features: freePlan.features,
          limits: freePlan.limits,
        },
        trial: trialInfo,
        usage: {
          contacts: 0,
          monthlyMessages: 0,
          users: 1,
          groups: 0,
          images: 0,
          currentPeriod: new Date().toISOString().slice(0, 7),
        },
        usagePercentages: {
          contacts: 0,
          monthlyMessages: 0,
          users: 0,
          groups: 0,
          images: 0,
        },
        warnings: [],
        isNearingLimits: false,
      });
    }

    const limits = subscription.plan.limits as Record<string, any>;
    const usage = await getUsageStats(tenant.id);

    // Calcular porcentagens de uso
    const usagePercentages = {
      contacts:
        limits.contacts === "unlimited"
          ? 0
          : Math.round((usage.contacts / (limits.contacts as number)) * 100),
      monthlyMessages:
        limits.monthlyMessages === "unlimited"
          ? 0
          : Math.round(
              (usage.monthlyMessages / (limits.monthlyMessages as number)) * 100
            ),
      users:
        limits.users === "unlimited"
          ? 0
          : Math.round((usage.users / (limits.users as number)) * 100),
      groups:
        limits.groups === "unlimited"
          ? 0
          : Math.round((usage.groups / (limits.groups as number)) * 100),
      images:
        limits.images === "unlimited"
          ? 0
          : Math.round((usage.images / (limits.images as number)) * 100),
    };

    // Verificar se está próximo dos limites (80% ou mais)
    const warnings = [];
    if (usagePercentages.contacts >= 80) warnings.push("contacts");
    if (usagePercentages.monthlyMessages >= 80)
      warnings.push("monthlyMessages");
    if (usagePercentages.users >= 80) warnings.push("users");
    if (usagePercentages.groups >= 80) warnings.push("groups");
    if (usagePercentages.images >= 80) warnings.push("images");

    return NextResponse.json({
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        description: subscription.plan.description,
        price: subscription.plan.price,
        currency: subscription.plan.currency,
        interval: subscription.plan.interval,
        features: subscription.plan.features,
        limits,
      },
      trial: trialInfo,
      usage,
      usagePercentages,
      warnings,
      isNearingLimits: warnings.length > 0,
    });
  } catch (err) {
    console.error("Erro ao buscar status da assinatura:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
