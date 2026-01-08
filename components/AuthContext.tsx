import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginAPI, registerAPI, getCurrentUserAPI, AuthUser } from '../services/apiService';

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    error: string | null;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check for existing token on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    const userData = await getCurrentUserAPI();
                    setUser(userData);
                } catch (err) {
                    // Token is invalid, clear it
                    localStorage.removeItem('auth_token');
                }
            }
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        setError(null);
        try {
            const response = await loginAPI(email, password);
            localStorage.setItem('auth_token', response.token);
            setUser(response.user);
        } catch (err: any) {
            const message = err.message || 'Login failed';
            setError(message);
            throw err;
        }
    };

    const register = async (name: string, email: string, password: string) => {
        setError(null);
        try {
            await registerAPI(name, email, password);
            // Auto-login after registration
            await login(email, password);
        } catch (err: any) {
            const message = err.message || 'Registration failed';
            setError(message);
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setUser(null);
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
                error,
                clearError
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
