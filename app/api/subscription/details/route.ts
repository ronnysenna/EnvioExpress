import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/serverAuth";
import { getTrialInfo } from "@/lib/trial";
import prisma from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function GET() {
  try {
    const { tenant } = await requireAuth();

    // Buscar informações completas da assinatura
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: tenant.id },
      include: {
        plan: true,
      },
    });

    // Buscar informações do trial
    const trialInfo = await getTrialInfo(tenant.id);

    // Preparar response com informações detalhadas
    const response = {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        createdAt: tenant.createdAt,
      },
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            createdAt: subscription.createdAt,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            plan: {
              name: subscription.plan.name,
              price: subscription.plan.price,
              currency: subscription.plan.currency,
              interval: subscription.plan.interval,
              features: subscription.plan.features,
              limits: subscription.plan.limits,
            },
          }
        : null,
      trial: {
        ...trialInfo,
        // Adicionar informações formatadas
        trialStartedAt: subscription?.trialStartsAt,
        trialEndDate: trialInfo.trialEndsAt
          ? new Date(trialInfo.trialEndsAt)
          : null,
        timeRemaining: trialInfo.trialEndsAt
          ? formatDistanceToNow(new Date(trialInfo.trialEndsAt), {
              addSuffix: true,
              locale: ptBR,
            })
          : null,
      },
      recommendations: generateRecommendations(trialInfo, subscription),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Erro ao buscar detalhes da assinatura:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

interface TrialInfo {
  isOnTrial: boolean;
  trialDaysRemaining: number;
  trialEndsAt: string | null;
  hasTrialExpired: boolean;
  canAccessFeatures: boolean;
}

interface SubscriptionData {
  id: string;
  status: string;
  plan: {
    name: string;
  };
}

interface Recommendation {
  type: "info" | "warning" | "urgent" | "critical";
  title: string;
  message: string;
  action: string;
  actionText: string;
  actionUrl: string;
}

function generateRecommendations(
  trialInfo: TrialInfo,
  subscription: SubscriptionData | null
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (trialInfo.isOnTrial) {
    if (trialInfo.trialDaysRemaining <= 2) {
      recommendations.push({
        type: "urgent",
        title: "Trial Expirando",
        message:
          "Seu trial está prestes a expirar. Considere atualizar seu plano para continuar usando todos os recursos.",
        action: "upgrade",
        actionText: "Atualizar Plano",
        actionUrl: "/plans",
      });
    } else if (trialInfo.trialDaysRemaining <= 5) {
      recommendations.push({
        type: "warning",
        title: "Trial Chegando ao Fim",
        message:
          "Aproveite os dias restantes do seu trial para explorar todos os recursos premium.",
        action: "explore",
        actionText: "Explorar Recursos",
        actionUrl: "/analytics",
      });
    } else {
      recommendations.push({
        type: "info",
        title: "Aproveite seu Trial",
        message:
          "Você tem acesso completo a todos os recursos premium. Explore e descubra tudo que o EnvioExpress pode oferecer.",
        action: "explore",
        actionText: "Ver Analytics",
        actionUrl: "/analytics",
      });
    }
  }

  if (
    trialInfo.hasTrialExpired &&
    (!subscription || subscription.plan.name === "Free")
  ) {
    recommendations.push({
      type: "critical",
      title: "Trial Expirado",
      message:
        "Seu período de avaliação terminou. Atualize para um plano pago para continuar usando os recursos premium.",
      action: "upgrade",
      actionText: "Ver Planos",
      actionUrl: "/plans",
    });
  }

  return recommendations;
}
