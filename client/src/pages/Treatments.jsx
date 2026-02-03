import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Scissors, Clock, Banknote } from 'lucide-react';
import { treatmentsAPI, branchesAPI, departmentsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Treatments() {
    const [treatments, setTreatments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const { user, selectedBranch } = useAuth();
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedTreatment, setSelectedTreatment] = useState(null);
    const [formData, setFormData] = useState({
        treatment_name: '',
        description: '',
        price: '',
        duration: '',
        category: '',
        branch_id: '',
        department_id: '',
    });
    const [pagination, setPagination] = useState({
        page: 1,
        size: 20,
        total: 0,
        pages: 1
    });

    useEffect(() => {
        fetchTreatments();
        fetchCategories();
        fetchBranches();
        fetchDepartments();
    }, [pagination.page]);

    const fetchTreatments = async () => {
        try {
            setLoading(true);
            const response = await treatmentsAPI.getAll({
                active_only: false,
                page: pagination.page,
                size: pagination.size
            });
            setTreatments(response.data.items);
            setPagination(prev => ({
                ...prev,
                total: response.data.total,
                pages: response.data.pages
            }));
        } catch (error) {
            toast.error('Failed to fetch treatments');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await treatmentsAPI.getCategories();
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await branchesAPI.getAll();
            setBranches(response.data);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await departmentsAPI.getAll();
            setDepartments(response.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const sanitize = (val) => typeof val === 'string' ? (val.trim() === '' ? null : val.trim()) : val;

        try {
            const data = {
                treatment_name: formData.treatment_name.trim(),
                description: sanitize(formData.description),
                price: parseFloat(formData.price),
                duration: parseInt(formData.duration),
                category: sanitize(formData.category),
                branch_id: formData.branch_id ? parseInt(formData.branch_id) : (user?.branch_id || selectedBranch?.branch_id || 1),
                department_id: formData.department_id ? parseInt(formData.department_id) : (user?.department_id || null),
            };

            if (isNaN(data.price) || data.price <= 0) {
                toast.error('Please enter a valid price');
                return;
            }

            if (selectedTreatment) {
                await treatmentsAPI.update(selectedTreatment.treatment_id, data);
                toast.success('Treatment updated');
            } else {
                await treatmentsAPI.create(data);
                toast.success('Treatment added');
            }
            setShowModal(false);
            resetForm();
            fetchTreatments();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Operation failed');
        }
    };

    const handleDelete = async (treatment) => {
        if (!confirm(`Delete ${treatment.treatment_name}?`)) return;
        try {
            await treatmentsAPI.delete(treatment.treatment_id);
            toast.success('Treatment deleted');
            fetchTreatments();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const openEditModal = (treatment) => {
        setSelectedTreatment(treatment);
        setFormData({
            treatment_name: treatment.treatment_name,
            description: treatment.description || '',
            price: treatment.price.toString(),
            duration: treatment.duration.toString(),
            category: treatment.category || '',
            branch_id: treatment.branch_id?.toString() || '',
            department_id: treatment.department_id?.toString() || '',
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setSelectedTreatment(null);
        setFormData({
            treatment_name: '',
            description: '',
            price: '',
            duration: '',
            category: '',
            branch_id: user?.branch_id || selectedBranch?.branch_id || '',
            department_id: user?.department_id || ''
        });
    };

    const columns = [
        {
            key: 'treatment_code',
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
            key: 'treatment_name',
            label: 'Name',
            render: (val) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Scissors size={18} color="white" />
                    </div>
                    <span style={{ fontWeight: 500 }}>{val}</span>
                </div>
            ),
        },
        { key: 'category', label: 'Category', render: (val) => val || '-' },
        {
            key: 'price',
            label: 'Price',
            render: (val) => (
                <span style={{ fontWeight: 600, color: 'var(--primary-400)' }}>
                    LKR {val}
                </span>
            ),
        },
        {
            key: 'duration',
            label: 'Duration',
            render: (val) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <Clock size={14} />
                    {val} mins
                </div>
            ),
        },
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
            key: 'is_active',
            label: 'Status',
            render: (val) => (
                <span className={`badge ${val ? 'badge-success' : 'badge-neutral'}`}>
                    {val ? 'Active' : 'Inactive'}
                </span>
            ),
        },
    ];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Treatments</h1>
                    <p className="page-subtitle">Manage services offered</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowModal(true); }}
                >
                    <Plus size={18} />
                    Add Treatment
                </button>
            </div>

            <DataTable
                columns={columns}
                data={treatments}
                loading={loading}
                emptyMessage="No treatments found"
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

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={selectedTreatment ? 'Edit Treatment' : 'Add Treatment'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {selectedTreatment ? 'Update' : 'Add'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                        <label className="input-label">Treatment Name *</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.treatment_name}
                            onChange={(e) => setFormData({ ...formData, treatment_name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                        <div className="input-group">
                            <label className="input-label">Price (LKR) *</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                                min="0"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Duration (mins) *</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                required
                                min="5"
                            />
                        </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                        <label className="input-label">Category</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder="e.g., Hair, Skin, Facial"
                            list="categories"
                        />
                        <datalist id="categories">
                            {categories.map(c => (
                                <option key={c} value={c} />
                            ))}
                        </datalist>
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                        <label className="input-label">Branch *</label>
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
                                required
                            >
                                <option value="">Select Branch</option>
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

                    <div className="input-group">
                        <label className="input-label">Description</label>
                        <textarea
                            className="input"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
}
