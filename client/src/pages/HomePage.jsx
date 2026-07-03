import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import Button from '../components/ui/Button';
import WaitlistModal from '../components/home/WaitlistModal';
import { FiShield, FiCpu, FiUser, FiCheckCircle, FiLoader } from 'react-icons/fi';

export default function HomePage() {
   const [modalOpen, setModalOpen] = useState(false);
   const [simulating, setSimulating] = useState(false);
   const [simStep, setSimStep] = useState(0); // 0: idle, 1: typing, 2: scanning, 3: result
   const [simText, setSimText] = useState('');
   const [simProgress, setSimProgress] = useState(0);

   const { isAuthenticated } = useAuthStore();
   const { theme, toggleTheme } = useUIStore();
   const navigate = useNavigate();

   const handleWaitlistOpen = () => setModalOpen(true);

   // Interactive Verification Simulator Logic
   const runSimulation = () => {
       if (simulating) return;
       setSimulating(true);
       setSimStep(1);
       setSimText('');
       setSimProgress(0);

       // Step 1: Simulate user typing
       let chars = "Watercolors on paper. Chasing sunsets in Yosemite. 🌿".split('');
       let idx = 0;
       let typingInterval = setInterval(() => {
           if (idx < chars.length) {
               setSimText(prev => prev + chars[idx]);
               idx++;
           } else {
               clearInterval(typingInterval);
               // Step 2: Simulate scanning
               setSimStep(2);
               let progressVal = 0;
               let progressInterval = setInterval(() => {
                   if (progressVal < 100) {
                       progressVal += 2;
                       setSimProgress(progressVal);
                   } else {
                       clearInterval(progressInterval);
                       // Step 3: Show result
                       setSimStep(3);
                       setSimulating(false);
                   }
               }, 20);
           }
       }, 30);
   };

   return (
       <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-color)' }}>
           {/* Top header navigation */}
           <header className="h-16 flex items-center justify-between px-6 md:px-12 border-b border-[var(--border-color)]">
               <Link to="/" className="flex items-center gap-2.5 no-underline select-none">
                   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[var(--brand-color)]">
                       <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
                       <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                   </svg>
                   <span className="font-brand text-md font-black tracking-[-0.04em] text-[var(--text-primary)]">
                       HumanHub
                   </span>
               </Link>

               <div className="flex items-center gap-4">
                   <button 
                       onClick={toggleTheme}
                       className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1.5 transition-colors"
                   >
                       {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                   </button>
                   {isAuthenticated ? (
                       <Button onClick={() => navigate('/feed')} size="sm">Enter Feed</Button>
                   ) : (
                       <Button onClick={() => navigate('/login')} size="sm" variant="secondary">Log In</Button>
                   )}
               </div>
           </header>

           {/* Hero section */}
           <main className="flex-1 max-w-[1000px] mx-auto px-6 py-12 md:py-20 flex flex-col gap-12 md:gap-16 items-center text-center">
               <div className="flex flex-col gap-6 max-w-2xl">
                   {/* Shield pill */}
                   <div className="mx-auto inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-color)] bg-[var(--surface-color)] text-[10px] font-extrabold uppercase tracking-widest text-[var(--verified-color)] shadow-sm">
                       <FiShield />
                       <span>Proof of Humanity protocol active</span>
                   </div>

                   {/* Title */}
                   <h1 className="font-brand text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-[var(--text-primary)]">
                       The internet, <span className="text-[var(--brand-color)]">verified.</span>
                   </h1>

                   {/* Description */}
                   <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto">
                       A premium social network designed to combat AI misinformation. Every post, image, and discussion is guaranteed 100% human-created.
                   </p>
               </div>

               {/* CTAs */}
               <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                   <Button onClick={handleWaitlistOpen} size="lg" className="w-full sm:w-auto">
                       Request Invitation
                   </Button>
                   <Button onClick={() => navigate('/feed')} size="lg" variant="secondary" className="w-full sm:w-auto">
                       Explore Feed
                   </Button>
               </div>

               {/* Interactive Simulator Card */}
               <div className="w-full max-w-md premium-card p-5 bg-[var(--surface-color)] border border-[var(--border-color)] text-left flex flex-col gap-4 shadow-xl">
                   <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                       <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Verification Simulator</span>
                       <button 
                           onClick={runSimulation}
                           disabled={simulating}
                           className="text-[10px] font-bold text-[var(--brand-color)] hover:underline disabled:opacity-50"
                       >
                           {simStep === 0 ? 'Run Scan' : simStep === 3 ? 'Reset' : 'Scanning...'}
                       </button>
                   </div>

                   {/* Simulator Display Screen */}
                   <div className="min-h-[96px] bg-[var(--bg-color)]/50 rounded-xl p-4 border border-[var(--border-color)] flex flex-col justify-center relative overflow-hidden">
                       {simStep === 0 && (
                           <div className="text-center py-2">
                               <p className="text-[11px] text-[var(--text-secondary)] font-medium">Click "Run Scan" to simulate a real-time verification process.</p>
                           </div>
                       )}

                       {simStep === 1 && (
                           <div className="flex flex-col gap-1">
                               <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">User Ingestion</span>
                               <p className="text-xs font-bold text-[var(--text-primary)] font-mono">{simText}</p>
                           </div>
                       )}

                       {simStep === 2 && (
                           <div className="flex flex-col items-center gap-3 py-2">
                               <FiLoader className="text-lg text-[var(--brand-color)] animate-spin" />
                               <div className="flex flex-col items-center gap-1">
                                   <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Analyzing Fingerprints</span>
                                   <span className="text-[9px] font-mono text-[var(--brand-color)]">{simProgress}% Complete</span>
                               </div>
                           </div>
                       )}

                       {simStep === 3 && (
                           <div className="flex items-center gap-3">
                               <div className="w-9 h-9 rounded-full bg-[var(--verified-color)]/10 text-[var(--verified-color)] flex items-center justify-center text-md shadow-sm">✓</div>
                               <div className="flex flex-col">
                                   <span className="text-xs font-bold text-[var(--text-primary)]">Passed: Human Verified</span>
                                   <span className="text-[9px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">Authenticity score resolved to 96% confidence.</span>
                               </div>
                           </div>
                       )}
                   </div>
               </div>

               {/* Metrics Stats Banner */}
               <div className="w-full grid grid-cols-3 gap-6 border-t border-[var(--border-color)] pt-10 pb-6">
                   <div className="flex flex-col items-center">
                       <span className="text-xl md:text-2xl font-black font-mono text-[var(--text-primary)] leading-none mb-1.5">2.4M</span>
                       <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--text-secondary)] text-center">Bots Blocked</span>
                   </div>
                   <div className="flex flex-col items-center">
                       <span className="text-xl md:text-2xl font-black font-mono text-[var(--text-primary)] leading-none mb-1.5">850k</span>
                       <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--text-secondary)] text-center">Verified Posts</span>
                   </div>
                   <div className="flex flex-col items-center">
                       <span className="text-xl md:text-2xl font-black font-mono text-[var(--text-primary)] leading-none mb-1.5">100%</span>
                       <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--text-secondary)] text-center">Organic Zones</span>
                   </div>
               </div>
           </main>

           {/* Footer */}
           <footer className="h-12 border-t border-[var(--border-color)] flex items-center justify-between px-6 md:px-12 text-[10px] text-[var(--text-muted)] select-none">
               <span>HumanHub © 2026</span>
               <div className="flex gap-4">
                   <span>Mission</span>
                   <span>API Access</span>
                   <span>Enterprise</span>
               </div>
           </footer>

           {/* Waitlist Modal */}
           <WaitlistModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
       </div>
   );
}