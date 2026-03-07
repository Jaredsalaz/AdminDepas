import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit, Key, Shield, CheckCircle2, XCircle, Search } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function SuperAdminUsuarios() {
    const toast = useToast();
    const [usuarios, setUsuarios] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Form states
    const [newUsuario, setNewUsuario] = useState({
        nombre: '', email: '', password: '', rol: 'Administrador', empresa_id: '', activo: true
    });
    const [editingUsuario, setEditingUsuario] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, empRes] = await Promise.all([
                api.get('/superadmin/usuarios'),
                api.get('/auth/empresas-disponibles')
            ]);
            setUsuarios(usersRes.data);
            setEmpresas(empRes.data);
        } catch (error) {
            toast.error("Error al cargar datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateUsuario = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...newUsuario };
            // Si no se selecciona empresa (o es 0), lo mandamos como null para SuperAdmin
            payload.empresa_id = parseInt(payload.empresa_id) || null;

            await api.post('/superadmin/usuarios', payload);
            toast.success("Usuario creado exitosamente");
            setIsCreateModalOpen(false);
            setNewUsuario({
                nombre: '', email: '', password: '', rol: 'Administrador', empresa_id: '', activo: true
            });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error al crear el usuario");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateUsuario = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                nombre: editingUsuario.nombre,
                email: editingUsuario.email,
                rol: editingUsuario.rol,
                activo: editingUsuario.activo,
                empresa_id: parseInt(editingUsuario.empresa_id) || 0 // 0 will be translated to None in backend
            };
            if (editingUsuario.new_password) {
                payload.password = editingUsuario.new_password;
            }

            await api.put(`/superadmin/usuarios/${editingUsuario.id}`, payload);
            toast.success("Usuario actualizado exitosamente");
            setIsEditModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error al actualizar el usuario");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStatus = async (user) => {
        try {
            await api.put(`/superadmin/usuarios/${user.id}`, { activo: !user.activo });
            toast.success(user.activo ? "Usuario desactivado" : "Usuario activado");
            fetchData();
        } catch (error) {
            toast.error("Error al cambiar el estado del usuario");
        }
    };

    const filteredUsers = usuarios.filter(u =>
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.empresa_nombre && u.empresa_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando usuarios...</div>;

    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex justify-between items-center bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Usuarios del Sistema</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestiona los accesos de todos los administradores y personal.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-primary-500/30 transition-all"
                >
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
                </button>
            </div>

            <div className="flex-1 overflow-auto bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="relative w-full md:w-96">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, correo o empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-dark-bg/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium sticky top-0 z-10 shadow-sm">
                                <th className="p-4 border-b border-gray-100 dark:border-gray-800 w-1/4">Usuario</th>
                                <th className="p-4 border-b border-gray-100 dark:border-gray-800">Empresa</th>
                                <th className="p-4 border-b border-gray-100 dark:border-gray-800">Rol</th>
                                <th className="p-4 border-b border-gray-100 dark:border-gray-800">Estado</th>
                                <th className="p-4 border-b border-gray-100 dark:border-gray-800 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg/20 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 dark:text-gray-200">{user.nombre}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {user.empresa_nombre ? (
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{user.empresa_nombre}</span>
                                        ) : (
                                            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 rounded-lg text-xs font-bold flex items-center w-max">
                                                <Shield className="w-3 h-3 mr-1" /> Sistema Central
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400">
                                        {user.rol === 'SuperAdmin' ? (
                                            <span className="flex items-center font-bold text-gray-800 dark:text-gray-200">
                                                <Key className="w-3.5 h-3.5 text-yellow-500 mr-1" /> {user.rol}
                                            </span>
                                        ) : user.rol}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => toggleStatus(user)}
                                            className={`px-3 py-1 text-xs font-bold rounded-full flex items-center transition-colors ${user.activo
                                                    ? 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'
                                                    : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                                                }`}>
                                            {user.activo ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                                            {user.activo ? 'Activo' : 'Suspendido'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => {
                                                setEditingUsuario({
                                                    ...user,
                                                    empresa_id: user.empresa_id || "",
                                                    new_password: ""
                                                });
                                                setIsEditModalOpen(true);
                                            }}
                                            className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center inline-flex"
                                            title="Editar Usuario"
                                        >
                                            <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CREAR USUARIO */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Nuevo Usuario"
                icon={Users}
                footer={
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition">Cancelar</button>
                        <button type="submit" form="create-user-form" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition">
                            {isSubmitting ? 'Guardando...' : 'Crear Usuario'}
                        </button>
                    </div>
                }
            >
                <form id="create-user-form" onSubmit={handleCreateUsuario} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo</label>
                            <input required type="text" value={newUsuario.nombre} onChange={e => setNewUsuario({ ...newUsuario, nombre: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico (Login)</label>
                            <input required type="email" value={newUsuario.email} onChange={e => setNewUsuario({ ...newUsuario, email: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña Inicial</label>
                            <input required type="text" placeholder="Ej. Pass123!" value={newUsuario.password} onChange={e => setNewUsuario({ ...newUsuario, password: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
                            <select value={newUsuario.rol} onChange={e => setNewUsuario({ ...newUsuario, rol: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white">
                                <option value="Administrador">Administrador</option>
                                <option value="Asistente">Asistente</option>
                                <option value="SuperAdmin">SuperAdmin</option>
                            </select>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pertenece a la Empresa:</label>
                            <select value={newUsuario.empresa_id} onChange={e => setNewUsuario({ ...newUsuario, empresa_id: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white">
                                <option value="">(Ninguna / Sistema Central)</option>
                                {empresas.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* MODAL EDITAR USUARIO */}
            <Modal
                isOpen={isEditModalOpen && !!editingUsuario}
                onClose={() => setIsEditModalOpen(false)}
                title="Editar Usuario"
                subtitle={editingUsuario?.nombre}
                icon={Edit}
                iconColor="text-blue-500"
                footer={
                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition">Cancelar</button>
                        <button type="submit" form="edit-user-form" className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-500 shadow-lg transition">Guardar Cambios</button>
                    </div>
                }
            >
                {editingUsuario && (
                    <form id="edit-user-form" onSubmit={handleUpdateUsuario} className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Nombre Completo</label>
                                <input required type="text" value={editingUsuario.nombre} onChange={e => setEditingUsuario({ ...editingUsuario, nombre: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Correo Electrónico (Login)</label>
                                <input required type="email" value={editingUsuario.email} onChange={e => setEditingUsuario({ ...editingUsuario, email: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Rol</label>
                                <select value={editingUsuario.rol} onChange={e => setEditingUsuario({ ...editingUsuario, rol: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white">
                                    <option value="Administrador">Administrador</option>
                                    <option value="Asistente">Asistente</option>
                                    <option value="SuperAdmin">SuperAdmin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Cambiar Contraseña (Opcional)</label>
                                <input type="text" placeholder="Dejar en blanco para no cambiar..." value={editingUsuario.new_password} onChange={e => setEditingUsuario({ ...editingUsuario, new_password: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                            </div>
                            <div className="col-span-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Pertenece a la Empresa:</label>
                                <select value={editingUsuario.empresa_id} onChange={e => setEditingUsuario({ ...editingUsuario, empresa_id: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white">
                                    <option value="">(Ninguna / Sistema Central)</option>
                                    {empresas.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
