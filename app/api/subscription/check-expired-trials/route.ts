import { NextResponse } from "next/server";
import { expireTrial, getTrialInfo } from "@/lib/trial";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    console.log("🔄 Iniciando verificação de trials expirados...");

    // Buscar todas as assinaturas em trial
    const trialsAtivos = await prisma.subscription.findMany({
      where: {
        status: "TRIAL",
        trialEndsAt: {
          not: null,
          lt: new Date(), // Trials que expiraram
        },
      },
      include: {
        tenant: true,
      },
    });

    console.log(`📋 Encontrados ${trialsAtivos.length} trials expirados`);

    let processados = 0;
    const resultados = [];

    for (const subscription of trialsAtivos) {
      try {
        await expireTrial(subscription.tenantId);
        processados++;
        resultados.push({
          tenantId: subscription.tenantId,
          tenantName: subscription.tenant.name,
          status: "success",
        });
        console.log(`✅ Trial expirado para tenant: ${subscription.tenant.name}`);
      } catch (error) {
        console.error(
          `❌ Erro ao expirar trial para tenant ${subscription.tenantId}:`,
          error
        );
        resultados.push({
          tenantId: subscription.tenantId,
          tenantName: subscription.tenant.name,
          status: "error",
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    console.log(`🎯 Processados ${processados}/${trialsAtivos.length} trials`);

    return NextResponse.json({
      success: true,
      message: `Verificação concluída. ${processados} trials expirados processados.`,
      totalFound: trialsAtivos.length,
      totalProcessed: processados,
      results: resultados,
    });
  } catch (error) {
    console.error("❌ Erro na verificação de trials expirados:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
