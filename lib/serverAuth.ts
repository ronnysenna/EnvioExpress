import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { TenantRole, User, Tenant } from "@prisma/client";
import prisma from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

export interface AuthContext {
  user: User;
  tenant: Tenant;
  role: TenantRole;
}

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  tenants: Array<{
    id: string;
    name: string;
    slug: string;
    role: TenantRole;
  }>;
  currentTenantId?: string;
}

export async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get?.("authToken")?.value;
    return token || null;
  } catch {
    return null;
  }
}

export async function verifyAuth(): Promise<AuthContext | null> {
  try {
    const token = await getAuthToken();
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (!decoded.currentTenantId) return null;

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user) return null;

    // Verificar acesso ao tenant
    const tenantUser = await prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId: decoded.currentTenantId,
          userId: decoded.userId,
        },
      },
      include: {
        tenant: true,
      },
    });

    if (!tenantUser) return null;

    return {
      user,
      tenant: tenantUser.tenant,
      role: tenantUser.role,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthContext> {
  const auth = await verifyAuth();
  if (!auth) {
    throw new Error("Unauthorized");
  }
  return auth;
}

export async function requireUser(): Promise<User> {
  const auth = await requireAuth();
  return auth.user;
}

export async function requireTenant(): Promise<Tenant> {
  const auth = await requireAuth();
  return auth.tenant;
}

export async function requireRole(minRole: TenantRole): Promise<AuthContext> {
  const auth = await requireAuth();

  const roleHierarchy = {
    [TenantRole.VIEWER]: 0,
    [TenantRole.USER]: 1,
    [TenantRole.ADMIN]: 2,
    [TenantRole.OWNER]: 3,
  };

  if (roleHierarchy[auth.role] < roleHierarchy[minRole]) {
    throw new Error("Insufficient permissions");
  }

  return auth;
}

// Helpers específicos para roles
export async function requireOwner(): Promise<AuthContext> {
  return requireRole(TenantRole.OWNER);
}

export async function requireAdmin(): Promise<AuthContext> {
  return requireRole(TenantRole.ADMIN);
}

export async function requireUser2(): Promise<AuthContext> {
  return requireRole(TenantRole.USER);
}

export async function getTenantId(): Promise<string> {
  const auth = await requireAuth();
  return auth.tenant.id;
}
