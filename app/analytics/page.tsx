'use client';

import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Users,
    MessageSquare,
    Eye,
    MousePointer,
    Activity,
    Calendar,
    Download,
    Loader2
} from 'lucide-react';

interface AnalyticsSummary {
    events: {
        total: number;
        recent: number;
    };
    usage: {
        contactsCount: number;
        messagesCount: number;
        groupsCount: number;
        imagesCount: number;
        usersCount: number;
        apiRequests: number;
        storageUsed: string;
    };
    campaigns: {
        totalSent: number;
        totalDelivered: number;
        totalOpened: number;
        totalClicked: number;
        totalFailed: number;
        avgDeliveryRate: number;
        avgOpenRate: number;
        avgClickRate: number;
    };
}

interface Event {
    id: string;
    name: string;
    properties: any;
    createdAt: string;
    user: {
        email: string;
        name: string;
    };
}

interface CampaignAnalytics {
    id: string;
    campaignName: string;
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalFailed: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    period: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [campaigns, setCampaigns] = useState<CampaignAnalytics[]>([]);
    const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const [summaryRes, eventsRes, campaignRes] = await Promise.all([
                fetch('/api/analytics/summary'),
                fetch(`/api/analytics/events?limit=50`),
                fetch('/api/analytics/campaigns'),
            ]);

            if (summaryRes.ok) {
                const summaryData = await summaryRes.json();
                setSummary(summaryData);
            }

            if (eventsRes.ok) {
                const eventsData = await eventsRes.json();
                setEvents(eventsData);
            }

            if (campaignRes.ok) {
                const campaignData = await campaignRes.json();
                setCampaigns(campaignData);
            }
        } catch (error) {
            console.error('Erro ao buscar analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        }
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
    };

    const StatCard = ({
        title,
        value,
        change,
        icon: Icon,
        color = 'blue'
    }: {
        title: string;
        value: string | number;
        change?: number;
        icon: any;
        color?: string;
    }) => (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                        {typeof value === 'number' ? formatNumber(value) : value}
                    </p>
                    {change !== undefined && (
                        <div className={`flex items-center mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {change >= 0 ? (
                                <TrendingUp className="h-4 w-4 mr-1" />
                            ) : (
                                <TrendingDown className="h-4 w-4 mr-1" />
                            )}
                            <span className="text-sm font-medium">
                                {Math.abs(change)}%
                            </span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-full bg-${color}-100`}>
                    <Icon className={`h-6 w-6 text-${color}-600`} />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const campaignData = campaigns.slice(0, 5).map(campaign => ({
        name: campaign.campaignName || 'Sem nome',
        enviados: campaign.totalSent,
        entregues: campaign.totalDelivered,
        abertos: campaign.totalOpened,
        cliques: campaign.totalClicked,
    }));

    const metricsData = [
        { name: 'Contatos', value: summary?.usage.contactsCount || 0 },
        { name: 'Mensagens', value: summary?.usage.messagesCount || 0 },
        { name: 'Grupos', value: summary?.usage.groupsCount || 0 },
        { name: 'Imagens', value: summary?.usage.imagesCount || 0 },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                            <p className="text-gray-600 mt-2">
                                Acompanhe o desempenho e uso da sua plataforma
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="7d">Últimos 7 dias</option>
                                <option value="30d">Últimos 30 dias</option>
                                <option value="90d">Últimos 90 dias</option>
                            </select>

                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <Download className="h-4 w-4" />
                                Exportar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total de Eventos"
                        value={summary?.events.total || 0}
                        change={12}
                        icon={Activity}
                        color="blue"
                    />
                    <StatCard
                        title="Mensagens Enviadas"
                        value={summary?.campaigns.totalSent || 0}
                        change={8}
                        icon={MessageSquare}
                        color="green"
                    />
                    <StatCard
                        title="Taxa de Entrega"
                        value={`${(summary?.campaigns.avgDeliveryRate || 0).toFixed(1)}%`}
                        change={-2}
                        icon={TrendingUp}
                        color="purple"
                    />
                    <StatCard
                        title="Taxa de Abertura"
                        value={`${(summary?.campaigns.avgOpenRate || 0).toFixed(1)}%`}
                        change={5}
                        icon={Eye}
                        color="orange"
                    />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Campaign Performance */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                            Performance de Campanhas
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={campaignData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="enviados" fill="#8884d8" name="Enviados" />
                                <Bar dataKey="entregues" fill="#82ca9d" name="Entregues" />
                                <Bar dataKey="abertos" fill="#ffc658" name="Abertos" />
                                <Bar dataKey="cliques" fill="#ff7c7c" name="Cliques" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Usage Distribution */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                            Distribuição de Uso
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={metricsData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {metricsData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Events */}
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Eventos Recentes
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Evento
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Usuário
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Data
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Detalhes
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {events.slice(0, 10).map((event) => (
                                    <tr key={event.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {event.name.replace(/_/g, ' ').toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {event.user?.name || event.user?.email || 'Sistema'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(event.createdAt).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {event.properties && Object.keys(event.properties).length > 0
                                                ? JSON.stringify(event.properties)
                                                : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
