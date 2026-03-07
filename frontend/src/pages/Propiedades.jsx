import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, MapPin, Grid, DoorOpen, MoreVertical, Search, X, CheckCircle, Clock, ChevronLeft, ChevronRight, Pencil, Save, CreditCard, ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { usePermissions } from '../context/usePermissions';
import { useAuth } from '../context/AuthContext';
import EmpresaSelector from '../components/EmpresaSelector';
import api from '../api';
import { formatMoney } from '../utils/formatMoney';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Propiedades() {
    const { canDeleteData, canCreateData } = usePermissions();
    const { empresaActiva } = useAuth();
    const toast = useToast();

    const [edificios, setEdificios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEdificio, setSelectedEdificio] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [nuevoEdificio, setNuevoEdificio] = useState({ nombre: '', direccion: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nuevoDepto, setNuevoDepto] = useState({ numero: '', renta_mensual: '', inventario: '' });
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isPaypalModalOpen, setIsPaypalModalOpen] = useState(false);
    const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState(null); // Plan seleccionado para pagar
    const [isSubmittingDepto, setIsSubmittingDepto] = useState(false);
    const [editingDepto, setEditingDepto] = useState(null); // Depa en edición
    const [deptoToDelete, setDeptoToDelete] = useState(null); // Para modal de confirmación de eliminación

    const [planesDisponibles, setPlanesDisponibles] = useState([]);

    const fetchPlanes = async () => {
        try {
            const { data } = await api.get('/empresas/planes/suscripcion');
            const mappedPlanes = data.map(plan => {
                const limitText = plan.limite_edificios === null || plan.limite_edificios > 9000 ? "Edificios ilimitados" : `Hasta ${plan.limite_edificios} edificio(s)`;
                return {
                    id: plan.id,
                    nombre: plan.nombre,
                    precio: plan.precio_mensual,
                    isPopular: plan.nombre.toLowerCase() === 'premium',
                    beneficios: [
                        limitText,
                        plan.nombre.toLowerCase() === 'premium' ? 'Soporte prioritario' : 'Soporte estándar',
                        plan.nombre.toLowerCase() === 'normal' ? 'Reportes básicos' : 'Reportes financieros avanzados'
                    ]
                };
            }).filter(p => p.nombre.toLowerCase() !== 'normal'); // Evitar que compren el Normal si ya llegaron al límite de 1
            setPlanesDisponibles(mappedPlanes);
        } catch (error) {
            console.error("Error al obtener planes:", error);
        }
    };

    useEffect(() => {
        if (isUpgradeModalOpen && planesDisponibles.length === 0) {
            fetchPlanes();
        }
    }, [isUpgradeModalOpen]);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEdificios, setTotalEdificios] = useState(0);

    const fetchEdificios = async (page = 1) => {
        try {
            setLoading(true);
            const { data } = await api.get(`/edificios?page=${page}&per_page=9`);
            const items = data.items || data || [];
            setEdificios(Array.isArray(items) ? items : []);
            setCurrentPage(data.page || 1);
            setTotalPages(data.pages || 1);
            setTotalEdificios(data.total || 0);
        } catch (error) {
            console.error("Error fetching edificios:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEdificios(1);
        setCurrentPage(1);
    }, [empresaActiva?.id]);

    const handleCreateEdificio = async (e) => {
        e.preventDefault();
        if (!nuevoEdificio.nombre || !nuevoEdificio.direccion) return;

        setIsSubmitting(true);
        try {
            await api.post('/edificios', nuevoEdificio);
            await fetchEdificios(currentPage); // Recargar lista
            setIsCreateModalOpen(false);
            setNuevoEdificio({ nombre: '', direccion: '' });
            toast.success("Edificio registrado exitosamente");
        } catch (error) {
            if (error.response?.data?.detail === "PLAN_LIMIT_REACHED") {
                setIsCreateModalOpen(false);
                setIsUpgradeModalOpen(true);
            } else {
                toast.error(error.response?.data?.detail || "Error al registrar el edificio");
                console.error("Error guardando edificio:", error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateDepto = async (e) => {
        e.preventDefault();
        if (!nuevoDepto.numero || !nuevoDepto.renta_mensual || !selectedEdificio) return;

        setIsSubmittingDepto(true);
        try {
            await api.post(`/edificios/${selectedEdificio.id}/departamentos`, {
                numero: nuevoDepto.numero,
                renta_mensual: parseFloat(nuevoDepto.renta_mensual),
                inventario: nuevoDepto.inventario || null
            });
            // Recargar datos: Volver a fetchear edificios y actualizar el selectedEdificio
            const { data } = await api.get(`/edificios?page=${currentPage}&per_page=9`);
            setEdificios(data.items);
            const edificioActualizado = data.items.find(ed => ed.id === selectedEdificio.id);
            if (edificioActualizado) setSelectedEdificio(edificioActualizado);

            setNuevoDepto({ numero: '', renta_mensual: '', inventario: '' });
            toast.success("Departamento agregado exitosamente");
        } catch (error) {
            console.error("Error guardando departamento:", error);
        } finally {
            setIsSubmittingDepto(false);
        }
    };

    const confirmDeleteDepto = async () => {
        if (!deptoToDelete) return;

        try {
            await api.delete(`/edificios/departamentos/${deptoToDelete.id}`);

            // Recargar
            const { data } = await api.get(`/edificios?page=${currentPage}&per_page=9`);
            setEdificios(data.items);
            const edificioActualizado = data.items.find(ed => ed.id === selectedEdificio.id);
            if (edificioActualizado) setSelectedEdificio(edificioActualizado);
            toast.success("Departamento eliminado");
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error al eliminar departamento");
            console.error("Error eliminando departamento:", error);
        } finally {
            setDeptoToDelete(null);
        }
    };

    const handleUpdateDepto = async (e) => {
        e.preventDefault();
        if (!editingDepto) return;
        setIsSubmittingDepto(true);
        try {
            await api.put(`/edificios/departamentos/${editingDepto.id}`, {
                numero: editingDepto.numero,
                renta_mensual: parseFloat(editingDepto.renta_mensual),
                inventario: editingDepto.inventario || null,
                estado: editingDepto.estado
            });
            // Recargar
            const { data } = await api.get(`/edificios?page=${currentPage}&per_page=9`);
            setEdificios(data.items);
            const edificioActualizado = data.items.find(ed => ed.id === selectedEdificio.id);
            if (edificioActualizado) setSelectedEdificio(edificioActualizado);
            setEditingDepto(null);
            toast.success("Departamento actualizado exitosamente");
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error al actualizar departamento");
        } finally {
            setIsSubmittingDepto(false);
        }
    };

    const filteredEdificios = edificios.filter(e =>
        e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.direccion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <EmpresaSelector />
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Propiedades</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Controla y administra tus edificios y departamentos.
                    </p>
                </div>
                {canCreateData && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn-primary flex items-center"
                    >
                        <Plus className="w-5 h-5 mr-1" />
                        Nuevo Edificio
                    </button>
                )}
            </div>

            {/* Barra de Búsqueda */}
            <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o dirección..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm"
                    />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Total: <span className="text-primary-500 font-bold">{totalEdificios}</span> Edificios
                </div>
            </div>

            {/* Grid de Edificios */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredEdificios.map((edificio, index) => {
                            // Cálculos rápidos para la tarjeta
                            const totalDepas = edificio.departamentos?.length || 0;
                            const ocupados = edificio.departamentos?.filter(d => d.estado === 'Rentado').length || 0;
                            const disponibles = totalDepas - ocupados;
                            const ingresosPotenciales = edificio.departamentos?.reduce((sum, d) => sum + parseFloat(d.renta_mensual), 0) || 0;

                            return (
                                <motion.div
                                    key={edificio.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="glass-panel p-0 overflow-hidden group hover:border-primary-500/30 transition-colors flex flex-col"
                                >
                                    {/* Card Header (Imagen / Banner) */}
                                    <div className="h-32 bg-gradient-to-br from-primary-500/80 to-primary-800/80 relative flex items-end p-4">
                                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-2 cursor-pointer hover:bg-white/40 transition">
                                            <MoreVertical className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white shadow-sm">{edificio.nombre}</h3>
                                            <div className="flex items-center text-primary-50 text-xs mt-1">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                <span className="truncate max-w-[200px]">{edificio.direccion}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-5 flex-1 flex flex-col justify-between">

                                        {/* Estadísticas rápidas del edificio */}
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="bg-gray-50 dark:bg-dark-bg rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                                                <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-1">
                                                    <DoorOpen className="w-3 h-3 mr-1 text-primary-500" />
                                                    Disponibles
                                                </div>
                                                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{disponibles}</p>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-dark-bg rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                                                <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-1">
                                                    <Grid className="w-3 h-3 mr-1 text-blue-500" />
                                                    Totales
                                                </div>
                                                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{totalDepas}</p>
                                            </div>
                                        </div>

                                        {/* Footer de la tarjeta con botón de acción */}
                                        <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Ingreso Potencial</p>
                                                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                                    {formatMoney(ingresosPotenciales)} <span className="text-xs font-normal text-gray-400">/mes</span>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedEdificio(edificio)}
                                                className="text-sm font-medium text-primary-500 hover:text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                            >
                                                Ver Depas
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Paginación */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-2 pb-4">
                    <button
                        onClick={() => fetchEdificios(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:text-primary-500 shadow-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Página <span className="font-bold text-primary-500">{currentPage}</span> de <span className="font-bold">{totalPages}</span>
                    </span>
                    <button
                        onClick={() => fetchEdificios(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:text-primary-500 shadow-sm"
                    >
                        Siguiente
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredEdificios.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
                    <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">No se encontraron edificios</h3>
                    <p className="text-gray-500 dark:text-gray-500 mt-2">Prueba buscando con otro nombre o dirección.</p>
                </motion.div>
            )}

            <AnimatePresence>
                {/* Panel Lateral (Modal) para ver Departamentos */}
                {selectedEdificio && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEdificio(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white dark:bg-dark-surface shadow-2xl z-50 flex flex-col border-l border-white/20 dark:border-gray-700"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start bg-gray-50 dark:bg-dark-bg/50">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                        {selectedEdificio.nombre}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                        <MapPin className="w-3 h-3 mr-1" /> {selectedEdificio.direccion}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedEdificio(null)}
                                    className="p-2 bg-gray-200/50 dark:bg-gray-800 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                                >
                                    <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {/* Formulario para Nuevo Departamento */}
                                {canCreateData && (
                                    <div className="bg-white dark:bg-dark-surface border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 mb-6">
                                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                            <Plus className="w-4 h-4 mr-1 text-primary-500" /> Nuevo Departamento
                                        </h4>
                                        <form onSubmit={handleCreateDepto} className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <input
                                                        type="text" placeholder="Núm/Ref (Ej. 101)" required
                                                        value={nuevoDepto.numero} onChange={e => setNuevoDepto({ ...nuevoDepto, numero: e.target.value })}
                                                        className="w-full px-3 py-1.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        type="number" step="0.01" placeholder="Renta (Ej. 12000)" required
                                                        value={nuevoDepto.renta_mensual} onChange={e => setNuevoDepto({ ...nuevoDepto, renta_mensual: e.target.value })}
                                                        className="w-full px-3 py-1.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <input
                                                    type="text" placeholder="Inventario/Notas (Ej. Refrigerador, Cama...)"
                                                    value={nuevoDepto.inventario} onChange={e => setNuevoDepto({ ...nuevoDepto, inventario: e.target.value })}
                                                    className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-white"
                                                />
                                                <button
                                                    type="submit" disabled={isSubmittingDepto}
                                                    className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                                                >
                                                    {isSubmittingDepto ? '...' : 'Añadir'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                                    Departamentos ({selectedEdificio.departamentos?.length || 0})
                                </h4>

                                {selectedEdificio.departamentos?.map((depa) => (
                                    <motion.div
                                        key={depa.id}
                                        whileHover={{ scale: 1.01 }}
                                        className="p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-dark-surface shadow-sm hover:shadow-md transition-all"
                                    >
                                        {editingDepto && editingDepto.id === depa.id ? (
                                            /* Modo Edición */
                                            <form onSubmit={handleUpdateDepto} className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-gray-400">Número</label>
                                                        <input type="text" required value={editingDepto.numero}
                                                            onChange={e => setEditingDepto({ ...editingDepto, numero: e.target.value })}
                                                            className="w-full px-3 py-1.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-white" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-gray-400">Renta Mensual</label>
                                                        <input type="number" step="0.01" required value={editingDepto.renta_mensual}
                                                            onChange={e => setEditingDepto({ ...editingDepto, renta_mensual: e.target.value })}
                                                            className="w-full px-3 py-1.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-white" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400">Inventario</label>
                                                    <input type="text" value={editingDepto.inventario || ''}
                                                        onChange={e => setEditingDepto({ ...editingDepto, inventario: e.target.value })}
                                                        className="w-full px-3 py-1.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-white" />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400">Estado</label>
                                                    <select value={editingDepto.estado}
                                                        onChange={e => setEditingDepto({ ...editingDepto, estado: e.target.value })}
                                                        className="w-full px-3 py-1.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-white">
                                                        <option value="Disponible">Disponible</option>
                                                        <option value="Rentado">Rentado</option>
                                                        <option value="Mantenimiento">Mantenimiento</option>
                                                    </select>
                                                </div>
                                                <div className="flex gap-2 justify-end">
                                                    <button type="button" onClick={() => setEditingDepto(null)}
                                                        className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                                                        Cancelar
                                                    </button>
                                                    <button type="submit" disabled={isSubmittingDepto}
                                                        className="flex items-center gap-1 bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
                                                        <Save className="w-3 h-3" />
                                                        {isSubmittingDepto ? 'Guardando...' : 'Guardar'}
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            /* Modo Vista */
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-start space-x-4 flex-1">
                                                    <div className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center font-bold text-lg
                                                        ${depa.estado === 'Disponible' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                                            depa.estado === 'Mantenimiento' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                        {depa.numero}
                                                    </div>
                                                    <div className="pr-4">
                                                        <p className="font-semibold text-gray-800 dark:text-white">Depa {depa.numero}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                                            {depa.inventario || "Sin inventario"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right flex-shrink-0 flex flex-col justify-between items-end">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => setEditingDepto({ ...depa, renta_mensual: parseFloat(depa.renta_mensual) })}
                                                            className="text-gray-300 hover:text-primary-500 transition-colors p-1"
                                                            title="Editar Departamento"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        {canDeleteData && (
                                                            <button
                                                                onClick={() => setDeptoToDelete(depa)}
                                                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                                title="Eliminar Departamento"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="mt-2">
                                                        <p className="font-bold text-gray-900 dark:text-white">{formatMoney(depa.renta_mensual)}</p>
                                                        <div className="flex items-center justify-end mt-1">
                                                            {depa.estado === 'Disponible' ? <CheckCircle className="w-3 h-3 text-green-500 mr-1" /> : <Clock className="w-3 h-3 text-gray-400 mr-1" />}
                                                            <span className={`text-xs font-medium 
                                                                ${depa.estado === 'Disponible' ? 'text-green-500' :
                                                                    depa.estado === 'Mantenimiento' ? 'text-yellow-500' : 'text-gray-500'}`}>
                                                                {depa.estado}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Modal para Crear Nuevo Edificio */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Nuevo Edificio"
                icon={Building2}
                footer={
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">Cancelar</button>
                        <button type="submit" form="edificio-form" disabled={isSubmitting} className="btn-primary opacity-100 data-[disabled=true]:opacity-50" data-disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Guardar Edificio'}
                        </button>
                    </div>
                }
            >
                <form id="edificio-form" onSubmit={handleCreateEdificio} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Edificio</label>
                        <input type="text" required value={nuevoEdificio.nombre} onChange={(e) => setNuevoEdificio({ ...nuevoEdificio, nombre: e.target.value })} placeholder="Ej. Torre Esmeralda" className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección Completa</label>
                        <input type="text" required value={nuevoEdificio.direccion} onChange={(e) => setNuevoEdificio({ ...nuevoEdificio, direccion: e.target.value })} placeholder="Ej. Av. Paseo de los Leones 123" className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm" />
                    </div>
                </form>
            </Modal>

            {/* Modal de Upgrade (Límite de Suscripción) */}
            <Modal
                isOpen={isUpgradeModalOpen}
                onClose={() => {
                    setIsUpgradeModalOpen(false);
                    setTimeout(() => setSelectedPlanToUpgrade(null), 300); // Reset after close
                }}
                title={selectedPlanToUpgrade ? "Seleccionar Método de Pago" : "Límite de Plan Alcanzado"}
                icon={Lock}
                iconColor="text-yellow-500"
                footer={
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setIsUpgradeModalOpen(false)} className="btn-secondary">Cancelar</button>
                    </div>
                }
            >
                <div className="p-6 text-center">
                    {!selectedPlanToUpgrade ? (
                        <>
                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Building2 className="w-8 h-8 text-yellow-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">¡Ups! Llegaste al límite</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Tu plan actual no permite registrar más edificios. Selecciona un nuevo plan para continuar creciendo.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2 text-left">
                                {planesDisponibles.map(plan => (
                                    <div key={plan.id} className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col ${plan.isPopular ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'}`} onClick={() => setSelectedPlanToUpgrade(plan)}>
                                        {plan.isPopular && <div className="text-xs font-bold text-primary-500 uppercase mb-1">Más Popular</div>}
                                        <h4 className="font-bold text-gray-800 dark:text-white text-lg">{plan.nombre}</h4>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-3">${plan.precio} <span className="text-sm font-normal text-gray-500">/mes</span></p>
                                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">
                                            {plan.beneficios.map((b, i) => (
                                                <li key={i} className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> <span>{b}</span></li>
                                            ))}
                                        </ul>
                                        <button className={`w-full py-2 rounded-xl font-medium transition ${plan.isPopular ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}>
                                            Seleccionar Plan
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="animate-fade-in text-left">
                            <button onClick={() => setSelectedPlanToUpgrade(null)} className="flex items-center text-sm text-gray-500 hover:text-primary-500 mb-6 transition">
                                <ChevronLeft className="w-4 h-4 mr-1" /> Volver a planes
                            </button>

                            <div className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">Plan seleccionado:</span>
                                    <span className="font-bold text-gray-900 dark:text-white bg-white dark:bg-dark-surface px-2 py-1 rounded shadow-sm border border-gray-100 dark:border-gray-700">
                                        {selectedPlanToUpgrade.nombre}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">Total a pagar:</span>
                                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                        ${selectedPlanToUpgrade.precio} <span className="text-sm font-normal text-gray-500">USD/mes</span>
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">Elige tu método de pago preferido para completar la suscripción.</p>

                            <div className="flex flex-col gap-3">
                                <button
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
                                    onClick={() => {
                                        setIsUpgradeModalOpen(false);
                                        setIsStripeModalOpen(true);
                                    }}
                                >
                                    <CreditCard className="w-5 h-5" /> Pagar con Tarjeta <ArrowRight className="w-4 h-4" />
                                </button>
                                <button
                                    className="w-full flex items-center justify-center gap-2 bg-[#ffc439] hover:bg-[#e5a819] text-gray-900 font-bold py-3 px-4 rounded-xl shadow transition-transform hover:scale-[1.02]"
                                    onClick={() => {
                                        setIsUpgradeModalOpen(false);
                                        setIsPaypalModalOpen(true);
                                    }}
                                >
                                    PayPal <ArrowRight className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Simulación: Modal Stripe (Tarjeta de Crédito) */}
            <Modal
                isOpen={isStripeModalOpen}
                onClose={() => !isProcessingPayment && setIsStripeModalOpen(false)}
                title="Pago Seguro con Tarjeta"
                icon={ShieldCheck}
                iconColor="text-blue-500"
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <button
                            type="button"
                            disabled={isProcessingPayment}
                            onClick={() => setIsStripeModalOpen(false)}
                            className="btn-secondary disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            disabled={isProcessingPayment}
                            onClick={() => {
                                setIsProcessingPayment(true);
                                setTimeout(() => {
                                    setIsProcessingPayment(false);
                                    setIsStripeModalOpen(false);
                                    toast.success("¡Pago procesado con éxito! Plan actualizado a Premium.");
                                }, 2500);
                            }}
                            className="btn-primary w-full max-w-[200px] flex items-center justify-center disabled:opacity-50"
                        >
                            {isProcessingPayment ? 'Procesando...' : 'Pagar $99.00 USD'}
                        </button>
                    </div>
                }
            >
                <div className="p-6">
                    <div className="bg-blue-50 dark:bg-dark-bg p-4 rounded-xl mb-6 flex justify-between items-center border border-blue-100 dark:border-gray-800">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total a pagar ({selectedPlanToUpgrade?.nombre})</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">${selectedPlanToUpgrade?.precio || "99.00"} <span className="text-sm font-normal text-gray-500">USD/mes</span></p>
                        </div>
                        <div className="w-12 h-12 bg-white dark:bg-dark-surface rounded-full flex items-center justify-center shadow-sm">
                            <CreditCard className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>

                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titular de la tarjeta</label>
                            <input type="text" placeholder="Ej. Juan Pérez" className="w-full px-4 py-2 bg-white dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de tarjeta</label>
                            <div className="relative">
                                <CreditCard className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="0000 0000 0000 0000" className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all font-mono" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de exp.</label>
                                <input type="text" placeholder="MM/AA" className="w-full px-4 py-2 bg-white dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all font-mono" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CVC</label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" placeholder="123" className="w-full px-4 py-2 bg-white dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all font-mono" />
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-center text-gray-500 flex items-center justify-center gap-1 mt-6">
                            <ShieldCheck className="w-4 h-4 text-green-500" /> Transacción encriptada y segura.
                        </p>
                    </form>
                </div>
            </Modal>

            {/* Simulación: Modal PayPal */}
            <Modal
                isOpen={isPaypalModalOpen}
                onClose={() => !isProcessingPayment && setIsPaypalModalOpen(false)}
                title="Pagar con PayPal"
                icon={CreditCard}
                footer={null}
            >
                <div className="p-8 text-center bg-gray-50 dark:bg-dark-surface/50">
                    <div className="mb-6 flex justify-center">
                        <div className="bg-[#003087] text-white font-bold italic text-3xl px-6 py-2 rounded shadow-lg">
                            Pay<span className="text-[#009cde]">Pal</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-dark-bg p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mb-6">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Monto de Suscripción ({selectedPlanToUpgrade?.nombre})</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">${selectedPlanToUpgrade?.precio || "99.00"} <span className="text-sm font-normal text-gray-500">USD</span></p>
                        <p className="text-xs text-gray-400">Se cobrará de forma segura desde tu cuenta de PayPal o tarjeta asociada.</p>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                        Estás a un clic de actualizar a {selectedPlanToUpgrade?.nombre || "Premium"} y obtener más beneficios.
                    </p>

                    <button
                        disabled={isProcessingPayment}
                        onClick={() => {
                            setIsProcessingPayment(true);
                            setTimeout(() => {
                                setIsProcessingPayment(false);
                                setIsPaypalModalOpen(false);
                                toast.success("¡Pago con PayPal exitoso! Eres Premium.");
                            }, 3000);
                        }}
                        className="w-full bg-[#ffc439] hover:bg-[#f4bb33] text-gray-900 font-bold text-lg py-4 px-6 rounded-full shadow-md transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {isProcessingPayment ? (
                            <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                        ) : 'Completar Compra'}
                    </button>

                    <button
                        disabled={isProcessingPayment}
                        onClick={() => setIsPaypalModalOpen(false)}
                        className="mt-4 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition"
                    >
                        Cancelar y volver a la app
                    </button>
                </div>
            </Modal>
            {/* Modal de Confirmación de Eliminación */}
            <Modal
                isOpen={!!deptoToDelete}
                onClose={() => setDeptoToDelete(null)}
                title="Eliminar Departamento"
                icon={X}
                iconColor="text-red-500"
                size="sm"
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <button type="button" onClick={() => setDeptoToDelete(null)} className="btn-secondary">
                            Cancelar
                        </button>
                        <button type="button" onClick={confirmDeleteDepto} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl shadow-sm transition-colors cursor-pointer">
                            Eliminar
                        </button>
                    </div>
                }
            >
                <div className="p-6">
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                        ¿Estás seguro de que deseas eliminar el departamento <span className="font-bold">{deptoToDelete?.numero}</span>?
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Esta acción no se puede deshacer. Se conservará un registro temporal de los datos que no se puedan eliminar si están en uso.
                    </p>
                </div>
            </Modal>
        </div>
    );
}
