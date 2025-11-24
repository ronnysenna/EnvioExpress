import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/serverAuth";

export interface PlanLimits {
  contacts: number;
  monthlyMessages: number;
  users: number;
  groups: number | "unlimited";
  images: number | "unlimited";
  apiRequests?: number;
  automations?: number | "unlimited";
  features: string[];
}

export interface UsageStats {
  contacts: number;
  monthlyMessages: number;
  users: number;
  groups: number;
  images: number;
  currentPeriod: string; // formato YYYY-MM
}

/**
 * Verifica se o tenant pode executar uma ação baseado nos limites do plano
 */
export async function checkPlanLimits(
  action:
    | "create_contact"
    | "send_message"
    | "create_group"
    | "upload_image"
    | "invite_user",
  tenantId?: string
): Promise<{
  allowed: boolean;
  limit?: number;
  current?: number;
  error?: string;
}> {
  try {
    const auth = tenantId ? null : await requireAuth();
    const finalTenantId = tenantId || auth?.tenant.id;

    if (!finalTenantId) {
      return { allowed: false, error: "Tenant não identificado" };
    }

    // Buscar assinatura e plano
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: finalTenantId },
      include: { plan: true },
    });

    if (!subscription || subscription.status !== "ACTIVE") {
      return { allowed: false, error: "Assinatura inativa ou não encontrada" };
    }

    const limits = subscription.plan.limits as any;
    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Buscar estatísticas de uso atuais
    const [
      contactsCount,
      groupsCount,
      imagesCount,
      usersCount,
      monthlyMessages,
    ] = await Promise.all([
      prisma.contact.count({ where: { tenantId: finalTenantId } }),
      prisma.group.count({ where: { tenantId: finalTenantId } }),
      prisma.image.count({ where: { tenantId: finalTenantId } }),
      prisma.tenantUser.count({ where: { tenantId: finalTenantId } }),
      getMonthlyMessageCount(finalTenantId, currentPeriod),
    ]);

    // Verificar limite baseado na ação
    switch (action) {
      case "create_contact":
        if (
          limits.contacts !== "unlimited" &&
          contactsCount >= limits.contacts
        ) {
          return {
            allowed: false,
            limit: limits.contacts,
            current: contactsCount,
            error: `Limite de ${limits.contacts} contatos atingido`,
          };
        }
        break;

      case "send_message":
        if (
          limits.monthlyMessages !== "unlimited" &&
          monthlyMessages >= limits.monthlyMessages
        ) {
          return {
            allowed: false,
            limit: limits.monthlyMessages,
            current: monthlyMessages,
            error: `Limite de ${limits.monthlyMessages} mensagens mensais atingido`,
          };
        }
        break;

      case "create_group":
        if (limits.groups !== "unlimited" && groupsCount >= limits.groups) {
          return {
            allowed: false,
            limit: limits.groups as number,
            current: groupsCount,
            error: `Limite de ${limits.groups} grupos atingido`,
          };
        }
        break;

      case "upload_image":
        if (limits.images !== "unlimited" && imagesCount >= limits.images) {
          return {
            allowed: false,
            limit: limits.images as number,
            current: imagesCount,
            error: `Limite de ${limits.images} imagens atingido`,
          };
        }
        break;

      case "invite_user":
        if (limits.users !== "unlimited" && usersCount >= limits.users) {
          return {
            allowed: false,
            limit: limits.users,
            current: usersCount,
            error: `Limite de ${limits.users} usuários atingido`,
          };
        }
        break;

      default:
        return { allowed: true };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Erro ao verificar limites do plano:", error);
    return { allowed: false, error: "Erro interno ao verificar limites" };
  }
}

/**
 * Incrementa contador de uso (para tracking)
 */
export async function incrementUsage(
  tenantId: string,
  metric: "contacts" | "messages" | "api_requests" | "images" | "groups",
  value: number = 1
): Promise<void> {
  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

  try {
    // Buscar ou criar registro de métricas para o período atual
    const existingMetrics = await prisma.usageMetrics.findUnique({
      where: {
        tenantId_period: {
          tenantId,
          period: currentPeriod,
        },
      },
    });

    const updates: any = {};

    // Determinar qual campo atualizar baseado na métrica
    switch (metric) {
      case "contacts":
        updates.contactsCount = (existingMetrics?.contactsCount || 0) + value;
        break;
      case "messages":
        updates.messagesCount = (existingMetrics?.messagesCount || 0) + value;
        break;
      case "groups":
        updates.groupsCount = (existingMetrics?.groupsCount || 0) + value;
        break;
      case "images":
        updates.imagesCount = (existingMetrics?.imagesCount || 0) + value;
        break;
      case "api_requests":
        updates.apiRequests = (existingMetrics?.apiRequests || 0) + value;
        break;
      default:
        console.warn(`Métrica desconhecida: ${metric}`);
        return;
    }

    await prisma.usageMetrics.upsert({
      where: {
        tenantId_period: {
          tenantId,
          period: currentPeriod,
        },
      },
      update: updates,
      create: {
        tenantId,
        period: currentPeriod,
        contactsCount: metric === "contacts" ? value : 0,
        messagesCount: metric === "messages" ? value : 0,
        groupsCount: metric === "groups" ? value : 0,
        imagesCount: metric === "images" ? value : 0,
        usersCount: 0,
        apiRequests: metric === "api_requests" ? value : 0,
        storageUsed: BigInt(0),
      },
    });
  } catch (error) {
    console.error(`Erro ao incrementar uso de ${metric}:`, error);
  }
}

/**
 * Busca estatísticas de uso do tenant
 */
export async function getUsageStats(tenantId: string): Promise<UsageStats> {
  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

  const [contactsCount, groupsCount, imagesCount, usersCount, monthlyMessages] =
    await Promise.all([
      prisma.contact.count({ where: { tenantId } }),
      prisma.group.count({ where: { tenantId } }),
      prisma.image.count({ where: { tenantId } }),
      prisma.tenantUser.count({ where: { tenantId } }),
      getMonthlyMessageCount(tenantId, currentPeriod),
    ]);

  return {
    contacts: contactsCount,
    groups: groupsCount,
    images: imagesCount,
    users: usersCount,
    monthlyMessages,
    currentPeriod,
  };
}

/**
 * Helper para buscar contagem de mensagens mensais
 */
async function getMonthlyMessageCount(
  tenantId: string,
  period: string
): Promise<number> {
  const usage = await prisma.usageMetrics.findUnique({
    where: {
      tenantId_period: {
        tenantId,
        period,
      },
    },
  });

  return usage?.messagesCount || 0;
}

/**
 * Middleware para APIs que criam recursos limitados
 */
export function withPlanLimits(action: Parameters<typeof checkPlanLimits>[0]) {
  return async function (req: Request, res: NextResponse) {
    const auth = await requireAuth();
    const limitCheck = await checkPlanLimits(action, auth.tenant.id);

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: limitCheck.error || "Limite do plano excedido",
          limit: limitCheck.limit,
          current: limitCheck.current,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    return null; // Allowed to continue
  };
}

/**
 * Verifica se uma feature específica está disponível no plano
 */
export async function hasFeature(
  tenantId: string,
  feature: string
): Promise<boolean> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription || subscription.status !== "ACTIVE") {
      return false;
    }

    const limits = subscription.plan.limits as any;
    return limits.features?.includes(feature) || false;
  } catch {
    return false;
  }
}
