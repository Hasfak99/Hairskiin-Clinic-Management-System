import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Printer, Receipt, Search, Trash2, QrCode, CheckCircle } from 'lucide-react';
import { billsAPI, clientsAPI, treatmentsAPI, productsAPI, branchesAPI, departmentsAPI, usersAPI } from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import ThermalReceipt from '../components/ThermalReceipt';

import ProfessionalBill from '../components/ProfessionalBill';
import SearchableSelect from '../components/SearchableSelect';

export default function Billing() {
    const [bills, setBills] = useState([]);
    const [clients, setClients] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [products, setProducts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [stylists, setStylists] = useState([]); // NEW
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [cashReceived, setCashReceived] = useState(0);
    const [printType, setPrintType] = useState('thermal'); // 'thermal' or 'professional'
    const { user, selectedBranch, isManager } = useAuth();
    const [pagination, setPagination] = useState({
        page: 1,
        size: 20,
        total: 0,
        pages: 1
    });

    const [formData, setFormData] = useState({
        client_id: '',
        branch_id: '',
        department_id: '',
        stylist_id: '', // NEW
        items: [],
        discount: 0,
        tax: 0,
        payment_method: 'cash',
        notes: '',
    });

    const [createClientMode, setCreateClientMode] = useState(false);
    const [newItem, setNewItem] = useState({
        type: 'treatment',
        item_id: '',
        quantity: 1,
    });
    // For quick client creation
    const [newClientData, setNewClientData] = useState({
        name: '',
        phone: '',
    });

    // State for Adding Item to Existing Bill (View Modal)
    const [viewAddItem, setViewAddItem] = useState(false);
    const [viewNewItem, setViewNewItem] = useState({
        type: 'product',
        item_id: '',
        quantity: 1,
    });

    useEffect(() => {
        fetchData();
        fetchMetadata();
    }, [pagination.page]);

    const fetchMetadata = async () => {
        try {
            const [branchRes, deptRes] = await Promise.all([
                branchesAPI.getAll(),
                departmentsAPI.getAll()
            ]);
            setBranches(branchRes.data);
            setDepartments(deptRes.data);
        } catch (error) {
            console.error('Error fetching metadata', error);
        }
    };

    const fetchData = async () => {
        try {
            const [billRes, clientRes, treatRes, prodRes, userRes] = await Promise.all([
                billsAPI.getAll({
                    page: pagination.page,
                    size: pagination.size
                }),
                clientsAPI.getAll(),
                treatmentsAPI.getAll(),
                productsAPI.getAll(),
                usersAPI.getAll(), // NEW
            ]);
            setBills(billRes.data.items);
            setPagination(prev => ({
                ...prev,
                total: billRes.data.total,
                pages: billRes.data.pages
            }));
            setClients(clientRes.data.items || clientRes.data);
            setTreatments(treatRes.data.items || treatRes.data);
            setProducts(prodRes.data.items || prodRes.data);
            setStylists(userRes.data.items || userRes.data); // NEW
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        if (!newItem.item_id) return;

        let itemData;
        if (newItem.type === 'treatment') {
            const treatment = treatments.find(t => t.treatment_id === parseInt(newItem.item_id));
            if (!treatment) return;
            itemData = {
                item_type: 'treatment',
                item_id: treatment.treatment_id,
                item_name: treatment.treatment_name,
                quantity: 1,
                unit_price: treatment.price,
            };
        } else {
            const product = products.find(p => p.product_id === parseInt(newItem.item_id));
            if (!product) return;
            itemData = {
                item_type: 'product',
                item_id: product.product_id,
                item_name: product.product_name,
                quantity: parseInt(newItem.quantity),
                unit_price: product.price,
            };
        }

        setFormData({
            ...formData,
            items: [...formData.items, itemData],
        });
        setNewItem({ type: 'treatment', item_id: '', quantity: 1 });
    };

    const removeItem = (index) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index),
        });
    };

    const calculateTotal = () => {
        const subtotal = formData.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
        return subtotal - formData.discount + formData.tax;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.items.length === 0) {
            toast.error('Add at least one item');
            return;
        }
        try {
            let finalClientId = formData.client_id;
            const finalBranchId = formData.branch_id ? parseInt(formData.branch_id) : (selectedBranch?.branch_id || 1);
            const finalDeptId = formData.department_id ? parseInt(formData.department_id) : null;

            // Handle New Client creation
            if (createClientMode) {
                if (!newClientData.name || !newClientData.phone) {
                    toast.error('Please enter Name and Phone for new client');
                    return;
                }
                const clientRes = await clientsAPI.create({
                    name: newClientData.name,
                    phone: newClientData.phone,
                    email: '', // Optional
                    address: '', // Optional
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
                department_id: finalDeptId,
                stylist_id: formData.stylist_id || null, // NEW
            };

            const response = await billsAPI.create(payload);
            toast.success('Bill created successfully');
            setShowModal(false);
            // Don't resetForm() here yet, so cashReceived stays in state for the view modal
            fetchData();
            // Automatically show the view modal for the new bill
            setSelectedBill(response.data);
            setShowViewModal(true);
        } catch (error) {
            console.error('Submission error:', error);
            const detail = error.response?.data?.detail;
            if (Array.isArray(detail)) {
                // Handle Pydantic validation errors
                const messages = detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('\n');
                toast.error(messages);
            } else {
                toast.error(typeof detail === 'string' ? detail : 'Failed to create bill');
            }
        }
    };

    const [paymentMethod, setPaymentMethod] = useState('cash'); // NEW state for checkout

    const handleRequestEdit = async (billId) => {
        try {
            await billsAPI.requestEdit(billId);
            toast.success('Edit request sent to manager');
            // Refresh bill
            const res = await billsAPI.getById(billId);
            setSelectedBill(res.data);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Request failed');
        }
    };

    const handleApproveEdit = async (billId) => {
        try {
            await billsAPI.approveEdit(billId);
            toast.success('Edit request approved');
            // Refresh bill
            const res = await billsAPI.getById(billId);
            setSelectedBill(res.data);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Approval failed');
        }
    };

    const handlePaymentUpdate = async (bill, status) => {
        try {
            await billsAPI.updatePayment(bill.bill_id, status);
            toast.success(`Marked as ${status}`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const handleAddItemToExistingBill = async () => {
        if (!viewNewItem.item_id) return;

        let itemData;
        if (viewNewItem.type === 'treatment') {
            const treatment = treatments.find(t => t.treatment_id === parseInt(viewNewItem.item_id));
            if (!treatment) return;
            itemData = {
                item_type: 'treatment',
                item_id: treatment.treatment_id,
                item_name: treatment.treatment_name,
                quantity: 1,
                unit_price: treatment.price,
            };
        } else {
            const product = products.find(p => p.product_id === parseInt(viewNewItem.item_id));
            if (!product) return;
            itemData = {
                item_type: 'product',
                item_id: product.product_id,
                item_name: product.product_name,
                quantity: parseInt(viewNewItem.quantity),
                unit_price: product.price,
            };
        }

        try {
            await billsAPI.addItem(selectedBill.bill_id, itemData);
            toast.success('Item added successfully');

            // Refresh bill
            const res = await billsAPI.getById(selectedBill.bill_id);
            setSelectedBill(res.data);
            fetchData();

            // Reset form
            setViewAddItem(false);
            setViewNewItem({ type: 'treatment', item_id: '', quantity: 1 });
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Failed to add item');
        }
    };

    const handleCompletePayment = async () => {
        try {
            if (!selectedBill) return;
            await billsAPI.updatePayment(selectedBill.bill_id, 'paid', paymentMethod);
            toast.success('Payment completed successfully');

            // Refresh data
            fetchData();

            // Update selected bill local state to show 'paid' view
            setSelectedBill({ ...selectedBill, payment_status: 'paid' });

            // Optional: Auto print?
            // handlePrint('thermal'); 
        } catch (error) {
            console.error(error);
            toast.error('Failed to process payment');
        }
    };

    const resetForm = () => {
        setCashReceived(0);
        setFormData({
            client_id: '',
            branch_id: selectedBranch?.branch_id || '',
            department_id: user?.department_id || '',
            stylist_id: '', // NEW
            items: [],
            discount: 0,
            tax: 0,
            payment_method: 'cash',
            notes: '',
        });
        setCreateClientMode(false);
        setNewClientData({ name: '', phone: '' });
    };

    const handlePrint = (type) => {
        setPrintType(type);
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const columns = [
        {
            key: 'bill_id',
            label: 'Bill #',
            render: (val) => (
                <span style={{ fontWeight: 600 }}>#{val.toString().padStart(4, '0')}</span>
            ),
        },
        { key: 'client_name', label: 'Client' },
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
        // REMOVED Stylist column
        {
            key: 'final_amount',
            label: 'Amount',
            render: (val) => (
                <span style={{ fontWeight: 600, color: 'var(--primary-400)' }}>LKR {val}</span>
            ),
        },
        {
            key: 'payment_status',
            label: 'Status',
            render: (val) => (
                <span className={`badge ${val === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                    {val}
                </span>
            ),
        },
        { key: 'payment_method', label: 'Method', render: (val) => val || '-' },
        {
            key: 'bill_date',
            label: 'Date',
            render: (val) => format(new Date(val), 'MMM d, yyyy'),
        },
    ];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Billing</h1>
                    <p className="page-subtitle">Create and manage invoices</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowModal(true); }}
                >
                    <Plus size={18} />
                    Create Bill
                </button>
            </div>

            <DataTable
                columns={columns}
                data={bills}
                loading={loading}
                emptyMessage="No bills found"
                onRowClick={(row) => {
                    setCashReceived(0);
                    setSelectedBill(row);
                    setPaymentMethod('cash'); // Default
                    setShowViewModal(true);
                }}
                pagination={{
                    currentPage: pagination.page,
                    totalPages: pagination.pages,
                    totalItems: pagination.total,
                    onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
                }}
                actions={(row) => (
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                        {/* Removed Quick Paid button to force review in modal */}
                    </div>
                )}
            />

            {/* Create Bill Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Create New Bill"
                size="lg"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            Create Bill
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                        <div className="input-group">
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
                        <div className="input-group">
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
                    </div>





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

                    {/* Add Items */}
                    <div style={{
                        padding: 'var(--spacing-4)',
                        background: 'var(--surface-elevated)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--spacing-4)',
                    }}>
                        <h4 style={{ marginBottom: 'var(--spacing-3)' }}>Add Items</h4>
                        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                            <select
                                className="input"
                                value={newItem.type}
                                onChange={(e) => setNewItem({ ...newItem, type: e.target.value, item_id: '' })}
                                style={{ width: 150 }}
                            >
                                <option value="treatment">Treatment</option>
                                <option value="product">Product</option>
                            </select>

                            <div style={{ flex: 1, minWidth: 200 }}>
                                <SearchableSelect
                                    placeholder={`Select ${newItem.type === 'treatment' ? 'Treatment' : 'Product'}`}
                                    options={newItem.type === 'treatment'
                                        ? treatments
                                            .filter(t => !formData.department_id || t.department_id === parseInt(formData.department_id))
                                            .filter(t => !formData.branch_id || t.branch_id === parseInt(formData.branch_id) || !t.branch_id) // Allow global treatments if any
                                            .map(t => ({
                                                value: t.treatment_id,
                                                label: `${t.treatment_name} - LKR ${t.price}`
                                            }))
                                        : products
                                            .filter(p => !formData.department_id || p.department_id === parseInt(formData.department_id))
                                            .filter(p => !formData.branch_id || p.branch_id === parseInt(formData.branch_id) || !p.branch_id) // Allow global products
                                            .map(p => ({
                                                value: p.product_id,
                                                label: `${p.product_name} - LKR ${p.price} (Stock: ${p.stock_qty || 0})`
                                            }))
                                    }
                                    value={newItem.item_id ? parseInt(newItem.item_id) : ''}
                                    onChange={(val) => setNewItem({ ...newItem, item_id: val })}
                                />
                            </div>

                            {newItem.type === 'product' && (
                                <input
                                    type="number"
                                    className="input"
                                    value={newItem.quantity}
                                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                                    min="1"
                                    style={{ width: 80 }}
                                />
                            )}
                            <button type="button" className="btn btn-secondary" onClick={addItem}>
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Items List */}
                    {formData.items.length > 0 && (
                        <div style={{ marginBottom: 'var(--spacing-4)' }}>
                            <h4 style={{ marginBottom: 'var(--spacing-3)' }}>Bill Items</h4>
                            {formData.items.map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: 'var(--spacing-3)',
                                        background: 'var(--surface)',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: 'var(--spacing-2)',
                                        border: '1px solid var(--border)',
                                    }}
                                >
                                    <div>
                                        <span style={{ fontWeight: 500 }}>{item.item_name}</span>
                                        <span style={{ color: 'var(--text-muted)', marginLeft: 'var(--spacing-2)' }}>
                                            x{item.quantity}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--primary-400)' }}>
                                            LKR {item.unit_price * item.quantity}
                                        </span>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => removeItem(index)}
                                            style={{ color: 'var(--error-500)' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Totals */}
                    <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                        <div className="input-group">
                            <label className="input-label">Discount (LKR)</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute',
                                    left: 'var(--spacing-3)',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                    fontWeight: 500
                                }}>LKR</span>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.discount || ''}
                                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    style={{ paddingLeft: '50px' }}
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Tax (LKR)</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute',
                                    left: 'var(--spacing-3)',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                    fontWeight: 500
                                }}>LKR</span>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.tax || ''}
                                    onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    style={{ paddingLeft: '50px' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                        <label className="input-label">Payment Method</label>
                        <select
                            className="input"
                            value={formData.payment_method}
                            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                        >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="upi">UPI</option>
                            <option value="online">Online Transfer</option>
                        </select>
                    </div>

                    {/* Total Summary */}
                    <div style={{
                        padding: 'var(--spacing-4)',
                        background: 'var(--surface-elevated)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--spacing-4)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                            <span>Subtotal:</span>
                            <span>LKR {formData.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                            <span>Discount:</span>
                            <span style={{ color: formData.discount > 0 ? 'var(--error-500)' : 'var(--text-muted)' }}>
                                {formData.discount > 0 ? `-LKR ${formData.discount.toFixed(2)}` : 'LKR 0.00'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                            <span>Tax:</span>
                            <span>+LKR {formData.tax.toFixed(2)}</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            paddingTop: 'var(--spacing-2)',
                            borderTop: '2px solid var(--border)',
                            marginTop: 'var(--spacing-2)',
                        }}>
                            <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: '#000000' }}>Total Amount</span>
                            <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#000000' }}>
                                LKR {calculateTotal().toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div style={{ marginTop: 'var(--spacing-4)' }}>
                        <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                            <label className="input-label">Cash Received (LKR)</label>
                            <input
                                type="number"
                                className="input"
                                value={cashReceived || ''}
                                onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                                min="0"
                                placeholder="0.00"
                            />
                        </div>

                        {cashReceived > 0 && (
                            <div style={{
                                padding: 'var(--spacing-4)',
                                background: 'var(--success-50)',
                                border: '2px solid var(--success-500)',
                                borderRadius: 'var(--radius-lg)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: 'var(--spacing-2)'
                            }}>
                                <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--success-600)' }}>Balance to Return</span>
                                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--success-600)' }}>
                                    LKR {Math.max(0, cashReceived - calculateTotal())}
                                </span>
                            </div>
                        )}
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title={`Bill #${selectedBill?.bill_id?.toString().padStart(4, '0')} - Status: ${selectedBill?.payment_status?.toUpperCase()}`}
                size="lg"
                footer={
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)', width: '100%', justifyContent: 'flex-end' }}>
                        {/* Request Edit Logic */}
                        {selectedBill?.payment_status === 'paid' && selectedBill?.edit_request_status !== 'approved' && (
                            <div style={{ marginRight: 'auto' }}>
                                {selectedBill.edit_request_status === 'pending' ? (
                                    isManager() ? (
                                        <button
                                            className="btn btn-warning"
                                            onClick={() => handleApproveEdit(selectedBill.bill_id)}
                                        >
                                            <CheckCircle size={16} /> Approve Edit Request
                                        </button>
                                    ) : (
                                        <span className="badge badge-warning">Edit Approval Pending</span>
                                    )
                                ) : (
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => handleRequestEdit(selectedBill.bill_id)}
                                    >
                                        Request Edit
                                    </button>
                                )}
                            </div>
                        )}

                        {selectedBill?.payment_status === 'paid' ? (
                            <button className="btn btn-secondary" onClick={() => handlePrint('thermal')}>
                                <Receipt size={16} /> Print Receipt
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={() => handleCompletePayment()} style={{ width: '100%' }}>
                                <CheckCircle size={18} style={{ marginRight: 8 }} /> Confirm Payment (LKR {selectedBill?.final_amount})
                            </button>
                        )}
                    </div>
                }
            >
                {selectedBill && (
                    <div>
                        <div style={{ marginBottom: 'var(--spacing-4)' }}>
                            <p style={{ color: 'var(--text-muted)' }}>Client</p>
                            <p style={{ fontWeight: 500 }}>{selectedBill.client_name}</p>

                            {selectedBill.department_name && (
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 4 }}>
                                    Department: {selectedBill.department_name}
                                </p>
                            )}
                        </div>


                        <div style={{ marginBottom: 'var(--spacing-4)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                                <p style={{ color: 'var(--text-muted)' }}>Items</p>
                                {((selectedBill.payment_status !== 'paid') || (selectedBill.payment_status === 'paid' && selectedBill.edit_request_status === 'approved')) && !viewAddItem && (
                                    <button
                                        className="btn btn-ghost btn-xs text-primary"
                                        onClick={() => setViewAddItem(true)}
                                    >
                                        <Plus size={14} /> Add Item
                                    </button>
                                )}
                            </div>

                            {viewAddItem && (
                                <div style={{
                                    padding: 'var(--spacing-3)',
                                    background: 'var(--bg-subtle)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--spacing-3)',
                                    border: '1px solid var(--border)'
                                }}>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                                        <select
                                            className="input"
                                            value={viewNewItem.type || 'product'}
                                            onChange={(e) => setViewNewItem({ ...viewNewItem, type: e.target.value, item_id: '' })}
                                            style={{ width: 150 }}
                                        >
                                            <option value="product">Product</option>
                                            <option value="treatment">Treatment</option>
                                        </select>
                                        <div style={{ flex: 1 }}>
                                            <SearchableSelect
                                                placeholder={`Select ${viewNewItem.type === 'treatment' ? 'Treatment' : 'Product'}`}
                                                options={viewNewItem.type === 'treatment'
                                                    ? treatments
                                                        .filter(t => !selectedBill.department_id || t.department_id === selectedBill.department_id)
                                                        .filter(t => !selectedBill.branch_id || t.branch_id === selectedBill.branch_id || !t.branch_id)
                                                        .map(t => ({
                                                            value: t.treatment_id,
                                                            label: `${t.treatment_name} - LKR ${t.price}`
                                                        }))
                                                    : products
                                                        .filter(p => !selectedBill.department_id || p.department_id === selectedBill.department_id)
                                                        .filter(p => !selectedBill.branch_id || p.branch_id === selectedBill.branch_id || !p.branch_id)
                                                        .map(p => ({
                                                            value: p.product_id,
                                                            label: `${p.product_name} - LKR ${p.price} (Stock: ${p.stock_qty || 0})`
                                                        }))}
                                                value={viewNewItem.item_id ? parseInt(viewNewItem.item_id) : ''}
                                                onChange={(val) => setViewNewItem({ ...viewNewItem, item_id: val })}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'center' }}>
                                        <div style={{ width: 80 }}>
                                            <input
                                                type="number"
                                                className="input text-sm p-1"
                                                value={viewNewItem.quantity}
                                                onChange={(e) => setViewNewItem({ ...viewNewItem, quantity: e.target.value })}
                                                min="1"
                                                placeholder="Qty"
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}></div>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setViewAddItem(false)}>Cancel</button>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={handleAddItemToExistingBill}
                                            disabled={!viewNewItem.item_id}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            )}
                            {selectedBill.details?.map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 'var(--spacing-2) 0',
                                    borderBottom: '1px solid var(--border)',
                                }}>
                                    <div>
                                        <span>{item.item_name} x{item.quantity}</span>
                                        {/* REMOVE BUTTON IF NOT PAID OR APPROVED */}
                                        {((selectedBill.payment_status !== 'paid') || (selectedBill.payment_status === 'paid' && selectedBill.edit_request_status === 'approved')) && (
                                            <button
                                                className="btn btn-ghost btn-xs ml-2 text-error"
                                                onClick={async () => {
                                                    if (!confirm('Remove this item?')) return;
                                                    try {
                                                        await billsAPI.deleteItem(selectedBill.bill_id, item.bill_detail_id);
                                                        toast.success('Item removed');
                                                        // Refresh bill data
                                                        const res = await billsAPI.getById(selectedBill.bill_id);
                                                        setSelectedBill(res.data);
                                                        fetchData(); // Refresh list to update totals
                                                    } catch (error) {
                                                        console.error(error);
                                                        toast.error('Failed to remove item');
                                                    }
                                                }}
                                                style={{ color: 'var(--error-500)', padding: 4 }}
                                                title="Remove Item"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <span style={{ fontWeight: 500 }}>LKR {item.total_price}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{
                            padding: 'var(--spacing-4)',
                            background: 'var(--surface-elevated)',
                            borderRadius: 'var(--radius-lg)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                                <span>Subtotal</span>
                                <span>LKR {selectedBill.total_amount}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                                <span>Discount</span>
                                <span style={{ color: selectedBill.discount > 0 ? 'var(--error-500)' : 'var(--text-muted)' }}>
                                    {selectedBill.discount > 0 ? `-LKR ${selectedBill.discount.toFixed(2)}` : 'LKR 0.00'}
                                </span>
                            </div>
                            {selectedBill.tax > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                                    <span>Tax</span>
                                    <span>+LKR {selectedBill.tax}</span>
                                </div>
                            )}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontWeight: 700,
                                fontSize: 'var(--font-size-lg)',
                                paddingTop: 'var(--spacing-2)',
                                borderTop: '1px solid var(--border)',
                            }}>
                                <span>Total</span>
                                <span style={{ color: 'var(--primary-400)' }}>LKR {selectedBill.final_amount}</span>
                            </div>
                        </div>

                        {selectedBill.payment_status !== 'paid' && (
                            <div style={{ marginTop: 'var(--spacing-6)', padding: 'var(--spacing-4)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
                                <h4 style={{ marginBottom: 'var(--spacing-3)' }}>Process Payment</h4>

                                <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-4)' }}>
                                    <div className="input-group">
                                        <label className="input-label">Payment Method</label>
                                        <select
                                            className="input"
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="card">Card</option>
                                            <option value="upi">UPI</option>
                                            <option value="online">Online Transfer</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Cash Received</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={cashReceived}
                                            onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                                            min="0"
                                            placeholder="Enter amount..."
                                        />
                                    </div>
                                </div>

                                {cashReceived > 0 && (
                                    <div style={{
                                        marginTop: 'var(--spacing-3)',
                                        padding: 'var(--spacing-3)',
                                        background: 'var(--success-50)',
                                        border: '1px solid var(--success-200)',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--success-700)' }}>Balance</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success-700)' }}>
                                            LKR {Math.max(0, cashReceived - selectedBill.final_amount).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Show balance even if paid, if checking history? No, usually not relevant unless stored. */}
                    </div>
                )}
            </Modal>

            {/* Hidden components for printing */}
            {
                selectedBill && (
                    <>
                        <div className={`print-preview-hidden ${printType === 'thermal' ? 'print-active' : ''}`}>
                            <ThermalReceipt bill={{ ...selectedBill, cashReceived }} />
                        </div>
                        <div className={`print-preview-hidden ${printType === 'professional' ? 'print-active' : ''}`}>
                            <ProfessionalBill bill={{ ...selectedBill, cashReceived }} />
                        </div>
                    </>
                )
            }
        </div >
    );
}
