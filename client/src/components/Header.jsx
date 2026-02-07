import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, User, Package, Scissors, Calendar, Building2, ChevronDown } from 'lucide-react';
import { searchAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const typeIcons = {
    client: User,
    treatment: Scissors,
    product: Package,
    appointment: Calendar,
};

const typeColors = {
    client: '#8b5cf6',
    treatment: '#ec4899',
    product: '#10b981',
    appointment: '#f59e0b',
};

export default function Header() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const searchRef = useRef(null);
    const branchRef = useRef(null);
    const [showBranchMenu, setShowBranchMenu] = useState(false);
    const navigate = useNavigate();
    const { user, selectedBranch, branches, selectBranch, isAdmin, isManager } = useAuth();

    // Search with debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                try {
                    const response = await searchAPI.search(searchQuery);
                    setSearchResults(response.data);
                    setShowResults(true);
                } catch (error) {
                    console.error('Search error:', error);
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Close search on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
            if (branchRef.current && !branchRef.current.contains(event.target)) {
                setShowBranchMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResultClick = (result) => {
        navigate(result.url);
        setSearchQuery('');
        setShowResults(false);
    };

    return (
        <header style={{
            position: 'fixed',
            top: 0,
            right: 0,
            left: 'var(--sidebar-width)',
            height: 'var(--header-height)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--spacing-6)',
            zIndex: 90,
            transition: 'left var(--transition-normal)',
        }}>
            {/* Mobile Menu Toggle */}
            <button
                className="btn btn-ghost btn-icon hide-desktop"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Global Search */}
            <div className="global-search" ref={searchRef}>
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    className="input"
                    placeholder="Search clients, treatments, products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                />
                <span className="search-shortcut hide-mobile">⌘K</span>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                    <div className="search-results">
                        {searchResults.map((result, index) => {
                            const Icon = typeIcons[result.type] || User;
                            return (
                                <div
                                    key={`${result.type}-${result.id}-${index}`}
                                    className="search-result-item"
                                    onClick={() => handleResultClick(result)}
                                >
                                    <div
                                        className="search-result-icon"
                                        style={{ background: typeColors[result.type] }}
                                    >
                                        <Icon size={18} color="white" />
                                    </div>
                                    <div className="search-result-info">
                                        <div className="search-result-title">{result.title}</div>
                                        <div className="search-result-subtitle">
                                            {result.subtitle} • {result.type}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                {/* Branch Selector (Admin/Manager only) */}
                {(isAdmin() || isManager()) && branches.length > 0 && (
                    <div ref={branchRef} style={{ position: 'relative' }}>
                        {/* 
                           Filter branches: 
                           - Super Admin: See all
                           - Others: See only their assigned branch (if assigned), else all (if global)
                        */}
                        {(() => {
                            const isMainBranch = user?.branch_name === 'Main Branch' || user?.branch_name === 'Main Branch ' || !user?.branch_id;
                            const isSuperOrDirector = user?.role === 'super_admin' || user?.role === 'director';
                            const canViewAll = isSuperOrDirector || isMainBranch;

                            const visibleBranches = canViewAll
                                ? branches
                                : branches.filter(b => b.branch_id === parseInt(user.branch_id));

                            const canSwitch = visibleBranches.length > 1;

                            return (
                                <>
                                    <button
                                        className={`btn btn-ghost ${!canSwitch ? 'btn-disabled' : ''}`}
                                        onClick={() => canSwitch && setShowBranchMenu(!showBranchMenu)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-2)',
                                            fontSize: 'var(--font-size-sm)',
                                            cursor: canSwitch ? 'pointer' : 'default',
                                            opacity: canSwitch ? 1 : 0.8
                                        }}
                                        disabled={!canSwitch}
                                    >
                                        <Building2 size={18} />
                                        <span className="hide-mobile">
                                            {selectedBranch?.branch_name || 'Select Branch'}
                                        </span>
                                        {canSwitch && <ChevronDown size={16} />}
                                    </button>

                                    {showBranchMenu && canSwitch && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: 'var(--spacing-2)',
                                            background: 'white',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-lg)',
                                            boxShadow: 'var(--shadow-lg)',
                                            minWidth: 200,
                                            zIndex: 1000,
                                            overflow: 'hidden',
                                        }}>
                                            {visibleBranches.map((branch) => (
                                                <button
                                                    key={branch.branch_id}
                                                    onClick={() => {
                                                        selectBranch(branch);
                                                        setShowBranchMenu(false);
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        padding: 'var(--spacing-3) var(--spacing-4)',
                                                        textAlign: 'left',
                                                        background: selectedBranch?.branch_id === branch.branch_id
                                                            ? 'var(--surface-elevated)'
                                                            : 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: 'var(--font-size-sm)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 'var(--spacing-2)',
                                                    }}
                                                >
                                                    <Building2 size={16} />
                                                    <span>{branch.branch_name}</span>
                                                    {!branch.is_active && (
                                                        <span style={{
                                                            fontSize: 'var(--font-size-xs)',
                                                            color: 'var(--text-muted)',
                                                            marginLeft: 'auto'
                                                        }}>
                                                            (Inactive)
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* Notifications */}
                <button className="btn btn-ghost btn-icon" title="Notifications">
                    <Bell size={20} />
                </button>

                {/* User Avatar (Mobile) */}
                <div className="avatar hide-desktop">
                    {user?.full_name?.[0] || user?.username?.[0] || 'U'}
                </div>
            </div>

            {/* Mobile Responsive Style Override */}
            <style>{`
        @media (max-width: 1024px) {
          header {
            left: 0 !important;
          }
          .global-search {
            max-width: 100%;
            flex: 1;
            margin: 0 var(--spacing-3);
          }
        }
      `}</style>
        </header>
    );
}
