import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/serverAuth";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const { tenant } = await requireAuth();

    // Buscar assinatura
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: tenant.id },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    // Criar sessão do customer portal
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Erro ao criar customer portal:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
