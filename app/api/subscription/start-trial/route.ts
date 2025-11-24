import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/serverAuth";
import { startTrial, getTrialInfo } from "@/lib/trial";

export async function POST() {
  try {
    const { tenant } = await requireAuth();

    // Verificar se já tem trial ativo ou usado
    const trialInfo = await getTrialInfo(tenant.id);

    if (trialInfo.isOnTrial && !trialInfo.hasTrialExpired) {
      return NextResponse.json(
        { error: "Você já tem um trial ativo" },
        { status: 400 }
      );
    }

    if (trialInfo.hasTrialExpired) {
      return NextResponse.json(
        { error: "Trial já foi usado anteriormente" },
        { status: 400 }
      );
    }

    // Iniciar trial
    await startTrial(tenant.id);

    return NextResponse.json({
      success: true,
      message: "Trial de 7 dias iniciado com sucesso!",
      trialDaysRemaining: 7,
    });
  } catch (err) {
    console.error("Erro ao iniciar trial:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
