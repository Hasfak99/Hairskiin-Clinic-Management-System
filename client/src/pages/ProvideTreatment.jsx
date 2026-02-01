import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI, appointmentsAPI, clientsAPI, treatmentsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Search, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ProvideTreatment() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [clients, setClients] = useState([]);
    const [treatmentOptions, setTreatmentOptions] = useState([]);

    const [formData, setFormData] = useState({
        client_id: '',
        treatment_id: '',
        notes: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadMetadata();
    }, []);

    const loadMetadata = async () => {
        try {
            const [clientsRes, treatmentsRes] = await Promise.all([
                clientsAPI.getAll({ size: 100 }),
                treatmentsAPI.getAll({ size: 100 })
            ]);
            setClients(clientsRes.data.items);
            setTreatmentOptions(treatmentsRes.data.items);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error("Failed to load form data");
        }
    };

    const handleSearchClients = (query) => {
        setSearchTerm(query);
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (!formData.client_id || !formData.treatment_id) {
                toast.error("Please select client and treatment");
                return;
            }

            const payload = {
                client_id: parseInt(formData.client_id),
                treatment_id: parseInt(formData.treatment_id),
                appointment_date: format(new Date(), 'yyyy-MM-dd'),
                appointment_time: format(new Date(), 'HH:mm'),
                notes: formData.notes,
                branch_id: user?.branch_id || 1, // Default or user branch
                status: 'completed',
                payment_status: 'pending'
            };

            const res = await appointmentsAPI.create(payload);
            await appointmentsAPI.updateStatus(res.data.appointment_id, 'completed');

            toast.success('Treatment recorded successfully');
            navigate('/my-treatments'); // Redirect to history after success
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Failed to record treatment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Provide New Treatment</h1>
                    <p className="page-subtitle">Record a treatment session for a client</p>
                </div>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit}>
                    {/* Client Selection */}
                    <div className="form-group" style={{ marginBottom: 'var(--spacing-6)' }}>
                        <label className="input-label" style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>Select Client</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search client by name or phone..."
                                className="input"
                                style={{ paddingLeft: '40px', marginBottom: 'var(--spacing-2)' }}
                                value={searchTerm}
                                onChange={(e) => handleSearchClients(e.target.value)}
                            />
                        </div>
                        <select
                            className="input"
                            value={formData.client_id}
                            onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                            required
                            size={5} // Show multiple options for easier selection
                            style={{ height: 'auto', padding: 'var(--spacing-2)' }}
                        >
                            <option value="" disabled>Select Client from list below</option>
                            {filteredClients.map(c => (
                                <option key={c.client_id} value={c.client_id} style={{ padding: '4px' }}>
                                    {c.name} ({c.phone})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Treatment Selection */}
                    <div className="form-group" style={{ marginBottom: 'var(--spacing-6)' }}>
                        <label className="input-label" style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>Treatment Given</label>
                        <select
                            className="input"
                            value={formData.treatment_id}
                            onChange={e => setFormData({ ...formData, treatment_id: e.target.value })}
                            required
                        >
                            <option value="">-- Select Treatment --</option>
                            {treatmentOptions.map(t => (
                                <option key={t.treatment_id} value={t.treatment_id}>
                                    {t.treatment_name} (LKR {t.price}) - {t.duration} min
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Notes */}
                    <div className="form-group" style={{ marginBottom: 'var(--spacing-6)' }}>
                        <label className="input-label" style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>Treatment Notes / Observations</label>
                        <textarea
                            className="input"
                            rows="4"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Enter any medical notes, products used, or observations..."
                        ></textarea>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-4)', paddingTop: 'var(--spacing-4)', borderTop: '1px solid var(--border)' }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ flex: 1 }}
                            onClick={() => navigate('/doctor-dashboard')}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Confirm & Complete'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
