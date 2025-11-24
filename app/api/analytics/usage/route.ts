import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/serverAuth";
import { getUsageMetrics } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const startPeriod = searchParams.get("startPeriod") || undefined;
    const endPeriod = searchParams.get("endPeriod") || undefined;

    const metrics = await getUsageMetrics(tenant.id, {
      startPeriod,
      endPeriod,
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Erro ao buscar métricas de uso:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
