import { NextResponse } from "next/server";
import { processTrialNotifications } from "@/lib/trialNotifications";

export async function POST() {
  try {
    console.log('🔄 Processando notificações de trial...');
    
    const result = await processTrialNotifications();
    
    return NextResponse.json({
      success: true,
      message: `Notificações processadas: ${result.sent} enviadas, ${result.failed} falharam`,
      data: result
    });
  } catch (error) {
    console.error("Erro ao processar notificações de trial:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}
