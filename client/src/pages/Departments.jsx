import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building } from 'lucide-react';
import { departmentsAPI, branchesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Departments() {
    const [departments, setDepartments] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const { isAdmin } = useAuth();
    const [formData, setFormData] = useState({
        department_name: '',
        description: '',
        branch_id: '',
    });

    useEffect(() => {
        if (isAdmin()) {
            fetchData();
        }
    }, []);

    const fetchData = async () => {
        try {
            const [deptRes, branchRes] = await Promise.all([
                departmentsAPI.getAll(),
                branchesAPI.getAll()
            ]);
            setDepartments(deptRes.data);
            setBranches(branchRes.data);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await departmentsAPI.getAll();
            setDepartments(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                branch_id: formData.branch_id ? parseInt(formData.branch_id) : null
            };

            if (selectedDepartment) {
                await departmentsAPI.update(selectedDepartment.department_id, payload);
                toast.success('Department updated');
            } else {
                await departmentsAPI.create(payload);
                toast.success('Department created');
            }
            setShowModal(false);
            resetForm();
            fetchDepartments();
        } catch (error) {
            console.error('Submission error:', error);
            const detail = error.response?.data?.detail;
            if (Array.isArray(detail)) {
                // Handle Pydantic validation errors
                const messages = detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('\n');
                toast.error(messages);
            } else {
                toast.error(typeof detail === 'string' ? detail : 'Failed to save department');
            }
        }
    };

    const handleEdit = (dept) => {
        setSelectedDepartment(dept);
        setFormData({
            department_name: dept.department_name || '',
            description: dept.description || '',
            branch_id: dept.branch_id || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (dept) => {
        if (!window.confirm(`Are you sure you want to delete ${dept.department_name}?`)) {
            return;
        }
        try {
            await departmentsAPI.delete(dept.department_id);
            toast.success('Department deleted');
            fetchDepartments();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to delete department');
        }
    };

    const resetForm = () => {
        setSelectedDepartment(null);
        setFormData({ department_name: '', description: '', branch_id: '' });
    };

    const columns = [
        {
            key: 'department_name',
            label: 'Department Name',
            render: (value, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <Building size={18} color="var(--primary)" />
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
        { key: 'description', label: 'Description' },
        { key: 'branch_name', label: 'Branch' },
        {
            key: 'created_at',
            label: 'Created',
            render: (value) => value ? format(new Date(value), 'MMM dd, yyyy') : '-',
        },
    ];

    if (!isAdmin()) {
        return (
            <div style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>
                <p>Access denied. Admin role required.</p>
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
                        Departments
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Manage clinic departments and units
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                >
                    <Plus size={20} />
                    Add Department
                </button>
            </div>

            <DataTable
                data={departments}
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
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => handleDelete(row)}
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                    </>
                )}
            />

            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                title={selectedDepartment ? 'Edit Department' : 'Add Department'}
            >
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                        <div>
                            <label className="label">Department Name *</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.department_name}
                                onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Branch</label>
                            <select
                                className="input"
                                value={formData.branch_id}
                                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                            >
                                <option value="">Select Branch</option>
                                {branches.map(branch => (
                                    <option key={branch.branch_id} value={branch.branch_id}>
                                        {branch.branch_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Description</label>
                            <textarea
                                className="input"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {selectedDepartment ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
