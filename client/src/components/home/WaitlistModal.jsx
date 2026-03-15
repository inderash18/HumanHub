import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

export default function WaitlistModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', type: 'user' });
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await api.post('/api/waitlist', formData);
        setSuccess(true);
    } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to join waitlist');
    } finally {
        setLoading(false);
    }
  };

  if (success) {
      return (
          <Modal isOpen={isOpen} onClose={onClose} title="You're on the list.">
              <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-brand-success/20 text-brand-success flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
                  <h3 className="text-xl text-white font-bold mb-2">Verification complete.</h3>
                  <p className="text-brand-muted mb-6">We'll alert you the moment we open registrations for your cohort.</p>
                  <Button onClick={onClose} className="w-full">Return</Button>
              </div>
          </Modal>
      );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join the HumanHub Waitlist">
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div>
                <label className="block text-sm text-brand-muted font-mono mb-1">Full Name</label>
                <input 
                   required
                   type="text" 
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   className="w-full bg-brand-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-gold transition-colors" 
                   placeholder="John Doe"
                />
            </div>
            <div>
                <label className="block text-sm text-brand-muted font-mono mb-1">Email Address</label>
                <input 
                   required
                   type="email" 
                   value={formData.email}
                   onChange={e => setFormData({...formData, email: e.target.value})}
                   className="w-full bg-brand-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-gold transition-colors" 
                   placeholder="john@example.com"
                />
            </div>
            <div>
                <label className="block text-sm text-brand-muted font-mono mb-1">I am a...</label>
                <select 
                   value={formData.type}
                   onChange={e => setFormData({...formData, type: e.target.value})}
                   className="w-full bg-brand-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-gold transition-colors"
                >
                    <option value="user">Content Creator / User</option>
                    <option value="investor">Venture Capitalist / Angel</option>
                    <option value="enterprise">Enterprise seeking API access</option>
                </select>
            </div>
            
            <div className="pt-4">
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Processing...' : 'Secure My Spot'}
                </Button>
            </div>
        </form>
    </Modal>
  );
}
