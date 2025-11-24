import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/serverAuth";
import { getStripeInstance } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const { tenant } = await requireAuth();

    // Buscar assinatura atual
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: tenant.id },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    // Cancelar no Stripe (no final do período)
    const stripe = getStripeInstance();
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Não atualizar o status ainda - será feito pelo webhook quando realmente cancelar
    return NextResponse.json({
      success: true,
      message: "Cancelamento agendado para o final do período de cobrança",
    });
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
