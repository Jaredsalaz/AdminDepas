import React from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/usePermissions';

/**
 * Selector de empresa que solo aparece para SuperAdmin.
 * Se coloca al inicio de cada página para filtrar datos por empresa.
 */
export default function EmpresaSelector() {
    const { empresaActiva, empresasDisponibles, seleccionarEmpresa } = useAuth();
    const { isSuperAdmin } = usePermissions();

    if (!isSuperAdmin || empresasDisponibles.length <= 1) return null;

    const handleChange = (e) => {
        const empresaId = parseInt(e.target.value);
        const empresa = empresasDisponibles.find(emp => emp.id === empresaId);
        if (empresa) {
            seleccionarEmpresa(empresa);
        }
    };

    return (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary-500/10 to-teal-500/10 dark:from-primary-900/30 dark:to-teal-900/30 rounded-xl border border-primary-200/50 dark:border-primary-800/50">
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                <Building2 className="w-5 h-5" />
                <span className="text-sm font-semibold whitespace-nowrap">🔑 Empresa:</span>
            </div>
            <div className="relative flex-1 max-w-xs">
                <select
                    value={empresaActiva?.id || ''}
                    onChange={handleChange}
                    className="w-full appearance-none bg-white dark:bg-dark-surface px-4 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                >
                    {empresasDisponibles.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
        </div>
    );
}
