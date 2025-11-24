import prisma from "./prisma";
import { addDays } from "date-fns";

export const TRIAL_DAYS = 7;

export interface TrialInfo {
  isOnTrial: boolean;
  trialDaysRemaining: number;
  trialEndsAt: Date | null;
  hasTrialExpired: boolean;
  canAccessFeatures: boolean;
}

/**
 * Inicia o trial para um tenant recém-criado
 */
export async function startTrial(tenantId: string) {
  const trialStartsAt = new Date();
  const trialEndsAt = addDays(trialStartsAt, TRIAL_DAYS);

  // Buscar ou criar uma assinatura com trial
  const freePlan = await prisma.plan.findFirst({
    where: { name: "Free" },
  });

  if (!freePlan) {
    throw new Error("Plano Free não encontrado");
  }

  // Atualizar ou criar assinatura com dados de trial
  const subscription = await prisma.subscription.upsert({
    where: { tenantId },
    update: {
      status: "TRIAL",
      trialStartsAt,
      trialEndsAt,
      isTrialUsed: true,
    },
    create: {
      tenantId,
      planId: freePlan.id,
      status: "TRIAL",
      trialStartsAt,
      trialEndsAt,
      isTrialUsed: true,
    },
  });

  return subscription;
}

/**
 * Obtém informações do trial para um tenant
 */
export async function getTrialInfo(tenantId: string): Promise<TrialInfo> {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });

  // Se não há assinatura, pode iniciar trial
  if (!subscription) {
    return {
      isOnTrial: false,
      trialDaysRemaining: TRIAL_DAYS,
      trialEndsAt: null,
      hasTrialExpired: false,
      canAccessFeatures: true, // Pode iniciar trial
    };
  }

  // Se está em trial
  if (subscription.status === "TRIAL" && subscription.trialEndsAt) {
    const now = new Date();
    const trialEndsAt = subscription.trialEndsAt;
    const hasExpired = now > trialEndsAt;
    const daysRemaining = hasExpired
      ? 0
      : Math.ceil(
          (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

    return {
      isOnTrial: true,
      trialDaysRemaining: daysRemaining,
      trialEndsAt,
      hasTrialExpired: hasExpired,
      canAccessFeatures: !hasExpired,
    };
  }

  // Se tem assinatura ativa
  if (subscription.status === "ACTIVE") {
    return {
      isOnTrial: false,
      trialDaysRemaining: 0,
      trialEndsAt: null,
      hasTrialExpired: false,
      canAccessFeatures: true,
    };
  }

  // Outros status (CANCELLED, PAST_DUE, etc.)
  return {
    isOnTrial: false,
    trialDaysRemaining: 0,
    trialEndsAt: null,
    hasTrialExpired: subscription.isTrialUsed,
    canAccessFeatures: false,
  };
}

/**
 * Marca o trial como expirado e move para Free plan
 */
export async function expireTrial(tenantId: string): Promise<void> {
  const freePlan = await prisma.plan.findFirst({
    where: { name: "Free" },
  });

  if (!freePlan) {
    throw new Error("Plano Free não encontrado");
  }

  await prisma.subscription.update({
    where: { tenantId },
    data: {
      status: "ACTIVE",
      planId: freePlan.id,
      currentPeriodStart: new Date(),
      currentPeriodEnd: null, // Free plan não tem período
    },
  });
}

/**
 * Verifica se o tenant pode acessar features premium
 */
export async function canAccessPremiumFeatures(
  tenantId: string
): Promise<boolean> {
  const trialInfo = await getTrialInfo(tenantId);

  // Pode acessar se está em trial ativo ou tem assinatura ativa
  return trialInfo.canAccessFeatures;
}

/**
 * Middleware para verificar acesso a features premium
 */
export function requirePremiumAccess() {
  return async (tenantId: string) => {
    const hasAccess = await canAccessPremiumFeatures(tenantId);

    if (!hasAccess) {
      throw new Error("Acesso negado. Trial expirado ou assinatura inativa.");
    }

    return hasAccess;
  };
}
