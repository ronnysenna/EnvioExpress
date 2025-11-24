import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, getTenantId } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";
import { checkPlanLimits, incrementUsage } from "@/lib/planLimits";

export async function GET(req: Request) {
  try {
    await requireAuth(); // Verificar autenticação
    const tenantId = await getTenantId(); // Obter tenant ID

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Math.min(
      1000,
      Math.max(1, Number(url.searchParams.get("limit") ?? 25))
    );
    const search = (url.searchParams.get("search") || "").trim();

    const where: Record<string, unknown> = { tenantId };
    if (search) {
      // busca por nome ou telefone parcialmente
      Object.assign(where, {
        OR: [
          { nome: { contains: search, mode: "insensitive" } },
          { telefone: { contains: search } },
        ],
      });
    }

    const [total, contacts] = await Promise.all([
      prisma.contact.count({ where }),
      prisma.contact.findMany({
        where,
        orderBy: { nome: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({ contacts, total, page, limit });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth(); // Verificar autenticação
    const tenantId = await getTenantId(); // Obter tenant ID

    // Verificar limites do plano ANTES de criar o contato
    const limitCheck = await checkPlanLimits("create_contact", tenantId);
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
    const nome = (body.nome || "").toString();
    const telefoneRaw = (body.telefone || "").toString();
    const telefone = telefoneRaw.replace(/\D/g, "");
    const email = (body.email || "").toString() || null;

    if (!telefone) {
      return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
    }

    // verificar contato existente pelo telefone dentro do tenant
    const existing = await prisma.contact.findUnique({
      where: {
        tenantId_telefone: {
          tenantId,
          telefone,
        },
      },
    });

    if (existing) {
      // atualizar contato existente
      const updated = await prisma.contact.update({
        where: { id: existing.id },
        data: { nome, email },
      });
      return NextResponse.json({ contact: updated });
    }

    const created = await prisma.contact.create({
      data: {
        nome,
        telefone,
        email,
        tenantId,
      },
    });

    // Incrementar contador de contatos para este tenant
    await incrementUsage(tenantId, "contacts", 1);

    return NextResponse.json({ contact: created });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
