import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, Building, Eye, EyeOff } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function Login() {
    const { login, user } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (user) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            // Redirige automáticamente por AuthContext mutando `user`
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-light-bg dark:bg-dark-bg relative overflow-hidden">
            {/* Background Animations */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary-500/10 dark:bg-primary-900/20 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-400/10 dark:bg-teal-900/20 blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-teal-400 text-white shadow-lg shadow-primary-500/30 mb-4">
                        <Building className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">DepaAdmin</h1>
                    <p className="text-gray-500 dark:text-gray-400">Inicia sesión en tu cuenta para continuar</p>
                </div>

                {/* Login Box */}
                <div className="glass-panel p-8 md:p-10 shadow-2xl border border-white/40 dark:border-gray-800/60 rounded-3xl">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {error && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 text-red-600 dark:text-red-400 text-sm font-medium">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p>{error}</p>
                            </motion.div>
                        )}

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Correo Electrónico</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@famesto.com"
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-dark-bg/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-dark-bg transition-all placeholder-gray-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contraseña</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-12 py-3 bg-gray-50/50 dark:bg-dark-bg/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-dark-bg transition-all placeholder-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-2">
                            <label className="flex items-center text-gray-600 dark:text-gray-400 cursor-pointer">
                                <input type="checkbox" className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                Recordarme
                            </label>
                            <a href="#" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg shadow-primary-500/30 text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                            ) : "Iniciar Sesión"}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
