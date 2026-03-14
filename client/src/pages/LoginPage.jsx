import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
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
        } catch (err) {
            // Error managed by hook
        }
    };

    return (
         <div className="min-h-[80vh] flex items-center justify-center p-4">
               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md glass rounded-2xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-gold to-transparent"></div>
                    
                    <div className="text-center mb-8">
                         <h2 className="text-3xl font-playfair font-bold text-white mb-2">Welcome back</h2>
                         <p className="text-sm font-jakarta text-brand-muted">Securely login to your HumanHub node.</p>
                    </div>

                    {error && (
                         <div className="mb-6 p-3 rounded-lg bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-sm text-center">
                              {error}
                         </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-5">
                         <div>
                              <label className="block text-xs font-mono uppercase text-brand-muted mb-2">Account Email</label>
                              <input 
                                  required 
                                  type="email" 
                                  value={formData.email}
                                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                                  className="w-full bg-brand-bg/50 border border-white/5 rounded-lg p-3 text-white focus:outline-none focus:border-brand-gold/50 transition-colors"
                              />
                         </div>
                         <div>
                              <div className="flex justify-between items-center mb-2">
                                  <label className="block text-xs font-mono uppercase text-brand-muted mb-0">Password Signature</label>
                                  <Link to="#" className="text-xs text-brand-gold hover:underline">Reset</Link>
                              </div>
                              <input 
                                  required 
                                  type="password" 
                                  value={formData.password}
                                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                                  className="w-full bg-brand-bg/50 border border-white/5 rounded-lg p-3 text-white focus:outline-none focus:border-brand-gold/50 transition-colors"
                              />
                         </div>

                         <div className="pt-4 flex flex-col gap-4">
                              <Button type="submit" disabled={loading} className="w-full shadow-lg">
                                  {loading ? 'Authenticating...' : 'Establish Connection'}
                              </Button>
                              <div className="text-center text-sm text-brand-muted font-jakarta">
                                  Don't have clearance? <Link to="/register" className="text-white font-medium hover:text-brand-gold ml-1 transition-colors">Apply here</Link>
                              </div>
                         </div>
                    </form>
               </motion.div>
         </div>
    )
}
