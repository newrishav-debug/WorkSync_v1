import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import MainApp from './App';
import { Loader2 } from 'lucide-react';

type AuthView = 'login' | 'register';

const AuthWrapper: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const [authView, setAuthView] = useState<AuthView>('login');

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Show login/register if not authenticated
    if (!isAuthenticated) {
        if (authView === 'register') {
            return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
        }
        return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
    }

    // Show main app if authenticated
    return <MainApp />;
};

const AppWithAuth: React.FC = () => {
    return (
        <AuthProvider>
            <AuthWrapper />
        </AuthProvider>
    );
};

export default AppWithAuth;
