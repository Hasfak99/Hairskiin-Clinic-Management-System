import { useState, useEffect } from 'react';
import { analyticsAPI } from '../api';
import { Calendar, Users, DollarSign, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function DoctorDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await analyticsAPI.getDoctorStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching doctor stats:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className="animate-pulse">Loading dashboard...</div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Doctor Dashboard</h1>
                    <p className="page-subtitle">Welcome back, Dr. {stats.doctor_name}</p>
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                    {format(new Date(), 'EEEE, MMMM do, yyyy')}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3" style={{ marginBottom: 'var(--spacing-8)' }}>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-card-icon">
                            <Calendar size={24} color="white" />
                        </div>
                        <span className="stat-card-title">Today's Appointments</span>
                    </div>
                    <div className="stat-card-value">{stats.today_appointments}</div>
                    <div className="stat-card-change" style={{ marginTop: 'var(--spacing-2)' }}>
                        Scheduled for today
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-card-icon">
                            <Users size={24} color="white" />
                        </div>
                        <span className="stat-card-title">Total Patients</span>
                    </div>
                    <div className="stat-card-value">{stats.total_patients}</div>
                    <div className="stat-card-change" style={{ marginTop: 'var(--spacing-2)' }}>
                        Unique patients treated
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-card-icon">
                            <DollarSign size={24} color="white" />
                        </div>
                        <span className="stat-card-title">My Revenue</span>
                    </div>
                    <div className="stat-card-value">LKR {stats.my_revenue.toLocaleString()}</div>
                    <div className="stat-card-change" style={{ marginTop: 'var(--spacing-2)' }}>
                        Total revenue generated
                    </div>
                </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="card">
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-4)',
                    paddingBottom: 'var(--spacing-4)',
                    borderBottom: '1px solid var(--border)'
                }}>
                    <h3>Upcoming Appointments</h3>
                    <button className="btn btn-ghost btn-sm">View All</button>
                </div>

                {stats.upcoming_appointments && stats.upcoming_appointments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                        {stats.upcoming_appointments.map(apt => (
                            <div key={apt.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: 'var(--spacing-4)',
                                background: 'var(--surface-elevated)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--border)'
                            }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '12px',
                                    background: 'var(--primary-100)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 'var(--spacing-4)'
                                }}>
                                    <Clock size={24} color="var(--primary-700)" />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-md)' }}>
                                        {apt.client_name}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                        {apt.treatment_name}
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 600 }}>
                                        {format(new Date(`${apt.date}T${apt.time}`), 'h:mm a')}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                        {format(new Date(apt.date), 'MMM d, yyyy')}
                                    </div>
                                </div>

                                <div style={{ marginLeft: 'var(--spacing-4)' }}>
                                    <span className={`badge ${apt.status === 'completed' ? 'badge-success' : 'badge-primary'}`}>
                                        {apt.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <Calendar size={48} className="empty-state-icon" />
                        <p>No upcoming appointments found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
