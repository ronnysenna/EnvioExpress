import Stripe from "stripe";

if (!process.env.STRIPE_API_KEY) {
  throw new Error("STRIPE_API_KEY is required");
}

export const stripe = new Stripe(process.env.STRIPE_API_KEY, {
  apiVersion: "2025-11-17.clover",
  typescript: true,
});

export const getStripeCustomerId = async (
  email: string,
  name?: string
): Promise<string> => {
  // Buscar customer existente
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0].id;
  }

  // Criar novo customer
  const customer = await stripe.customers.create({
    email,
    name,
  });

  return customer.id;
};

export const formatPrice = (
  priceInCents: number,
  currency: string = "BRL"
): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(priceInCents / 100);
};
