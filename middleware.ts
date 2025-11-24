import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Função para verificar JWT no Edge Runtime (sem crypto do Node.js)
function verifyJWT(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decodedPayload = JSON.parse(atob(payload));

    // Verificar se o token não expirou
    if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
      return null;
    }

    // Verificar se tem tenant atual (necessário para multi-tenancy)
    if (!decodedPayload.currentTenantId) {
      return null;
    }

    return decodedPayload;
  } catch {
    return null;
  }
}

// Rotas que não precisam de autenticação
const publicRoutes = [
  "/login",
  "/register",
  "/welcome",
  "/plans",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/switch-tenant",
];

// Rotas que requerem verificação de trial
const trialProtectedRoutes = [
  "/api/contacts",
  "/api/groups",
  "/api/messages",
  "/api/images",
  "/contacts",
  "/groups",
  "/messages",
  "/campaigns",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acesso a rotas públicas
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Verificar autenticação para rotas protegidas
  const token = request.cookies.get("authToken")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const payload = verifyJWT(token);
  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("authToken");
    return response;
  }

  // Adicionar headers com informações do contexto para as APIs
  const response = NextResponse.next();
  response.headers.set("x-user-id", payload.userId);
  response.headers.set("x-tenant-id", payload.currentTenantId);
  response.headers.set("x-user-email", payload.email);

  // Verificar se a rota requer verificação de trial
  const needsTrialCheck = trialProtectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (needsTrialCheck) {
    response.headers.set("x-requires-trial-check", "true");
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
