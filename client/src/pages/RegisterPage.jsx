import { useState } from 'react';
import { register } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(formData);
            toast.success("Account created successfully. Login to begin.");
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed structurally');
        } finally {
            setLoading(false);
        }
    };

    return (
         <div className="min-h-[80vh] flex items-center justify-center p-4">
               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md glass rounded-2xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                    <div className="text-center mb-8">
                         <h2 className="text-3xl font-playfair font-bold text-white mb-2">Join HumanHub</h2>
                         <p className="text-sm font-jakarta text-brand-muted">Verify your humanity.</p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-5">
                         <div>
                              <label className="block text-xs font-mono uppercase text-brand-muted mb-2">Display Name</label>
                              <input required type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full bg-brand-bg/50 border border-white/5 rounded-lg p-3 text-white focus:outline-none focus:border-brand-gold/50 transition-colors" />
                         </div>
                         <div>
                              <label className="block text-xs font-mono uppercase text-brand-muted mb-2">Account Email</label>
                              <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-brand-bg/50 border border-white/5 rounded-lg p-3 text-white focus:outline-none focus:border-brand-gold/50 transition-colors" />
                         </div>
                         <div>
                              <label className="block text-xs font-mono uppercase text-brand-muted mb-2">Password Signature</label>
                              <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-brand-bg/50 border border-white/5 rounded-lg p-3 text-white focus:outline-none focus:border-brand-gold/50 transition-colors" />
                         </div>

                         <div className="pt-4 flex flex-col gap-4">
                              <Button type="submit" disabled={loading} className="w-full shadow-lg">
                                  {loading ? 'Processing Registration...' : 'Verify & Join'}
                              </Button>
                              <div className="text-center text-sm text-brand-muted font-jakarta">
                                  Already cleared? <Link to="/login" className="text-white font-medium hover:text-brand-gold ml-1 transition-colors">Sign in</Link>
                              </div>
                         </div>
                    </form>
               </motion.div>
         </div>
    )
}
