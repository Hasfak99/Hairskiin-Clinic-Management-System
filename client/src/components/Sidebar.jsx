import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Calendar,
    Scissors,
    Package,
    Receipt,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    Sparkles,

    Building2,
    Shield
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { path: '/super-admin', icon: Shield, label: 'Super Admin', roles: ['super_admin'] },
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'receptionist', 'director', 'cashier', 'doctor'] },
    { path: '/clients', icon: Users, label: 'Clients', roles: ['admin', 'manager', 'receptionist', 'director', 'cashier', 'super_admin'] },
    { path: '/appointments', icon: Calendar, label: 'Appointments', roles: ['admin', 'manager', 'receptionist', 'director', 'cashier', 'super_admin', 'doctor'] },
    { path: '/treatments', icon: Scissors, label: 'Treatments', roles: ['admin', 'manager', 'director', 'super_admin', 'doctor'] },
    { path: '/products', icon: Package, label: 'Products', roles: ['admin', 'manager', 'director', 'super_admin'], departmentRestricted: true },
    { path: '/billing', icon: Receipt, label: 'Billing', roles: ['admin', 'manager', 'receptionist', 'cashier', 'director', 'super_admin'] },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['admin', 'manager', 'director', 'super_admin'] },
    { path: '/branches', icon: Building2, label: 'Branches', roles: ['admin', 'manager', 'director', 'super_admin'] },
    { path: '/departments', icon: Building2, label: 'Departments', roles: ['admin', 'director', 'super_admin'] },
    { path: '/users', icon: Settings, label: 'Users', roles: ['admin', 'director', 'super_admin'] },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const filteredNavItems = navItems.filter(item => {
        // 1. Role Check
        const hasRole = item.roles.includes(user?.role);
        if (!hasRole) return false;

        // 2. Department Restriction (Specific to Hair Skin Clinic request)
        // "Products" only visible if 'Hair Skin Clinic' OR Admin/Director
        if (item.departmentRestricted) {
            const isRestrictedDept = user?.department_name !== 'Hair Skin Clinic';
            const isPrivileged = ['admin', 'director', 'super_admin'].includes(user?.role);

            // If user is from another department (e.g. Harskin) AND not privileged, HIDE it
            if (isRestrictedDept && !isPrivileged) {
                return false;
            }
        }

        return true;
    });

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className="sidebar-overlay hide-desktop"
                style={{ display: 'none' }}
                onClick={() => setCollapsed(true)}
            />

            <aside
                className="sidebar"
                style={{
                    width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    background: 'var(--surface)',
                    borderRight: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 100,
                    transition: 'width var(--transition-normal)',
                    overflow: 'hidden',
                }}
            >
                {/* Logo */}
                <div style={{
                    padding: 'var(--spacing-6)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-3)',
                    minHeight: 'var(--header-height)',
                }}>
                    <img
                        src="/HS_1.png"
                        alt="Hairskiin Logo"
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 'var(--radius-lg)',
                            objectFit: 'contain'
                        }}
                    />
                    {!collapsed && (
                        <div>
                            <h1 style={{
                                fontSize: 'var(--font-size-lg)',
                                fontWeight: 700,
                                background: 'var(--gradient-primary)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                Hairskiin
                            </h1>
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                CRM System
                            </p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav style={{
                    flex: 1,
                    padding: 'var(--spacing-4)',
                    overflowY: 'auto',
                }}>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                        {filteredNavItems.map(item => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    style={({ isActive }) => ({
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-3)',
                                        padding: collapsed ? 'var(--spacing-3)' : 'var(--spacing-3) var(--spacing-4)',
                                        borderRadius: 'var(--radius-lg)',
                                        color: isActive ? '#ffffff' : 'var(--text-secondary)',
                                        background: isActive ? 'var(--gradient-primary)' : 'transparent',
                                        textDecoration: 'none',
                                        fontWeight: 500,
                                        fontSize: 'var(--font-size-sm)',
                                        transition: 'all var(--transition-fast)',
                                        justifyContent: collapsed ? 'center' : 'flex-start',
                                    })}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <item.icon size={20} />
                                    {!collapsed && <span>{item.label}</span>}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Footer */}
                <div style={{
                    padding: 'var(--spacing-4)',
                    borderTop: '1px solid var(--border)',
                }}>
                    {/* Collapse Toggle */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="btn btn-ghost hide-mobile"
                        style={{
                            width: '100%',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            marginBottom: 'var(--spacing-2)',
                        }}
                    >
                        <ChevronLeft
                            size={20}
                            style={{
                                transform: collapsed ? 'rotate(180deg)' : 'none',
                                transition: 'transform var(--transition-fast)',
                            }}
                        />
                        {!collapsed && <span>Collapse</span>}
                    </button>

                    {/* User Info & Logout */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-3)',
                        padding: 'var(--spacing-3)',
                        background: 'var(--surface-elevated)',
                        borderRadius: 'var(--radius-lg)',
                    }}>
                        <div className="avatar avatar-sm">
                            {user?.full_name?.[0] || user?.username?.[0] || 'U'}
                        </div>
                        {!collapsed && (
                            <>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{
                                        fontWeight: 500,
                                        fontSize: 'var(--font-size-sm)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {user?.full_name || user?.username}
                                    </p>
                                    <p style={{
                                        fontSize: 'var(--font-size-xs)',
                                        color: 'var(--text-muted)',
                                        textTransform: 'capitalize',
                                    }}>
                                        {user?.role}
                                    </p>
                                </div>
                                <button
                                    onClick={logout}
                                    className="btn btn-ghost btn-icon"
                                    title="Logout"
                                    style={{ flexShrink: 0 }}
                                >
                                    <LogOut size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
