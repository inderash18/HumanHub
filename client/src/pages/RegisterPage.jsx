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
            minHeight: '100vh', background: '#dae0e6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div style={{ display: 'flex', width: '100%', maxWidth: '860px', background: '#fff', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,.15)' }}>
                {/* Left panel */}
                <div style={{
                    width: '280px', flexShrink: 0,
                    background: 'linear-gradient(180deg, #ff4500 0%, #ff6534 40%, #ff8c69 100%)',
                    padding: '32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                            <svg width="32" height="32" viewBox="0 0 20 20" fill="white">
                                <circle cx="10" cy="10" r="10" fill="rgba(255,255,255,0.3)"/>
                                <path d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.92 1 1 0 0 0-.96.68l-2.38-.5a.27.27 0 0 0-.32.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .68-1.16zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.65a3.56 3.56 0 0 1-2.85.87 3.56 3.56 0 0 1-2.85-.87.23.23 0 0 1 .33-.33 3.15 3.15 0 0 0 2.52.69 3.15 3.15 0 0 0 2.52-.69.23.23 0 0 1 .33.33zm-.16-1.65a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" fill="white"/>
                            </svg>
                        </div>
                        <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 700, lineHeight: 1.2, marginBottom: '16px', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                            Join the human revolution.
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: 1.6 }}>
                            HumanHub uses advanced AI detection to ensure only real humans can post and vote.
                        </p>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                        🛡️ AI-Detection Protected • ✅ Human Verified
                    </div>
                </div>

                {/* Right panel */}
                <div style={{ flex: 1, padding: '40px 36px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1c1c1c', marginBottom: '4px', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                        Sign Up
                    </h2>
                    <p style={{ fontSize: '12px', color: '#878a8c', marginBottom: '24px' }}>
                        By continuing, you agree to our{' '}
                        <Link to="/" style={{ color: '#0079d3' }}>User Agreement</Link> and{' '}
                        <Link to="/" style={{ color: '#0079d3' }}>Privacy Policy</Link>.
                    </p>

                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <input
                            required
                            type="text"
                            placeholder="Username"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            className="reddit-input"
                            style={{ fontFamily: 'inherit' }}
                        />
                        <input
                            required
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="reddit-input"
                            style={{ fontFamily: 'inherit' }}
                        />
                        <input
                            required
                            type="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="reddit-input"
                            style={{ fontFamily: 'inherit' }}
                        />

                        <p style={{ fontSize: '11px', color: '#878a8c', lineHeight: 1.5 }}>
                            HumanHub is for everyone over 13. By creating an account, you agree that you are human and your posts may be reviewed by our AI detection system.
                        </p>

                        <button type="submit" disabled={loading} className="btn-reddit-orange" style={{ fontFamily: 'inherit', width: '100%', opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Creating Account...' : 'Continue'}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '1px', background: '#edeff1' }} />
                            <span style={{ fontSize: '12px', color: '#878a8c', fontWeight: 700 }}>OR</span>
                            <div style={{ flex: 1, height: '1px', background: '#edeff1' }} />
                        </div>

                        <div style={{ textAlign: 'center', fontSize: '14px', color: '#1c1c1c' }}>
                            Already a human?{' '}
                            <Link to="/login" style={{ color: '#ff4500', fontWeight: 700, textDecoration: 'none' }}>
                                Log In
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
