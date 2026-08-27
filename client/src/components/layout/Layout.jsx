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
    <div className="min-h-screen bg-black text-[#f5f5f5] flex">
      {/* Instagram Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen pl-0 md:pl-[72px] xl:pl-[245px] pb-14 md:pb-0 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
