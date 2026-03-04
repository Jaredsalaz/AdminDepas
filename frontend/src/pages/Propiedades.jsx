import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, MapPin, Grid, DoorOpen, MoreVertical, Search, X, CheckCircle, Clock } from 'lucide-react';
import { usePermissions } from '../context/usePermissions';
import api from '../api';

export default function Propiedades() {
    const { canDeleteData, canCreateData } = usePermissions();

    const [edificios, setEdificios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEdificio, setSelectedEdificio] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [nuevoEdificio, setNuevoEdificio] = useState({ nombre: '', direccion: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nuevoDepto, setNuevoDepto] = useState({ numero: '', renta_mensual: '', inventario: '' });
    const [isSubmittingDepto, setIsSubmittingDepto] = useState(false);

    const fetchEdificios = async () => {
        try {
            const { data } = await api.get('/edificios');
            setEdificios(data);
        } catch (error) {
            console.error("Error fetching edificios:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEdificios();
    }, []);

    const handleCreateEdificio = async (e) => {
        e.preventDefault();
        if (!nuevoEdificio.nombre || !nuevoEdificio.direccion) return;

        setIsSubmitting(true);
        try {
            await api.post('/edificios', nuevoEdificio);
            await fetchEdificios(); // Recargar lista
            setIsCreateModalOpen(false);
            setNuevoEdificio({ nombre: '', direccion: '' });
        } catch (error) {
            console.error("Error guardando edificio:", error);
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
            const { data } = await api.get('/edificios');
            setEdificios(data);
            const edificioActualizado = data.find(ed => ed.id === selectedEdificio.id);
            if (edificioActualizado) setSelectedEdificio(edificioActualizado);

            setNuevoDepto({ numero: '', renta_mensual: '', inventario: '' });
        } catch (error) {
            console.error("Error guardando departamento:", error);
        } finally {
            setIsSubmittingDepto(false);
        }
    };

    const handleDeleteDepto = async (deptoId) => {
        if (!window.confirm('¿Estás seguro de eliminar este departamento?')) return;

        try {
            await api.delete(`/edificios/departamentos/${deptoId}`);

            // Recargar
            const { data } = await api.get('/edificios');
            setEdificios(data);
            const edificioActualizado = data.find(ed => ed.id === selectedEdificio.id);
            if (edificioActualizado) setSelectedEdificio(edificioActualizado);
        } catch (error) {
            console.error("Error eliminando departamento:", error);
        }
    };

    const filteredEdificios = edificios.filter(e =>
        e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.direccion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
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
                    Total: <span className="text-primary-500 font-bold">{filteredEdificios.length}</span> Edificios
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
                                                    ${ingresosPotenciales.toLocaleString()} <span className="text-xs font-normal text-gray-400">/mes</span>
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
                                        className="p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-dark-surface shadow-sm hover:shadow-md transition-all flex justify-between items-center group"
                                    >
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
                                            {canDeleteData && (
                                                <button
                                                    onClick={() => handleDeleteDepto(depa.id)}
                                                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                    title="Eliminar Departamento"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                            <div className="mt-2">
                                                <p className="font-bold text-gray-900 dark:text-white">${parseFloat(depa.renta_mensual).toLocaleString()}</p>
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
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}

                {/* Modal para Crear Nuevo Edificio (Centro) */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-dark-surface relative z-10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                    <Building2 className="w-5 h-5 mr-2 text-primary-500" />
                                    Nuevo Edificio
                                </h3>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                                >
                                    <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateEdificio} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Edificio</label>
                                    <input
                                        type="text"
                                        required
                                        value={nuevoEdificio.nombre}
                                        onChange={(e) => setNuevoEdificio({ ...nuevoEdificio, nombre: e.target.value })}
                                        placeholder="Ej. Torre Esmeralda"
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección Completa</label>
                                    <input
                                        type="text"
                                        required
                                        value={nuevoEdificio.direccion}
                                        onChange={(e) => setNuevoEdificio({ ...nuevoEdificio, direccion: e.target.value })}
                                        placeholder="Ej. Av. Paseo de los Leones 123"
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="btn-secondary"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="btn-primary opacity-100 data-[disabled=true]:opacity-50"
                                        data-disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Guardando...' : 'Guardar Edificio'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
