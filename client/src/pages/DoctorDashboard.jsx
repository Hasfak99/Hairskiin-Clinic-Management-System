import { useState, useEffect } from 'react';
import { analyticsAPI, appointmentsAPI, clientsAPI, treatmentsAPI } from '../api';
import { Calendar, Users, DollarSign, Clock, User, Plus, X, Search, CheckCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function DoctorDashboard() {
    const [stats, setStats] = useState(null);
    const [treatments, setTreatments] = useState([]); // History
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedTreatment, setSelectedTreatment] = useState(null);
    const [clients, setClients] = useState([]);
    const [treatmentOptions, setTreatmentOptions] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        client_id: '',
        treatment_id: '',
        notes: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
        loadMetadata();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, treatmentsRes] = await Promise.all([
                analyticsAPI.getDoctorStats(),
                analyticsAPI.getDoctorTreatments()
            ]);
            setStats(statsRes.data);
            setTreatments(treatmentsRes.data);
        } catch (error) {
            console.error('Error fetching doctor dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const loadMetadata = async () => {
        try {
            const [clientsRes, treatmentsRes] = await Promise.all([
                clientsAPI.getAll({ size: 100 }), // Get initial list
                treatmentsAPI.getAll({ size: 100 })
            ]);
            setClients(clientsRes.data.items);
            setTreatmentOptions(treatmentsRes.data.items);
        } catch (error) {
            console.error('Error loading metadata:', error);
        }
    };

    const handleSearchClients = async (query) => {
        setSearchTerm(query);
        if (query.length > 2) {
            try {
                // If we had a specific search API for clients, use it. 
                // For now filtering the loaded list or using getAll with search param if API supports it
                // Assuming clientsAPI.getAll supports 'search' or 'q'
                // Let's stick to loaded list filtering for simplicity if list is small, or regex
                // But typically we should hit API. clientsAPI.lookup is by phone.
                // searchAPI.search(query) is global.
            } catch (e) { }
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    const handleViewDetails = (treatment) => {
        setSelectedTreatment(treatment);
        setShowDetailsModal(true);
    };

    const handleCreateTreatment = async (e) => {
        e.preventDefault();
        try {
            if (!formData.client_id || !formData.treatment_id) {
                toast.error("Please select client and treatment");
                return;
            }

            const payload = {
                client_id: parseInt(formData.client_id),
                treatment_id: parseInt(formData.treatment_id),
                appointment_date: format(new Date(), 'yyyy-MM-dd'),
                appointment_time: format(new Date(), 'HH:mm'),
                notes: formData.notes,
                branch_id: 1, // Default to 1 or from user context
                status: 'completed', // Immediately completed as we are "Providing" it
                payment_status: 'pending'
            };

            // Create as appointment
            // Note: appointmentsAPI.create puts status='booked'. 
            // We might need to update it to completed immediately or if backend allows override.
            // My schemas don't show status in AppointmentCreate! passing it might be ignored.
            // Let's create then update status.

            const res = await appointmentsAPI.create(payload);

            // Immediately mark as completed
            await appointmentsAPI.updateStatus(res.data.appointment_id, 'completed');

            toast.success('Treatment recorded successfully');
            setShowModal(false);
            setFormData({ client_id: '', treatment_id: '', notes: '' });
            fetchData(); // Refresh
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Failed to record treatment');
        }
    };

    const handleMarkCompleted = async (id) => {
        if (!window.confirm("Mark this appointment as completed?")) return;
        try {
            await appointmentsAPI.updateStatus(id, 'completed');
            toast.success("Appointment completed");
            fetchData();
        } catch (error) {
            toast.error("Failed to update status");
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
                <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                        {format(new Date(), 'EEEE, MMMM do, yyyy')}
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} />
                        Provide New Treatment
                    </button>
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

                                <div style={{ textAlign: 'right', marginRight: 'var(--spacing-4)' }}>
                                    <div style={{ fontWeight: 600 }}>
                                        {format(new Date(`${apt.date}T${apt.time}`), 'h:mm a')}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                        {format(new Date(apt.date), 'MMM d, yyyy')}
                                    </div>
                                </div>

                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleMarkCompleted(apt.id)}
                                    title="Mark as Completed"
                                >
                                    <CheckCircle size={16} style={{ marginRight: '4px' }} />
                                    Complete
                                </button>
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

            {/* Treatment History Section */}
            <div className="card" style={{ marginTop: 'var(--spacing-8)' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-4)',
                    paddingBottom: 'var(--spacing-4)',
                    borderBottom: '1px solid var(--border)'
                }}>
                    <h3>My Treatment History</h3>
                </div>

                {treatments && treatments.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Treatment</th>
                                    <th>Date & Time</th>
                                    <th>Status</th>
                                    <th>Notes</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {treatments.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{t.client_name}</div>
                                            {t.client_phone && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{t.client_phone}</div>}
                                        </td>
                                        <td>{t.treatment_name}</td>
                                        <td>
                                            <div>{format(new Date(t.date), 'MMM d, yyyy')}</div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                                {format(new Date(`${t.date}T${t.time}`), 'h:mm a')}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${t.status === 'completed' ? 'badge-success' :
                                                    t.status === 'cancelled' ? 'badge-danger' : 'badge-primary'
                                                }`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: '300px', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                                            {t.notes ? (t.notes.length > 50 ? t.notes.substring(0, 50) + '...' : t.notes) : '-'}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => handleViewDetails(t)}
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <User size={48} className="empty-state-icon" />
                        <p>No treatment history found</p>
                    </div>
                )}
            </div>

            {/* Provide Treatment Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '500px', maxHeight: '90vh', overflow: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
                            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Provide New Treatment</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTreatment}>
                            {/* Client Selection */}
                            <div className="form-group">
                                <label>Select Client</label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search client by name or phone..."
                                        className="form-control"
                                        style={{ paddingLeft: '35px' }}
                                        value={searchTerm}
                                        onChange={(e) => handleSearchClients(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="form-control"
                                    style={{ marginTop: '8px' }}
                                    value={formData.client_id}
                                    onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                                    required
                                >
                                    <option value="">-- Select Client --</option>
                                    {filteredClients.map(c => (
                                        <option key={c.client_id} value={c.client_id}>
                                            {c.name} ({c.phone})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Treatment Selection */}
                            <div className="form-group">
                                <label>Treatment Given</label>
                                <select
                                    className="form-control"
                                    value={formData.treatment_id}
                                    onChange={e => setFormData({ ...formData, treatment_id: e.target.value })}
                                    required
                                >
                                    <option value="">-- Select Treatment --</option>
                                    {treatmentOptions.map(t => (
                                        <option key={t.treatment_id} value={t.treatment_id}>
                                            {t.treatment_name} (LKR {t.price}) - {t.duration} min
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Notes */}
                            <div className="form-group">
                                <label>Treatment Notes / Observations</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Enter any medical notes, products used, or observations..."
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-6)' }}>
                                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    Confirm & Complete
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {showDetailsModal && selectedTreatment && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '500px', padding: 'var(--spacing-6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
                            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Treatment Details</h2>
                            <button onClick={() => setShowDetailsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
                            <div>
                                <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Client</label>
                                <div style={{ fontWeight: 500 }}>{selectedTreatment.client_name}</div>
                                {selectedTreatment.client_phone && <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>{selectedTreatment.client_phone}</div>}
                            </div>

                            <div>
                                <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Treatment</label>
                                <div style={{ fontWeight: 500 }}>{selectedTreatment.treatment_name}</div>
                                {selectedTreatment.price > 0 && <div>LKR {selectedTreatment.price?.toLocaleString()}</div>}
                            </div>

                            <div>
                                <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Date & Time</label>
                                <div>{format(new Date(selectedTreatment.date), 'MMM d, yyyy')}</div>
                                <div>{format(new Date(`${selectedTreatment.date}T${selectedTreatment.time}`), 'h:mm a')}</div>
                            </div>

                            <div>
                                <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Status</label>
                                <div>
                                    <span className={`badge ${selectedTreatment.status === 'completed' ? 'badge-success' :
                                            selectedTreatment.status === 'cancelled' ? 'badge-danger' : 'badge-primary'
                                        }`}>
                                        {selectedTreatment.status}
                                    </span>
                                </div>
                                <div style={{ marginTop: '4px', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                    Payment: {selectedTreatment.payment_status || 'Pending'}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 'var(--spacing-4)' }}>
                            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Doctor's Notes</label>
                            <div style={{
                                padding: 'var(--spacing-3)',
                                background: 'var(--background)',
                                borderRadius: 'var(--radius-md)',
                                minHeight: '80px',
                                marginTop: 'var(--spacing-2)'
                            }}>
                                {selectedTreatment.notes || "No notes recorded."}
                            </div>
                        </div>

                        <div style={{ marginTop: 'var(--spacing-6)', textAlign: 'right' }}>
                            <button className="btn btn-primary" onClick={() => setShowDetailsModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
