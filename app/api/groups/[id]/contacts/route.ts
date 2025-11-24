import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

type NextContextWithParams = {
  params?: { id: string } | Promise<{ id: string }>;
};

export async function POST(_req: Request, context: NextContextWithParams) {
  const params = await (context?.params ?? ({} as { id: string }));
  try {
    const { tenant } = await requireAuth();
    const groupId = params.id;
    const body = await _req.json();
    const { contactIds } = body;

    if (!Array.isArray(contactIds)) {
      return NextResponse.json(
        { error: "contactIds deve ser um array" },
        { status: 400 }
      );
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group)
      return NextResponse.json(
        { error: "Grupo não encontrado" },
        { status: 404 }
      );
    if (group.tenantId !== tenant.id)
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    // Verificar se todos os contatos pertencem ao tenant
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        tenantId: tenant.id,
      },
    });

    if (contacts.length !== contactIds.length) {
      return NextResponse.json(
        {
          error:
            "Alguns contatos não foram encontrados ou não pertencem a você",
        },
        { status: 400 }
      );
    }

    // Remover contatos existentes do grupo
    await prisma.contactGroup.deleteMany({
      where: { groupId },
    });

    // Adicionar novos contatos
    if (contactIds.length > 0) {
      await prisma.contactGroup.createMany({
        data: contactIds.map((contactId: string) => ({
          groupId,
          contactId,
        })),
        skipDuplicates: true,
      });
    }

    const updatedGroup = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        contacts: {
          include: {
            contact: true,
          },
        },
        _count: {
          select: { contacts: true },
        },
      },
    });

    return NextResponse.json({ group: updatedGroup });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
