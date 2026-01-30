import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, branchesAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const response = await authAPI.getMe();
                    setUser(response.data);

                    // Load branches
                    try {
                        const branchesList = await fetchBranches();

                        // Set selected branch from localStorage or user's branch
                        const savedBranchId = localStorage.getItem('selectedBranchId');
                        if (savedBranchId) {
                            const branch = branchesList.find(b => b.branch_id === parseInt(savedBranchId));
                            if (branch) {
                                setSelectedBranch(branch);
                            } else if (response.data.branch_id) {
                                const userBranch = branchesList.find(b => b.branch_id === response.data.branch_id);
                                if (userBranch) {
                                    setSelectedBranch(userBranch);
                                    localStorage.setItem('selectedBranchId', userBranch.branch_id);
                                }
                            }
                        } else if (response.data.branch_id) {
                            const userBranch = branchesList.find(b => b.branch_id === response.data.branch_id);
                            if (userBranch) {
                                setSelectedBranch(userBranch);
                                localStorage.setItem('selectedBranchId', userBranch.branch_id);
                            }
                        }
                    } catch (error) {
                        console.error('Error loading branches:', error);
                    }
                } catch (error) {
                    console.error('Auth init error:', error);
                    logout();
                }
            }
            setLoading(false);
        };
        initAuth();
    }, [token]);

    const login = async (username, password) => {
        const response = await authAPI.login(username, password);
        const { access_token } = response.data;

        localStorage.setItem('token', access_token);
        setToken(access_token);

        // Get user info
        const userResponse = await authAPI.getMe();
        setUser(userResponse.data);

        return userResponse.data;
    };

    const register = async (userData) => {
        const response = await authAPI.register(userData);
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('selectedBranchId');
        setToken(null);
        setUser(null);
        setSelectedBranch(null);
        setBranches([]);
    };

    const selectBranch = (branch) => {
        setSelectedBranch(branch);
        localStorage.setItem('selectedBranchId', branch.branch_id);
    };

    const isAdmin = () => user?.role === 'admin' || user?.role === 'super_admin';
    const isManager = () => ['manager', 'admin', 'super_admin'].includes(user?.role);
    const isAuthenticated = () => !!token && !!user;

    const fetchBranches = async () => {
        try {
            // Fetch all branches (admins need to see them all)
            const response = await branchesAPI.getAll({ active_only: false });
            setBranches(response.data);
            return response.data;
        } catch (error) {
            console.error('Error loading branches:', error);
            return [];
        }
    };

    const refreshBranches = fetchBranches;

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAdmin,
        isManager,
        isAuthenticated,
        selectedBranch,
        branches,
        selectBranch,
        refreshBranches,
    };

    return (
        <AuthContext.Provider value={value} >
            {children}
        </AuthContext.Provider >
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
