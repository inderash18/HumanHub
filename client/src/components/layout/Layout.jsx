import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

export default function Layout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-hub-background text-hub-text-primary flex transition-colors duration-200">
      {/* Sleek Minimal Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen pl-0 md:pl-[72px] xl:pl-[240px] pb-16 md:pb-0 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
