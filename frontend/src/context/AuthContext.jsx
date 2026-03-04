import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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
            // Configurar el header default para axios
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const { data } = await api.get('/auth/me');
            setUser(data);
        } catch (error) {
            console.error("Token inválido o expirado");
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const formData = new URLSearchParams();
            formData.append('username', email); // OAuth2 espera username
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
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
