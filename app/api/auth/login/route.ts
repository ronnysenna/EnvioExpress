import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/utils";

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

const JWT_SECRET = getJWTSecret();

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, tenantSlug } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenants: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Se não tiver acesso a nenhum tenant
    if (user.tenants.length === 0) {
      return NextResponse.json(
        { error: "No access to any organization" },
        { status: 403 }
      );
    }

    // Preparar lista de tenants do usuário
    const userTenants = user.tenants.map((tu) => ({
      id: tu.tenant.id,
      name: tu.tenant.name,
      slug: tu.tenant.slug,
      role: tu.role,
    }));

    // Determinar tenant atual
    let currentTenant = userTenants[0]; // Default para o primeiro

    // Se um slug específico foi fornecido, tentar encontrá-lo
    if (tenantSlug) {
      const requestedTenant = userTenants.find((t) => t.slug === tenantSlug);
      if (requestedTenant) {
        currentTenant = requestedTenant;
      } else {
        return NextResponse.json(
          { error: "No access to this organization" },
          { status: 403 }
        );
      }
    }

    // Gerar token JWT com informações multi-tenant
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      tenants: userTenants,
      currentTenantId: currentTenant.id,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: "7d",
      issuer: "envioexpress",
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
      },
      tenants: userTenants,
      currentTenant,
    });

    // Cookie seguro para o token
    const cookieOptions = {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax" as const,
      secure: IS_PROD,
      ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
    };

    response.cookies.set("authToken", token, cookieOptions);
    return response;
  } catch (unknownErr) {
    return NextResponse.json(
      { error: getErrorMessage(unknownErr) },
      { status: 500 }
    );
  }
}
