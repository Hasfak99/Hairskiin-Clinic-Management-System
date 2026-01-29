import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    Users,
    Calendar,
    Banknote,
    Package,
    ArrowRight,
    Clock,
    Mail,
    Briefcase
} from 'lucide-react';
import { analyticsAPI, appointmentsAPI, productsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function HairSkinDirectorDashboard() {
    const [stats, setStats] = useState(null);
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, appointmentsRes] = await Promise.all([
                analyticsAPI.getDashboard(),
                appointmentsAPI.getToday(),
            ]);
            setStats(statsRes.data);
            setTodayAppointments(appointmentsRes.data);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLowStockNotify = async () => {
        try {
            const promise = productsAPI.sendLowStockReport();
            toast.promise(promise, {
                loading: 'Checking inventory...',
                success: (data) => `Report sent! ${data.data.count} items found.`,
                error: 'Failed to send report',
            });
        } catch (error) {
            console.error(error);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const statCards = [
        {
            title: 'Global Revenue',
            value: formatCurrency(stats?.total_revenue || 0),
            icon: Banknote,
            change: '+12.5%',
            positive: true,
        },
        {
            title: 'Total Active Clients',
            value: stats?.total_clients || 0,
            icon: Users,
            change: `+${stats?.new_clients_this_month || 0} this month`,
            positive: true,
        },
        {
            title: 'Operations',
            value: stats?.total_appointments || 0,
            icon: Briefcase,
            change: `${stats?.completed_appointments || 0} completed`,
            positive: true,
        },
        {
            title: 'Inventory Alert',
            value: stats?.low_stock_products || 0,
            icon: Package,
            change: 'Items below threshold',
            positive: stats?.low_stock_products === 0,
        },
    ];

    if (loading) {
        return (
            <div>
                <div className="page-header">
                    <div>
                        <div className="skeleton" style={{ width: 200, height: 32, marginBottom: 8 }}></div>
                        <div className="skeleton" style={{ width: 300, height: 20 }}></div>
                    </div>
                </div>
                <div className="grid grid-cols-4" style={{ marginBottom: 'var(--spacing-6)' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton" style={{ height: 160 }}></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        Hair Skin Clinic Director Dashboard
                    </h1>
                    <p className="page-subtitle">
                        Global Operations Overview | {user?.full_name || 'Director'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    <button className="btn btn-secondary" disabled>
                        High Level View
                    </button>
                    <Link to="/appointments" className="btn btn-primary">
                        <Calendar size={18} />
                        View Appointments
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4" style={{ marginBottom: 'var(--spacing-8)' }}>
                {statCards.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-title">{stat.title}</span>
                            <div className="stat-card-icon" style={{ background: index === 0 ? 'var(--warning-500)' : undefined }}> {/* Gold/Amber for Revenue */}
                                <stat.icon size={22} color="white" />
                            </div>
                        </div>
                        <div className="stat-card-value">{stat.value}</div>
                        <div className={`stat-card-change ${stat.positive ? 'positive' : 'negative'}`}>
                            {stat.positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            <span>{stat.change}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-3" style={{ gap: 'var(--spacing-6)' }}>
                {/* Net Profit Summary - Prominent for Director - Spans 2 cols */}
                <div className="card col-span-2" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', color: 'white', border: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-6)' }}>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Financial Performance</h3>
                        <Banknote size={24} style={{ opacity: 0.5 }} />
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-6)' }}>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: '#999', marginBottom: 'var(--spacing-1)' }}>Total Net Profit (Month)</p>
                        <p style={{ fontSize: '42px', fontWeight: 700, color: '#fbbf24' }}>
                            {formatCurrency(stats?.net_profit || 0)}
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', borderTop: '1px solid #333', paddingTop: 'var(--spacing-4)' }}>
                        <div>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: '#999' }}>Projected Revenue</p>
                            <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{formatCurrency((stats?.total_revenue || 0) * 1.15)}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: '#999' }}>Growth Projection</p>
                            <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: '#4ade80' }}>+15%</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions - 1 col */}
                <div className="card">
                    <h3 style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: 600,
                        marginBottom: 'var(--spacing-6)',
                    }}>
                        Quick Actions
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                        <Link to="/users" className="btn btn-secondary btn-lg" style={{ justifyContent: 'flex-start', gap: 'var(--spacing-3)' }}>
                            <Users size={20} />
                            <span>Manage Staff</span>
                        </Link>
                        <Link to="/analytics" className="btn btn-secondary btn-lg" style={{ justifyContent: 'flex-start', gap: 'var(--spacing-3)' }}>
                            <TrendingUp size={20} />
                            <span>Full Analytics</span>
                        </Link>
                        <Link to="/products" className="btn btn-secondary btn-lg" style={{ justifyContent: 'flex-start', gap: 'var(--spacing-3)' }}>
                            <Package size={20} />
                            <span>Inventory</span>
                        </Link>
                        <button
                            className="btn btn-secondary btn-lg"
                            style={{ justifyContent: 'flex-start', gap: 'var(--spacing-3)' }}
                            onClick={handleLowStockNotify}
                        >
                            <Mail size={20} />
                            <span>Email Stock Report</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Activity / Today's Appointments */}
            <div className="card" style={{ marginTop: 'var(--spacing-6)' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--spacing-6)',
                }}>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                        Live Operations
                    </h3>
                    <Link to="/appointments" className="btn btn-ghost btn-sm">
                        View Scheduler <ArrowRight size={16} />
                    </Link>
                </div>

                {todayAppointments.length === 0 ? (
                    <div className="empty-state" style={{ padding: 'var(--spacing-4)' }}>
                        <p className="empty-state-title">No appointments today</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-4)' }}>
                        {todayAppointments.slice(0, 6).map((apt) => (
                            <div
                                key={apt.appointment_id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-4)',
                                    padding: 'var(--spacing-3)',
                                    background: 'var(--surface-muted)',
                                    borderRadius: 'var(--radius-md)',
                                }}
                            >
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 'var(--radius-md)',
                                    background: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid var(--border)'
                                }}>
                                    <Clock size={18} color="var(--text-secondary)" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{apt.client_name}</p>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                        {apt.treatment_name}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                                        {apt.appointment_time}
                                    </p>
                                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: apt.status === 'completed' ? 'var(--success-500)' : 'var(--primary-500)' }}>
                                        {apt.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
