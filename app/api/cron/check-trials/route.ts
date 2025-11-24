import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { expireTrial } from "@/lib/trial";
import { processTrialNotifications } from "@/lib/trialNotifications";

export async function POST() {
  try {
    console.log("🔄 Iniciando verificação automática de trials...");

    const now = new Date();

    // Find all active trials
    const activeTrials = await prisma.subscription.findMany({
      where: {
        status: "TRIAL",
        trialEndsAt: {
          not: null,
        },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(
      `📊 Encontrados ${activeTrials.length} trials ativos para verificar`
    );

    let expiredCount = 0;
    let notifiedCount = 0;

    // Check each trial
    for (const subscription of activeTrials) {
      const trialEndsAt = subscription.trialEndsAt!;

      if (trialEndsAt <= now) {
        // Trial has expired
        console.log(
          `⏰ Trial expirado para tenant ${subscription.tenant.name} (${subscription.tenant.id})`
        );

        try {
          await expireTrial(subscription.tenantId);
          expiredCount++;
        } catch (error) {
          console.error(
            `❌ Erro ao expirar trial para tenant ${subscription.tenant.id}:`,
            error
          );
        }
      }
    }

    // Send notifications for trials that need them
    console.log("📧 Processando notificações de trial...");
    const notificationResult = await processTrialNotifications();
    notifiedCount = notificationResult.sent;

    const summary = {
      totalChecked: activeTrials.length,
      expired: expiredCount,
      notified: notifiedCount,
      timestamp: now.toISOString(),
    };

    console.log("✅ Verificação automática concluída:", summary);

    return NextResponse.json({
      success: true,
      message: "Verificação automática de trials concluída",
      summary,
    });
  } catch (error) {
    console.error("❌ Erro na verificação automática de trials:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // For manual testing - same as POST but with additional info
  try {
    const now = new Date();

    const [activeTrials, totalTenants] = await Promise.all([
      prisma.subscription.count({
        where: {
          status: "TRIAL",
          trialEndsAt: {
            gt: now,
          },
        },
      }),
      prisma.tenant.count(),
    ]);

    // Count expired trials (those with ACTIVE status, isTrialUsed=true, and Free plan)
    const freePlan = await prisma.plan.findFirst({ where: { name: "Free" } });
    const expiredTrials = freePlan
      ? await prisma.subscription.count({
          where: {
            status: "ACTIVE",
            isTrialUsed: true,
            planId: freePlan.id,
          },
        })
      : 0;

    // Find trials expiring today
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const expiringToday = await prisma.subscription.count({
      where: {
        status: "TRIAL",
        trialEndsAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return NextResponse.json({
      status: {
        activeTrials,
        expiredTrials,
        expiringToday,
        totalTenants,
      },
      lastCheck: now.toISOString(),
      message: "Use POST to run the automated check",
    });
  } catch (error) {
    console.error("Erro ao obter status dos trials:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
