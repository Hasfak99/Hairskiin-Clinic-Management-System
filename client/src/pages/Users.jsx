import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, User, Key } from 'lucide-react';
import { usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const { user: currentUser, isAdmin } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        role: 'receptionist',
    });

    useEffect(() => {
        if (isAdmin()) {
            fetchUsers();
        }
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await usersAPI.getAll();
            setUsers(response.data);
        } catch (error) {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedUser) {
                await usersAPI.update(selectedUser.user_id, {
                    full_name: formData.full_name,
                    role: formData.role,
                });
                toast.success('User updated');
            } else {
                await usersAPI.create(formData);
                toast.success('User created');
            }
            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Operation failed');
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        try {
            await usersAPI.resetPassword(selectedUser.user_id, newPassword);
            toast.success('Password reset successfully');
            setShowPasswordModal(false);
            setNewPassword('');
        } catch (error) {
            toast.error('Failed to reset password');
        }
    };

    const handleStatusToggle = async (user) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        try {
            await usersAPI.update(user.user_id, { status: newStatus });
            toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
            fetchUsers();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setFormData({
            username: user.username,
            password: '',
            full_name: user.full_name || '',
            role: user.role,
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setSelectedUser(null);
        setFormData({ username: '', password: '', full_name: '', role: 'receptionist' });
    };

    const roleColors = {
        admin: 'badge-primary',
        manager: 'badge-warning',
        receptionist: 'badge-neutral',
    };

    const columns = [
        {
            key: 'username',
            label: 'Username',
            render: (val, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                    <div className="avatar">{val?.[0]?.toUpperCase()}</div>
                    <div>
                        <p style={{ fontWeight: 500 }}>{val}</p>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                            {row.full_name || 'No name set'}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            label: 'Role',
            render: (val) => (
                <span className={`badge ${roleColors[val] || 'badge-neutral'}`}>
                    {val}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (val) => (
                <span className={`badge ${val === 'active' ? 'badge-success' : 'badge-error'}`}>
                    {val}
                </span>
            ),
        },
        {
            key: 'created_at',
            label: 'Created',
            render: (val) => format(new Date(val), 'MMM d, yyyy'),
        },
    ];

    if (!isAdmin()) {
        return (
            <div className="empty-state" style={{ minHeight: '60vh' }}>
                <Shield size={64} style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-4)' }} />
                <h2>Access Denied</h2>
                <p style={{ color: 'var(--text-muted)' }}>Only administrators can manage users</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Users</h1>
                    <p className="page-subtitle">Manage system users and access</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowModal(true); }}
                >
                    <Plus size={18} />
                    Add User
                </button>
            </div>

            <DataTable
                columns={columns}
                data={users}
                loading={loading}
                emptyMessage="No users found"
                actions={(row) => row.user_id !== currentUser?.user_id && (
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => { setSelectedUser(row); setShowPasswordModal(true); }}
                            title="Reset Password"
                        >
                            <Key size={16} />
                        </button>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => openEditModal(row)}
                            title="Edit"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleStatusToggle(row)}
                            title={row.status === 'active' ? 'Deactivate' : 'Activate'}
                            style={{ color: row.status === 'active' ? 'var(--error-500)' : 'var(--success-500)' }}
                        >
                            {row.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                )}
            />

            {/* Add/Edit User Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={selectedUser ? 'Edit User' : 'Add New User'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {selectedUser ? 'Update' : 'Create'} User
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    {!selectedUser && (
                        <>
                            <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                                <label className="input-label">Username *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                                <label className="input-label">Password *</label>
                                <input
                                    type="password"
                                    className="input"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </>
                    )}

                    <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                        <label className="input-label">Full Name</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Role *</label>
                        <select
                            className="input"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            required
                        >
                            <option value="receptionist">Receptionist</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </form>
            </Modal>

            {/* Reset Password Modal */}
            <Modal
                isOpen={showPasswordModal}
                onClose={() => { setShowPasswordModal(false); setNewPassword(''); }}
                title={`Reset Password for ${selectedUser?.username}`}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleResetPassword}>
                            Reset Password
                        </button>
                    </>
                }
            >
                <div className="input-group">
                    <label className="input-label">New Password</label>
                    <input
                        type="password"
                        className="input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 6 chars)"
                        minLength={6}
                    />
                </div>
            </Modal>
        </div>
    );
}
