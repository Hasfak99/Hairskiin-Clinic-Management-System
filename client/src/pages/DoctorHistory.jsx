import { useState, useEffect } from 'react';
import { analyticsAPI } from '../api';
import { Calendar, User, Eye, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function DoctorHistory() {
    const [treatments, setTreatments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedTreatment, setSelectedTreatment] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await analyticsAPI.getDoctorTreatments();
            setTreatments(res.data);
        } catch (error) {
            console.error('Error fetching history:', error);
            toast.error('Failed to load treatment history');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (treatment) => {
        setSelectedTreatment(treatment);
        setShowDetailsModal(true);
    };

    const filteredTreatments = treatments.filter(t =>
        t.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.treatment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className="animate-pulse">Loading history...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Treatment History</h1>
                    <p className="page-subtitle">Record of all treatments performed</p>
                </div>
            </div>

            <div className="card">
                <div style={{ marginBottom: 'var(--spacing-4)', position: 'relative', maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search by client, treatment or notes..."
                        className="input"
                        style={{ paddingLeft: '40px', width: '100%' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {filteredTreatments.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Treatment</th>
                                    <th>Date & Time</th>
                                    <th>Status</th>
                                    <th>Notes</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTreatments.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{t.client_name}</div>
                                            {t.client_phone && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{t.client_phone}</div>}
                                        </td>
                                        <td>{t.treatment_name}</td>
                                        <td>
                                            <div>{format(new Date(t.date), 'MMM d, yyyy')}</div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                                {format(new Date(`${t.date}T${t.time}`), 'h:mm a')}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${t.status === 'completed' ? 'badge-success' :
                                                    t.status === 'cancelled' ? 'badge-danger' : 'badge-primary'
                                                }`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: '300px', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                                            {t.notes ? (t.notes.length > 50 ? t.notes.substring(0, 50) + '...' : t.notes) : '-'}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => handleViewDetails(t)}
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <User size={48} className="empty-state-icon" />
                        <p>No treatment history found</p>
                    </div>
                )}
            </div>

            {/* View Details Modal */}
            {showDetailsModal && selectedTreatment && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Treatment Details</h2>
                            <button onClick={() => setShowDetailsModal(false)} className="btn btn-ghost btn-icon">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="grid grid-cols-2" style={{ marginBottom: 'var(--spacing-6)' }}>
                                <div>
                                    <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Client</label>
                                    <div style={{ fontWeight: 500 }}>{selectedTreatment.client_name}</div>
                                    {selectedTreatment.client_phone && <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>{selectedTreatment.client_phone}</div>}
                                </div>

                                <div>
                                    <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Treatment</label>
                                    <div style={{ fontWeight: 500 }}>{selectedTreatment.treatment_name}</div>
                                    <div>LKR {selectedTreatment.price?.toLocaleString() || '0'}</div>
                                </div>

                                <div>
                                    <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Date & Time</label>
                                    <div>{format(new Date(selectedTreatment.date), 'MMM d, yyyy')}</div>
                                    <div>{format(new Date(`${selectedTreatment.date}T${selectedTreatment.time}`), 'h:mm a')}</div>
                                </div>

                                <div>
                                    <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Status</label>
                                    <div>
                                        <span className={`badge ${selectedTreatment.status === 'completed' ? 'badge-success' :
                                                selectedTreatment.status === 'cancelled' ? 'badge-danger' : 'badge-primary'
                                            }`}>
                                            {selectedTreatment.status}
                                        </span>
                                    </div>
                                    <div style={{ marginTop: '4px', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                        Payment: {selectedTreatment.payment_status || 'Pending'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Doctor's Notes</label>
                                <div style={{
                                    padding: 'var(--spacing-3)',
                                    background: 'var(--surface-elevated)',
                                    borderRadius: 'var(--radius-md)',
                                    minHeight: '80px',
                                    marginTop: 'var(--spacing-2)'
                                }}>
                                    {selectedTreatment.notes || "No notes recorded."}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={() => setShowDetailsModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
