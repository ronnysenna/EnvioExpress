import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";
import { checkPlanLimits, incrementUsage } from "@/lib/planLimits";

export async function GET(req: Request) {
  try {
    const { tenant } = await requireAuth();
    const tenantId = tenant.id;

    const url = new URL(req.url);
    const search = (url.searchParams.get("search") || "").trim();

    const where: Record<string, unknown> = { tenantId };
    if (search) {
      Object.assign(where, {
        OR: [
          { nome: { contains: search, mode: "insensitive" } },
          { descricao: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    const groups = await prisma.group.findMany({
      where,
      orderBy: { nome: "asc" },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
    });

    return NextResponse.json({ groups });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { tenant } = await requireAuth();
    const tenantId = tenant.id;

    // Verificar limites do plano ANTES de criar o grupo
    const limitCheck = await checkPlanLimits("create_group", tenantId);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: limitCheck.error || "Limite do plano excedido",
          limit: limitCheck.limit,
          current: limitCheck.current,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const nome = (body.nome || "").toString().trim();
    const descricao = body.descricao ? body.descricao.toString().trim() : null;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se já existe um grupo com o mesmo nome para este tenant
    const existing = await prisma.group.findUnique({
      where: {
        tenantId_nome: {
          tenantId,
          nome,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um grupo com este nome" },
        { status: 400 }
      );
    }

    const created = await prisma.group.create({
      data: { nome, descricao, tenantId },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
    });

    // Incrementar contador de grupos para este tenant
    await incrementUsage(tenantId, "groups", 1);

    return NextResponse.json({ group: created });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
