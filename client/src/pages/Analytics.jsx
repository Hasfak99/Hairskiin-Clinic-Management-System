import { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Banknote,
    Users,
    Calendar,
    Package,
    BarChart3
} from 'lucide-react';
import { analyticsAPI } from '../api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function Analytics() {
    const [stats, setStats] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [topTreatments, setTopTreatments] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [appointmentsTrend, setAppointmentsTrend] = useState([]);
    const [clientStats, setClientStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [dashRes, revRes, treatRes, prodRes, trendRes, clientRes] = await Promise.all([
                analyticsAPI.getDashboard(),
                analyticsAPI.getRevenue('month'),
                analyticsAPI.getTopTreatments(5),
                analyticsAPI.getTopProducts(5),
                analyticsAPI.getAppointmentsTrend(14),
                analyticsAPI.getClientStats(),
            ]);

            setStats(dashRes.data);
            setRevenueData(revRes.data);
            setTopTreatments(treatRes.data);
            setTopProducts(prodRes.data);
            setAppointmentsTrend(trendRes.data);
            setClientStats(clientRes.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#71717a' },
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#71717a' },
            },
        },
    };

    const revenueChartData = {
        labels: revenueData.map(d => d.date?.slice(-5) || ''),
        datasets: [{
            label: 'Revenue',
            data: revenueData.map(d => d.revenue),
            fill: true,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
        }],
    };

    const appointmentsChartData = {
        labels: appointmentsTrend.map(d => d.date?.slice(-5) || ''),
        datasets: [
            {
                label: 'Completed',
                data: appointmentsTrend.map(d => d.completed),
                backgroundColor: '#10b981',
            },
            {
                label: 'Booked',
                data: appointmentsTrend.map(d => d.booked),
                backgroundColor: '#8b5cf6',
            },
            {
                label: 'Cancelled',
                data: appointmentsTrend.map(d => d.cancelled),
                backgroundColor: '#ef4444',
            },
        ],
    };

    const treatmentsChartData = {
        labels: topTreatments.map(t => t.name),
        datasets: [{
            data: topTreatments.map(t => t.count),
            backgroundColor: ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1'],
        }],
    };

    if (loading) {
        return (
            <div>
                <div className="page-header">
                    <div className="skeleton" style={{ width: 200, height: 32 }}></div>
                </div>
                <div className="grid grid-cols-4" style={{ marginBottom: 'var(--spacing-6)' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton" style={{ height: 120 }}></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analytics</h1>
                    <p className="page-subtitle">Business insights and reports</p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4" style={{ marginBottom: 'var(--spacing-8)' }}>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Revenue</span>
                        <div className="stat-card-icon">
                            <Banknote size={22} color="white" />
                        </div>
                    </div>
                    <div className="stat-card-value">{formatCurrency(stats?.total_revenue || 0)}</div>
                    <div className="stat-card-change positive">
                        <TrendingUp size={16} />
                        <span>This month</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Net Profit</span>
                        <div className="stat-card-icon" style={{ background: stats?.net_profit >= 0 ? 'var(--success-500)' : 'var(--error-500)' }}>
                            {stats?.net_profit >= 0 ? <TrendingUp size={22} color="white" /> : <TrendingDown size={22} color="white" />}
                        </div>
                    </div>
                    <div className="stat-card-value">{formatCurrency(stats?.net_profit || 0)}</div>
                    <div className={`stat-card-change ${stats?.net_profit >= 0 ? 'positive' : 'negative'}`}>
                        {stats?.net_profit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>Revenue - Expenses</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Client Growth</span>
                        <div className="stat-card-icon">
                            <Users size={22} color="white" />
                        </div>
                    </div>
                    <div className="stat-card-value">{clientStats?.new_clients_this_month || 0}</div>
                    <div className="stat-card-change positive">
                        <TrendingUp size={16} />
                        <span>{clientStats?.retention_rate || 0}% returning</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Appointments</span>
                        <div className="stat-card-icon">
                            <Calendar size={22} color="white" />
                        </div>
                    </div>
                    <div className="stat-card-value">{stats?.completed_appointments || 0}</div>
                    <div className="stat-card-change positive">
                        <TrendingUp size={16} />
                        <span>{stats?.cancelled_appointments || 0} cancelled</span>
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-2" style={{ marginBottom: 'var(--spacing-6)' }}>
                {/* Revenue Trend */}
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-4)' }}>Revenue Trend</h3>
                    <div style={{ height: 300 }}>
                        <Line data={revenueChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Appointments Trend */}
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-4)' }}>Appointments (Last 14 days)</h3>
                    <div style={{ height: 300 }}>
                        <Bar data={appointmentsChartData} options={{
                            ...chartOptions,
                            plugins: { ...chartOptions.plugins, legend: { display: true, position: 'top' } },
                        }} />
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-3" style={{ gap: 'var(--spacing-6)' }}>
                {/* Top Treatments */}
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-4)' }}>Top Treatments</h3>
                    <div style={{ height: 250 }}>
                        <Doughnut data={treatmentsChartData} options={{
                            ...chartOptions,
                            plugins: { legend: { position: 'bottom', labels: { color: '#a1a1aa' } } },
                        }} />
                    </div>
                </div>

                {/* Top Products */}
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-4)' }}>Top Products</h3>
                    {topProducts.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No product sales yet</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                            {topProducts.map((p, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: 'var(--spacing-3)',
                                    background: 'var(--surface-elevated)',
                                    borderRadius: 'var(--radius-md)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                                        <span style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: 'var(--radius-full)',
                                            background: 'var(--gradient-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 'var(--font-size-xs)',
                                            fontWeight: 600,
                                        }}>
                                            {i + 1}
                                        </span>
                                        <span>{p.name}</span>
                                    </div>
                                    <span style={{ fontWeight: 600, color: 'var(--primary-400)' }}>
                                        {p.quantity_sold} sold
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Client Stats */}
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-4)' }}>Client Overview</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                        <div style={{
                            padding: 'var(--spacing-4)',
                            background: 'var(--surface-elevated)',
                            borderRadius: 'var(--radius-lg)',
                            textAlign: 'center',
                        }}>
                            <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--primary-400)' }}>
                                {clientStats?.total_clients || 0}
                            </p>
                            <p style={{ color: 'var(--text-muted)' }}>Total Clients</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                            <div style={{
                                padding: 'var(--spacing-3)',
                                background: 'var(--surface-elevated)',
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center',
                            }}>
                                <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600 }}>
                                    {clientStats?.new_clients_this_month || 0}
                                </p>
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>New</p>
                            </div>
                            <div style={{
                                padding: 'var(--spacing-3)',
                                background: 'var(--surface-elevated)',
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center',
                            }}>
                                <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600 }}>
                                    {clientStats?.returning_clients || 0}
                                </p>
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Returning</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
