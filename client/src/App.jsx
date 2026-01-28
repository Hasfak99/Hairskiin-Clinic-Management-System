import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientProfile from './pages/ClientProfile';
import Appointments from './pages/Appointments';
import Treatments from './pages/Treatments';
import Products from './pages/Products';
import Billing from './pages/Billing';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import Branches from './pages/Branches';
import Departments from './pages/Departments';

// Protected Route wrapper
function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ height: '100vh' }}>
                <div className="animate-pulse">
                    <div className="skeleton" style={{ width: 200, height: 40 }}></div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

// Main Layout with Sidebar
function MainLayout({ children }) {
    return (
        <div className="app-layout">
            <Sidebar />
            <div style={{ flex: 1 }}>
                <Header />
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
}

function App() {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* Public Routes */}
            <Route
                path="/login"
                element={isAuthenticated() ? <Navigate to="/" replace /> : <Login />}
            />

            {/* Public Client Profile (QR Code Scan) */}
            <Route path="/client/:qrCode" element={<ClientProfile />} />

            {/* Protected Routes */}
            <Route path="/" element={
                <ProtectedRoute>
                    <MainLayout>
                        <Dashboard />
                    </MainLayout>
                </ProtectedRoute>
            } />

            <Route path="/clients" element={
                <ProtectedRoute>
                    <MainLayout>
                        <Clients />
                    </MainLayout>
                </ProtectedRoute>
            } />

            <Route path="/appointments" element={
                <ProtectedRoute>
                    <MainLayout>
                        <Appointments />
                    </MainLayout>
                </ProtectedRoute>
            } />

            <Route path="/treatments" element={
                <ProtectedRoute>
                    <MainLayout>
                        <Treatments />
                    </MainLayout>
                </ProtectedRoute>
            } />

            <Route path="/products" element={
                <ProtectedRoute>
                    <MainLayout>
                        <Products />
                    </MainLayout>
                </ProtectedRoute>
            } />

            <Route path="/billing" element={
                <ProtectedRoute>
                    <MainLayout>
                        <Billing />
                    </MainLayout>
                </ProtectedRoute>
            } />

            <Route path="/analytics" element={
                <ProtectedRoute>
                    <MainLayout>
                        <Analytics />
                    </MainLayout>
                </ProtectedRoute>
            } />

            <Route path="/users" element={
                <ProtectedRoute>
                    <MainLayout>
                        <Users />
                    </MainLayout>
                </ProtectedRoute>
            } />

            <Route path="/branches" element={
                <ProtectedRoute>
                    <MainLayout>
                        <Branches />
                    </MainLayout>
                </ProtectedRoute>
            } />

            <Route path="/departments" element={
                <ProtectedRoute>
                    <MainLayout>
                        <Departments />
                    </MainLayout>
                </ProtectedRoute>
            } />

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
