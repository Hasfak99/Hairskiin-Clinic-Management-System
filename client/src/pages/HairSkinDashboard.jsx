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
    Mail
} from 'lucide-react';
import { analyticsAPI, appointmentsAPI, productsAPI, billsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function HairSkinDashboard() {
    const [stats, setStats] = useState(null);
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, isManager } = useAuth(); // Get isManager

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, appointmentsRes, pendingRes] = await Promise.all([
                analyticsAPI.getDashboard(),
                appointmentsAPI.getToday(),
                billsAPI.getAll({ edit_request_status: 'pending', size: 100 }), // Fetch pending
            ]);
            setStats(statsRes.data);
            setTodayAppointments(appointmentsRes.data);
            setPendingApprovals(pendingRes.data.items || []);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveEdit = async (billId) => {
        try {
            await billsAPI.approveEdit(billId);
            toast.success('Approved!');
            // Refresh ONLY dashboard data to remove the item
            fetchDashboardData();
        } catch (error) {
            toast.error('Failed to approve');
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
            title: 'Total Revenue',
            value: formatCurrency(stats?.total_revenue || 0),
            icon: Banknote,
            change: '+12.5%',
            positive: true,
        },
        {
            title: 'Total Clients',
            value: stats?.total_clients || 0,
            icon: Users,
            change: `+${stats?.new_clients_this_month || 0} this month`,
            positive: true,
        },
        {
            title: 'Appointments',
            value: stats?.total_appointments || 0,
            icon: Calendar,
            change: `${stats?.completed_appointments || 0} completed`,
            positive: true,
        },
        {
            title: 'Low Stock',
            value: stats?.low_stock_products || 0,
            icon: Package,
            change: 'Products need restock',
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
                        Hair Skin Clinic Dashboard
                    </h1>
                    <p className="page-subtitle">
                        Welcome back, {user?.full_name?.split(' ')[0] || user?.username}! 👋 ({user?.branch_name || 'Head Office'})
                    </p>
                </div>
                <Link to="/appointments" className="btn btn-primary">
                    <Calendar size={18} />
                    New Appointment
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4" style={{ marginBottom: 'var(--spacing-8)' }}>
                {statCards.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-title">{stat.title}</span>
                            <div className="stat-card-icon">
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
            <div className={`grid grid-cols-${isManager() && pendingApprovals.length > 0 ? '3' : '2'}`} style={{ gap: 'var(--spacing-6)' }}>

                {/* Pending Approvals (Debug Mode: Always Show) */}
                {true && (
                    <div className="card" style={{ borderColor: 'var(--warning-200)', background: 'var(--warning-50)' }}>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--warning-700)', marginBottom: 'var(--spacing-4)' }}>
                            ⚠️ Pending Approvals ({pendingApprovals.length})
                        </h3>
                        {pendingApprovals.length === 0 ? (
                            <p>No pending approvals found.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                                {pendingApprovals.map(bill => (
                                    <div key={bill.bill_id} style={{
                                        background: 'white',
                                        padding: 'var(--spacing-3)',
                                        borderRadius: 'var(--radius-md)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Bill #{bill.bill_id}</p>
                                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{bill.client_name}</p>
                                            <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500 }}>LKR {bill.final_amount}</p>
                                        </div>
                                        <button
                                            className="btn btn-warning btn-sm"
                                            onClick={() => handleApproveEdit(bill.bill_id)}
                                            title="Approve Edit Request"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Today's Appointments */}
                <div className="card">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--spacing-6)',
                    }}>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                            Today's Appointments
                        </h3>
                        <Link to="/appointments" className="btn btn-ghost btn-sm">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>

                    {todayAppointments.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--spacing-8)' }}>
                            <Calendar size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-4)' }} />
                            <p className="empty-state-title">No appointments today</p>
                            <p className="empty-state-description">Enjoy your free day or book new appointments</p>
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
                                        background: apt.status === 'completed' ? 'var(--success-500)' :
                                            apt.status === 'cancelled' ? 'var(--error-500)' : 'var(--gradient-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Clock size={22} color="white" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 500 }}>{apt.client_name}</p>
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                                            {apt.treatment_name}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: 600, color: 'var(--primary-400)' }}>
                                            {apt.appointment_time}
                                        </p>
                                        <span className={`badge ${apt.status === 'completed' ? 'badge-success' :
                                            apt.status === 'cancelled' ? 'badge-error' : 'badge-primary'
                                            }`}>
                                            {apt.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <h3 style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: 600,
                        marginBottom: 'var(--spacing-6)',
                    }}>
                        Quick Actions
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-4)' }}>
                        <Link to="/clients" className="btn btn-secondary btn-lg" style={{ flexDirection: 'column', height: 100, gap: 'var(--spacing-2)' }}>
                            <Users size={24} />
                            <span>Add Client</span>
                        </Link>
                        <Link to="/appointments" className="btn btn-secondary btn-lg" style={{ flexDirection: 'column', height: 100, gap: 'var(--spacing-2)' }}>
                            <Calendar size={24} />
                            <span>Book Appointment</span>
                        </Link>
                        <Link to="/billing" className="btn btn-secondary btn-lg" style={{ flexDirection: 'column', height: 100, gap: 'var(--spacing-2)' }}>
                            <Banknote size={24} />
                            <span>Create Bill</span>
                        </Link>
                        <Link to="/products" className="btn btn-secondary btn-lg" style={{ flexDirection: 'column', height: 100, gap: 'var(--spacing-2)' }}>
                            <Package size={24} />
                            <span>Manage Products</span>
                        </Link>

                        <button
                            className="btn btn-secondary btn-lg"
                            style={{ flexDirection: 'column', height: 100, gap: 'var(--spacing-2)' }}
                            onClick={handleLowStockNotify}
                        >
                            <Mail size={24} />
                            <span>Email Stock Report</span>
                        </button>
                    </div>

                    {/* Net Profit Summary */}
                    <div style={{
                        marginTop: 'var(--spacing-6)',
                        padding: 'var(--spacing-5)',
                        background: '#ffffff',
                        border: '2px solid #000000',
                        borderRadius: 'var(--radius-xl)',
                    }}>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: '#666666', fontWeight: 500 }}>Net Profit (This Month)</p>
                        <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: '#000000' }}>
                            {formatCurrency(stats?.net_profit || 0)}
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
}
