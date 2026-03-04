import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, ReceiptText, Wrench, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/usePermissions';

const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Propiedades', path: '/propiedades', icon: Building2 },
    { name: 'Inquilinos', path: '/inquilinos', icon: Users },
    { name: 'Finanzas', path: '/finanzas', icon: ReceiptText },
    { name: 'Mantenimiento', path: '/mantenimiento', icon: Wrench },
    { name: 'Configuración', path: '/settings', icon: Settings },
];

export default function Sidebar({ onClose }) {
    const { logout } = useAuth();
    const { canEditFinances } = usePermissions();

    // Filtramos los items de navegación disponibles según permisos
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
            <div className="p-6 flex items-center justify-center border-b border-gray-100 dark:border-gray-800">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-teal-400 bg-clip-text text-transparent drop-shadow-sm">
                    DepaAdmin
                </h1>
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
