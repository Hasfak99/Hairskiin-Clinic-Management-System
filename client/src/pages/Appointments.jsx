import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { appointmentsAPI, clientsAPI, treatmentsAPI } from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [clients, setClients] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [formData, setFormData] = useState({
        client_id: '',
        treatment_id: '',
        appointment_date: format(new Date(), 'yyyy-MM-dd'),
        appointment_time: '10:00',
        notes: '',
    });
    const [selectedTreatment, setSelectedTreatment] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        size: 20,
        total: 0,
        pages: 1
    });

    useEffect(() => {
        fetchData();
    }, [pagination.page]);

    const fetchData = async () => {
        try {
            const [aptRes, clientRes, treatRes] = await Promise.all([
                appointmentsAPI.getAll({
                    page: pagination.page,
                    size: pagination.size
                }),
                clientsAPI.getAll(),
                treatmentsAPI.getAll(),
            ]);
            setAppointments(aptRes.data.items);
            setPagination(prev => ({
                ...prev,
                total: aptRes.data.total,
                pages: aptRes.data.pages
            }));
            setClients(clientRes.data.items || clientRes.data);
            setTreatments(treatRes.data.items || treatRes.data);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                branch_id: parseInt(localStorage.getItem('selectedBranchId') || '1'),
            };

            if (selectedAppointment) {
                await appointmentsAPI.update(selectedAppointment.appointment_id, payload);
                toast.success('Appointment updated');
            } else {
                await appointmentsAPI.create(payload);
                toast.success('Appointment booked');
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Operation failed');
        }
    };

    const handleStatusChange = async (apt, status) => {
        try {
            await appointmentsAPI.updateStatus(apt.appointment_id, status);
            toast.success(`Marked as ${status}`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (apt) => {
        if (!confirm('Cancel this appointment?')) return;
        try {
            await appointmentsAPI.cancel(apt.appointment_id);
            toast.success('Appointment cancelled');
            fetchData();
        } catch (error) {
            toast.error('Failed to cancel');
        }
    };

    const openEditModal = (apt) => {
        setSelectedAppointment(apt);
        setFormData({
            client_id: apt.client_id,
            treatment_id: apt.treatment_id,
            appointment_date: apt.appointment_date,
            appointment_time: apt.appointment_time,
            notes: apt.notes || '',
        });
        setSelectedTreatment(treatments.find(t => t.treatment_id === apt.treatment_id));
        setShowModal(true);
    };

    const resetForm = () => {
        setSelectedAppointment(null);
        setFormData({
            client_id: '',
            treatment_id: '',
            appointment_date: format(new Date(), 'yyyy-MM-dd'),
            appointment_time: '10:00',
            notes: '',
        });
        setSelectedTreatment(null);
    };

    const handleTreatmentChange = (treatmentId) => {
        const treatment = treatments.find(t => t.treatment_id === parseInt(treatmentId));
        setSelectedTreatment(treatment);
        setFormData({ ...formData, treatment_id: treatmentId });
    };

    const columns = [
        {
            key: 'client_name',
            label: 'Client',
            render: (val) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                    <div className="avatar avatar-sm">{val?.[0]}</div>
                    <span style={{ fontWeight: 500 }}>{val}</span>
                </div>
            ),
        },
        { key: 'treatment_name', label: 'Treatment' },
        {
            key: 'appointment_date',
            label: 'Date',
            render: (val) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <Calendar size={14} />
                    {format(new Date(val), 'MMM d, yyyy')}
                </div>
            ),
        },
        {
            key: 'appointment_time',
            label: 'Time',
            render: (val) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <Clock size={14} />
                    {val}
                </div>
            ),
        },
        {
            key: 'treatment_price',
            label: 'Price',
            render: (val) => `LKR ${val || 0}`,
        },
        {
            key: 'status',
            label: 'Status',
            render: (val) => (
                <span className={`badge ${val === 'completed' ? 'badge-success' :
                    val === 'cancelled' ? 'badge-error' : 'badge-primary'
                    }`}>
                    {val}
                </span>
            ),
        },
    ];

    const timeSlots = [];
    for (let h = 9; h < 18; h++) {
        timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Appointments</h1>
                    <p className="page-subtitle">Manage bookings and schedules</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowModal(true); }}
                >
                    <Plus size={18} />
                    Book Appointment
                </button>
            </div>

            <DataTable
                columns={columns}
                data={appointments}
                loading={loading}
                emptyMessage="No appointments found"
                pagination={{
                    currentPage: pagination.page,
                    totalPages: pagination.pages,
                    totalItems: pagination.total,
                    onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
                }}
                actions={(row) => (
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                        {row.status === 'booked' && (
                            <>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleStatusChange(row, 'completed')}
                                    title="Complete"
                                    style={{ color: 'var(--success-500)' }}
                                >
                                    <CheckCircle size={16} />
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => openEditModal(row)}
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                            </>
                        )}
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDelete(row)}
                            title="Cancel"
                            style={{ color: 'var(--error-500)' }}
                        >
                            <XCircle size={16} />
                        </button>
                    </div>
                )}
            />

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={selectedAppointment ? 'Edit Appointment' : 'Book Appointment'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {selectedAppointment ? 'Update' : 'Book'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                        <label className="input-label">Client *</label>
                        <select
                            className="input"
                            value={formData.client_id}
                            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                            required
                        >
                            <option value="">Select Client</option>
                            {clients.map(c => (
                                <option key={c.client_id} value={c.client_id}>
                                    {c.name} ({c.phone})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                        <label className="input-label">Treatment *</label>
                        <select
                            className="input"
                            value={formData.treatment_id}
                            onChange={(e) => handleTreatmentChange(e.target.value)}
                            required
                        >
                            <option value="">Select Treatment</option>
                            {treatments.map(t => (
                                <option key={t.treatment_id} value={t.treatment_id}>
                                    {t.treatment_name} - LKR {t.price}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedTreatment && (
                        <div style={{
                            padding: 'var(--spacing-4)',
                            background: 'var(--gradient-surface)',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: 'var(--spacing-4)',
                        }}>
                            <p style={{ fontWeight: 600, color: 'var(--primary-400)' }}>
                                LKR {selectedTreatment.price}
                            </p>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                                Duration: {selectedTreatment.duration} mins
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                        <div className="input-group">
                            <label className="input-label">Date *</label>
                            <input
                                type="date"
                                className="input"
                                value={formData.appointment_date}
                                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                                min={format(new Date(), 'yyyy-MM-dd')}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Time *</label>
                            <select
                                className="input"
                                value={formData.appointment_time}
                                onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                                required
                            >
                                {timeSlots.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Notes</label>
                        <textarea
                            className="input"
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
}
