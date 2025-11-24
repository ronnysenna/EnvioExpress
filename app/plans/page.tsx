'use client';

import { useState, useEffect } from 'react';
import { Check, Crown, Zap, Building2, ArrowRight, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/stripe';

interface Plan {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    interval: string;
    features: string[];
    limits: {
        contacts: number | 'unlimited';
        monthlyMessages: number | 'unlimited';
        users: number | 'unlimited';
        groups: number | 'unlimited';
        images: number | 'unlimited';
        automations?: number | 'unlimited';
    };
    stripePriceId?: string;
    popular?: boolean;
}

interface Subscription {
    plan: Plan;
    status: string;
}

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState<string | null>(null);

    useEffect(() => {
        fetchPlansAndSubscription();
    }, []);

    const fetchPlansAndSubscription = async () => {
        try {
            // Buscar planos disponíveis
            const plansResponse = await fetch('/api/plans');
            const plansData = await plansResponse.json();

            // Buscar assinatura atual
            const subscriptionResponse = await fetch('/api/subscription/status');
            const subscriptionData = await subscriptionResponse.json();

            setPlans(plansData);
            setCurrentSubscription(subscriptionData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = async (planId: string, planName: string) => {
        if (currentSubscription?.plan.id === planId) return;

        setUpgrading(planId);

        try {
            if (planName === 'Free') {
                // Downgrade para free
                const response = await fetch('/api/subscription/upgrade', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ planId }),
                });

                const result = await response.json();
                if (result.success) {
                    await fetchPlansAndSubscription();
                }
            } else {
                // Upgrade para plano pago
                const response = await fetch('/api/billing/create-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ planId }),
                });

                const result = await response.json();
                if (result.url) {
                    window.location.href = result.url;
                }
            }
        } catch (error) {
            console.error('Erro ao selecionar plano:', error);
        } finally {
            setUpgrading(null);
        }
    };

    const openCustomerPortal = async () => {
        try {
            const response = await fetch('/api/billing/customer-portal', {
                method: 'POST',
            });

            const result = await response.json();
            if (result.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            console.error('Erro ao abrir portal:', error);
        }
    };

    const formatLimit = (value: number | 'unlimited'): string => {
        if (value === 'unlimited') return 'Ilimitado';
        return value.toLocaleString('pt-BR');
    };

    const getPlanIcon = (planName: string) => {
        switch (planName.toLowerCase()) {
            case 'free':
                return <Zap className="h-8 w-8 text-green-600" />;
            case 'starter':
                return <Crown className="h-8 w-8 text-blue-600" />;
            case 'professional':
                return <Building2 className="h-8 w-8 text-purple-600" />;
            case 'enterprise':
                return <Building2 className="h-8 w-8 text-red-600" />;
            default:
                return <Zap className="h-8 w-8 text-gray-600" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Escolha o Plano Ideal
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Planos flexíveis para empresas de todos os tamanhos.
                        Comece grátis e evolua conforme sua necessidade.
                    </p>

                    {currentSubscription && (
                        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-sm font-medium">
                                Plano atual: {currentSubscription.plan.name}
                            </span>
                            {currentSubscription.plan.name !== 'Free' && (
                                <button
                                    onClick={openCustomerPortal}
                                    className="ml-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    Gerenciar
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {plans.map((plan) => {
                        const isCurrentPlan = currentSubscription?.plan.id === plan.id;
                        const isPopular = plan.name === 'Starter';

                        return (
                            <div
                                key={plan.id}
                                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${isCurrentPlan
                                        ? 'border-green-500 ring-2 ring-green-200'
                                        : isPopular
                                            ? 'border-blue-500 ring-2 ring-blue-200'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                {isPopular && !isCurrentPlan && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                            Mais Popular
                                        </span>
                                    </div>
                                )}

                                {isCurrentPlan && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                            Plano Atual
                                        </span>
                                    </div>
                                )}

                                <div className="p-8">
                                    {/* Plan Header */}
                                    <div className="text-center mb-8">
                                        <div className="mb-4 flex justify-center">
                                            {getPlanIcon(plan.name)}
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                            {plan.name}
                                        </h3>
                                        <div className="mb-4">
                                            <span className="text-4xl font-bold text-gray-900">
                                                {formatPrice(plan.price)}
                                            </span>
                                            {plan.price > 0 && (
                                                <span className="text-gray-600">/mês</span>
                                            )}
                                        </div>
                                        {plan.description && (
                                            <p className="text-gray-600 text-sm">
                                                {plan.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <div className="space-y-4 mb-8">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Contatos</span>
                                                <span className="font-semibold">
                                                    {formatLimit(plan.limits.contacts)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Envios/mês</span>
                                                <span className="font-semibold">
                                                    {formatLimit(plan.limits.monthlyMessages)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Usuários</span>
                                                <span className="font-semibold">
                                                    {formatLimit(plan.limits.users)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Grupos</span>
                                                <span className="font-semibold">
                                                    {formatLimit(plan.limits.groups)}
                                                </span>
                                            </div>
                                            {plan.limits.automations && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Automações</span>
                                                    <span className="font-semibold">
                                                        {formatLimit(plan.limits.automations)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <hr className="my-4" />

                                        <div className="space-y-3">
                                            {plan.features.map((feature, index) => (
                                                <div key={index} className="flex items-center gap-3">
                                                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span className="text-sm text-gray-700">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* CTA Button */}
                                    <button
                                        onClick={() => handleSelectPlan(plan.id, plan.name)}
                                        disabled={isCurrentPlan || upgrading === plan.id}
                                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${isCurrentPlan
                                                ? 'bg-green-100 text-green-800 cursor-default'
                                                : isPopular
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                            }`}
                                    >
                                        {upgrading === plan.id ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : isCurrentPlan ? (
                                            'Plano Atual'
                                        ) : (
                                            <>
                                                {plan.price === 0 ? 'Começar Grátis' : 'Fazer Upgrade'}
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ or Additional Info */}
                <div className="mt-16 text-center">
                    <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            Precisa de Ajuda?
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Nossa equipe está pronta para ajudá-lo a escolher o melhor plano para sua empresa.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                                Falar com Vendas
                            </button>
                            <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                                Ver FAQ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
