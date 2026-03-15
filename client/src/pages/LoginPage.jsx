import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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
                {/* Left panel: Brand / Context */}
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
                            Join the <br/>Human Tribe.
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px', lineHeight: 1.6, fontWeight: 500 }}>
                            DHRUVIT is the first social network where every interaction is 100% human-verified. No AI noise.
                        </p>
                    </div>
                    
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff7f', boxShadow: '0 0 12px #00ff7f' }}></div>
                         <span style={{ color: 'white', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>AI-Free Secured</span>
                    </div>
                </div>

                {/* Right panel: Form */}
                <div style={{ flex: 1, padding: '60px 56px', background: 'var(--surface-color)' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                            Sign in to DHRUVIT
                        </h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            New to the platform?{' '}
                            <Link to="/register" style={{ color: 'var(--brand-color)', textDecoration: 'none', fontWeight: 700 }}>Create human account</Link>
                        </p>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{ 
                                marginBottom: '24px', padding: '14px 16px', 
                                background: 'rgba(255, 69, 0, 0.08)', 
                                border: '1px solid rgba(255, 69, 0, 0.2)', 
                                borderRadius: '12px', fontSize: '13px', 
                                color: 'var(--brand-color)', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '10px'
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Address</label>
                            <input
                                required
                                type="email"
                                placeholder="human@creativity.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="reddit-input"
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Password</label>
                                <Link to="/" style={{ fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Forgot?</Link>
                            </div>
                            <input
                                required
                                type="password"
                                placeholder="••••••••••••"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="reddit-input"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="btn-dhruvit" 
                            style={{ 
                                width: '100%', marginTop: '12px', padding: '14px', 
                                fontSize: '15px', letterSpacing: '0.3px',
                                boxShadow: '0 12px 24px -10px rgba(255, 69, 0, 0.4)'
                            }}
                        >
                            {loading ? 'AUTHENTICATING...' : 'ACCESS PLATFORM'}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 800 }}>OR</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                            By signing in, you agree to our <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Human Content Policy</span> and <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>User Agreement</span>.
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

