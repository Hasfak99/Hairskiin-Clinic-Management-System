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
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import { analyticsAPI, appointmentsAPI, productsAPI, billsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function HarskinDashboard() {
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
            // Only fetch pending bills for authorized roles
            const canApproveBills = ['manager', 'director', 'super_admin'].includes(user?.role?.toLowerCase());

            const promises = [
                analyticsAPI.getDashboard(),
                appointmentsAPI.getToday(),
            ];

            // Only add bills API call if user can approve
            if (canApproveBills) {
                promises.push(billsAPI.getAll({ edit_request_status: 'pending' }));
            }

            const results = await Promise.all(promises);

            setStats(results[0].data);
            setTodayAppointments(results[1].data);

            // Only set pending bills if we fetched them
            if (canApproveBills && results[2]) {
                setPendingBills(results[2].data.items || []);
            } else {
                setPendingBills([]);
            }
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
            permission: ['admin', 'super_admin', 'director'], // Restricted
        },
        {
            title: 'Active Clients',
            value: stats?.total_clients || 0,
            icon: Users,
            change: `+${stats?.new_clients_this_month || 0} this month`,
            positive: true,
            permission: 'all',
        },
        {
            title: 'Treatments',
            value: stats?.total_appointments || 0,
            icon: Sparkles,
            change: `${stats?.completed_appointments || 0} completed`,
            positive: true,
            permission: 'all',
        },
    ].filter(card => card.permission === 'all' || card.permission.includes(user?.role));

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

            {/* Pending Approvals Alert - Only for Managers/Directors/Super Admins */}
            {
                pendingBills.length > 0 && ['manager', 'director', 'super_admin'].includes(user?.role?.toLowerCase()) && (
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
                )
            }

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
