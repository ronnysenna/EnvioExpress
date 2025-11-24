import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/serverAuth";
import { generateToken } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils";
import prisma from "@/lib/prisma";

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 }
      );
    }

    // Verificar se o usuário tem acesso ao tenant
    const tenantUser = await prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: auth.user.id,
        },
      },
      include: {
        tenant: true,
      },
    });

    if (!tenantUser) {
      return NextResponse.json(
        { error: "No access to this organization" },
        { status: 403 }
      );
    }

    // Buscar todos os tenants do usuário para o novo token
    const allUserTenants = await prisma.tenantUser.findMany({
      where: {
        userId: auth.user.id,
      },
      include: {
        tenant: true,
      },
    });

    const userTenants = allUserTenants.map((tu) => ({
      id: tu.tenant.id,
      name: tu.tenant.name,
      slug: tu.tenant.slug,
      role: tu.role,
    }));

    // Gerar novo token com tenant alterado
    const tokenPayload = {
      userId: auth.user.id,
      email: auth.user.email,
      username: auth.user.username,
      tenants: userTenants,
      currentTenantId: tenantId,
    };

    const newToken = generateToken(tokenPayload);

    const response = NextResponse.json({
      currentTenant: {
        id: tenantUser.tenant.id,
        name: tenantUser.tenant.name,
        slug: tenantUser.tenant.slug,
        role: tenantUser.role,
      },
    });

    // Atualizar cookie
    const cookieOptions = {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax" as const,
      secure: IS_PROD,
      ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
    };

    response.cookies.set("authToken", newToken, cookieOptions);
    return response;
  } catch (unknownErr) {
    return NextResponse.json(
      { error: getErrorMessage(unknownErr) },
      { status: 500 }
    );
  }
}
