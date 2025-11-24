import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/serverAuth";
import { getAnalyticsSummary } from "@/lib/analytics";

export async function GET() {
  try {
    const { tenant } = await requireAuth();

    const summary = await getAnalyticsSummary(tenant.id);

    // Convert BigInt to string for JSON serialization
    const serializedSummary = {
      ...summary,
      usage: {
        ...summary.usage,
        storageUsed: summary.usage.storageUsed.toString(),
      },
    };

    return NextResponse.json(serializedSummary);
  } catch (error) {
    console.error("Erro ao buscar resumo de analytics:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
