import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI, appointmentsAPI, clientsAPI, treatmentsAPI, productsAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import SearchableSelect from '../components/SearchableSelect';
import { Search, Save, X, Plus, Trash2, User, Calendar, CheckCircle, Clock, FileText, Sparkles, ChevronRight, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ProvideTreatment() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [clients, setClients] = useState([]);
    const [treatmentOptions, setTreatmentOptions] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [doctorOptions, setDoctorOptions] = useState([]);

    // Scheduled appointments
    const [scheduledAppointments, setScheduledAppointments] = useState([]);

    const [formData, setFormData] = useState({
        appointment_id: null, // Linked appointment
        client_id: '',
        treatment_id: '',
        stylist_id: '',
        notes: ''
    });

    const [selectedProducts, setSelectedProducts] = useState([]);
    const [currentProduct, setCurrentProduct] = useState('');

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadMetadata();
    }, []);

    // Effect: Fetch scheduled appointments when doctor changes
    useEffect(() => {
        if (formData.stylist_id) {
            fetchScheduledAppointments(formData.stylist_id);
        } else {
            setScheduledAppointments([]);
        }
    }, [formData.stylist_id]);

    const loadMetadata = async () => {
        try {
            const [clientsRes, treatmentsRes, productsRes, doctorsRes] = await Promise.all([
                clientsAPI.getAll({ size: 100 }),
                treatmentsAPI.getAll({ size: 100 }),
                productsAPI.getAll({ size: 100 }),
                usersAPI.getAll({ role: 'doctor' })
            ]);
            setClients(clientsRes.data.items);
            setTreatmentOptions(treatmentsRes.data.items);
            setProductOptions(productsRes.data.items);
            if (user?.role === 'doctor') {
                // If logged in as doctor, ONLY show themselves
                setDoctorOptions(doctorsRes.data.items.filter(d => d.user_id === user.user_id));
                setFormData(prev => ({ ...prev, stylist_id: user.user_id }));
            } else {
                setDoctorOptions(doctorsRes.data.items);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error("Failed to load form data");
        }
    };

    const fetchScheduledAppointments = async (stylistId) => {
        try {
            // Get BOOKED appointments for TODAY
            const res = await appointmentsAPI.getAll({
                stylist_id: stylistId,
                status: 'booked',
                size: 50
            });
            setScheduledAppointments(res.data.items);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSelectAppointment = (apt) => {
        setFormData({
            ...formData,
            appointment_id: apt.appointment_id,
            client_id: apt.client_id,
            treatment_id: apt.treatment_id,
            notes: apt.notes || ''
        });
        toast.success(`Selected booking for ${apt.client_name}`);
    };

    const handleClearSelection = () => {
        setFormData({
            ...formData,
            appointment_id: null,
            client_id: '',
            treatment_id: '',
            notes: ''
        });
        setSearchTerm('');
    };

    const handleSearchClients = (query) => {
        setSearchTerm(query);
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    const handleAddProduct = () => {
        if (!currentProduct) return;
        const product = productOptions.find(p => p.product_id === parseInt(currentProduct));
        if (!product) return;
        if (selectedProducts.find(p => p.product_id === product.product_id)) {
            toast.error("Product already added");
            return;
        }
        setSelectedProducts([...selectedProducts, {
            product_id: product.product_id,
            name: product.product_name,
            price: product.price,
            quantity: 1
        }]);
        setCurrentProduct('');
    };

    const handleRemoveProduct = (productId) => {
        setSelectedProducts(selectedProducts.filter(p => p.product_id !== productId));
    };

    const handleUpdateQuantity = (productId, qty) => {
        if (qty < 1) return;
        setSelectedProducts(selectedProducts.map(p =>
            p.product_id === productId ? { ...p, quantity: parseInt(qty) } : p
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (!formData.client_id || !formData.treatment_id) {
                toast.error("Please select client and treatment");
                return;
            }

            const payload = {
                appointment_id: formData.appointment_id, // Pass linked ID if available
                client_id: parseInt(formData.client_id),
                treatment_id: parseInt(formData.treatment_id),
                stylist_id: formData.stylist_id ? parseInt(formData.stylist_id) : null,
                notes: formData.notes,
                branch_id: user?.branch_id || 1,
                products: selectedProducts.map(p => ({
                    product_id: p.product_id,
                    quantity: p.quantity
                }))
            };

            await treatmentsAPI.recordTreatment(payload);

            toast.success('Treatment recorded successfully! Bill created.');
            navigate('/billing');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Failed to record treatment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: 'var(--spacing-8)' }}>
            {/* Header Section */}
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Sparkles className="text-primary" size={28} />
                        Provide Treatment
                    </h1>
                    <p className="page-subtitle">Record clinical session details and prescriptions</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ minWidth: '160px' }}>
                        {loading ? 'Processing...' : 'Complete & Bill'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT COLUMN: Sidebar (Doctor & Schedule) */}
                <div className="lg:col-span-4">
                    <div className="card sticky-card" style={{ position: 'sticky', top: '2rem' }}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
                            <User size={20} />
                            Session Context
                        </h3>

                        {/* Doctor Selector */}
                        <div className="form-group mb-6">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Specialist</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-surface-muted border-none rounded-lg p-3 pl-4 pr-10 appearance-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground"
                                    value={formData.stylist_id}
                                    onChange={e => setFormData({ ...formData, stylist_id: e.target.value })}
                                >
                                    <option value="">Select Specialist...</option>
                                    {doctorOptions.map(d => (
                                        <option key={d.user_id} value={d.user_id}>
                                            {d.full_name || d.username}
                                        </option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Schedule Timeline */}
                        {formData.stylist_id && (
                            <div className="border-t border-border pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today's Schedule</label>
                                    <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                                        {scheduledAppointments.length}
                                    </span>
                                </div>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                    {scheduledAppointments.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground text-sm bg-surface-muted rounded-lg border-dashed border border-border">
                                            No bookings for today
                                        </div>
                                    ) : (
                                        scheduledAppointments.map(apt => (
                                            <div
                                                key={apt.appointment_id}
                                                onClick={() => handleSelectAppointment(apt)}
                                                className={`
                                                    group relative p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md
                                                    ${formData.appointment_id === apt.appointment_id
                                                        ? 'bg-primary/5 border-primary shadow-sm'
                                                        : 'bg-surface border-border hover:border-primary/50'}
                                                `}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-foreground flex items-center gap-1.5">
                                                        <Clock size={14} className="text-primary" />
                                                        {apt.appointment_time.substring(0, 5)}
                                                    </span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide
                                                        ${apt.status === 'booked' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
                                                    `}>
                                                        {apt.status}
                                                    </span>
                                                </div>
                                                <h4 className="font-medium text-foreground text-sm">{apt.client_name}</h4>
                                                <p className="text-xs text-muted-foreground truncate">{apt.treatment_name}</p>

                                                {/* Selection Indicator */}
                                                {formData.appointment_id === apt.appointment_id && (
                                                    <div className="absolute top-3 right-3 text-primary animate-in zoom-in spin-in-12 duration-300">
                                                        <CheckCircle size={16} fill="currentColor" className="text-primary-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Treatment Form */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Active Session Banner */}
                    {formData.appointment_id && (
                        <div className="bg-green-50/50 border border-green-200 rounded-xl p-4 flex items-center justify-between text-sm animate-in fade-in slide-in-from-top-4">
                            <div className="flex items-center gap-3 text-green-800">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle size={16} className="text-green-600" />
                                </div>
                                <div>
                                    <span className="block font-semibold">Linked to Booking #{formData.appointment_id}</span>
                                    <span className="text-green-600/80">Client details auto-filled</span>
                                </div>
                            </div>
                            <button
                                onClick={handleClearSelection}
                                className="p-2 hover:bg-green-100/50 rounded-lg text-green-700 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    {/* Main Form Card */}
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b border-border pb-4">
                            <FileText size={20} className="text-muted-foreground" />
                            Treatment Details
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Client & Treatment Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Client Select */}
                                <div className="form-group">
                                    <label className="input-label">Patient / Client</label>
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />

                                        {!formData.appointment_id ? (
                                            <>
                                                <input
                                                    type="text"
                                                    placeholder="Search..."
                                                    className="input pl-10 mb-2 w-full"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                                <select
                                                    className="input w-full"
                                                    value={formData.client_id}
                                                    onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                                                    required
                                                >
                                                    <option value="">Select Client from list...</option>
                                                    {filteredClients.map(c => (
                                                        <option key={c.client_id} value={c.client_id}>
                                                            {c.name} • {c.phone}
                                                        </option>
                                                    ))}
                                                </select>
                                            </>
                                        ) : (
                                            <div className="input pl-10 bg-surface-muted flex items-center text-foreground font-medium cursor-not-allowed opacity-80">
                                                {clients.find(c => c.client_id === formData.client_id)?.name || 'Unknown Client'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Treatment Select */}
                                <div className="form-group">
                                    <label className="input-label">Treatment Performed</label>
                                    <div className="relative">
                                        <select
                                            className="input w-full appearance-none"
                                            value={formData.treatment_id}
                                            onChange={e => setFormData({ ...formData, treatment_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Treatment...</option>
                                            {treatmentOptions.map(t => (
                                                <option key={t.treatment_id} value={t.treatment_id}>
                                                    {t.treatment_name} • {t.duration}m
                                                    {(user?.role !== 'doctor') && ` • LKR ${t.price}`}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                            <ChevronRight className="rotate-90" size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Products Section */}
                            <div className="bg-surface-muted/50 rounded-xl p-6 border border-border/50">
                                <label className="input-label mb-4 flex justify-between items-center">
                                    <span>Products / Medicinals Used</span>
                                    <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                                </label>

                                <div className="flex gap-2 mb-4">
                                    <div className="relative flex-1">
                                        <SearchableSelect
                                            placeholder="Select Product to Add..."
                                            options={productOptions.map(p => ({
                                                value: p.product_id,
                                                label: `${p.product_name} (Stock: ${p.stock_qty})`
                                            }))}
                                            value={currentProduct ? parseInt(currentProduct) : ''}
                                            onChange={(val) => setCurrentProduct(val)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-secondary aspect-square px-0 w-[42px] flex items-center justify-center"
                                        onClick={handleAddProduct}
                                        disabled={!currentProduct}
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>

                                {/* Active Products List */}
                                <div className="space-y-2">
                                    {selectedProducts.map((p) => (
                                        <div key={p.product_id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-border shadow-sm animate-in slide-in-from-bottom-2">
                                            <span className="font-medium text-sm text-foreground">{p.name}</span>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center border border-border rounded-md overflow-hidden h-8">
                                                    <span className="px-2 text-xs text-muted-foreground bg-surface-muted border-r border-border h-full flex items-center">Qty</span>
                                                    <input
                                                        type="number"
                                                        className="w-12 text-center text-sm focus:outline-none"
                                                        value={p.quantity}
                                                        min="1"
                                                        onChange={(e) => handleUpdateQuantity(p.product_id, e.target.value)}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                                                    onClick={() => handleRemoveProduct(p.product_id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedProducts.length === 0 && (
                                        <div className="text-center text-xs text-muted-foreground py-2 italic opacity-60">
                                            No products added
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="form-group">
                                <label className="input-label">Clinical Notes</label>
                                <textarea
                                    className="input w-full min-h-[120px] resize-y"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Enter detailed observations, post-care instructions, or adverse reactions..."
                                ></textarea>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
