import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import type Stripe from "stripe";
import { SubscriptionStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook signature missing" },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripeInstance();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("Stripe webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { tenantId, planId } = session.metadata || {};

  if (!tenantId || !planId) {
    console.error("Missing metadata in checkout session");
    return;
  }

  try {
    const subscription = await prisma.subscription.upsert({
      where: { tenantId },
      update: {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        status: SubscriptionStatus.ACTIVE,
        planId,
      },
      create: {
        tenantId,
        planId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    console.log("Subscription created/updated:", subscription.id);
  } catch (error) {
    console.error("Error handling checkout completed:", error);
  }
}

async function handleSubscriptionUpdated(
  stripeSubscription: Stripe.Subscription
) {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      console.error(
        "Subscription not found for Stripe subscription:",
        stripeSubscription.id
      );
      return;
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: mapStripeStatus(stripeSubscription.status),
      },
    });

    console.log("Subscription updated:", subscription.id);
  } catch (error) {
    console.error("Error handling subscription updated:", error);
  }
}

async function handleSubscriptionDeleted(
  stripeSubscription: Stripe.Subscription
) {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      console.error(
        "Subscription not found for deletion:",
        stripeSubscription.id
      );
      return;
    }

    const freePlan = await prisma.plan.findFirst({
      where: { name: "Free" },
    });

    if (freePlan) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: freePlan.id,
          status: SubscriptionStatus.CANCELLED,
          stripeSubscriptionId: null,
        },
      });
    }

    console.log(
      "Subscription cancelled and moved to free plan:",
      subscription.id
    );
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
  }
}

function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: SubscriptionStatus.ACTIVE,
    canceled: SubscriptionStatus.CANCELLED,
    incomplete: SubscriptionStatus.INCOMPLETE,
    incomplete_expired: SubscriptionStatus.CANCELLED,
    past_due: SubscriptionStatus.PAST_DUE,
    paused: SubscriptionStatus.CANCELLED,
    trialing: SubscriptionStatus.ACTIVE,
    unpaid: SubscriptionStatus.UNPAID,
  };

  return statusMap[stripeStatus] || SubscriptionStatus.ACTIVE;
}
