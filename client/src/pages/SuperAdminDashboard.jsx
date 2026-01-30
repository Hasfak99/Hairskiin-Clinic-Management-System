import { useState, useEffect } from 'react';
import { Shield, Users, Building, Briefcase, DollarSign, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
    const { user } = useAuth();
    const [analyticsData, setAnalyticsData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await api.get('/analytics/super-admin');
                setAnalyticsData(response.data);
            } catch (error) {
                console.error("Error fetching super admin analytics:", error);
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        if (user?.role === 'super_admin') {
            fetchAnalytics();
        }
    }, [user]);

    if (!user || user.role !== 'super_admin') {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    if (loading) {
        return <div className="p-8 text-center">Loading analytics...</div>;
    }

    // Calculate Grand Totals
    const grandTotals = analyticsData.reduce((acc, curr) => ({
        total_users: acc.total_users + curr.total_users,
        total_branches: acc.total_branches + curr.total_branches,
        total_clients: acc.total_clients + curr.total_clients,
        total_revenue: acc.total_revenue + curr.total_revenue
    }), { total_users: 0, total_branches: 0, total_clients: 0, total_revenue: 0 });

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Super Admin Dashboard</h1>
                    <p className="page-subtitle">Overview of all departments and performance metrics</p>
                </div>
            </div>

            {/* Grand Totals Section */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Network Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Revenue"
                        value={`LKR ${grandTotals.total_revenue.toLocaleString()}`}
                        icon={<DollarSign size={24} color="var(--primary-600)" />}
                        bg="var(--primary-50)"
                    />
                    <StatCard
                        title="Total Clients"
                        value={grandTotals.total_clients}
                        icon={<Users size={24} color="var(--secondary-600)" />}
                        bg="var(--secondary-50)"
                    />
                    <StatCard
                        title="Total Branches"
                        value={grandTotals.total_branches}
                        icon={<Building size={24} color="var(--success-600)" />}
                        bg="var(--success-50)"
                    />
                    <StatCard
                        title="Total Users"
                        value={grandTotals.total_users}
                        icon={<Shield size={24} color="var(--warning-600)" />}
                        bg="var(--warning-50)"
                    />
                </div>
            </div>

            {/* Department Breakdown */}
            <div>
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Department Performance</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {analyticsData.map((dept) => (
                        <div key={dept.department_id} className="card p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold" style={{ color: 'var(--primary-700)' }}>{dept.department_name}</h3>
                                    <p className="text-sm text-gray-500">Department Overview</p>
                                </div>
                                <div className="p-2 rounded-lg bg-gray-100">
                                    <Briefcase size={20} className="text-gray-600" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                    <p className="text-sm text-gray-500 mb-1">Revenue</p>
                                    <p className="text-lg font-bold" style={{ color: 'var(--primary-600)' }}>
                                        LKR {dept.total_revenue.toLocaleString()}
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                    <p className="text-sm text-gray-500 mb-1">Clients</p>
                                    <p className="text-lg font-bold">{dept.total_clients}</p>
                                </div>
                                <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                    <p className="text-sm text-gray-500 mb-1">Branches</p>
                                    <p className="text-lg font-bold">{dept.total_branches}</p>
                                </div>
                                <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                    <p className="text-sm text-gray-500 mb-1">Users</p>
                                    <p className="text-lg font-bold">{dept.total_users}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, bg }) {
    return (
        <div className="card p-6 flex items-center gap-4">
            <div style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-lg)',
                background: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            </div>
        </div>
    );
}
