"use client";

import { useState } from "react";
import { LogIn, Building2 } from "lucide-react";
import Brand from "../../components/Brand";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("admin123");
  const [tenantSlug, setTenantSlug] = useState("demo-empresa");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          tenantSlug: tenantSlug || undefined
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro de login");
        return;
      }

      // Login bem-sucedido - redirecionar
      window.location.replace("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-gray-900 text-gray-100">
      <div className="bg-white/5 backdrop-blur-sm p-8 rounded-xl shadow-xl w-full max-w-md border border-white/10">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-4 rounded-full">
            <LogIn size={32} className="text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">
          <Brand />
        </h1>
        <p className="text-center text-gray-300 mb-6">
          Acesse sua conta para continuar
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white/8 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition text-white placeholder-gray-400"
              placeholder="Digite seu email"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white/8 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition text-white placeholder-gray-400"
              placeholder="Digite sua senha"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="tenantSlug"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              <Building2 className="inline w-4 h-4 mr-1" />
              Organização (opcional)
            </label>
            <input
              id="tenantSlug"
              type="text"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              className="w-full px-4 py-2 bg-white/8 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition text-white placeholder-gray-400"
              placeholder="Slug da organização"
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1">
              Deixe em branco para acessar a primeira organização disponível
            </p>
          </div>

          {error && (
            <div className="bg-red-700/20 border border-red-600/30 text-red-100 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* Demo credentials info */}
        <div className="mt-6 p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg text-sm">
          <p className="text-blue-200 font-medium mb-2">🚀 Credenciais de demonstração:</p>
          <div className="text-blue-100 space-y-1 text-xs">
            <p><strong>Email:</strong> admin@demo.com</p>
            <p><strong>Senha:</strong> admin123</p>
            <p><strong>Organização:</strong> demo-empresa</p>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-300">
          <p className="mt-2">
            Não tem conta?{" "}
            <a href="/register" className="text-blue-300 hover:underline">
              Criar conta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
