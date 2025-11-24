import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

type NextContextWithParams = {
  params?: { id: string } | Promise<{ id: string }>;
};

export async function PUT(_req: Request, context: NextContextWithParams) {
  const params = await (context?.params ?? ({} as { id: string }));
  try {
    const { tenant } = await requireAuth();
    const contactId = params.id; // Now it's a string (cuid)
    const body = await _req.json();
    const { nome, telefone } = body;

    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });
    if (!contact)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (contact.tenantId !== tenant.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data: Partial<{ nome: string; telefone: string }> = {};
    if (typeof nome === "string") data.nome = nome;
    if (typeof telefone === "string")
      data.telefone = telefone.replace(/\D/g, "");

    const updated = await prisma.contact.update({
      where: { id: contactId },
      data,
    });
    return NextResponse.json({ contact: updated });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: NextContextWithParams) {
  const params = await (context?.params ?? ({} as { id: string }));
  try {
    const { tenant } = await requireAuth();
    const contactId = params.id; // Now it's a string (cuid)

    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });
    if (!contact)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (contact.tenantId !== tenant.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.contact.delete({ where: { id: contactId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
