import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { appointmentsAPI, clientsAPI, treatmentsAPI, departmentsAPI, branchesAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [clients, setClients] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [branches, setBranches] = useState([]);
    const [stylists, setStylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const { user, selectedBranch, isAdmin } = useAuth();

    // Quick Client Creation State
    const [createClientMode, setCreateClientMode] = useState(false);
    const [newClientData, setNewClientData] = useState({
        name: '',
        phone: '',
    });

    const [formData, setFormData] = useState({
        client_id: '',
        treatment_id: '',
        branch_id: '',
        department_id: '',
        stylist_id: '',
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
            const [aptRes, clientRes, treatRes, deptRes, branchRes] = await Promise.all([
                appointmentsAPI.getAll({
                    page: pagination.page,
                    size: pagination.size
                }),
                clientsAPI.getAll(),
                treatmentsAPI.getAll(),
                departmentsAPI.getAll(),
                branchesAPI.getAll(),
                usersAPI.getAll(), // Fetch all users to filter as stylists
            ]);
            setAppointments(aptRes.data.items);
            setPagination(prev => ({
                ...prev,
                total: aptRes.data.total,
                pages: aptRes.data.pages
            }));
            setClients(clientRes.data.items || clientRes.data);
            setTreatments(treatRes.data.items || treatRes.data);
            setDepartments(deptRes.data);
            setBranches(branchRes.data);
            // Filter users who can be stylists (all for now, or specific roles)
            setBranches(branchRes.data);
            // Filter users who can be stylists (doctors only)
            setStylists(branchRes.data ? (await usersAPI.getAll({ role: 'doctor' })).data.items : []);
            // Better to optimize this later, but reusing response

        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let finalClientId = formData.client_id;
            const finalBranchId = formData.branch_id ? parseInt(formData.branch_id) : (user?.branch_id || selectedBranch?.branch_id || 1);

            // Handle New Client Creation
            if (createClientMode) {
                if (!newClientData.name || !newClientData.phone) {
                    toast.error('Please enter Name and Phone for new client');
                    return;
                }
                const clientRes = await clientsAPI.create({
                    name: newClientData.name,
                    phone: newClientData.phone,
                    branch_id: finalBranchId
                });
                finalClientId = clientRes.data.client_id;
            } else if (!finalClientId) {
                toast.error('Please select a client');
                return;
            }

            const payload = {
                ...formData,
                client_id: finalClientId,
                branch_id: finalBranchId,
                // Ensure IDs are integers or null, checking for both empty string and 0 if valid (though IDs usually > 0)
                treatment_id: formData.treatment_id ? parseInt(formData.treatment_id) : null,
                department_id: formData.department_id ? parseInt(formData.department_id) : null,
                stylist_id: formData.stylist_id ? parseInt(formData.stylist_id) : null,
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
            console.error(error);
            const detail = error.response?.data?.detail;
            if (typeof detail === 'object') {
                toast.error(JSON.stringify(detail));
            } else {
                toast.error(detail || 'Operation failed');
            }
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

    const handleHardDelete = async (apt) => {
        if (!confirm('PERMANENTLY DELETE this appointment? This cannot be undone.')) return;
        try {
            await appointmentsAPI.deletePermanently(apt.appointment_id);
            toast.success('Appointment deleted permanently');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const openEditModal = (apt) => {
        setSelectedAppointment(apt);
        setFormData({
            client_id: apt.client_id,
            treatment_id: apt.treatment_id,
            appointment_date: apt.appointment_date,
            appointment_time: apt.appointment_time,
            department_id: apt.department_id || '',
            branch_id: apt.branch_id || '',
            stylist_id: apt.stylist_id || '',
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
            department_id: user?.department_id || '',
            branch_id: user?.branch_id || selectedBranch?.branch_id || '',
            stylist_id: '',
            notes: '',
        });
        setSelectedTreatment(null);
        setCreateClientMode(false);
        setNewClientData({ name: '', phone: '' });
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
            key: 'department_name',
            label: 'Department',
            render: (val) => val || '-'
        },
        {
            key: 'branch_name',
            label: 'Branch',
            render: (val) => val || '-'
        },
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
            key: 'stylist_name',
            label: 'Doctor / Stylist',
            render: (val) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <User size={14} className="text-muted" />
                    <span>{val || 'Unassigned'}</span>
                </div>
            )
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
                        {isAdmin() && (
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleHardDelete(row)}
                                title="Delete Permanently"
                                style={{ color: '#991b1b' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                            <label className="input-label" style={{ marginBottom: 0 }}>Client *</label>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setCreateClientMode(!createClientMode)}
                                style={{ color: 'var(--primary-600)', fontWeight: 500 }}
                            >
                                {createClientMode ? 'Select Existing Client' : 'New Client ?'}
                            </button>
                        </div>

                        {!createClientMode ? (
                            <SearchableSelect
                                label=""
                                placeholder="Select Client"
                                options={clients.map(c => ({
                                    value: c.client_id,
                                    label: `${c.name} (${c.phone})`
                                }))}
                                value={formData.client_id}
                                onChange={(val) => setFormData({ ...formData, client_id: val })}
                                required={!createClientMode}
                            />
                        ) : (
                            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Client Name"
                                    value={newClientData.name}
                                    onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                                    style={{ flex: 1 }}
                                    required={createClientMode}
                                />
                                <input
                                    type="tel"
                                    className="input"
                                    placeholder="Phone Number"
                                    value={newClientData.phone}
                                    onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                                    style={{ flex: 1 }}
                                    required={createClientMode}
                                />
                            </div>
                        )}
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                        <SearchableSelect
                            label="Treatment *"
                            placeholder="Select Treatment"
                            options={treatments.map(t => ({
                                value: t.treatment_id,
                                label: `${t.treatment_name} - LKR ${t.price}`
                            }))}
                            value={formData.treatment_id}
                            onChange={handleTreatmentChange}
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                        <label className="input-label">Branch</label>
                        {user?.branch_id ? (
                            <input
                                type="text"
                                className="input disabled"
                                value={branches.find(b => b.branch_id === user.branch_id)?.branch_name || ''}
                                disabled
                                readOnly
                            />
                        ) : (
                            <select
                                className="input"
                                value={formData.branch_id}
                                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                            >
                                <option value="">Default (Your Branch)</option>
                                {branches.map(b => (
                                    <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                        <label className="input-label">Department</label>
                        {user?.department_id ? (
                            <input
                                type="text"
                                className="input disabled"
                                value={departments.find(d => d.department_id === user.department_id)?.department_name || ''}
                                disabled
                                readOnly
                            />
                        ) : (
                            <select
                                className="input"
                                value={formData.department_id}
                                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                            >
                                <option value="">Select Department</option>
                                {departments.map(d => (
                                    <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                        <label className="input-label">Doctor / Stylist</label>
                        <select
                            className="input"
                            value={formData.stylist_id}
                            onChange={(e) => setFormData({ ...formData, stylist_id: e.target.value })}
                        >
                            <option value="">-- Select Doctor/Stylist --</option>
                            {stylists.map(s => (
                                <option key={s.user_id} value={s.user_id}>
                                    {s.full_name || s.username} ({s.role})
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
