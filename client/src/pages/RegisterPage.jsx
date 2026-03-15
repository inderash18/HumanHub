import { useState } from 'react';
import { register } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(formData);
            toast.success('Account created! Please log in.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
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
                            Join the Revolution.
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '15px', lineHeight: 1.6 }}>
                            Become a certified human creator on DHRUVIT. Share your voice in an AI-free ecosystem.
                        </p>
                    </div>
                    <div style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>
                         🛡️ AI-Safe Protection Enabled
                    </div>
                </div>

                {/* Right panel */}
                <div style={{ flex: 1, padding: '40px 48px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                        Sign Up
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        By continuing, you agree to our{' '}
                        <Link to="/" style={{ color: 'var(--brand-color)', textDecoration: 'none' }}>Agreement</Link>.
                    </p>

                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <input
                            required
                            type="text"
                            placeholder="HUMAN USERNAME"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            className="reddit-input"
                        />
                        <input
                            required
                            type="email"
                            placeholder="EMAIL ADDRESS"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="reddit-input"
                        />
                        <input
                            required
                            type="password"
                            placeholder="SECURE PASSWORD"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="reddit-input"
                        />

                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '8px 0' }}>
                           DHRUVIT uses real-time verification to ensure authentic human interaction. Your data is encrypted and protected.
                        </p>

                        <button type="submit" disabled={loading} className="btn-dhruvit" style={{ width: '100%', padding: '12px' }}>
                            {loading ? 'CREATING IDENTITY...' : 'CONTINUE'}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>OR</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                        </div>

                        <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Already human?{' '}
                            <Link to="/login" style={{ color: 'var(--brand-color)', fontWeight: 800, textDecoration: 'none' }}>
                                Log In
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
