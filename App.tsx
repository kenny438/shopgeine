
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminPage } from './pages/Admin';
import { StorefrontPage } from './pages/Storefront';
import { LoginPage } from './pages/Login';
import { ZCloudPage } from './pages/ZCloud';
import { Icons } from './components/UI';

// Toast Container
const ToastContainer = () => {
    const { notifications, dismissNotification } = useStore();
    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
            {notifications.map(n => (
                <div 
                    key={n.id} 
                    className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-slide-up text-sm font-medium ${
                        n.type === 'success' ? 'bg-white text-green-700 border-green-200' :
                        n.type === 'error' ? 'bg-white text-red-700 border-red-200' :
                        'bg-white text-gray-700 border-gray-200'
                    }`}
                >
                    {n.type === 'success' && <Icons.Check className="w-4 h-4" />}
                    {n.type === 'error' && <Icons.X className="w-4 h-4" />}
                    {n.type === 'info' && <Icons.Bell className="w-4 h-4" />}
                    <span>{n.message}</span>
                    <button onClick={() => dismissNotification(n.id)} className="ml-2 hover:opacity-50"><Icons.X className="w-3 h-3" /></button>
                </div>
            ))}
        </div>
    );
};

// Protected Route Component
const RequireAuth = ({ children }: { children?: React.ReactNode }) => {
    const { session, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin text-gray-900">
                    <Icons.Grid className="w-8 h-8" />
                </div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

const App = () => {
  return (
    <AuthProvider>
        <StoreProvider>
        <HashRouter>
            <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/store" element={<StorefrontPage />} />
            
            {/* Default Route redirects to ZCloud Dashboard */}
            <Route path="/" element={<Navigate to="/zcloud" replace />} />

            {/* ZCloud Master Dashboard */}
            <Route 
                path="/zcloud" 
                element={
                <RequireAuth>
                    <ZCloudPage />
                </RequireAuth>
                } 
            />
            
            {/* Specific Store Admin */}
            <Route 
                path="/admin" 
                element={
                <RequireAuth>
                    <div className="h-screen overflow-hidden bg-white">
                        <AdminPage />
                        <ToastContainer />
                    </div>
                </RequireAuth>
                } 
            />
            </Routes>
        </HashRouter>
        </StoreProvider>
    </AuthProvider>
  );
};

export default App;
