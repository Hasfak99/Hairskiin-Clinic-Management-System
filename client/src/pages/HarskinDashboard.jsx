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
    Sparkles
} from 'lucide-react';
import { analyticsAPI, appointmentsAPI, productsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function HarskinDashboard() {
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const statCards = [
        {
            title: 'Harskin Revenue',
            value: formatCurrency(stats?.total_revenue || 0),
            icon: Banknote,
            change: '+8.5%', // Mock data different from HairSkin to show difference
            positive: true,
        },
        {
            title: 'Active Clients',
            value: stats?.total_clients || 0,
            icon: Users,
            change: `+${stats?.new_clients_this_month || 0} this month`,
            positive: true,
        },
        {
            title: 'Treatments',
            value: stats?.total_appointments || 0,
            icon: Sparkles,
            change: `${stats?.completed_appointments || 0} completed`,
            positive: true,
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
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ color: 'var(--secondary-600)' }}>
                        Harskin Dashboard
                    </h1>
                    <p className="page-subtitle">
                        Welcome, {user?.full_name?.split(' ')[0] || user?.username} ({user?.branch_name || 'Head Office'}).
                    </p>
                </div>
                <Link to="/appointments" className="btn btn-secondary">
                    <Calendar size={18} />
                    New Harskin Booking
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3" style={{ marginBottom: 'var(--spacing-8)' }}>
                {statCards.map((stat, index) => (
                    <div key={index} className="stat-card" style={{ borderLeft: '4px solid var(--secondary-500)' }}>
                        <div className="stat-card-header">
                            <span className="stat-card-title">{stat.title}</span>
                            <div className="stat-card-icon" style={{ background: 'var(--secondary-500)' }}>
                                <stat.icon size={22} color="white" />
                            </div>
                        </div>
                        <div className="stat-card-value">{stat.value}</div>
                        <div className="stat-card-change positive">
                            <TrendingUp size={16} />
                            <span>{stat.change}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1" style={{ gap: 'var(--spacing-6)' }}>
                {/* Simplified view for Harskin for now */}
                <div className="card">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--spacing-6)',
                    }}>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                            Scheduled Treatments
                        </h3>
                    </div>

                    {todayAppointments.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--spacing-8)' }}>
                            <Calendar size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-4)' }} />
                            <p className="empty-state-title">No treatments scheduled</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                            {todayAppointments.slice(0, 5).map((apt) => (
                                <div
                                    key={apt.appointment_id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-4)',
                                        padding: 'var(--spacing-4)',
                                        background: 'var(--surface-elevated)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--border)',
                                    }}
                                >
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'var(--secondary-100)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--secondary-600)'
                                    }}>
                                        <Sparkles size={22} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 500 }}>{apt.client_name}</p>
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                                            {apt.treatment_name}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: 600, color: 'var(--secondary-600)' }}>
                                            {apt.appointment_time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
