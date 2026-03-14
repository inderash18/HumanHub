import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
    const location = useLocation();
    const isMarketingPage = location.pathname === '/';
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    return (
        <div style={{ minHeight: '100vh', background: '#dae0e6', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            {isAuthPage ? (
                <main style={{ paddingTop: '48px', flex: 1 }}>
                    <Outlet />
                </main>
            ) : isMarketingPage ? (
                <main style={{ flex: 1 }}>
                    <Outlet />
                </main>
            ) : (
                <div style={{ paddingTop: '48px', flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', width: '100%', maxWidth: '1200px', padding: '20px 24px', gap: '24px' }}>
                        {/* Left sidebar */}
                        <Sidebar />
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
