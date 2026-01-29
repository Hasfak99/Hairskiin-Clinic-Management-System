import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react';
import { branchesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Branches() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const { isAdmin, isManager, refreshBranches } = useAuth();
    const [formData, setFormData] = useState({
        branch_name: '',
        address: '',
        phone: '',
        email: '',
    });

    useEffect(() => {
        if (isAdmin() || isManager()) {
            fetchBranches();
        }
    }, []);

    const fetchBranches = async () => {
        try {
            const response = await branchesAPI.getAll();
            setBranches(response.data);
        } catch (error) {
            toast.error('Failed to fetch branches');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedBranch) {
                await branchesAPI.update(selectedBranch.branch_id, formData);
                toast.success('Branch updated');
            } else {
                await branchesAPI.create(formData);
                toast.success('Branch created');
            }
            setShowModal(false);
            setSelectedBranch(null);
            setFormData({ branch_name: '', address: '', phone: '', email: '' });
            fetchBranches();
            // Refresh global context branches
            if (refreshBranches) await refreshBranches();
        } catch (error) {
            console.error('Submission error:', error);
            const detail = error.response?.data?.detail;
            if (Array.isArray(detail)) {
                // Handle Pydantic validation errors
                const messages = detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('\n');
                toast.error(messages);
            } else {
                toast.error(typeof detail === 'string' ? detail : 'Failed to save branch');
            }
        }
    };

    const handleEdit = (branch) => {
        setSelectedBranch(branch);
        setFormData({
            branch_name: branch.branch_name || '',
            address: branch.address || '',
            phone: branch.phone || '',
            email: branch.email || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (branch) => {
        if (!window.confirm(`Are you sure you want to delete ${branch.branch_name}?`)) {
            return;
        }
        try {
            await branchesAPI.delete(branch.branch_id);
            toast.success('Branch deleted');
            fetchBranches();
            // Refresh global context branches
            if (refreshBranches) await refreshBranches();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to delete branch');
        }
    };

    const columns = [
        {
            key: 'branch_name',
            label: 'Branch Name',
            render: (value, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <Building2 size={18} color="var(--primary)" />
                    <span style={{ fontWeight: 500 }}>{value}</span>
                    {!row.is_active && (
                        <span style={{
                            fontSize: 'var(--font-size-xs)',
                            padding: '2px 8px',
                            background: 'var(--surface-elevated)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-muted)'
                        }}>
                            Inactive
                        </span>
                    )}
                </div>
            ),
        },
        { key: 'address', label: 'Address' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        {
            key: 'created_at',
            label: 'Created',
            render: (value) => value ? format(new Date(value), 'MMM dd, yyyy') : '-',
        },
    ];

    if (!isAdmin() && !isManager()) {
        return (
            <div style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>
                <p>Access denied. Admin or Manager role required.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: 'var(--spacing-6)' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-6)',
            }}>
                <div>
                    <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--spacing-2)' }}>
                        Branch Management
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Manage branches and locations
                    </p>
                </div>
                {isAdmin() && (
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setSelectedBranch(null);
                            setFormData({ branch_name: '', address: '', phone: '', email: '' });
                            setShowModal(true);
                        }}
                    >
                        <Plus size={20} />
                        Add Branch
                    </button>
                )}
            </div>

            <DataTable
                data={branches}
                columns={columns}
                loading={loading}
                actions={(row) => (
                    <>
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => handleEdit(row)}
                            title="Edit"
                        >
                            <Edit2 size={18} />
                        </button>
                        {isAdmin() && (
                            <button
                                className="btn btn-ghost btn-icon"
                                onClick={() => handleDelete(row)}
                                title="Delete"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </>
                )}
            />

            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setSelectedBranch(null);
                    setFormData({ branch_name: '', address: '', phone: '', email: '' });
                }}
                title={selectedBranch ? 'Edit Branch' : 'Add Branch'}
            >
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                        <div>
                            <label className="label">Branch Name *</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.branch_name}
                                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Address</label>
                            <textarea
                                className="input"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="label">Phone</label>
                            <input
                                type="tel"
                                className="input"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                className="input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedBranch(null);
                                    setFormData({ branch_name: '', address: '', phone: '', email: '' });
                                }}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {selectedBranch ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
