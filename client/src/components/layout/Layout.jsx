import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useUIStore } from '../../store/uiStore';
import MobileBottomNav from './MobileBottomNav';

export default function Layout() {
    const location = useLocation();
    const isMarketingPage = location.pathname === '/';
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    const theme = useUIStore((state) => state.theme);

    // Sync theme class with document body
    useEffect(() => {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }, [theme]);

    return (
        <div className="min-h-screen transition-colors duration-300 relative overflow-hidden flex flex-col" style={{ background: 'var(--bg-color)' }}>
            {/* Ambient Blurred Glassmorphism Blobs */}
            <div className="fixed top-[-20%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-[#0095F6]/5 dark:bg-[#0095F6]/7 blur-[140px] pointer-events-none z-0" />
            <div className="fixed bottom-[-15%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-purple-500/5 dark:bg-purple-500/8 blur-[140px] pointer-events-none z-0" />
            <div className="fixed top-[35%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-amber-500/3 dark:bg-amber-500/5 blur-[120px] pointer-events-none z-0" />

            {/* Top Navbar: Hidden on marketing and auth screens, visible elsewhere */}
            {!isAuthPage && !isMarketingPage && <Navbar />}

            {isAuthPage ? (
                <main className="flex-1 w-full flex items-center justify-center p-4">
                    <Outlet />
                </main>
            ) : isMarketingPage ? (
                <main className="flex-1 w-full">
                    <Outlet />
                </main>
            ) : (
                <div style={{ paddingTop: 'var(--nav-height)', flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <div className="w-full flex max-w-[1400px] mx-auto px-4 md:px-6 py-6 gap-8">
                        {/* Desktop Sticky Left Sidebar */}
                        <div className="hidden md:block sticky top-[calc(var(--nav-height)+24px)] h-[calc(100vh-var(--nav-height)-48px)]">
                            <Sidebar />
                        </div>
                        
                        {/* Main Feed/Content Column */}
                        <main className="flex-1 min-w-0 pb-20 md:pb-0">
                            <Outlet />
                        </main>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation Bar */}
            {!isAuthPage && !isMarketingPage && <MobileBottomNav />}
        </div>
    );
}
