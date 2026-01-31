import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                await login(username, password);
                toast.success('Welcome back!');
                navigate('/');
            } else {
                await register({ username, password, full_name: fullName });
                toast.success('Account created! Please login.');
                setIsLogin(true);
            }
        } catch (error) {
            const message = error.response?.data?.detail || 'Something went wrong';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-4)',
            background: '#ffffff',
        }}>
            {/* Login Card */}
            <div className="card" style={{
                width: '100%',
                maxWidth: 440,
                padding: 'var(--spacing-8)',
                background: '#ffffff',
                border: '1px solid #e5e5e5',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
                    <img
                        src="/HS_1.png"
                        alt="Hairskiin Logo"
                        style={{
                            width: 80,
                            height: 80,
                            margin: '0 auto var(--spacing-4)',
                            objectFit: 'contain'
                        }}
                    />
                    <h1 style={{
                        fontSize: 'var(--font-size-2xl)',
                        fontWeight: 700,
                        color: '#000000',
                    }}>
                        Hairskiin CRM
                    </h1>
                    <p style={{ color: '#a3a3a3', marginTop: 'var(--spacing-2)' }}>
                        {isLogin ? 'Sign in to your account' : 'Create your admin account'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                            <label className="input-label">Full Name</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className="input-group" style={{ marginBottom: 'var(--spacing-4)' }}>
                        <label className="input-label">Username</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--spacing-6)' }}>
                        <label className="input-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ paddingRight: 48 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-pulse" />
                                {isLogin ? 'Signing in...' : 'Creating account...'}
                            </>
                        ) : (
                            isLogin ? 'Sign In' : 'Create Account'
                        )}
                    </button>
                </form>

                {/* Toggle Removed */}
            </div>
        </div>
    );
}
