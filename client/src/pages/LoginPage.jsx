import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
    const { handleLogin, loading, error } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            await handleLogin(formData);
            navigate('/feed');
        } catch (err) {}
    };

    return (
        <div style={{
            minHeight: '100vh', background: 'var(--bg-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div style={{ display: 'flex', width: '100%', maxWidth: '860px', background: 'var(--surface-color)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                {/* Left panel */}
                <div style={{
                    width: '320px', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--brand-color) 0%, #cc3700 100%)',
                    padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                    <div>
                         <div style={{ marginBottom: '32px' }}>
                             <svg viewBox="0 0 100 100" width="50" height="50">
                                <circle cx="50" cy="50" r="48" fill="white" />
                                <path d="M50 20 L50 80 M20 50 L80 50" stroke="var(--brand-color)" strokeWidth="8" />
                             </svg>
                         </div>
                        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 800, lineHeight: 1.2, marginBottom: '20px' }}>
                            Human Only Space.
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '15px', lineHeight: 1.6 }}>
                            Login to DHRUVIT and connect with real human creativity, free from AI noise.
                        </p>
                    </div>
                    <div style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>
                         DHRUVIT Network © 2026
                    </div>
                </div>

                {/* Right panel */}
                <div style={{ flex: 1, padding: '48px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                        Log In
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                        By continuing, you agree to our{' '}
                        <Link to="/" style={{ color: 'var(--brand-color)', textDecoration: 'none' }}>Agreement</Link>.
                    </p>

                    {error && (
                        <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255, 69, 0, 0.1)', border: '1px solid var(--brand-color)', borderRadius: '8px', fontSize: '13px', color: 'var(--brand-color)' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <input
                            required
                            type="email"
                            placeholder="EMAIL"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="reddit-input"
                        />
                        <input
                            required
                            type="password"
                            placeholder="PASSWORD"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="reddit-input"
                        />
                        
                        <Link to="/" style={{ fontSize: '12px', color: 'var(--brand-color)', textDecoration: 'none', fontWeight: 700 }}>Forgot password?</Link>

                        <button type="submit" disabled={loading} className="btn-dhruvit" style={{ width: '100%', marginTop: '8px', padding: '12px' }}>
                            {loading ? 'AUTHENTICATING...' : 'LOG IN'}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '12px 0' }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>OR</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                        </div>

                        <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            New here?{' '}
                            <Link to="/register" style={{ color: 'var(--brand-color)', fontWeight: 800, textDecoration: 'none' }}>
                                Create Human Account
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
