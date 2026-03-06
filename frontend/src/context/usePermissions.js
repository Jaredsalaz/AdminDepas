import { useAuth } from './AuthContext';

export function usePermissions() {
    const { user } = useAuth();

    const isSuperAdmin = user?.rol === 'SuperAdmin';
    const isAdmin = user?.rol === 'Administrador' || isSuperAdmin; // SuperAdmin tiene permisos de Admin
    const isAssistant = user?.rol === 'Asistente';

    return {
        isSuperAdmin,
        isAdmin,
        isAssistant,
        canEditFinances: isAdmin,
        canManageUsers: isAdmin,
        canDeleteData: isAdmin,
        canCreateData: true,
        canEditData: true
    };
}
