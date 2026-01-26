import axios from 'axios';

// API base URL - use proxy in development
const API_URL = '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token and branch_id
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Add branch_id to query params if available
        const branchId = localStorage.getItem('selectedBranchId');
        if (branchId && config.params) {
            config.params.branch_id = branchId;
        } else if (branchId) {
            config.params = { branch_id: branchId };
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ==================== BRANCHES ====================
export const branchesAPI = {
    getAll: (params) => api.get('/branches/', { params }),
    getById: (id) => api.get(`/branches/${id}`),
    create: (data) => api.post('/branches/', data),
    update: (id, data) => api.put(`/branches/${id}`, data),
    delete: (id) => api.delete(`/branches/${id}`),
};

// ==================== AUTH ====================
export const authAPI = {
    login: (username, password) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        return api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
    },
    register: (data) => api.post('/auth/register', data),
    getMe: () => api.get('/users/me'),
};

// ==================== USERS ====================
export const usersAPI = {
    getAll: (params) => api.get('/users/', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users/', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    resetPassword: (id, password) => api.post(`/users/${id}/reset-password`, null, { params: { new_password: password } }),
};

// ==================== CLIENTS ====================
export const clientsAPI = {
    getAll: (params) => api.get('/clients/', { params }),
    getById: (id) => api.get(`/clients/${id}`),
    lookup: (phone) => api.get(`/clients/lookup/${phone}`),
    create: (data) => api.post('/clients/', data),
    update: (id, data) => api.put(`/clients/${id}`, data),
    delete: (id) => api.delete(`/clients/${id}`),
    getAppointments: (id) => api.get(`/clients/${id}/appointments`),
    getBills: (id) => api.get(`/clients/${id}/bills`),
};

// ==================== TREATMENTS ====================
export const treatmentsAPI = {
    getAll: (params) => api.get('/treatments/', { params }),
    getById: (id) => api.get(`/treatments/${id}`),
    getCategories: () => api.get('/treatments/categories'),
    create: (data) => api.post('/treatments/', data),
    update: (id, data) => api.put(`/treatments/${id}`, data),
    delete: (id) => api.delete(`/treatments/${id}`),
};

// ==================== PRODUCTS ====================
export const productsAPI = {
    getAll: (params) => api.get('/products/', { params }),
    getById: (id) => api.get(`/products/${id}`),
    getCategories: () => api.get('/products/categories'),
    getLowStock: () => api.get('/products/low-stock'),
    create: (data) => api.post('/products/', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    updateStock: (id, quantity) => api.patch(`/products/${id}/stock`, null, { params: { quantity } }),
    delete: (id) => api.delete(`/products/${id}`),
};

// ==================== APPOINTMENTS ====================
export const appointmentsAPI = {
    getAll: (params) => api.get('/appointments/', { params }),
    getById: (id) => api.get(`/appointments/${id}`),
    getToday: () => api.get('/appointments/today'),
    getUpcoming: (days = 7) => api.get('/appointments/upcoming', { params: { days } }),
    checkAvailability: (date, treatmentId) => api.get('/appointments/check-availability', { params: { appointment_date: date, treatment_id: treatmentId } }),
    create: (data) => api.post('/appointments/', data),
    update: (id, data) => api.put(`/appointments/${id}`, data),
    updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, null, { params: { status } }),
    cancel: (id) => api.delete(`/appointments/${id}`),
};

// ==================== BILLS ====================
export const billsAPI = {
    getAll: (params) => api.get('/bills/', { params }),
    getById: (id) => api.get(`/bills/${id}`),
    getRecent: (limit = 10) => api.get('/bills/recent', { params: { limit } }),
    create: (data) => api.post('/bills/', data),
    update: (id, data) => api.put(`/bills/${id}`, data),
    updatePayment: (id, status, method) => api.patch(`/bills/${id}/payment`, null, { params: { payment_status: status, payment_method: method } }),
    delete: (id) => api.delete(`/bills/${id}`),
    addItem: (id, item) => api.post(`/bills/${id}/items`, item),
};

// ==================== ANALYTICS ====================
export const analyticsAPI = {
    getDashboard: () => api.get('/analytics/dashboard'),
    getRevenue: (period = 'month') => api.get('/analytics/revenue', { params: { period } }),
    getTopTreatments: (limit = 10) => api.get('/analytics/top-treatments', { params: { limit } }),
    getTopProducts: (limit = 10) => api.get('/analytics/top-products', { params: { limit } }),
    getAppointmentsTrend: (days = 30) => api.get('/analytics/appointments-trend', { params: { days } }),
    getClientStats: () => api.get('/analytics/client-stats'),
    getPeakHours: () => api.get('/analytics/peak-hours'),
};

// ==================== GLOBAL SEARCH ====================
export const searchAPI = {
    search: (query) => api.get('/search/', { params: { q: query } }),
    quickSearch: (query) => api.get('/search/quick', { params: { q: query } }),
};

export default api;
