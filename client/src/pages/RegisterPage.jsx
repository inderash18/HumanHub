import { useState } from 'react';
import { register } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

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
            <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                style={{ 
                    display: 'flex', width: '100%', maxWidth: '920px', 
                    background: 'var(--surface-color)', borderRadius: '24px', 
                    overflow: 'hidden', border: '1px solid var(--border-color)',
                    boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6)'
                }}
            >
                {/* Left panel */}
                <div 
                    className="auth-panel-left"
                    style={{
                        width: '380px', flexShrink: 0,
                        background: 'linear-gradient(135deg, var(--brand-color) 0%, #a22c00 100%)',
                        padding: '60px 48px', display: 'flex', flexDirection: 'column', 
                        justifyContent: 'space-between', position: 'relative'
                    }}
                >
                    <div style={{ position: 'relative', zIndex: 1 }}>
                         <div style={{ marginBottom: '40px' }}>
                             <svg viewBox="0 0 100 100" width="64" height="64" style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))' }}>
                                <circle cx="50" cy="50" r="48" fill="white" />
                                <path d="M50 20 L50 80 M20 50 L80 50" stroke="var(--brand-color)" strokeWidth="10" strokeLinecap="round" />
                             </svg>
                         </div>
                        <h1 style={{ color: 'white', fontSize: '36px', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-1.5px', fontFamily: 'Outfit, sans-serif' }}>
                            Start Your <br/>Human Journey.
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px', lineHeight: 1.6, fontWeight: 500 }}>
                            Join 1M+ humans sharing authentic thoughts in an AI-free ecosystem.
                        </p>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, color: 'white', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff7f', boxShadow: '0 0 12px #00ff7f' }}></div>
                         <span>SECURED BY DHRUVIT-AI™</span>
                    </div>
                </div>

                {/* Right panel */}
                <div style={{ flex: 1, padding: '60px 56px', background: 'var(--surface-color)' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                            Create Account
                        </h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Already a member?{' '}
                            <Link to="/login" style={{ color: 'var(--brand-color)', textDecoration: 'none', fontWeight: 700 }}>Log In</Link>
                        </p>
                    </div>

                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Username</label>
                            <input
                                required
                                type="text"
                                placeholder="@HUMAN_CREATOR"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                className="reddit-input"
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Address</label>
                            <input
                                required
                                type="email"
                                placeholder="YOU@EXAMPLE.COM"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="reddit-input"
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Secret Password</label>
                            <input
                                required
                                type="password"
                                placeholder="••••••••••••"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="reddit-input"
                            />
                        </div>

                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '8px 0' }}>
                           DHRUVIT uses real-time biological verification cues to ensure authentic human interaction. Your data is encrypted and protected.
                        </p>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="btn-dhruvit" 
                            style={{ 
                                width: '100%', padding: '14px', fontSize: '15px', letterSpacing: '0.3px',
                                boxShadow: '0 12px 24px -10px rgba(255, 69, 0, 0.4)'
                            }}
                        >
                            {loading ? 'INITIATING...' : 'CREATE IDENTITY'}
                        </button>

                        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                            By joining, you agree to our <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Agreement</span>.
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
