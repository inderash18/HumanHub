import React from 'react';
import { motion } from 'framer-motion';
import { FaUserShield, FaCalendarAlt, FaFire, FaCertificate } from 'react-icons/fa';

/**
 * 🆔 IDENTITY TRACKER (Sidebar Widget)
 * Implements the "Certified Human" overview for the user's sidebar.
 * Strictly follows the App Mode Right Rail / Sidebar specifications.
 */

export default function IdentityTracker({ user, stats }) {
  if (!user) return null;

  // Derive initials for the brand gradient circle
  const initials = user.username?.substring(0, 2).toUpperCase() || 'H';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="reddit-card w-full p-4 mb-4"
      style={{
        backgroundColor: 'var(--surface-color)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        position: 'sticky',
        top: '80px'
      }}
    >
      <div className="flex items-center gap-4 mb-4">
        {/* Avatar Initials Circle with Brand Gradient */}
        <div 
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[18px] font-black text-white shadow-lg"
          style={{ 
            background: 'linear-gradient(135deg, var(--brand-color) 0%, #ff8c00 100%)',
            fontFamily: 'Outfit'
          }}
        >
          {initials}
        </div>
        
        <div>
          <div className="text-[15px] font-bold text-[#e7e9ea] font-outfit leading-tight">
            u/{user.username}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#818384] mt-1">
            <FaCalendarAlt className="text-[10px]" />
            <span>Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Certified Human Status Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-[1.5px] text-[#818384]">Status</span>
          <div className="flex items-center gap-1.5">
             <div 
                className="w-[6px] h-[6px] rounded-full bg-[#46d160]"
                style={{ 
                    boxShadow: '0 0 10px rgba(70, 209, 96, 0.6)',
                    animation: 'pulse 2s infinite'
                }} 
             />
             <span className="text-[10px] font-black text-[#46d160] uppercase tracking-wider">Certified Human</span>
          </div>
        </div>
        
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(user.trustScore || 0.5) * 100}%` }}
            className="h-full bg-[#46d160]"
            style={{ boxShadow: '0 0 15px rgba(70, 209, 96, 0.3)' }}
          />
        </div>
      </div>

      {/* 3-Column Micro-Stats */}
      <div className="grid grid-cols-3 border-t border-white/5 pt-4">
        <div className="flex flex-col items-center">
          <span className="text-[14px] font-bold text-[#e7e9ea] font-mono">{(user.trustScore * 100).toFixed(0)}</span>
          <span className="text-[9px] font-black uppercase text-[#4a4f55] tracking-widest mt-1">Humanity</span>
        </div>
        <div className="flex flex-col items-center border-l border-white/5">
          <span className="text-[14px] font-bold text-[#e7e9ea] font-mono">{stats?.karma || 0}</span>
          <span className="text-[9px] font-black uppercase text-[#4a4f55] tracking-widest mt-1">Karma</span>
        </div>
        <div className="flex flex-col items-center border-l border-white/5">
          <span className="text-[14px] font-bold text-[#e7e9ea] font-mono">{stats?.postCount || 0}</span>
          <span className="text-[9px] font-black uppercase text-[#4a4f55] tracking-widest mt-1">Posts</span>
        </div>
      </div>

      {/* Action Button */}
      <button className="w-full py-2.5 mt-4 rounded-full bg-[#ff4500] hover:bg-[#ff5414] text-white text-[12px] font-bold uppercase tracking-widest transition-all transform hover:scale-[1.02] active:scale-[0.98]">
        Public Publication
      </button>

      <style>{`
        @keyframes pulse { 
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </motion.div>
  );
}
