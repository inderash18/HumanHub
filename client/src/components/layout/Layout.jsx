import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function Layout() {
    const location = useLocation();
    const isMarketingPage = location.pathname === '/';

    return (
        <div className="min-h-screen flex flex-col bg-brand-bg relative">
            <Navbar />
            
            <div className={`flex-1 flex w-full max-w-[1400px] mx-auto ${isMarketingPage ? '' : 'px-4 lg:px-8 pt-16'}`}>
                {!isMarketingPage && <Sidebar />}
                
                <main className={`flex-1 min-w-0 ${isMarketingPage ? '' : 'py-6 px-4 lg:px-8'}`}>
                    <Outlet />
                </main>
            </div>
            
            {isMarketingPage && <Footer />}
        </div>
    );
}
