import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';

interface RegisterPageProps {
    onSwitchToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
    const { register, error, clearError } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [localError, setLocalError] = useState('');

    const passwordRequirements = [
        { met: password.length >= 6, text: 'At least 6 characters' },
        { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
        { met: /[0-9]/.test(password), text: 'One number' },
    ];

    const allRequirementsMet = password.length >= 6;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        clearError();

        if (!name || !email || !password || !confirmPassword) {
            setLocalError('Please fill in all fields');
            return;
        }

        if (!allRequirementsMet) {
            setLocalError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            await register(name, email, password);
        } catch (err: any) {
            setLocalError(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const displayError = localError || error;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                    <p className="text-slate-400">Join WorkSync and boost your productivity</p>
                </div>

                {/* Registration Form */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {displayError && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
                                {displayError}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-12 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Password requirements */}
                            {password && (
                                <div className="mt-2 space-y-1">
                                    {passwordRequirements.map((req, idx) => (
                                        <div key={idx} className={`flex items-center gap-2 text-xs ${req.met ? 'text-emerald-400' : 'text-slate-500'}`}>
                                            <CheckCircle className={`w-3.5 h-3.5 ${req.met ? 'text-emerald-400' : 'text-slate-500'}`} />
                                            {req.text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={`w-full pl-11 pr-4 py-3 bg-slate-900/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${confirmPassword && confirmPassword !== password
                                            ? 'border-red-500/50'
                                            : 'border-slate-600/50'
                                        }`}
                                />
                            </div>
                            {confirmPassword && confirmPassword !== password && (
                                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-400">
                            Already have an account?{' '}
                            <button
                                onClick={onSwitchToLogin}
                                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-sm mt-8">
                    © 2024 WorkSync. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
