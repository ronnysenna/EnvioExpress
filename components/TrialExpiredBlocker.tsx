'use client';

import { Lock, Crown, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TrialExpiredBlockerProps {
    feature?: string;
    action?: string;
    className?: string;
}

export default function TrialExpiredBlocker({ 
    feature = 'este recurso',
    action = 'esta ação',
    className = ''
}: TrialExpiredBlockerProps) {
    const router = useRouter();

    const handleUpgrade = () => {
        router.push('/plans');
    };

    return (
        <div className={`bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg p-6 text-center ${className}`}>
            <div className="flex justify-center mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                    <Lock className="h-8 w-8 text-red-600" />
                </div>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Trial Expirado
            </h3>
            
            <p className="text-gray-600 mb-4">
                Seu período de avaliação gratuito de 7 dias expirou. 
                Para continuar usando {feature}, você precisa fazer upgrade para um plano pago.
            </p>
            
            <div className="bg-white border border-red-200 rounded-md p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">
                    🚫 Ações bloqueadas:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Envio de mensagens em massa</li>
                    <li>• Criação de novos contatos</li>
                    <li>• Upload de imagens</li>
                    <li>• Criação de grupos</li>
                    <li>• Acesso à API</li>
                </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                    onClick={handleUpgrade}
                    className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                    <Crown className="h-5 w-5 mr-2" />
                    Atualizar Plano
                    <ArrowRight className="h-4 w-4 ml-2" />
                </button>
                
                <a
                    href="/plans"
                    className="inline-flex items-center px-6 py-3 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors"
                >
                    Ver Planos Disponíveis
                </a>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
                Não perca suas configurações e dados. Faça upgrade agora mesmo!
            </p>
        </div>
    );
}
