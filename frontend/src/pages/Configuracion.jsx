import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Shield, Wallet, Save, Upload, Users, Plus, X, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/usePermissions';
import api from '../api';

export default function Configuracion() {
    const { user } = useAuth();
    const { isAdmin, canEditFinances } = usePermissions();

    const [activeTab, setActiveTab] = useState('perfil');

    // Usuarios State
    const [usuarios, setUsuarios] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ nombre: '', email: '', password: '', rol: 'Administrador' });

    const [editingPasswordUser, setEditingPasswordUser] = useState(null);
    const [newPasswordValue, setNewPasswordValue] = useState('');

    useEffect(() => {
        if (activeTab === 'usuarios') {
            fetchUsuarios();
        }
    }, [activeTab]);

    const fetchUsuarios = async () => {
        try {
            const { data } = await api.get('/auth/usuarios');
            setUsuarios(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/auth/register', newUserForm);
            setNewUserForm({ nombre: '', email: '', password: '', rol: 'Administrador' });
            fetchUsuarios();
            alert("Usuario creado exitosamente");
        } catch (error) {
            alert(error.response?.data?.detail || "Error al crear usuario");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChangeUserPassword = async (e) => {
        e.preventDefault();
        if (!newPasswordValue) return;
        setIsSubmitting(true);
        try {
            await api.put(`/auth/usuarios/${editingPasswordUser.id}/password`, {
                new_password: newPasswordValue
            });
            alert('Contraseña actualizada correctamente');
            setEditingPasswordUser(null);
            setNewPasswordValue('');
        } catch (error) {
            alert(error.response?.data?.detail || "Error al actualizar contraseña");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Configuración</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Administra tu cuenta, notificaciones y preferencias del sistema.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">

                {/* Menú Lateral Navegación Configuración */}
                <div className="w-full md:w-64 flex-shrink-0 space-y-1">
                    <button
                        onClick={() => setActiveTab('perfil')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'perfil' ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface'}`}
                    >
                        <User className="w-5 h-5 mr-3" />
                        Perfil y Cuenta
                    </button>
                    {canEditFinances && (
                        <button
                            onClick={() => setActiveTab('finanzas')}
                            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'finanzas' ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface'}`}
                        >
                            <Wallet className="w-5 h-5 mr-3" />
                            Datos Fiscales y Recibos
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('seguridad')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'seguridad' ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface'}`}
                    >
                        <Shield className="w-5 h-5 mr-3" />
                        Seguridad
                    </button>
                    <button
                        onClick={() => setActiveTab('notificaciones')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'notificaciones' ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface'}`}
                    >
                        <Bell className="w-5 h-5 mr-3" />
                        Notificaciones
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('usuarios')}
                            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'usuarios' ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface'}`}
                        >
                            <Users className="w-5 h-5 mr-3" />
                            Gestión de Acceso
                        </button>
                    )}
                </div>

                {/* Área de Contenido Principal */}
                <div className="flex-1 glass-panel p-6 md:p-8 min-h-[500px]">

                    {/* TAB PERFIL */}
                    {activeTab === 'perfil' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Información Personal</h3>

                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-500 to-teal-400 p-1">
                                    <div className="w-full h-full rounded-full bg-white dark:bg-dark-surface object-cover overflow-hidden flex items-center justify-center">
                                        <img src="https://ui-avatars.com/api/?name=Marisol+Sanchez&background=random&size=128" alt="Avatar" />
                                    </div>
                                </div>
                                <div>
                                    <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center">
                                        <Upload className="w-4 h-4 mr-2" />
                                        Subir nueva foto
                                    </button>
                                    <p className="text-xs text-gray-500 mt-2">JPG, GIF o PNG. Tamaño máximo 2MB.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo</label>
                                    <input type="text" defaultValue={user?.nombre || "Cargando..."} className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
                                    <input type="email" defaultValue={user?.email || "Cargando..."} className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol en el Sistema</label>
                                    <input type="text" disabled defaultValue={user?.rol || "Asistente"} className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB FINANZAS */}
                    {activeTab === 'finanzas' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Configuración de Recibos y Empresa</h3>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de la Empresa o Entidad</label>
                                    <input type="text" defaultValue="Grupo Famesto" className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Comercial a mostrar (Arrendador)</label>
                                    <input type="text" defaultValue="Marisol Sánchez" className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                                    <p className="text-xs text-gray-500 mt-1">Este nombre aparecerá en la sección de firmas del PDF.</p>
                                </div>
                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-2">
                                    <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-4">Datos Bancarios para Depósitos</h4>
                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            <input type="text" placeholder="Banco (Ej. BBVA)" defaultValue="BBVA" className="w-1/3 px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                                            <input type="text" placeholder="CLABE o Cuenta" defaultValue="012XXXXXXXXXXXXXXX" className="w-2/3 px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB SEGURIDAD */}
                    {activeTab === 'seguridad' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Cambio de Contraseña</h3>
                            <div className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña Actual</label>
                                    <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva Contraseña</label>
                                    <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar Nueva Contraseña</label>
                                    <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
                                </div>
                                <button className="mt-4 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900 text-white font-medium rounded-xl transition-colors text-sm">
                                    Actualizar Contraseña
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB USUARIOS */}
                    {activeTab === 'usuarios' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Gestión de Acceso y Usuarios</h3>

                            {/* Formulario Alta */}
                            <div className="bg-gray-50 dark:bg-dark-bg p-5 rounded-2xl border border-gray-100 dark:border-gray-800 mb-8">
                                <h4 className="font-bold text-sm text-gray-700 dark:text-white mb-4 flex items-center"><Plus className="w-4 h-4 mr-1" /> Invitar Colaborador</h4>
                                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input required type="text" placeholder="Nombre Completo" value={newUserForm.nombre} onChange={e => setNewUserForm({ ...newUserForm, nombre: e.target.value })} className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl text-sm" />
                                    <input required type="email" placeholder="Correo Electrónico" value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl text-sm" />
                                    <input required type="password" placeholder="Contraseña Temporal" value={newUserForm.password} onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl text-sm" />
                                    <select value={newUserForm.rol} onChange={e => setNewUserForm({ ...newUserForm, rol: e.target.value })} className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none">
                                        <option value="Administrador">Administrador</option>
                                        <option value="Asistente">Asistente</option>
                                    </select>
                                    <div className="md:col-span-2 flex justify-end">
                                        <button disabled={isSubmitting} type="submit" className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold shadow-md shadow-primary-500/20">{isSubmitting ? 'Registrando...' : 'Registrar Usuario'}</button>
                                    </div>
                                </form>
                            </div>

                            {/* Lista Usuarios */}
                            <div className="overflow-hidden border border-gray-100 dark:border-gray-800 rounded-2xl">
                                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-400 font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Nombre</th>
                                            <th className="px-4 py-3">Correo</th>
                                            <th className="px-4 py-3">Rol</th>
                                            <th className="px-4 py-3">Estado</th>
                                            <th className="px-4 py-3">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-dark-bg/60">
                                        {usuarios.map(u => (
                                            <tr key={u.id}>
                                                <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{u.nombre}</td>
                                                <td className="px-4 py-3">{u.email}</td>
                                                <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-xs">{u.rol}</span></td>
                                                <td className="px-4 py-3 text-green-500">Activo</td>
                                                <td className="px-4 py-3">
                                                    {u.id !== user.id && (
                                                        <button
                                                            onClick={() => setEditingPasswordUser(u)}
                                                            className="text-gray-400 hover:text-primary-600 transition-colors"
                                                            title="Cambiar Contraseña"
                                                        >
                                                            <Key className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* BOTÓN GENERAL GUARDAR */}
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                        <button className="btn-primary flex items-center shadow-lg shadow-primary-500/30">
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL CAMBIAR CONTRASEÑA DE TERCERO */}
            <AnimatePresence>
                {editingPasswordUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingPasswordUser(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-dark-surface relative z-10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-dark-bg/50">
                                <h3 className="font-bold text-lg dark:text-white">Cambiar Contraseña</h3>
                                <button onClick={() => setEditingPasswordUser(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleChangeUserPassword} className="p-5 space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Ingresa la nueva contraseña para <strong>{editingPasswordUser.nombre}</strong> ({editingPasswordUser.email}).</p>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Nueva contraseña"
                                        value={newPasswordValue}
                                        onChange={e => setNewPasswordValue(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                                <div className="pt-2 flex justify-end gap-3">
                                    <button type="button" onClick={() => setEditingPasswordUser(null)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition">Cancelar</button>
                                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-primary-500/30 transition">{isSubmitting ? 'Guardando...' : 'Guardar'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
