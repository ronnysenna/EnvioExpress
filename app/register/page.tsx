"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import Brand from "../../components/Brand";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!email || !username || !password) {
            setError("Todos os campos obrigatórios devem ser preenchidos");
            return;
        }

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    username,
                    password,
                    name,
                    companyName
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erro no registro");
                return;
            }

            setSuccess("Conta criada com sucesso! Trial de 7 dias iniciado. Redirecionando...");

            // Aguardar um pouco para mostrar a mensagem antes de redirecionar
            setTimeout(() => {
                router.push("/welcome");
            }, 1500);
        } catch (_err) {
            setError("Erro de conexão");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-800 to-gray-900 text-gray-100">
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-xl shadow-xl w-full max-w-md border border-white/6">
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-600 p-4 rounded-full">
                        <UserPlus size={32} className="text-white" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-center mb-2">
                    <Brand />
                </h1>
                <p className="text-center text-gray-300 mb-6">
                    Crie sua conta para continuar
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-200 mb-1"
                        >
                            Email *
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-white/6 border border-white/8 rounded-lg text-white placeholder-gray-400 outline-none focus:border-blue-500"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-200 mb-1"
                        >
                            Nome Completo
                        </label>
                        <input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 bg-white/6 border border-white/8 rounded-lg text-white placeholder-gray-400 outline-none focus:border-blue-500"
                            placeholder="Seu nome completo"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="companyName"
                            className="block text-sm font-medium text-gray-200 mb-1"
                        >
                            Nome da Empresa
                        </label>
                        <input
                            id="companyName"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full px-4 py-2 bg-white/6 border border-white/8 rounded-lg text-white placeholder-gray-400 outline-none focus:border-blue-500"
                            placeholder="Nome da sua empresa"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium text-gray-200 mb-1"
                        >
                            Usuário *
                        </label>
                        <input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 bg-white/6 border border-white/8 rounded-lg text-white placeholder-gray-400 outline-none focus:border-blue-500"
                            placeholder="seuusuario"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-200 mb-1"
                        >
                            Senha *
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-white/6 border border-white/8 rounded-lg text-white placeholder-gray-400 outline-none focus:border-blue-500"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">{error}</div>}
                    {success && <div className="text-green-400 text-sm bg-green-900/20 p-3 rounded-lg">{success}</div>}

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Criar conta
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-300">
                    <p className="mt-2">
                        Já tem conta?{" "}
                        <a href="/login" className="text-blue-300 hover:underline">
                            Fazer login
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
