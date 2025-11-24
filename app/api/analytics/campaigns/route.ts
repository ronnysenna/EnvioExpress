import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/serverAuth";
import { getCampaignAnalytics } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const campaignId = searchParams.get("campaignId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const analytics = await getCampaignAnalytics(tenant.id, {
      campaignId,
      startDate,
      endDate,
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Erro ao buscar analytics de campanhas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
