import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/serverAuth";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { tenant, user } = await requireAuth();
    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar o plano
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.stripePriceId) {
      return NextResponse.json(
        { error: "Plano não encontrado ou não configurado" },
        { status: 404 }
      );
    }

    // Verificar se já tem assinatura ativa
    const existingSubscription = await prisma.subscription.findUnique({
      where: { tenantId: tenant.id },
    });

    // Criar customer no Stripe se não existir
    let stripeCustomerId: string;

    if (existingSubscription?.stripeCustomerId) {
      stripeCustomerId = existingSubscription.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || user.username,
        metadata: {
          tenantId: tenant.id,
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans?checkout=cancelled`,
      metadata: {
        tenantId: tenant.id,
        planId: plan.id,
      },
      subscription_data: {
        metadata: {
          tenantId: tenant.id,
          planId: plan.id,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Erro ao criar checkout:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
