import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/serverAuth";
import { getUsageStats, type PlanLimits } from "@/lib/planLimits";
import { getErrorMessage } from "@/lib/utils";
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

    if (!subscription) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    const limits = subscription.plan.limits as any;
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
      usage,
      usagePercentages,
      warnings,
      isNearingLimits: warnings.length > 0,
    });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
