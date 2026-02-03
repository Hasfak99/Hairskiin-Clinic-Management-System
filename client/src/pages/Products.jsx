import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react';
import { productsAPI, departmentsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, branches } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        size: 20,
        total: 0,
        pages: 1
    });
    const [formData, setFormData] = useState({
        product_name: '',
        description: '',
        price: '',
        stock_qty: '',
        min_stock: '5',
        category: '',
        branch_id: '',
        department_id: '',
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        fetchDepartments();
    }, [pagination.page]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await productsAPI.getAll({
                active_only: false,
                page: pagination.page,
                size: pagination.size
            });
            setProducts(response.data.items);
            setPagination(prev => ({
                ...prev,
                total: response.data.total,
                pages: response.data.pages
            }));
        } catch (error) {
            toast.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await productsAPI.getCategories();
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
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
        try {
            const data = {
                ...formData,
                price: parseFloat(formData.price),
                stock_qty: parseInt(formData.stock_qty),
                min_stock: parseInt(formData.min_stock),
                branch_id: formData.branch_id ? parseInt(formData.branch_id) : (user?.branch_id || selectedBranch?.branch_id || null),
                department_id: formData.department_id ? parseInt(formData.department_id) : (user?.department_id || null),
            };
            if (selectedProduct) {
                await productsAPI.update(selectedProduct.product_id, data);
                toast.success('Product updated');
            } else {
                await productsAPI.create(data);
                toast.success('Product added');
            }
            setShowModal(false);
            resetForm();
            fetchProducts();
        } catch (error) {
            const detail = error.response?.data?.detail;
            if (Array.isArray(detail)) {
                // Handle Pydantic validation errors
                const messages = detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('\n');
                toast.error(messages);
            } else if (typeof detail === 'object') {
                toast.error(JSON.stringify(detail));
            } else {
                toast.error(detail || 'Operation failed');
            }
        }
    };

    const handleDelete = async (product) => {
        if (!confirm(`Delete ${product.product_name}?`)) return;
        try {
            await productsAPI.delete(product.product_id);
            toast.success('Product deleted');
            fetchProducts();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const openEditModal = (product) => {
        setSelectedProduct(product);
        setFormData({
            product_name: product.product_name,
            description: product.description || '',
            price: product.price.toString(),
            stock_qty: product.stock_qty.toString(),
            min_stock: product.min_stock.toString(),
            category: product.category || '',
            branch_id: product.branch_id || '',
            department_id: product.department_id || '',
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setSelectedProduct(null);
        setFormData({
            product_name: '',
            description: '',
            price: '',
            stock_qty: '',
            min_stock: '5',
            category: '',
            branch_id: user?.branch_id || selectedBranch?.branch_id || '',
            department_id: user?.department_id || ''
        });
    };

    const columns = [
        {
            key: 'product_code',
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
            key: 'product_name',
            label: 'Name',
            render: (val) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--gradient-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Package size={18} color="white" />
                    </div>
                    <span style={{ fontWeight: 500 }}>{val}</span>
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
        { key: 'category', label: 'Category', render: (val) => val || '-' },
        { key: 'size', label: 'Size', render: (val) => val || '-' },
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
            key: 'stock_qty',
            label: 'Stock',
            render: (val, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    {val <= row.min_stock && (
                        <AlertTriangle size={16} style={{ color: 'var(--warning-500)' }} />
                    )}
                    <span style={{
                        fontWeight: 600,
                        color: val <= row.min_stock ? 'var(--warning-500)' : 'var(--text-primary)',
                    }}>
                        {val}
                    </span>
                </div>
            ),
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

    const lowStockCount = products.filter(p => p.stock_qty <= p.min_stock && p.is_active).length;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Products</h1>
                    <p className="page-subtitle">Manage inventory and stock</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    {lowStockCount > 0 && (
                        <div className="btn btn-secondary" style={{ cursor: 'default' }}>
                            <AlertTriangle size={18} style={{ color: 'var(--warning-500)' }} />
                            {lowStockCount} low stock
                        </div>
                    )}
                    <button
                        className="btn btn-primary"
                        onClick={() => { resetForm(); setShowModal(true); }}
                    >
                        <Plus size={18} />
                        Add Product
                    </button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={products}
                loading={loading}
                emptyMessage="No products found"
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
                title={selectedProduct ? 'Edit Product' : 'Add Product'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {selectedProduct ? 'Update' : 'Add'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                        <label className="input-label">Product Name *</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.product_name}
                            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                            required
                        />
                    </div>

                    {/* Branch Selection */}
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
                                <option value="">Global / No Branch</option>
                                {branches.map(b => (
                                    <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Department Selection */}
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
                            <label className="input-label">Stock Quantity *</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.stock_qty}
                                onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })}
                                required
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                        <div className="input-group">
                            <label className="input-label">Min Stock Level</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.min_stock}
                                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                                min="0"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Category</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="e.g., Hair Care, Skin Care"
                                list="product-categories"
                            />
                            <datalist id="product-categories">
                                {categories.map(c => (
                                    <option key={c} value={c} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                        <label className="input-label">Size</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.size || ''}
                            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                            placeholder="e.g., 100ml, 500g"
                        />
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
        </div >
    );
}
