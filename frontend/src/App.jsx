import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Mantenimiento from './pages/Mantenimiento';
import Propiedades from './pages/Propiedades';
import Inquilinos from './pages/Inquilinos';
import Finanzas from './pages/Finanzas';
import Configuracion from './pages/Configuracion';
import Login from './pages/Login';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { usePermissions } from './context/usePermissions';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center bg-dark-bg text-white">Cargando Sistema...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const RoleProtectedRoute = ({ children, requiredPermission }) => {
  const permissions = usePermissions();
  if (!permissions[requiredPermission]) return <Navigate to="/" replace />;
  return children;
};

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        {/* Dashboard Principal */}
        <Route index element={<Dashboard />} />

        {/* Vistas Simultaneadas Temporales para la Navegación, o reales añadidas */}
        <Route path="propiedades" element={<Propiedades />} />
        <Route path="inquilinos" element={<Inquilinos />} />
        <Route path="finanzas" element={
          <RoleProtectedRoute requiredPermission="canEditFinances">
            <Finanzas />
          </RoleProtectedRoute>
        } />
        <Route path="mantenimiento" element={<Mantenimiento />} />
        <Route path="settings" element={<Configuracion />} />

        {/* Ruta por defecto para 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
