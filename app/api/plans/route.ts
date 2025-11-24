import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { active: true },
      orderBy: { price: "asc" },
    });

    // Garantir que os campos JSON estão tipados corretamente
    const formattedPlans = plans.map((plan) => ({
      ...plan,
      features: Array.isArray(plan.features) ? plan.features : [],
      limits: {
        contacts:
          typeof plan.limits === "object" &&
          plan.limits !== null &&
          "contacts" in plan.limits
            ? plan.limits.contacts
            : 0,
        monthlyMessages:
          typeof plan.limits === "object" &&
          plan.limits !== null &&
          "monthlyMessages" in plan.limits
            ? plan.limits.monthlyMessages
            : 0,
        users:
          typeof plan.limits === "object" &&
          plan.limits !== null &&
          "users" in plan.limits
            ? plan.limits.users
            : 0,
        groups:
          typeof plan.limits === "object" &&
          plan.limits !== null &&
          "groups" in plan.limits
            ? plan.limits.groups
            : 0,
        images:
          typeof plan.limits === "object" &&
          plan.limits !== null &&
          "images" in plan.limits
            ? plan.limits.images
            : 0,
        automations:
          typeof plan.limits === "object" &&
          plan.limits !== null &&
          "automations" in plan.limits
            ? plan.limits.automations
            : 0,
      },
    }));

    return NextResponse.json(formattedPlans);
  } catch (error) {
    console.error("Erro ao buscar planos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
