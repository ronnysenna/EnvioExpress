import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/serverAuth";
import { startTrial } from "@/lib/trial";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { user } = await requireAuth();

    // Check if user is admin (you might want to add an admin role check here)
    const { tenantId } = await params;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID é obrigatório" },
        { status: 400 }
      );
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant não encontrado" },
        { status: 404 }
      );
    }

    // Check if tenant already has an active subscription or trial
    if (tenant.subscription) {
      if (tenant.subscription.status === "ACTIVE") {
        return NextResponse.json(
          { error: "Tenant já possui assinatura ativa" },
          { status: 400 }
        );
      }

      if (
        tenant.subscription.status === "TRIAL" &&
        tenant.subscription.trialEndsAt &&
        tenant.subscription.trialEndsAt > new Date()
      ) {
        return NextResponse.json(
          { error: "Tenant já possui trial ativo" },
          { status: 400 }
        );
      }

      if (tenant.subscription.isTrialUsed) {
        return NextResponse.json(
          { error: "Tenant já utilizou o período de trial" },
          { status: 400 }
        );
      }
    }

    // Start trial for the tenant
    const subscription = await startTrial(tenantId);

    return NextResponse.json({
      success: true,
      message: "Trial iniciado com sucesso",
      subscription: {
        id: subscription.id,
        tenantId: subscription.tenantId,
        status: subscription.status,
        trialStartsAt: subscription.trialStartsAt,
        trialEndsAt: subscription.trialEndsAt,
      },
    });
  } catch (error) {
    console.error("Erro ao iniciar trial para tenant:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
