import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, username, password, name } = body;
    if (!email || !username || !password)
      return NextResponse.json(
        { error: "Email, username e password são obrigatórios" },
        { status: 400 }
      );

    // Verificar se email ou username já existem
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail)
      return NextResponse.json(
        { error: "Email já está em uso" },
        { status: 409 }
      );

    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername)
      return NextResponse.json(
        { error: "Username já está em uso" },
        { status: 409 }
      );

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashed,
        name: name || null,
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
    });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
