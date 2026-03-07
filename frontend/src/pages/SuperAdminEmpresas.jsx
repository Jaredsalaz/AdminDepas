import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Edit, Key, Shield, AlertTriangle } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function SuperAdminEmpresas() {
    const toast = useToast();
    const [empresas, setEmpresas] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditSuscripcionModalOpen, setIsEditSuscripcionModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

    // Forms state
    const [newEmpresa, setNewEmpresa] = useState({
        nombre: '', rfc: '', direccion: '', telefono: '', correo: '', plan_id: '',
        admin_nombre: '', admin_email: '', admin_password: ''
    });
    const [editingEmpresa, setEditingEmpresa] = useState(null);
    const [isEditEmpresaModalOpen, setIsEditEmpresaModalOpen] = useState(false);
    const [editingSuscripcion, setEditingSuscripcion] = useState(null);
    const [resettingPassword, setResettingPassword] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [empresasRes, planesRes] = await Promise.all([
                api.get('/superadmin/empresas'),
                api.get('/superadmin/planes')
            ]);
            setEmpresas(empresasRes.data);
            setPlanes(planesRes.data);
        } catch (error) {
            toast.error("Error al cargar datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateEmpresa = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Validar plan (opcional)
            let plan_id = parseInt(newEmpresa.plan_id);
            if (isNaN(plan_id)) plan_id = null;

            // Fechas dummy para inicio
            const payload = {
                ...newEmpresa,
                plan_id: plan_id,
                estado_suscripcion: 'Activa'
            };

            await api.post('/superadmin/empresas', payload);
            toast.success("Empresa creada exitosamente");
            setIsCreateModalOpen(false);
            setNewEmpresa({
                nombre: '', rfc: '', direccion: '', plan_id: '',
                admin_nombre: '', admin_email: '', admin_password: ''
            });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error al crear la empresa");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateSuscripcion = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put(`/superadmin/empresas/${editingSuscripcion.id}/suscripcion`, {
                plan_id: parseInt(editingSuscripcion.plan_id) || null,
                estado_suscripcion: editingSuscripcion.estado_suscripcion,
                fecha_vencimiento: editingSuscripcion.fecha_vencimiento || null
            });
            toast.success("Suscripción actualizada exitosamente");
            setIsEditSuscripcionModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Error al actualizar la suscripción");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateEmpresa = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                nombre: editingEmpresa.nombre,
                rfc: editingEmpresa.rfc,
                direccion: editingEmpresa.direccion,
                telefono: editingEmpresa.telefono,
                correo: editingEmpresa.correo,
                plan_id: editingEmpresa.plan_id
            };
            await api.put(`/superadmin/empresas/${editingEmpresa.id}`, payload);
            toast.success("Empresa actualizada exitosamente");
            setIsEditEmpresaModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error al actualizar la empresa");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // We need to know which user. For simplicity, we are getting the first user of the company here.
            // In a more complex system, we'd list the users of the company and select one.
            // Since we don't have a /usuarios?empresa_id endpoint easily exposed without headers here,
            // let's assume the backend handles it or we pass a specific admin ID.
            // *Wait*, we need the user_id for the payload. Since we only have the empresa_id,
            // we should ideally fetch the users of that company first.
            // For now, let's show a toast that this feature is in development if we can't get the user ID,
            // OR we can make a quick fetch to get users of that company.

            // Fetch users of the selected company using the superadmin header trick
            const usersRes = await api.get('/auth/usuarios', {
                headers: { 'X-Empresa-Id': resettingPassword.id }
            });

            const users = usersRes.data;
            if (users.length === 0) {
                toast.error("La empresa no tiene usuarios administradores.");
                setIsSubmitting(false);
                return;
            }

            // Reset the password for the primary admin (first user)
            const adminUser = users.find(u => u.rol === 'Administrador') || users[0];

            await api.post(`/superadmin/empresas/${resettingPassword.id}/reset-password`, {
                user_id: adminUser.id,
                new_password: newPassword
            });

            toast.success(`Contraseña actualizada para ${adminUser.email}`);
            setIsResetPasswordModalOpen(false);
            setNewPassword('');
        } catch (error) {
            toast.error("Error al resetear la contraseña");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando empresas...</div>;

    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex justify-between items-center bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Empresas Cliente</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestiona las inmobiliarias, sus suscripciones y accesos.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-primary-500/30 transition-all"
                >
                    <Plus className="w-4 h-4 mr-2" /> Nueva Empresa
                </button>
            </div>

            <div className="flex-1 overflow-auto bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-dark-bg/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">
                            <th className="p-4 rounded-tl-xl border-b border-gray-100 dark:border-gray-800 w-1/4">Empresa</th>
                            <th className="p-4 border-b border-gray-100 dark:border-gray-800">Plan</th>
                            <th className="p-4 border-b border-gray-100 dark:border-gray-800">Estado</th>
                            <th className="p-4 border-b border-gray-100 dark:border-gray-800">Vencimiento</th>
                            <th className="p-4 rounded-tr-xl border-b border-gray-100 dark:border-gray-800 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                        {empresas.map((emp) => (
                            <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg/20 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{emp.nombre}</p>
                                            <p className="text-xs text-gray-400">RFC: {emp.rfc || 'N/A'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium rounded-full text-xs">
                                        {emp.plan ? emp.plan.nombre : 'Sin Plan'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${emp.estado_suscripcion === 'Activa'
                                        ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                        : emp.estado_suscripcion === 'Vencida'
                                            ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                            : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
                                        }`}>
                                        {emp.estado_suscripcion}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-600 dark:text-gray-400">
                                    {emp.fecha_vencimiento ? new Date(emp.fecha_vencimiento).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingEmpresa(emp);
                                                setIsEditEmpresaModalOpen(true);
                                            }}
                                            className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center"
                                            title="Editar Datos de Empresa"
                                        >
                                            <Edit className="w-3.5 h-3.5 mr-1" /> Editar Info
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingSuscripcion({ ...emp, fecha_vencimiento: emp.fecha_vencimiento ? emp.fecha_vencimiento.split('T')[0] : '' });
                                                setIsEditSuscripcionModalOpen(true);
                                            }}
                                            className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors flex items-center"
                                            title="Editar Suscripción o Cambiar Plan"
                                        >
                                            <Edit className="w-3.5 h-3.5 mr-1.5" /> Cambiar Plan
                                        </button>
                                        <button
                                            onClick={() => {
                                                setResettingPassword(emp);
                                                setIsResetPasswordModalOpen(true);
                                            }}
                                            className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                                            title="Forzar Reseteo de Contraseña de Administrador"
                                        >
                                            <Key className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL CREAR EMPRESA */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Alta de Nueva Empresa"
                icon={Building2}
                footer={
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition">Cancelar</button>
                        <button type="submit" form="empresa-form" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition">
                            {isSubmitting ? 'Guardando...' : 'Crear Empresa'}
                        </button>
                    </div>
                }
            >
                <form id="empresa-form" onSubmit={handleCreateEmpresa} className="p-5 space-y-4">
                    <div className="border-b border-gray-100 dark:border-gray-800 pb-3 mb-3">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Datos de la Empresa</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                                <input required type="text" value={newEmpresa.nombre} onChange={e => setNewEmpresa({ ...newEmpresa, nombre: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RFC</label>
                                <input type="text" value={newEmpresa.rfc} onChange={e => setNewEmpresa({ ...newEmpresa, rfc: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
                                <input type="text" value={newEmpresa.direccion} onChange={e => setNewEmpresa({ ...newEmpresa, direccion: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                                <input type="text" value={newEmpresa.telefono} onChange={e => setNewEmpresa({ ...newEmpresa, telefono: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo de Contacto</label>
                                <input type="email" value={newEmpresa.correo} onChange={e => setNewEmpresa({ ...newEmpresa, correo: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-gray-100 dark:border-gray-800 pb-3 mb-3">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3 flex items-center"><Shield className="w-4 h-4 mr-1 text-primary-500" />Administrador Inicial</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Amin.</label>
                                <input required type="text" value={newEmpresa.admin_nombre} onChange={e => setNewEmpresa({ ...newEmpresa, admin_nombre: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
                                <input required type="email" value={newEmpresa.admin_email} onChange={e => setNewEmpresa({ ...newEmpresa, admin_email: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña Temporal</label>
                                <input required type="text" placeholder="Ej. Temp1234!" value={newEmpresa.admin_password} onChange={e => setNewEmpresa({ ...newEmpresa, admin_password: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Suscripción Inicial</h3>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label>
                        <select value={newEmpresa.plan_id} onChange={e => setNewEmpresa({ ...newEmpresa, plan_id: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">(Sin Plan)</option>
                            {planes.map(p => <option key={p.id} value={p.id}>{p.nombre} (${p.precio_mensual}/mes)</option>)}
                        </select>
                    </div>
                </form>
            </Modal>

            {/* MODAL EDITAR EMPRESA INFO */}
            <Modal
                isOpen={isEditEmpresaModalOpen && !!editingEmpresa}
                onClose={() => setIsEditEmpresaModalOpen(false)}
                title="Editar Información de Empresa"
                subtitle={editingEmpresa?.nombre}
                icon={Building2}
                footer={
                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={() => setIsEditEmpresaModalOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition">Cancelar</button>
                        <button type="submit" form="edit-empresa-form" className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-500 shadow-lg transition">Guardar Cambios</button>
                    </div>
                }
            >
                {editingEmpresa && (
                    <form id="edit-empresa-form" onSubmit={handleUpdateEmpresa} className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Nombre</label>
                                <input required type="text" value={editingEmpresa.nombre} onChange={e => setEditingEmpresa({ ...editingEmpresa, nombre: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300 mb-1">RFC</label>
                                <input type="text" value={editingEmpresa.rfc || ''} onChange={e => setEditingEmpresa({ ...editingEmpresa, rfc: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Teléfono</label>
                                <input type="text" value={editingEmpresa.telefono || ''} onChange={e => setEditingEmpresa({ ...editingEmpresa, telefono: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Dirección</label>
                                <input type="text" value={editingEmpresa.direccion || ''} onChange={e => setEditingEmpresa({ ...editingEmpresa, direccion: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Correo de Contacto</label>
                                <input type="email" value={editingEmpresa.correo || ''} onChange={e => setEditingEmpresa({ ...editingEmpresa, correo: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                            </div>
                        </div>
                    </form>
                )}
            </Modal>

            {/* MODAL EDITAR SUSCRIPCIÓN */}
            <Modal
                isOpen={isEditSuscripcionModalOpen && !!editingSuscripcion}
                onClose={() => setIsEditSuscripcionModalOpen(false)}
                title="Gestionar Suscripción"
                subtitle={editingSuscripcion?.nombre}
                icon={Edit}
                iconColor="text-blue-500"
                footer={
                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={() => setIsEditSuscripcionModalOpen(false)} className="px-4 py-2 border rounded-xl text-sm">Cancelar</button>
                        <button type="submit" form="edit-sus-form" className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-500 shadow-lg transition">Guardar</button>
                    </div>
                }
            >
                {editingSuscripcion && (
                    <form id="edit-sus-form" onSubmit={handleUpdateSuscripcion} className="p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Plan Asignado</label>
                            <select value={editingSuscripcion.plan_id || ''} onChange={e => setEditingSuscripcion({ ...editingSuscripcion, plan_id: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border dark:border-gray-700 rounded-xl text-sm dark:text-white">
                                <option value="">(Sin Plan)</option>
                                {planes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Estado de Suscripción</label>
                                <select value={editingSuscripcion.estado_suscripcion} onChange={e => setEditingSuscripcion({ ...editingSuscripcion, estado_suscripcion: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border dark:border-gray-700 rounded-xl text-sm dark:text-white">
                                    <option value="Activa">Activa</option>
                                    <option value="Vencida">Vencida</option>
                                    <option value="Suspendida">Suspendida</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Fecha de Vencimiento</label>
                                <input type="date" value={editingSuscripcion.fecha_vencimiento || ''} onChange={e => setEditingSuscripcion({ ...editingSuscripcion, fecha_vencimiento: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                            </div>
                        </div>
                    </form>
                )}
            </Modal>

            {/* MODAL RESET PASSWORD */}
            <Modal
                isOpen={isResetPasswordModalOpen && !!resettingPassword}
                onClose={() => setIsResetPasswordModalOpen(false)}
                title="Generar Nueva Contraseña"
                subtitle={resettingPassword?.nombre}
                icon={AlertTriangle}
                iconColor="text-yellow-500"
                footer={
                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={() => setIsResetPasswordModalOpen(false)} className="px-4 py-2 border rounded-xl text-sm">Cancelar</button>
                        <button type="submit" form="reset-pwd-form" className="px-4 py-2 bg-yellow-500 text-white rounded-xl text-sm font-medium hover:bg-yellow-400 shadow-lg shadow-yellow-500/20 transition">Actualizar Contraseña</button>
                    </div>
                }
            >
                <form id="reset-pwd-form" onSubmit={handleResetPassword} className="p-5 space-y-4">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/50 rounded-xl text-sm text-yellow-800 dark:text-yellow-400 mb-4">
                        <p>Al confirmar, se actualizará la contraseña del administrador principal de esta empresa. Recuerda proporcionar esta nueva contraseña al cliente para que pueda acceder.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nueva Contraseña Temporal</label>
                        <input required type="text" placeholder="Nueva contraseña..." value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border dark:border-gray-700 rounded-xl text-sm dark:text-white" />
                    </div>
                </form>
            </Modal>
        </div>
    );
}
