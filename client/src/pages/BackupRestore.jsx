import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Download, Upload, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function BackupRestore() {
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);

    // Ensure only admins can access
    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
        return (
            <div className="empty-state">
                <Shield size={48} className="empty-state-icon" />
                <h2>Access Denied</h2>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    const handleExport = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8000/api/backup/export', {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Create download link
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `hairskiin_backup_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            toast.success('Backup downloaded successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Export failed');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!window.confirm("WARNING: importing data will overwrite/merge with existing data. This cannot be undone. Are you sure?")) {
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            setImporting(true);
            await axios.post('http://localhost:8000/api/backup/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            toast.success('Data imported successfully!');
            // Refresh to show new data
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Import failed');
        } finally {
            setImporting(false);
            event.target.value = null; // Reset input
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">System Backup & Restore</h1>
                    <p className="page-subtitle">Manage your data security</p>
                </div>
            </div>

            <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-6)' }}>
                {/* Export Card */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
                        <div style={{ padding: '10px', background: 'var(--surface-elevated)', borderRadius: 'var(--radius-lg)' }}>
                            <Download size={24} color="var(--primary-600)" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Export Data</h3>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Download a full system backup</p>
                        </div>
                    </div>

                    <p style={{ marginBottom: 'var(--spacing-6)', fontSize: 'var(--font-size-sm)' }}>
                        This will generate a JSON file containing all Clients, Appointments, Bills, Treatments, Products, Users, Branches, and Departments.
                    </p>

                    <button
                        className="btn btn-primary"
                        onClick={handleExport}
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        {loading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                        {loading ? 'Exporting...' : 'Download Backup'}
                    </button>
                </div>

                {/* Import Card */}
                <div className="card" style={{ borderColor: 'var(--warning-200)', background: 'var(--warning-50)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
                        <div style={{ padding: '10px', background: '#fff', borderRadius: 'var(--radius-lg)' }}>
                            <Upload size={24} color="var(--warning-600)" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--warning-700)' }}>Restore Data</h3>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--warning-600)' }}>Import data from a backup file</p>
                        </div>
                    </div>

                    <div style={{
                        padding: 'var(--spacing-3)',
                        background: 'rgba(255, 255, 255, 0.5)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--spacing-4)',
                        border: '1px solid var(--warning-200)'
                    }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                            <AlertTriangle size={16} color="var(--warning-600)" style={{ flexShrink: 0, marginTop: 2 }} />
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--warning-700)' }}>
                                <strong>Warning:</strong> Importing data will merge with existing records. Data with matching IDs will be overwritten. Use with caution.
                            </p>
                        </div>
                    </div>

                    {importing ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-4)' }}>
                            <Loader size={24} className="animate-spin" style={{ margin: '0 auto', marginBottom: 'var(--spacing-2)' }} />
                            <p>Restoring data... Please wait.</p>
                        </div>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    cursor: 'pointer'
                                }}
                            />
                            <button className="btn" style={{ width: '100%', background: 'white', border: '1px solid var(--warning-300)', color: 'var(--warning-700)' }}>
                                <Upload size={18} />
                                Select Backup File
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
