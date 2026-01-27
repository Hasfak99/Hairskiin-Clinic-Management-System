import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { clientsAPI } from '../api';
import { User, Phone, Mail, MapPin, Calendar, Clock, Banknote } from 'lucide-react';
import { format } from 'date-fns';

export default function ClientProfile() {
    const { qrCode } = useParams();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchClientData();
    }, [qrCode]);

    const fetchClientData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await clientsAPI.scanQRPublic(qrCode);
            setClient(response.data);
        } catch (err) {
            console.error('Error fetching client:', err);
            setError(err.response?.data?.detail || 'Client not found');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            }}>
                <div style={{ color: 'white', fontSize: '1.2rem' }}>Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{ color: '#ff6b6b', fontSize: '1.5rem' }}>⚠️ {error}</div>
                <div style={{ color: '#8b8b8b' }}>Please check the QR code and try again</div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            padding: '2rem 1rem'
        }}>
            <div style={{
                maxWidth: '600px',
                margin: '0 auto'
            }}>
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '2rem'
                }}>
                    <h1 style={{
                        color: '#ffd700',
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                    }}>
                        Hairskiin CRM
                    </h1>
                    <p style={{ color: '#8b8b8b', fontSize: '0.9rem' }}>Client Profile</p>
                </div>

                {/* Client Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '1.5rem',
                            fontWeight: 'bold'
                        }}>
                            {client.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ color: 'white', fontSize: '1.3rem', fontWeight: '600' }}>
                                {client.name}
                            </h2>
                            <p style={{ color: '#8b8b8b', fontSize: '0.9rem' }}>
                                Client ID: #{client.client_id}
                            </p>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ccc' }}>
                            <Phone size={18} color="#ffd700" />
                            <span>{client.phone}</span>
                        </div>
                        {client.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ccc' }}>
                                <Mail size={18} color="#ffd700" />
                                <span>{client.email}</span>
                            </div>
                        )}
                        {client.address && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ccc' }}>
                                <MapPin size={18} color="#ffd700" />
                                <span>{client.address}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{
                        background: 'rgba(255,215,0,0.1)',
                        borderRadius: '12px',
                        padding: '1rem',
                        textAlign: 'center',
                        border: '1px solid rgba(255,215,0,0.2)'
                    }}>
                        <div style={{ color: '#ffd700', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {client.total_appointments || 0}
                        </div>
                        <div style={{ color: '#8b8b8b', fontSize: '0.8rem' }}>Total Visits</div>
                    </div>
                    <div style={{
                        background: 'rgba(0,255,136,0.1)',
                        borderRadius: '12px',
                        padding: '1rem',
                        textAlign: 'center',
                        border: '1px solid rgba(0,255,136,0.2)'
                    }}>
                        <div style={{ color: '#00ff88', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            LKR {(client.total_spent || 0).toLocaleString()}
                        </div>
                        <div style={{ color: '#8b8b8b', fontSize: '0.8rem' }}>Total Spent</div>
                    </div>
                </div>

                {/* Treatment History */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <h3 style={{
                        color: 'white',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        marginBottom: '1rem'
                    }}>
                        Treatment History
                    </h3>

                    {(!client.treatments_done || client.treatments_done.length === 0) ? (
                        <p style={{ color: '#8b8b8b', textAlign: 'center', padding: '2rem 0' }}>
                            No treatments yet
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {client.treatments_done.map((treatment, idx) => (
                                <div key={idx} style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '10px',
                                    padding: '1rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ color: 'white', fontWeight: '500' }}>
                                            {treatment.treatment_name}
                                        </div>
                                        <div style={{ color: '#8b8b8b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                            <Calendar size={12} />
                                            {format(new Date(treatment.appointment_date), 'MMM d, yyyy')}
                                            <Clock size={12} style={{ marginLeft: '0.5rem' }} />
                                            {treatment.appointment_time}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: '#ffd700', fontWeight: '500' }}>
                                            LKR {(treatment.amount || 0).toLocaleString()}
                                        </div>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            background: treatment.status === 'completed' ? 'rgba(0,255,136,0.2)' :
                                                treatment.status === 'cancelled' ? 'rgba(255,107,107,0.2)' :
                                                    'rgba(255,215,0,0.2)',
                                            color: treatment.status === 'completed' ? '#00ff88' :
                                                treatment.status === 'cancelled' ? '#ff6b6b' :
                                                    '#ffd700'
                                        }}>
                                            {treatment.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '2rem',
                    color: '#666',
                    fontSize: '0.8rem'
                }}>
                    Powered by Hairskiin CRM
                </div>
            </div>
        </div>
    );
}
