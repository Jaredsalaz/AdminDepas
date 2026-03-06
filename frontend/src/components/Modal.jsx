import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Modal — Componente reutilizable enterprise-grade
 * 
 * Props:
 * - isOpen: boolean — controla visibilidad
 * - onClose: () => void — callback al cerrar
 * - title: string — título del modal
 * - subtitle?: string — subtítulo opcional
 * - icon?: React Component — ícono al lado del título
 * - iconColor?: string — clase de color del ícono (default: "text-primary-500")
 * - size?: "sm" | "md" | "lg" | "xl" — ancho máximo (default: "md")
 * - children: ReactNode — contenido del modal
 * - footer?: ReactNode — footer opcional (botones, etc.)
 * - headerColor?: string — clase de color de fondo del header (default: estándar)
 */
export default function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    icon: Icon,
    iconColor = "text-primary-500",
    size = "md",
    children,
    footer,
    headerColor
}) {
    const sizeClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl"
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={`bg-white dark:bg-dark-surface relative z-10 w-full ${sizeClasses[size] || sizeClasses.md} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-gray-800`}
                    >
                        {/* Header */}
                        <div className={`px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center flex-shrink-0 ${headerColor || 'bg-gray-50/50 dark:bg-dark-bg/50'}`}>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                    {Icon && <Icon className={`w-5 h-5 mr-2.5 flex-shrink-0 ${iconColor}`} />}
                                    <span className="truncate">{title}</span>
                                </h3>
                                {subtitle && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-[30px]">{subtitle}</p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="ml-4 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 shadow-sm"
                            >
                                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>

                        {/* Body — scrollable */}
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            {children}
                        </div>

                        {/* Footer — optional */}
                        {footer && (
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-dark-bg/50 flex-shrink-0">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
