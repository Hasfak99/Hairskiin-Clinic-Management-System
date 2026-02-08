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
    Sparkles,
    Briefcase,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import { analyticsAPI, appointmentsAPI, productsAPI, billsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function HarskinDirectorDashboard() {
    const [stats, setStats] = useState(null);
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [pendingBills, setPendingBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, appointmentsRes, billsRes] = await Promise.all([
                analyticsAPI.getDashboard(),
                appointmentsAPI.getToday(),
                billsAPI.getAll({ edit_request_status: 'pending' }),
            ]);
            setStats(statsRes.data);
            setTodayAppointments(appointmentsRes.data);
            setPendingBills(billsRes.data.items || []);
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
            title: 'Harskin Revenue',
            value: formatCurrency(stats?.total_revenue || 0),
            icon: Banknote,
            change: '+22.5%',
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
            title: 'Treatments Performed',
            value: stats?.completed_appointments || 0,
            icon: Sparkles,
            change: "Top Performance",
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
                        Harskin Director Dashboard
                    </h1>
                    <p className="page-subtitle">
                        Brand Operations | {user?.full_name || 'Director'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    <button className="btn btn-secondary">
                        <Sparkles size={18} />
                        Campaign Manager
                    </button>
                    <Link to="/appointments" className="btn btn-primary" style={{ background: 'var(--secondary-500)', borderColor: 'var(--secondary-500)' }}>
                        <Calendar size={18} />
                        View Bookings
                    </Link>
                </div>
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
                        <div className="stat-card-value" style={{ color: 'var(--secondary-700)' }}>{stat.value}</div>
                        <div className="stat-card-change positive">
                            <TrendingUp size={16} />
                            <span>{stat.change}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pending Approvals Alert */}
            {pendingBills.length > 0 && (
                <div className="card" style={{
                    marginBottom: 'var(--spacing-8)',
                    borderLeft: '4px solid #f59e0b',
                    background: '#fffbeb'
                }}>
                    <div style={{ marginBottom: 'var(--spacing-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-3)' }}>
                            <div style={{
                                background: '#fef3c7',
                                padding: '12px',
                                borderRadius: '50%',
                                color: '#d97706'
                            }}>
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 style={{ color: '#92400e', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                                    {pendingBills.length} Bill{pendingBills.length !== 1 ? 's' : ''} Awaiting Your Approval
                                </h3>
                                <p style={{ color: '#b45309', margin: 0 }}>
                                    Staff have requested permission to edit these paid bills.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* List of Pending Bills */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                        {pendingBills.map((bill) => (
                            <div key={bill.bill_id} style={{
                                background: 'white',
                                padding: 'var(--spacing-3)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid #fde68a',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#92400e' }}>
                                        Bill #{bill.bill_id.toString().padStart(4, '0')} - {bill.client_name}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#b45309' }}>
                                        LKR {bill.final_amount} • {bill.branch_name}
                                    </div>
                                </div>
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={async () => {
                                        try {
                                            await billsAPI.approveEditRequest(bill.bill_id);
                                            toast.success('Edit request approved!');
                                            fetchDashboardData(); // Refresh
                                        } catch (error) {
                                            toast.error('Failed to approve request');
                                        }
                                    }}
                                >
                                    <CheckCircle size={16} />
                                    Approve
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-3" style={{ gap: 'var(--spacing-6)' }}>
                {/* Net Profit Summary - Harskin Themed */}
                <div className="card col-span-2" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)', color: 'white', border: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-6)' }}>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Performance Metrics</h3>
                        <Banknote size={24} style={{ opacity: 0.5 }} />
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-6)' }}>
                        <p style={{ fontSize: 'var(--font-size-sm)', opacity: 0.8, marginBottom: 'var(--spacing-1)' }}>Harskin Net Profit</p>
                        <p style={{ fontSize: '42px', fontWeight: 700, color: '#ffffff' }}>
                            {formatCurrency(stats?.net_profit || 0)}
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 'var(--spacing-4)' }}>
                        <div>
                            <p style={{ fontSize: 'var(--font-size-sm)', opacity: 0.8 }}>Target</p>
                            <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{formatCurrency((stats?.net_profit || 0) * 1.3)}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 'var(--font-size-sm)', opacity: 0.8 }}>Engagement</p>
                            <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: '#a7f3d0' }}>High</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <h3 style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: 600,
                        marginBottom: 'var(--spacing-6)',
                    }}>
                        Harskin Actions
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                        <Link to="/users" className="btn btn-secondary btn-lg" style={{ justifyContent: 'flex-start', gap: 'var(--spacing-3)', color: 'var(--secondary-700)' }}>
                            <Users size={20} />
                            <span>Staff Management</span>
                        </Link>
                        <Link to="/analytics" className="btn btn-secondary btn-lg" style={{ justifyContent: 'flex-start', gap: 'var(--spacing-3)', color: 'var(--secondary-700)' }}>
                            <TrendingUp size={20} />
                            <span>Sales Reports</span>
                        </Link>
                    </div>
                </div>
            </div>

        </div >
    );
}
