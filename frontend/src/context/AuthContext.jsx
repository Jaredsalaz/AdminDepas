import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [empresaActiva, setEmpresaActiva] = useState(null); // Empresa seleccionada
    const [empresasDisponibles, setEmpresasDisponibles] = useState([]); // Solo para SuperAdmin

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            checkAuth(token);
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuth = async (token) => {
        try {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const { data } = await api.get('/auth/me');
            setUser(data);

            if (data.rol === 'SuperAdmin') {
                // SuperAdmin: cargar lista de empresas disponibles
                const empresasRes = await api.get('/auth/empresas-disponibles');
                setEmpresasDisponibles(empresasRes.data);

                // Restaurar empresa guardada o auto-seleccionar la primera
                const savedEmpresaId = localStorage.getItem('empresaActiva');
                if (savedEmpresaId) {
                    const empresa = empresasRes.data.find(e => e.id === parseInt(savedEmpresaId));
                    if (empresa) {
                        seleccionarEmpresa(empresa);
                    } else if (empresasRes.data.length > 0) {
                        seleccionarEmpresa(empresasRes.data[0]);
                    }
                } else if (empresasRes.data.length > 0) {
                    // Primera vez: auto-seleccionar la primera empresa
                    seleccionarEmpresa(empresasRes.data[0]);
                }
            } else {
                // Admin/Asistente: empresa fija
                setEmpresaActiva({
                    id: data.empresa_id,
                    nombre: data.empresa_nombre
                });
            }
        } catch (error) {
            console.error("Token inválido o expirado");
            logout();
        } finally {
            setLoading(false);
        }
    };

    const seleccionarEmpresa = (empresa) => {
        setEmpresaActiva(empresa);
        localStorage.setItem('empresaActiva', empresa.id.toString());
        // Configurar header para que el backend filtre por esta empresa
        api.defaults.headers.common['X-Empresa-Id'] = empresa.id.toString();
    };

    const login = async (email, password) => {
        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const { data } = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            localStorage.setItem('token', data.access_token);
            await checkAuth(data.access_token);
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.detail || "Error al iniciar sesión");
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('empresaActiva');
        delete api.defaults.headers.common['Authorization'];
        delete api.defaults.headers.common['X-Empresa-Id'];
        setUser(null);
        setEmpresaActiva(null);
        setEmpresasDisponibles([]);
    };

    return (
        <AuthContext.Provider value={{
            user, login, logout, loading,
            empresaActiva, empresasDisponibles, seleccionarEmpresa
        }}>
            {children}
        </AuthContext.Provider>
    );
};
