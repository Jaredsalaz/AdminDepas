import { useAuth } from './AuthContext';

export function usePermissions() {
    const { user } = useAuth();

    const isAdmin = user?.rol === 'Administrador';
    const isAssistant = user?.rol === 'Asistente';

    return {
        isAdmin,
        isAssistant,
        canEditFinances: isAdmin,
        canManageUsers: isAdmin,
        canDeleteData: isAdmin, // Sólo admin borra inquilinos/propiedades
        canCreateData: true,    // Asistente puede dar de alta (inquilinos, tickets, propiedades)
        canEditData: true       // Asistente puede modificar todo excepto roles y finanzas
    };
}
