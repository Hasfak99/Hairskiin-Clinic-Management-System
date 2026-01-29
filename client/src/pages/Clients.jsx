import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Phone, Mail, User, History, QrCode, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { clientsAPI } from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Clients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrCodeData, setQRCodeData] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientHistory, setClientHistory] = useState({ appointments: [], bills: [] });
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        dob: '',
        notes: '',
    });
    const [pagination, setPagination] = useState({
        page: 1,
        size: 20,
        total: 0,
        pages: 1
    });

    useEffect(() => {
        fetchClients();
    }, [pagination.page]);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await clientsAPI.getAll({
                page: pagination.page,
                size: pagination.size
            });
            setClients(response.data.items);
            setPagination(prev => ({
                ...prev,
                total: response.data.total,
                pages: response.data.pages
            }));
        } catch (error) {
            toast.error('Failed to fetch clients');
        } finally {
            setLoading(false);
        }
    };

    const fetchClientHistory = async (clientId) => {
        try {
            const [aptRes, billRes] = await Promise.all([
                clientsAPI.getAppointments(clientId),
                clientsAPI.getBills(clientId),
            ]);
            setClientHistory({
                appointments: aptRes.data,
                bills: billRes.data,
            });
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Sanitize data: trim strings and convert empty/whitespace-only to null
        const sanitize = (val) => typeof val === 'string' ? (val.trim() === '' ? null : val.trim()) : val;

        const payload = {
            ...formData,
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            email: sanitize(formData.email),
            address: sanitize(formData.address),
            dob: sanitize(formData.dob),
            notes: sanitize(formData.notes),
            branch_id: parseInt(localStorage.getItem('selectedBranchId') || '1'),
        };

        console.log('CLIENT CREATE/UPDATE PAYLOAD:', payload);

        if (payload.phone && payload.phone.length < 10) {
            toast.error('Phone number must be at least 10 digits');
            return;
        }

        try {
            if (selectedClient) {
                await clientsAPI.update(selectedClient.client_id, payload);
                toast.success('Client updated successfully');
            } else {
                await clientsAPI.create(payload);
                toast.success('Client added successfully');
            }
            setShowModal(false);
            resetForm();
            fetchClients();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Operation failed');
        }
    };

    const handleDelete = async (client) => {
        if (!confirm(`Delete ${client.name}?`)) return;
        try {
            await clientsAPI.delete(client.client_id);
            toast.success('Client deleted');
            fetchClients();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Cannot delete client');
        }
    };

    const openEditModal = (client) => {
        setSelectedClient(client);
        setFormData({
            name: client.name,
            phone: client.phone,
            email: client.email || '',
            address: client.address || '',
            dob: client.dob || '',
            notes: client.notes || '',
        });
        setShowModal(true);
    };

    const openHistoryModal = async (client) => {
        setSelectedClient(client);
        await fetchClientHistory(client.client_id);
        setShowHistory(true);
    };

    const resetForm = () => {
        setSelectedClient(null);
        setFormData({ name: '', phone: '', email: '', address: '', dob: '', notes: '' });
    };

    const handleGenerateQR = async (client) => {
        try {
            const response = await clientsAPI.generateQR(client.client_id);
            const qrCode = response.data.qr_code;
            const qrUrl = `${window.location.origin}/client/${qrCode}`;
            setQRCodeData({
                client: client,
                qrCode: qrCode,
                qrUrl: qrUrl
            });
            setShowQRModal(true);
            toast.success('QR Code generated!');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to generate QR code');
        }
    };

    const handlePrintQR = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Client QR Code - ${qrCodeData?.client?.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
                    .card { border: 2px solid #333; padding: 30px; max-width: 300px; margin: 0 auto; border-radius: 12px; }
                    .name { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
                    .phone { color: #666; margin-bottom: 20px; }
                    .qr-container { margin: 20px 0; }
                    .footer { font-size: 12px; color: #999; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="name">${qrCodeData?.client?.name}</div>
                    <div class="phone">${qrCodeData?.client?.phone}</div>
                    <div class="qr-container">
                        ${document.getElementById('qr-code-svg').innerHTML}
                    </div>
                    <div class="footer">Scan to view profile</div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const columns = [
        {
            key: 'client_code',
            label: 'ID',
            render: (val) => (
                <span style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    background: 'var(--surface-muted)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                }}>
                    {val || '-'}
                </span>
            ),
        },
        {
            key: 'name',
            label: 'Name',
            render: (val, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                    <div className="avatar">{val?.[0]?.toUpperCase()}</div>
                    <span style={{ fontWeight: 500 }}>{val}</span>
                </div>
            ),
        },
        {
            key: 'phone',
            label: 'Phone',
            render: (val) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--text-secondary)' }}>
                    <Phone size={14} /> {val}
                </div>
            ),
        },
        {
            key: 'email',
            label: 'Email',
            render: (val) => val ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--text-secondary)' }}>
                    <Mail size={14} /> {val}
                </div>
            ) : '-',
        },
        {
            key: 'created_at',
            label: 'Joined',
            render: (val) => format(new Date(val), 'MMM d, yyyy'),
        },
    ];

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Clients</h1>
                    <p className="page-subtitle">Manage your client database</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowModal(true); }}
                >
                    <Plus size={18} />
                    Add Client
                </button>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={clients}
                loading={loading}
                emptyMessage="No clients found. Add your first client!"
                pagination={{
                    currentPage: pagination.page,
                    totalPages: pagination.pages,
                    totalItems: pagination.total,
                    onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
                }}
                actions={(row) => (
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleGenerateQR(row)}
                            title="Generate QR Code"
                            style={{ color: 'var(--primary-400)' }}
                        >
                            <QrCode size={16} />
                        </button>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => openHistoryModal(row)}
                            title="View History"
                        >
                            <History size={16} />
                        </button>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => openEditModal(row)}
                            title="Edit"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDelete(row)}
                            title="Delete"
                            style={{ color: 'var(--error-500)' }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            />

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={selectedClient ? 'Edit Client' : 'Add New Client'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {selectedClient ? 'Update' : 'Add'} Client
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-4)' }}>
                        <div className="input-group">
                            <label className="input-label">Name *</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Phone *</label>
                            <input
                                type="tel"
                                className="input"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Email</label>
                            <input
                                type="email"
                                className="input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Date of Birth</label>
                            <input
                                type="date"
                                className="input"
                                value={formData.dob}
                                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="input-group" style={{ marginTop: 'var(--spacing-4)' }}>
                        <label className="input-label">Address</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                    <div className="input-group" style={{ marginTop: 'var(--spacing-4)' }}>
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

            {/* History Modal */}
            <Modal
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                title={`${selectedClient?.name} - History`}
                size="lg"
            >
                <div style={{ display: 'flex', gap: 'var(--spacing-6)' }}>
                    {/* Appointments */}
                    <div style={{ flex: 1 }}>
                        <h4 style={{ marginBottom: 'var(--spacing-4)', color: 'var(--text-muted)' }}>
                            Recent Appointments
                        </h4>
                        {clientHistory.appointments.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                No appointments yet
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                                {clientHistory.appointments.slice(0, 5).map((apt) => (
                                    <div
                                        key={apt.appointment_id}
                                        style={{
                                            padding: 'var(--spacing-3)',
                                            background: 'var(--surface-elevated)',
                                            borderRadius: 'var(--radius-md)',
                                        }}
                                    >
                                        <p style={{ fontWeight: 500 }}>{apt.treatment_name}</p>
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                                            {apt.appointment_date} at {apt.appointment_time}
                                        </p>
                                        <span className={`badge badge-${apt.status === 'completed' ? 'success' : apt.status === 'cancelled' ? 'error' : 'primary'}`}>
                                            {apt.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bills */}
                    <div style={{ flex: 1 }}>
                        <h4 style={{ marginBottom: 'var(--spacing-4)', color: 'var(--text-muted)' }}>
                            Recent Bills
                        </h4>
                        {clientHistory.bills.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                No bills yet
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                                {clientHistory.bills.slice(0, 5).map((bill) => (
                                    <div
                                        key={bill.bill_id}
                                        style={{
                                            padding: 'var(--spacing-3)',
                                            background: 'var(--surface-elevated)',
                                            borderRadius: 'var(--radius-md)',
                                        }}
                                    >
                                        <p style={{ fontWeight: 500 }}>LKR {bill.final_amount}</p>
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                                            {format(new Date(bill.bill_date), 'MMM d, yyyy')}
                                        </p>
                                        <span className={`badge badge-${bill.payment_status === 'paid' ? 'success' : 'warning'}`}>
                                            {bill.payment_status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* QR Code Modal */}
            <Modal
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
                title={`QR Code - ${qrCodeData?.client?.name}`}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setShowQRModal(false)}>
                            Close
                        </button>
                        <button className="btn btn-primary" onClick={handlePrintQR}>
                            <Printer size={18} />
                            Print Card
                        </button>
                    </>
                }
            >
                <div style={{ textAlign: 'center', padding: 'var(--spacing-4)' }}>
                    <div id="qr-code-svg" style={{
                        display: 'inline-block',
                        padding: 'var(--spacing-4)',
                        background: 'white',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--spacing-4)'
                    }}>
                        {qrCodeData && (
                            <QRCodeSVG
                                value={qrCodeData.qrUrl}
                                size={200}
                                level="H"
                            />
                        )}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-2)' }}>
                        Scan this QR code to view client profile
                    </p>
                    <div style={{
                        background: 'var(--surface-elevated)',
                        padding: 'var(--spacing-3)',
                        borderRadius: 'var(--radius-md)',
                        wordBreak: 'break-all',
                        fontSize: 'var(--font-size-sm)'
                    }}>
                        <a
                            href={qrCodeData?.qrUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--primary-400)' }}
                        >
                            {qrCodeData?.qrUrl}
                        </a>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
