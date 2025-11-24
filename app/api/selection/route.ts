import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/serverAuth";

export async function GET() {
  const { user } = await requireAuth();
  const selection = await prisma.selection.findUnique({
    where: { userId: user.id },
  });
  return NextResponse.json({ selectedIds: selection?.selectedIds ?? [] });
}

export async function POST(req: Request) {
  const { user } = await requireAuth();
  const body = await req.json().catch(() => ({}));
  const selectedIds = Array.isArray(body.selectedIds)
    ? (body.selectedIds as unknown[])
    : [];

  // basic validation: ensure array of strings (cuid)
  const normalized: string[] = selectedIds
    .map((v) => String(v))
    .filter((s) => s && s.length > 0);

  const upsert = await prisma.selection.upsert({
    where: { userId: user.id },
    update: { selectedIds: normalized },
    create: { userId: user.id, selectedIds: normalized },
  });

  return NextResponse.json({ selectedIds: upsert.selectedIds });
}

export async function DELETE() {
  const { user } = await requireAuth();
  await prisma.selection.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true });
}
