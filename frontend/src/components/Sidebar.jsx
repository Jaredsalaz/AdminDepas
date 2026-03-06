import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, ReceiptText, Wrench, Settings, LogOut, ChevronDown, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/usePermissions';

const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Propiedades', path: '/propiedades', icon: Building2 },
    { name: 'Inquilinos', path: '/inquilinos', icon: Users },
    { name: 'Cobranza y Pagos', path: '/cobranza', icon: Wallet },
    { name: 'Finanzas', path: '/finanzas', icon: ReceiptText },
    { name: 'Mantenimiento', path: '/mantenimiento', icon: Wrench },
    { name: 'Configuración', path: '/settings', icon: Settings },
];

export default function Sidebar({ onClose }) {
    const { logout, empresaActiva, empresasDisponibles, seleccionarEmpresa, user } = useAuth();
    const { canEditFinances, isSuperAdmin } = usePermissions();
    const [showEmpresaSelector, setShowEmpresaSelector] = useState(false);

    const availableNavItems = navItems.filter(item => {
        if (item.name === 'Finanzas' && !canEditFinances) return false;
        return true;
    });

    return (
        <motion.aside
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-64 h-screen border-r border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-dark-surface/50 backdrop-blur-xl flex flex-col transition-colors duration-300"
        >
            {/* Logo + Nombre Empresa */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-teal-400 bg-clip-text text-transparent drop-shadow-sm text-center">
                    DepaAdmin
                </h1>

                {/* Selector de empresa / Nombre de empresa */}
                {empresaActiva && (
                    <div className="mt-3 relative">
                        {isSuperAdmin && empresasDisponibles.length > 1 ? (
                            <>
                                <button
                                    onClick={() => setShowEmpresaSelector(!showEmpresaSelector)}
                                    className="w-full flex items-center justify-between px-3 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-sm font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                                >
                                    <span className="truncate">{empresaActiva.nombre}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showEmpresaSelector ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {showEmpresaSelector && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-surface rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-48 overflow-y-auto"
                                        >
                                            {empresasDisponibles.map(emp => (
                                                <button
                                                    key={emp.id}
                                                    onClick={() => {
                                                        seleccionarEmpresa(emp);
                                                        setShowEmpresaSelector(false);
                                                        // Recargar la página para refrescar datos con la nueva empresa
                                                        window.location.reload();
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${emp.id === empresaActiva.id
                                                        ? 'text-primary-600 dark:text-primary-400 font-semibold bg-primary-50 dark:bg-primary-900/20'
                                                        : 'text-gray-700 dark:text-gray-300'
                                                        }`}
                                                >
                                                    {emp.nombre}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        ) : (
                            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                                {empresaActiva.nombre}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <nav className="flex-1 px-4 py-8 space-y-2">
                {availableNavItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`
                        }
                        onClick={() => {
                            if (onClose) onClose();
                        }}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={`w-5 h-5 mr-3 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                <span className="font-medium">{item.name}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 w-1 h-8 rounded-r-md bg-primary-500"
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 text-sm font-medium">
                {/* Mostrar rol del usuario */}
                {user && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 px-4">
                        {user.nombre} • {isSuperAdmin ? '🔑 SuperAdmin' : user.rol}
                    </p>
                )}
                <button
                    onClick={logout}
                    className="flex w-full items-center px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Cerrar Sesión
                </button>
            </div>
        </motion.aside>
    );
}
