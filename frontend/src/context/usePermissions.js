import { useAuth } from './AuthContext';

export function usePermissions() {
    const { user } = useAuth();

    const userRole = user?.rol?.toLowerCase();
    const isSuperAdmin = userRole === 'superadmin';
    const isAdmin = userRole === 'administrador' || isSuperAdmin;
    const isAssistant = userRole === 'asistente';

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
