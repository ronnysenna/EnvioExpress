import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Buscar todos os tenants do usuário
    const userTenants = await prisma.tenantUser.findMany({
      where: {
        userId: auth.user.id,
      },
      include: {
        tenant: true,
      },
    });

    const tenants = userTenants.map((tu) => ({
      id: tu.tenant.id,
      name: tu.tenant.name,
      slug: tu.tenant.slug,
      role: tu.role,
    }));

    return NextResponse.json({
      authenticated: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        username: auth.user.username,
        name: auth.user.name,
        avatar: auth.user.avatar,
      },
      tenants,
      currentTenant: {
        id: auth.tenant.id,
        name: auth.tenant.name,
        slug: auth.tenant.slug,
        role: auth.role,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { authenticated: false, error: getErrorMessage(err) },
      { status: 401 }
    );
  }
}
