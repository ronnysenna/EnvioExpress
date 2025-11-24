'use client';

import { useState } from 'react';
import { Clock, Users, CheckCircle, AlertCircle, Zap } from 'lucide-react';

interface TenantTrialStatus {
    tenantId: string;
    tenantName: string;
    hasSubscription: boolean;
    subscriptionStatus: string;
    trialInfo: {
        isOnTrial: boolean;
        trialDaysRemaining: number;
        hasTrialExpired: boolean;
        canAccessFeatures: boolean;
    } | null;
}

export default function TrialManagementPage() {
    const [tenants, setTenants] = useState<TenantTrialStatus[]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);

    const fetchTenantsTrialStatus = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/trial-status');
            if (response.ok) {
                const data = await response.json();
                setTenants(data.tenants || []);
            }
        } catch (error) {
            console.error('Erro ao buscar status dos trials:', error);
        } finally {
            setLoading(false);
        }
    };

    const startTrialForTenant = async (tenantId: string) => {
        setProcessing(tenantId);
        try {
            const response = await fetch(`/api/admin/start-trial/${tenantId}`, {
                method: 'POST',
            });

            if (response.ok) {
                await fetchTenantsTrialStatus(); // Refresh data
                alert('Trial iniciado com sucesso!');
            } else {
                const error = await response.json();
                alert(`Erro: ${error.error}`);
            }
        } catch (error) {
            console.error('Erro ao iniciar trial:', error);
            alert('Erro ao iniciar trial');
        } finally {
            setProcessing(null);
        }
    };

    const checkExpiredTrials = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/subscription/check-expired-trials', {
                method: 'POST',
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Verificação concluída: ${result.totalProcessed} trials expirados processados.`);
                await fetchTenantsTrialStatus(); // Refresh data
            } else {
                const error = await response.json();
                alert(`Erro: ${error.error}`);
            }
        } catch (error) {
            console.error('Erro ao verificar trials expirados:', error);
            alert('Erro ao verificar trials expirados');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (tenant: TenantTrialStatus) => {
        if (!tenant.trialInfo) {
            return <AlertCircle className="h-5 w-5 text-red-500" />;
        }

        if (tenant.trialInfo.isOnTrial) {
            if (tenant.trialInfo.trialDaysRemaining <= 2) {
                return <Clock className="h-5 w-5 text-orange-500" />;
            }
            return <Zap className="h-5 w-5 text-blue-500" />;
        }

        if (tenant.trialInfo.hasTrialExpired) {
            return <AlertCircle className="h-5 w-5 text-red-500" />;
        }

        return <CheckCircle className="h-5 w-5 text-green-500" />;
    };

    const getStatusText = (tenant: TenantTrialStatus) => {
        if (!tenant.trialInfo) {
            return 'Sem trial';
        }

        if (tenant.trialInfo.isOnTrial) {
            return `Trial ativo (${tenant.trialInfo.trialDaysRemaining} dias)`;
        }

        if (tenant.trialInfo.hasTrialExpired) {
            return 'Trial expirado';
        }

        return 'Assinatura ativa';
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Gerenciamento de Trials
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Gerencie e monitore os trials dos tenants
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={checkExpiredTrials}
                                disabled={loading}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <Clock className="h-4 w-4" />
                                {loading ? 'Verificando...' : 'Verificar Trials Expirados'}
                            </button>
                            <button
                                onClick={fetchTenantsTrialStatus}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <Users className="h-4 w-4" />
                                {loading ? 'Carregando...' : 'Atualizar Lista'}
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    {tenants.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-blue-600" />
                                    <span className="font-medium text-blue-900">Trials Ativos</span>
                                </div>
                                <div className="text-2xl font-bold text-blue-600 mt-1">
                                    {tenants.filter(t => t.trialInfo?.isOnTrial).length}
                                </div>
                            </div>

                            <div className="bg-orange-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-orange-600" />
                                    <span className="font-medium text-orange-900">Expirando Hoje</span>
                                </div>
                                <div className="text-2xl font-bold text-orange-600 mt-1">
                                    {tenants.filter(t => t.trialInfo?.trialDaysRemaining === 0).length}
                                </div>
                            </div>

                            <div className="bg-red-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    <span className="font-medium text-red-900">Trials Expirados</span>
                                </div>
                                <div className="text-2xl font-bold text-red-600 mt-1">
                                    {tenants.filter(t => t.trialInfo?.hasTrialExpired).length}
                                </div>
                            </div>

                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="font-medium text-green-900">Assinantes</span>
                                </div>
                                <div className="text-2xl font-bold text-green-600 mt-1">
                                    {tenants.filter(t => t.subscriptionStatus === 'ACTIVE').length}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tenants List */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tenant</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Assinatura</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.map((tenant) => (
                                    <tr key={tenant.tenantId} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div>
                                                <div className="font-medium text-gray-900">{tenant.tenantName}</div>
                                                <div className="text-xs text-gray-500">{tenant.tenantId}</div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(tenant)}
                                                <span className="text-sm">{getStatusText(tenant)}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${tenant.subscriptionStatus === 'ACTIVE'
                                                    ? 'bg-green-100 text-green-800'
                                                    : tenant.subscriptionStatus === 'TRIAL'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {tenant.subscriptionStatus || 'Sem assinatura'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {!tenant.trialInfo?.isOnTrial && !tenant.trialInfo?.hasTrialExpired && (
                                                <button
                                                    onClick={() => startTrialForTenant(tenant.tenantId)}
                                                    disabled={processing === tenant.tenantId}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    {processing === tenant.tenantId ? 'Iniciando...' : 'Iniciar Trial'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {tenants.length === 0 && !loading && (
                            <div className="text-center py-8 text-gray-500">
                                Clique em "Atualizar Lista" para ver os tenants
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
