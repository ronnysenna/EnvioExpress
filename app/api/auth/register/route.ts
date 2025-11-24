import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startTrial } from "@/lib/trial";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, username, password, name, companyName } = body;

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username e password são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se email ou username já existem
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email já está em uso" },
        { status: 409 }
      );
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username já está em uso" },
        { status: 409 }
      );
    }

    // Criar usuário e tenant em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar usuário
      const hashed = await bcrypt.hash(password, 10);
      const user = await tx.user.create({
        data: {
          email,
          username,
          password: hashed,
          name: name || null,
        },
      });

      // Criar tenant (empresa) para o usuário
      const tenantName =
        companyName || `${user.name || user.username}'s Company`;
      const tenantSlug = username.toLowerCase().replace(/[^a-z0-9]/g, "-");

      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: tenantSlug,
          settings: {},
        },
      });

      // Adicionar usuário como OWNER do tenant
      await tx.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: "OWNER",
        },
      });

      return { user, tenant };
    });

    // Iniciar trial para o novo tenant
    await startTrial(result.tenant.id);

    return NextResponse.json({
      id: result.user.id,
      email: result.user.email,
      username: result.user.username,
      name: result.user.name,
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
      message: "Conta criada com sucesso! Trial de 7 dias iniciado.",
    });
  } catch (err) {
    console.error("Erro ao registrar usuário:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
