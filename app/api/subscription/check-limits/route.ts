import { NextRequest, NextResponse } from "next/server";
import { checkPlanLimits } from "@/lib/planLimits";

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    if (!action) {
      return NextResponse.json(
        { error: "Ação é obrigatória" },
        { status: 400 }
      );
    }

    // Check if action is valid
    const validActions = [
      "create_contact",
      "send_message", 
      "create_group",
      "upload_image",
      "invite_user"
    ];

    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: "Ação inválida" },
        { status: 400 }
      );
    }

    const result = await checkPlanLimits(action as any);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao verificar limites do plano:", error);
    return NextResponse.json(
      { 
        allowed: false,
        error: "Erro interno do servidor" 
      },
      { status: 500 }
    );
  }
}
