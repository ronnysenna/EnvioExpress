import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/serverAuth";
import prisma from "@/lib/prisma";
import { getTrialInfo } from "@/lib/trial";

export async function GET() {
  try {
    const { user } = await requireAuth();

    // Check if user is admin (you might want to add an admin role check here)
    // For now, we'll allow any authenticated user to access this for demo purposes

    // Get all tenants with their subscriptions
    const tenants = await prisma.tenant.findMany({
      include: {
        subscription: true,
        users: {
          where: {
            role: 'OWNER'
          },
          include: {
            user: {
              select: {
                email: true,
                name: true,
                username: true
              }
            }
          }
        }
      }
    });

    const tenantsWithTrialStatus = tenants.map(tenant => {
      const hasSubscription = !!tenant.subscription;
      const subscriptionStatus = tenant.subscription?.status || null;
      
      let trialInfo = null;
      if (tenant.subscription) {
        trialInfo = getTrialInfo(tenant.subscription);
      }

      const owner = tenant.users[0]?.user;

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        hasSubscription,
        subscriptionStatus,
        trialInfo,
        owner: owner ? {
          email: owner.email,
          name: owner.name,
          username: owner.username
        } : null
      };
    });

    // Sort by trial status (active trials first, then expiring, then expired)
    tenantsWithTrialStatus.sort((a, b) => {
      if (a.trialInfo?.isOnTrial && !b.trialInfo?.isOnTrial) return -1;
      if (!a.trialInfo?.isOnTrial && b.trialInfo?.isOnTrial) return 1;
      
      if (a.trialInfo?.isOnTrial && b.trialInfo?.isOnTrial) {
        return a.trialInfo.trialDaysRemaining - b.trialInfo.trialDaysRemaining;
      }
      
      return a.tenantName.localeCompare(b.tenantName);
    });

    return NextResponse.json({
      tenants: tenantsWithTrialStatus,
      summary: {
        total: tenantsWithTrialStatus.length,
        activeTrials: tenantsWithTrialStatus.filter(t => t.trialInfo?.isOnTrial).length,
        expiringToday: tenantsWithTrialStatus.filter(t => t.trialInfo?.trialDaysRemaining === 0).length,
        expiredTrials: tenantsWithTrialStatus.filter(t => t.trialInfo?.hasTrialExpired).length,
        activeSubscriptions: tenantsWithTrialStatus.filter(t => t.subscriptionStatus === 'ACTIVE').length
      }
    });
  } catch (error) {
    console.error("Erro ao buscar status dos trials:", error);
    return NextResponse.json(
      { 
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}
