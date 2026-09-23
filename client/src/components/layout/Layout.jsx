import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

export default function Layout() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isLandingPage = !isAuthenticated && location.pathname === '/';

  if (isAuthPage || isLandingPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-[var(--ig-bg)] text-[var(--ig-text-primary)] flex">
      {/* Desktop Fixed Left Sidebar & Drawers */}
      <Sidebar />

      {/* Main Responsive Content Area */}
      <main className="flex-1 min-h-screen pl-0 md:pl-[72px] xl:pl-[244px] pt-12 md:pt-0 pb-[50px] md:pb-0 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Mobile Top Header and Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
