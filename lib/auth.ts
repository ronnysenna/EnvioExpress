import jwt from "jsonwebtoken";
import { TenantRole } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name?: string;
  avatar?: string;
}

export interface AuthTenant {
  id: string;
  name: string;
  slug: string;
  role: TenantRole;
}

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  tenants: AuthTenant[];
  currentTenantId?: string;
  iat?: number;
  exp?: number;
}

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

const JWT_SECRET = getJWTSecret();

export function generateToken(
  payload: Omit<TokenPayload, "iat" | "exp">
): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
    issuer: "envioexpress",
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;

  const token = getAuthToken();
  if (!token) return false;

  const payload = verifyToken(token);
  return !!payload;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", token);
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const token = getAuthToken();
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.userId,
    email: payload.email,
    username: payload.username,
  };
}

export function getCurrentTenant(): AuthTenant | null {
  if (typeof window === "undefined") return null;

  const token = getAuthToken();
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || !payload.currentTenantId) return null;

  return payload.tenants.find((t) => t.id === payload.currentTenantId) || null;
}

export function getUserTenants(): AuthTenant[] {
  if (typeof window === "undefined") return [];

  const token = getAuthToken();
  if (!token) return [];

  const payload = verifyToken(token);
  return payload?.tenants || [];
}

export function switchTenant(tenantId: string): boolean {
  if (typeof window === "undefined") return false;

  const token = getAuthToken();
  if (!token) return false;

  const payload = verifyToken(token);
  if (!payload) return false;

  // Verificar se o usuário tem acesso ao tenant
  const tenant = payload.tenants.find((t) => t.id === tenantId);
  if (!tenant) return false;

  // Gerar novo token com tenant atual
  const newPayload = {
    ...payload,
    currentTenantId: tenantId,
  };
  delete newPayload.iat;
  delete newPayload.exp;

  const newToken = generateToken(newPayload);
  setAuthToken(newToken);

  return true;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentTenantId");
  }
}

// Client-side helper para verificar roles
export function hasRole(requiredRole: TenantRole): boolean {
  const tenant = getCurrentTenant();
  if (!tenant) return false;

  const roleHierarchy = {
    [TenantRole.VIEWER]: 0,
    [TenantRole.USER]: 1,
    [TenantRole.ADMIN]: 2,
    [TenantRole.OWNER]: 3,
  };

  return roleHierarchy[tenant.role] >= roleHierarchy[requiredRole];
}

export function canManageBilling(): boolean {
  return hasRole(TenantRole.OWNER);
}

export function canManageUsers(): boolean {
  return hasRole(TenantRole.ADMIN);
}

export function canCreateContent(): boolean {
  return hasRole(TenantRole.USER);
}
