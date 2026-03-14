import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import Hero from '../components/home/Hero';
import Problem from '../components/home/Problem';
import Solution from '../components/home/Solution';
import LiveDemo from '../components/home/LiveDemo';
import Features from '../components/home/Features';
import BusinessModel from '../components/home/BusinessModel';
import Traction from '../components/home/Traction';
import InvestorCTA from '../components/home/InvestorCTA';
import WaitlistModal from '../components/home/WaitlistModal';

export default function HomePage() {
   const [modalOpen, setModalOpen] = useState(false);
   const { isAuthenticated } = useAuthStore(); // Can redirect entirely if preferred 

   const handleWaitlistOpen = () => setModalOpen(true);

   return (
       <div className="min-h-screen bg-brand-bg text-brand-text">
           <Hero onWaitlistClick={handleWaitlistOpen} />
           <Problem />
           <Solution />
           <LiveDemo />
           <Features />
           <BusinessModel />
           <Traction />
           <InvestorCTA onEmailDeckClick={handleWaitlistOpen} />
           
           <WaitlistModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
       </div>
   )
}