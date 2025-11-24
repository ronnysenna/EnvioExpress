import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/serverAuth";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar assinatura atual
    const currentSubscription = await prisma.subscription.findUnique({
      where: { tenantId: tenant.id },
      include: { plan: true },
    });

    if (!currentSubscription) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    // Buscar novo plano
    const newPlan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!newPlan || !newPlan.stripePriceId) {
      return NextResponse.json(
        { error: "Plano não encontrado ou não configurado" },
        { status: 404 }
      );
    }

    // Se for upgrade/downgrade de plano pago
    if (currentSubscription.stripeSubscriptionId && newPlan.stripePriceId) {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        currentSubscription.stripeSubscriptionId
      );

      // Atualizar subscription no Stripe
      await stripe.subscriptions.update(
        currentSubscription.stripeSubscriptionId,
        {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price: newPlan.stripePriceId,
            },
          ],
          proration_behavior: "create_prorations",
        }
      );

      // Atualizar no banco
      await prisma.subscription.update({
        where: { id: currentSubscription.id },
        data: { planId: newPlan.id },
      });

      return NextResponse.json({
        success: true,
        message: "Plano atualizado com sucesso",
      });
    }

    // Se for mudança de free para pago, criar checkout
    if (!currentSubscription.stripeSubscriptionId && newPlan.stripePriceId) {
      // Redirecionar para checkout
      return NextResponse.json({
        requiresCheckout: true,
        planId: newPlan.id,
      });
    }

    // Se for downgrade para free
    if (currentSubscription.stripeSubscriptionId && !newPlan.stripePriceId) {
      await stripe.subscriptions.cancel(
        currentSubscription.stripeSubscriptionId
      );

      await prisma.subscription.update({
        where: { id: currentSubscription.id },
        data: {
          planId: newPlan.id,
          stripeSubscriptionId: null,
          status: "ACTIVE",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Downgrade realizado com sucesso",
      });
    }

    return NextResponse.json(
      { error: "Operação não suportada" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro ao fazer upgrade:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
