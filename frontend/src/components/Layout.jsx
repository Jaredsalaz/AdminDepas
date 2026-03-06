import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Moon, Sun, Bell, Menu, X, AlertTriangle, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

export default function Layout() {
    const { isDarkMode, toggleTheme } = useTheme();
    const { user, empresaActiva } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Notificaciones
    const [notificaciones, setNotificaciones] = useState([]);
    const [showNotificaciones, setShowNotificaciones] = useState(false);
    const notifRef = useRef(null);

    useEffect(() => {
        const fetchNotificaciones = async () => {
            const prefsStr = localStorage.getItem('notificacionesPreferencias');
            if (prefsStr) {
                const prefs = JSON.parse(prefsStr);
                if (!prefs.alertasSistema) return; // No hacer polling si está apagada la opción
            }

            try {
                const { data } = await api.get('/contratos/notificaciones/vencimientos');
                setNotificaciones(data);
            } catch (error) {
                // Silenciar — endpoint puede no existir en algunos entornos
            }
        };
        fetchNotificaciones();
        // Refrescar cada 5 minutos
        const interval = setInterval(fetchNotificaciones, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [empresaActiva?.id]);

    // Cerrar dropdown al hacer click afuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotificaciones(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex bg-light-bg dark:bg-dark-bg h-screen font-sans selection:bg-primary-500 selection:text-white overflow-hidden">
            {/* Background Decorativo Abstracto */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-400/10 dark:bg-primary-900/20 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-400/10 dark:bg-teal-900/20 blur-[100px]" />
            </div>

            {/* Sidebar Desktop (Oculto en móviles) - sticky */}
            <div className="relative z-10 hidden md:block flex-shrink-0">
                <Sidebar />
            </div>

            {/* Sidebar Móvil (Drawer) */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Overlay Oscuro */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        />

                        {/* Menú Deslizable */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 z-50 md:hidden"
                        >
                            <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
                            {/* Botón Cerrar Flotante en Móvil */}
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="absolute top-6 -right-12 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Contenedor principal derecho */}
            <div className="flex-1 flex flex-col relative z-10 w-full min-w-0">

                {/* Header Superior Glassmorphism - fijo */}
                <header className="relative z-20 h-20 w-full px-4 md:px-8 flex items-center justify-between bg-white/30 dark:bg-dark-surface/30 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/50 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        {/* Espacio para breadcrumbs o título de página (inyectado v2) */}
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 hidden sm:block">Resumen Ejecutivo</h2>
                    </div>

                    <div className="flex items-center space-x-6">
                        {/* Campanita de Notificaciones */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setShowNotificaciones(!showNotificaciones)}
                                className="relative text-gray-500 hover:text-primary-500 transition-colors duration-200"
                            >
                                <Bell className="w-6 h-6" />
                                {notificaciones.length > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-dark-surface px-1">
                                        {notificaciones.length}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Notificaciones */}
                            <AnimatePresence>
                                {showNotificaciones && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 mt-3 w-96 bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
                                    >
                                        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notificaciones</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">Contratos próximos a vencer</p>
                                        </div>

                                        <div className="max-h-80 overflow-y-auto">
                                            {notificaciones.length === 0 ? (
                                                <div className="p-8 text-center">
                                                    <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-400 dark:text-gray-500">No hay notificaciones pendientes</p>
                                                </div>
                                            ) : (
                                                notificaciones.map((notif, i) => (
                                                    <div
                                                        key={i}
                                                        className={`px-5 py-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${notif.dias_restantes <= 1 ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${notif.dias_restantes <= 0 ? 'bg-red-100 dark:bg-red-900/30' :
                                                                notif.dias_restantes <= 1 ? 'bg-orange-100 dark:bg-orange-900/30' :
                                                                    'bg-yellow-100 dark:bg-yellow-900/30'
                                                                }`}>
                                                                <AlertTriangle className={`w-4 h-4 ${notif.dias_restantes <= 0 ? 'text-red-500' :
                                                                    notif.dias_restantes <= 1 ? 'text-orange-500' :
                                                                        'text-yellow-500'
                                                                    }`} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                                                                    {notif.inquilino_nombre}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                    {notif.departamento} — {notif.edificio}
                                                                </p>
                                                                <p className={`text-xs font-bold mt-1 ${notif.dias_restantes <= 0 ? 'text-red-500' :
                                                                    notif.dias_restantes <= 1 ? 'text-orange-500' :
                                                                        'text-yellow-600'
                                                                    }`}>
                                                                    {notif.dias_restantes <= 0 ? '⚠️ ¡Contrato vencido!' :
                                                                        notif.dias_restantes === 1 ? '🔔 Vence mañana' :
                                                                            `📅 Vence en ${notif.dias_restantes} días`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 hover:rotate-12"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        <div className="flex items-center space-x-3 border-l border-gray-300 dark:border-gray-700 pl-6">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-teal-400 p-[2px] shadow-lg shadow-primary-500/30">
                                <div className="w-full h-full rounded-full bg-white dark:bg-dark-surface object-cover overflow-hidden">
                                    <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Avatar" />
                                </div>
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">{user?.nombre || 'Usuario'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{empresaActiva?.nombre || user?.rol}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Zona de contenido donde se inyectarán las páginas */}
                <main className="flex-1 p-8 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
