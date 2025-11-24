import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

export async function GET() {
  try {
    const { tenant } = await requireAuth();

    const groups = await prisma.group.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        nome: true,
        _count: {
          select: { contacts: true },
        },
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json({ groups });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
