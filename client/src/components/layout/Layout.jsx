import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
    const location = useLocation();
    const isMarketingPage = location.pathname === '/';
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            {isAuthPage ? (
                <main style={{ paddingTop: 'var(--nav-height)', flex: 1, background: 'var(--bg-color)' }}>
                    <Outlet />
                </main>
            ) : isMarketingPage ? (
                <main style={{ flex: 1, background: 'var(--bg-color)' }}>
                    <Outlet />
                </main>
            ) : (
                <div style={{ paddingTop: 'var(--nav-height)', flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', width: '100%', maxWidth: '1280px', padding: '24px', gap: '24px' }}>
                        {/* Sticky Left sidebar */}
                        <div style={{ position: 'sticky', top: 'calc(var(--nav-height) + 24px)', height: 'fit-content' }}>
                           <Sidebar />
                        </div>
                        
                        {/* Main content */}
                        <main style={{ flex: 1, minWidth: 0 }}>
                            <Outlet />
                        </main>
                    </div>
                </div>
            )}
        </div>
    );
}
