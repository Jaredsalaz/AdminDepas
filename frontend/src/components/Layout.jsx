import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Moon, Sun, Bell, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
    const { isDarkMode, toggleTheme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex bg-light-bg dark:bg-dark-bg min-h-screen font-sans selection:bg-primary-500 selection:text-white">
            {/* Background Decorativo Abstracto */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-400/10 dark:bg-primary-900/20 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-400/10 dark:bg-teal-900/20 blur-[100px]" />
            </div>

            {/* Sidebar Desktop (Oculto en móviles) */}
            <div className="relative z-10 hidden md:block">
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
            <div className="flex-1 flex flex-col relative z-10 w-full overflow-hidden">

                {/* Header Superior Glassmorphism */}
                <header className="relative z-20 h-20 w-full px-4 md:px-8 flex items-center justify-between bg-white/30 dark:bg-dark-surface/30 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/50">
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
                        <button className="relative text-gray-500 hover:text-primary-500 transition-colors duration-200">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-dark-surface"></span>
                        </button>

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
                                <p className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">Administradora</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Dueña / Owner</p>
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
