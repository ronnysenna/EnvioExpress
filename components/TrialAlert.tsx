'use client';

import { useState } from 'react';
import { Clock, Zap, Crown, X } from 'lucide-react';

interface TrialInfo {
    isOnTrial: boolean;
    trialDaysRemaining: number;
    trialEndsAt: string | null;
    hasTrialExpired: boolean;
    canAccessFeatures: boolean;
}

interface TrialAlertProps {
    trial?: TrialInfo;
}

export default function TrialAlert({ trial }: TrialAlertProps) {
    const [isVisible, setIsVisible] = useState(true);

    if (!trial || !isVisible) return null;

    if (trial.isOnTrial) {
        const isExpiring = trial.trialDaysRemaining <= 2;
        const isExpired = trial.hasTrialExpired || trial.trialDaysRemaining <= 0;

        if (isExpired) {
            return (
                <div className="bg-red-500 border-l-4 border-red-700 text-white p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5" />
                            <div>
                                <div className="font-semibold">Trial Expirado</div>
                                <div className="text-sm opacity-90">
                                    Seu período de avaliação de 7 dias expirou. Atualize seu plano para continuar.
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <a
                                href="/plans"
                                className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors"
                            >
                                <Crown className="inline h-4 w-4 mr-1" />
                                Atualizar Plano
                            </a>                        <button
                                type="button"
                                onClick={() => setIsVisible(false)}
                                className="text-white/70 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={`border-l-4 p-4 mb-4 ${isExpiring
                ? 'bg-orange-50 border-orange-400 text-orange-700'
                : 'bg-blue-50 border-blue-400 text-blue-700'
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5" />
                        <div>
                            <div className="font-semibold">
                                {isExpiring ? 'Trial Expirando' : 'Trial Ativo'}
                            </div>
                            <div className="text-sm opacity-80">
                                {trial.trialDaysRemaining === 1
                                    ? '1 dia restante'
                                    : `${trial.trialDaysRemaining} dias restantes`
                                } do seu período de avaliação gratuito.
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href="/plans"
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${isExpiring
                                ? 'bg-orange-600 text-white hover:bg-orange-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            <Crown className="inline h-4 w-4 mr-1" />
                            {isExpiring ? 'Atualizar Agora' : 'Ver Planos'}
                        </a>                            <button
                            type="button"
                            onClick={() => setIsVisible(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
