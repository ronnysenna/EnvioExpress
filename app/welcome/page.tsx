'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Zap,
    Users,
    MessageSquare,
    BarChart3,
    Crown,
    CheckCircle,
    ArrowRight,
    Calendar
} from 'lucide-react';

export default function WelcomePage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);

    const features = [
        {
            icon: <MessageSquare className="h-6 w-6" />,
            title: "Envio em Massa",
            description: "Envie mensagens para milhares de contatos simultaneamente"
        },
        {
            icon: <Users className="h-6 w-6" />,
            title: "Gestão de Contatos",
            description: "Organize seus contatos em grupos e segmente suas campanhas"
        },
        {
            icon: <BarChart3 className="h-6 w-6" />,
            title: "Analytics Avançados",
            description: "Acompanhe métricas detalhadas de entrega, abertura e cliques"
        },
        {
            icon: <Zap className="h-6 w-6" />,
            title: "API Completa",
            description: "Integre com seus sistemas através da nossa API REST"
        }
    ];

    const steps = [
        {
            title: "Bem-vindo ao EnvioExpress!",
            content: (
                <div className="text-center">
                    <div className="mb-6">
                        <div className="bg-blue-100 p-4 rounded-full inline-flex">
                            <Zap className="h-12 w-12 text-blue-600" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Sua conta foi criada com sucesso!
                    </h2>
                    <p className="text-lg text-gray-600 mb-6">
                        Você agora tem acesso completo ao EnvioExpress por{' '}
                        <span className="font-bold text-blue-600">7 dias gratuitos</span>.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-center gap-2 text-blue-700">
                            <Calendar className="h-5 w-5" />
                            <span className="font-medium">
                                Seu trial expira em 7 dias
                            </span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Recursos Premium Inclusos",
            content: (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        Tudo que você precisa, sem limitações
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {features.map((feature, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-green-100 p-2 rounded-lg">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center text-green-600">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    <span className="text-sm font-medium">Incluído no trial</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
        {
            title: "Próximos Passos",
            content: (
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Comece a explorar agora
                    </h2>
                    <div className="space-y-4 mb-8">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 text-left">
                            <div className="flex items-start gap-3">
                                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                                <div>
                                    <h3 className="font-medium text-gray-900">Importe seus contatos</h3>
                                    <p className="text-gray-600 text-sm">Adicione seus contatos manualmente ou importe via CSV</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4 text-left">
                            <div className="flex items-start gap-3">
                                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                                <div>
                                    <h3 className="font-medium text-gray-900">Crie seus grupos</h3>
                                    <p className="text-gray-600 text-sm">Organize seus contatos em grupos para campanhas segmentadas</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4 text-left">
                            <div className="flex items-start gap-3">
                                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                                <div>
                                    <h3 className="font-medium text-gray-900">Envie sua primeira campanha</h3>
                                    <p className="text-gray-600 text-sm">Crie e envie mensagens para testar todos os recursos</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                            <Crown className="h-5 w-5" />
                            <span className="font-medium">Lembrete</span>
                        </div>
                        <p className="text-sm text-blue-600">
                            Para continuar usando após o trial, você pode escolher um plano que se adeque às suas necessidades.
                        </p>
                    </div>
                </div>
            )
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            router.push('/dashboard');
        }
    };

    const handleSkip = () => {
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">
                            Passo {currentStep + 1} de {steps.length}
                        </span>
                        <button
                            onClick={handleSkip}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Pular apresentação
                        </button>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-lg p-8 min-h-[500px] flex flex-col">
                    <div className="flex-1">
                        {steps[currentStep].content}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                        <div>
                            {currentStep > 0 && (
                                <button
                                    onClick={() => setCurrentStep(currentStep - 1)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    Voltar
                                </button>
                            )}
                        </div>

                        <button
                            onClick={handleNext}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            {currentStep === steps.length - 1 ? (
                                <>
                                    Ir para Dashboard
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            ) : (
                                <>
                                    Continuar
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
