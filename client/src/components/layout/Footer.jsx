import React from 'react';
import { Link } from 'react-router-dom';
import { Fingerprint, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-neutral-200 py-12 px-4 sm:px-6 select-none mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Brand & Mission */}
        <div className="space-y-2 max-w-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-white text-xs">
              <Fingerprint className="w-4 h-4" />
            </div>
            <span className="font-display font-extrabold text-sm text-black tracking-tight">
              Human<span className="text-neutral-500">Hub</span>
            </span>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            A fresh social space to share moments, discover communities, meet people, and stay connected.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Organic Communities • Real Connections</span>
          </div>
        </div>

        {/* Navigation Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
          <div className="space-y-2.5">
            <p className="font-bold text-black uppercase tracking-wider text-[11px]">Explore</p>
            <ul className="space-y-2 text-neutral-500">
              <li><Link to="/feed" className="hover:text-black transition-colors">Feed</Link></li>
              <li><Link to="/explore" className="hover:text-black transition-colors">Discover</Link></li>
              <li><Link to="/communities" className="hover:text-black transition-colors">Communities</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <p className="font-bold text-black uppercase tracking-wider text-[11px]">Account</p>
            <ul className="space-y-2 text-neutral-500">
              <li><Link to="/login" className="hover:text-black transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-black transition-colors">Create Account</Link></li>
              <li><Link to="/settings" className="hover:text-black transition-colors">Settings & Privacy</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <p className="font-bold text-black uppercase tracking-wider text-[11px]">Community</p>
            <ul className="space-y-2 text-neutral-500">
              <li><span className="text-neutral-400">Status: Online</span></li>
              <li><span className="text-neutral-400">Community Guidelines</span></li>
              <li><span className="text-neutral-400">Safety & Privacy</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-8 mt-8 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
        <p>© {new Date().getFullYear()} HumanHub. Built for real conversations and communities.</p>
        <p className="flex items-center gap-1 text-neutral-500">
          <Heart className="w-3.5 h-3.5 text-neutral-400 fill-current" />
          Designed for authentic connection
        </p>
      </div>
    </footer>
  );
}
