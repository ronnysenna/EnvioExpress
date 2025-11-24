import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/serverAuth";
import { trackEvent, EventNames } from "@/lib/analytics";

export async function POST(request: NextRequest) {
  try {
    const { tenant, user } = await requireAuth();
    const body = await request.json();

    const { eventName, properties, metadata } = body;

    if (!eventName) {
      return NextResponse.json(
        { error: "Nome do evento é obrigatório" },
        { status: 400 }
      );
    }

    await trackEvent({
      name: eventName,
      tenantId: tenant.id,
      userId: user.id,
      properties,
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao registrar evento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { tenant } = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const eventName = searchParams.get("eventName") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const startDate = searchParams.get("startDate") 
      ? new Date(searchParams.get("startDate")!) 
      : undefined;
    const endDate = searchParams.get("endDate") 
      ? new Date(searchParams.get("endDate")!) 
      : undefined;
    const limit = searchParams.get("limit") 
      ? parseInt(searchParams.get("limit")!) 
      : undefined;
    const offset = searchParams.get("offset") 
      ? parseInt(searchParams.get("offset")!) 
      : undefined;

    const { getEvents } = await import("@/lib/analytics");
    
    const events = await getEvents(tenant.id, {
      eventName,
      userId,
      startDate,
      endDate,
      limit,
      offset,
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
