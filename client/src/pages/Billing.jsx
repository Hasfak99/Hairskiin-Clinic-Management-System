import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Printer, Receipt, Search, Trash2, QrCode } from 'lucide-react';
import { billsAPI, clientsAPI, treatmentsAPI, productsAPI } from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import ThermalReceipt from '../components/ThermalReceipt';
import ProfessionalBill from '../components/ProfessionalBill';

export default function Billing() {
    const [bills, setBills] = useState([]);
    const [clients, setClients] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [cashReceived, setCashReceived] = useState(0);
    const [printType, setPrintType] = useState('thermal'); // 'thermal' or 'professional'
    const { selectedBranch } = useAuth();

    const [formData, setFormData] = useState({
        client_id: '',
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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [billRes, clientRes, treatRes, prodRes] = await Promise.all([
                billsAPI.getAll(),
                clientsAPI.getAll(),
                treatmentsAPI.getAll(),
                productsAPI.getAll(),
            ]);
            setBills(billRes.data);
            setClients(clientRes.data);
            setTreatments(treatRes.data);
            setProducts(prodRes.data);
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
                    branch_id: selectedBranch?.branch_id || 1 // Default to 1 if not selected, or handle error
                });
                finalClientId = clientRes.data.client_id;
            } else if (!finalClientId) {
                toast.error('Please select a client');
                return;
            }

            const payload = {
                ...formData,
                client_id: finalClientId,
                branch_id: selectedBranch?.branch_id || 1 // Default to 1 if not selected
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

    const handlePaymentUpdate = async (bill, status) => {
        try {
            await billsAPI.updatePayment(bill.bill_id, status);
            toast.success(`Marked as ${status}`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const resetForm = () => {
        setCashReceived(0);
        setFormData({
            client_id: '',
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
                onRowClick={(row) => { setCashReceived(0); setSelectedBill(row); setShowViewModal(true); }}
                actions={(row) => (
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                        {row.payment_status !== 'paid' && (
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={(e) => { e.stopPropagation(); handlePaymentUpdate(row, 'paid'); }}
                                title="Mark Paid"
                                style={{ color: 'var(--success-500)' }}
                            >
                                Paid
                            </button>
                        )}
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
                            <select
                                className="input"
                                value={formData.client_id}
                                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                                required={!createClientMode}
                            >
                                <option value="">Select Client</option>
                                {clients.map(c => (
                                    <option key={c.client_id} value={c.client_id}>
                                        {c.name} ({c.phone})
                                    </option>
                                ))}
                            </select>
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
                            <select
                                className="input"
                                value={newItem.item_id}
                                onChange={(e) => setNewItem({ ...newItem, item_id: e.target.value })}
                                style={{ flex: 1, minWidth: 200 }}
                            >
                                <option value="">Select {newItem.type}</option>
                                {newItem.type === 'treatment'
                                    ? treatments.map(t => (
                                        <option key={t.treatment_id} value={t.treatment_id}>
                                            {t.treatment_name} - LKR {t.price}
                                        </option>
                                    ))
                                    : products.map(p => (
                                        <option key={p.product_id} value={p.product_id}>
                                            {p.product_name} - LKR {p.price} (Stock: {p.stock_qty})
                                        </option>
                                    ))
                                }
                            </select>
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
                                    value={formData.discount}
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
                                    value={formData.tax}
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
                                value={cashReceived}
                                onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                                min="0"
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
                title={`Bill #${selectedBill?.bill_id?.toString().padStart(4, '0')}`}
                size="lg"
                footer={
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                        <button className="btn btn-secondary" onClick={() => handlePrint('thermal')}>
                            <Receipt size={16} /> Thermal Receipt
                        </button>
                        <button className="btn btn-primary" onClick={() => handlePrint('professional')}>
                            <Printer size={16} /> Professional A4
                        </button>
                    </div>
                }
            >
                {selectedBill && (
                    <div>
                        <div style={{ marginBottom: 'var(--spacing-4)' }}>
                            <p style={{ color: 'var(--text-muted)' }}>Client</p>
                            <p style={{ fontWeight: 500 }}>{selectedBill.client_name}</p>
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-4)' }}>
                            <p style={{ color: 'var(--text-muted)' }}>Items</p>
                            {selectedBill.details?.map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: 'var(--spacing-2) 0',
                                    borderBottom: '1px solid var(--border)',
                                }}>
                                    <span>{item.item_name} x{item.quantity}</span>
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

                        {cashReceived > 0 && (
                            <div style={{
                                marginTop: 'var(--spacing-4)',
                                padding: 'var(--spacing-4)',
                                background: 'var(--success-50)',
                                border: '1px solid var(--success-200)',
                                borderRadius: 'var(--radius-lg)',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-1)' }}>
                                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--success-700)' }}>Cash Received</span>
                                    <span style={{ fontWeight: 600, color: 'var(--success-700)' }}>LKR {cashReceived}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--success-800)' }}>Balance to Return</span>
                                    <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--success-800)' }}>
                                        LKR {Math.max(0, cashReceived - selectedBill.final_amount)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* QR Code for Payment */}
                        <div style={{
                            marginTop: 'var(--spacing-6)',
                            padding: 'var(--spacing-4)',
                            background: '#ffffff',
                            border: '2px solid #000000',
                            borderRadius: 'var(--radius-lg)',
                            textAlign: 'center',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
                                <QrCode size={20} />
                                <span style={{ fontWeight: 600 }}>Scan to Pay</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-3)', background: '#ffffff', borderRadius: 'var(--radius-md)' }}>
                                <QRCodeSVG
                                    value={`hairskiin://pay?bill=${selectedBill.bill_id}&amount=${selectedBill.final_amount}&client=${encodeURIComponent(selectedBill.client_name || '')}`}
                                    size={150}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: '#666666', marginTop: 'var(--spacing-2)' }}>
                                Bill #{selectedBill.bill_id?.toString().padStart(4, '0')} • LKR {selectedBill.final_amount}
                            </p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Hidden components for printing */}
            {selectedBill && (
                <>
                    <div className={`print-preview-hidden ${printType === 'thermal' ? 'print-active' : ''}`}>
                        <ThermalReceipt bill={{ ...selectedBill, cashReceived }} />
                    </div>
                    <div className={`print-preview-hidden ${printType === 'professional' ? 'print-active' : ''}`}>
                        <ProfessionalBill bill={{ ...selectedBill, cashReceived }} />
                    </div>
                </>
            )}
        </div>
    );
}
