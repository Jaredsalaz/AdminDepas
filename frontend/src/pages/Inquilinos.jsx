import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Search, Phone, Mail, FileText, Shield, MoreVertical, X, CheckCircle, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { usePermissions } from '../context/usePermissions';
import { useAuth } from '../context/AuthContext';
import EmpresaSelector from '../components/EmpresaSelector';
import api from '../api';
import { formatMoney } from '../utils/formatMoney';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Inquilinos() {
    const { canDeleteData, canCreateData } = usePermissions();
    const { empresaActiva } = useAuth();
    const toast = useToast();

    const [inquilinos, setInquilinos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados para Contrato
    const [isContratoModalOpen, setIsContratoModalOpen] = useState(false);
    const [selectedInquilino, setSelectedInquilino] = useState(null);
    const [edificios, setEdificios] = useState([]);
    const [isSubmittingContrato, setIsSubmittingContrato] = useState(false);
    const [contratoData, setContratoData] = useState({
        edificio_id: '',
        departamento_id: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        monto_deposito: '',
        duracion_meses: 12
    });

    // Estados para Ver Detalles de Contrato
    const [isDetallesModalOpen, setIsDetallesModalOpen] = useState(false);
    const [contratoActivoInfo, setContratoActivoInfo] = useState(null);
    const [loadingDetalles, setLoadingDetalles] = useState(false);

    // Estado del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        correo: '',
        telefono: '',
        datos_aval: ''
    });

    const fetchInquilinos = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/inquilinos');
            setInquilinos(data.items || data || []);
        } catch (error) {
            console.error("Error fetching inquilinos:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEdificios = async () => {
        try {
            const { data } = await api.get('/edificios?per_page=999');
            setEdificios(data.items || data);
        } catch (error) {
            console.error("Error fetching edificios:", error);
        }
    };

    useEffect(() => {
        fetchInquilinos();
        fetchEdificios();
    }, [empresaActiva?.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/inquilinos', formData);
            await fetchInquilinos();
            setIsModalOpen(false);
            setFormData({ nombre: '', apellidos: '', correo: '', telefono: '', datos_aval: '' });
            toast.success("Inquilino registrado exitosamente");
        } catch (error) {
            console.error("Error al guardar inquilino:", error);
            toast.error(error.response?.data?.detail || "Error al registrar inquilino");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este perfil de inquilino?")) return;
        try {
            await api.delete(`/inquilinos/${id}`);
            await fetchInquilinos();
            toast.success("Perfil de inquilino eliminado");
        } catch (error) {
            console.error("Error eliminando inquilino:", error);
            toast.error("Error al eliminar el inquilino");
        }
    };

    const openContratoModal = (inquilino) => {
        setSelectedInquilino(inquilino);
        setContratoData({
            ...contratoData,
            edificio_id: '',
            departamento_id: '',
            monto_deposito: ''
        });
        setIsContratoModalOpen(true);
    };

    const handleCreateContrato = async (e) => {
        e.preventDefault();
        setIsSubmittingContrato(true);
        try {
            await api.post('/contratos', {
                inquilino_id: selectedInquilino.id,
                departamento_id: parseInt(contratoData.departamento_id),
                fecha_inicio: contratoData.fecha_inicio + "T00:00:00",
                fecha_fin: contratoData.fecha_fin + "T00:00:00",
                monto_deposito: parseFloat(contratoData.monto_deposito) || 0
            });
            toast.success("Contrato creado y departamento asignado exitosamente.");
            setIsContratoModalOpen(false);
            fetchInquilinos(); // Actualizar estado de contrato
            fetchEdificios(); // Actualizar disponibilidad de depas
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error al crear contrato");
        } finally {
            setIsSubmittingContrato(false);
        }
    };

    const verDetallesContrato = async (inquilino) => {
        setLoadingDetalles(true);
        setSelectedInquilino(inquilino);
        try {
            const { data } = await api.get(`/inquilinos/${inquilino.id}/contrato_activo`);
            setContratoActivoInfo(data);
            setIsDetallesModalOpen(true);
        } catch (error) {
            toast.error("No se pudo obtener la información del contrato.");
        } finally {
            setLoadingDetalles(false);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-MX', options);
    };

    const filteredInquilinos = inquilinos.filter(i =>
        i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.correo && i.correo.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <EmpresaSelector />
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Inquilinos</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Gestión de perfiles de clientes, avales y datos de contacto.
                    </p>
                </div>
                {canCreateData && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center"
                    >
                        <Plus className="w-5 h-5 mr-1" />
                        Nuevo Inquilino
                    </button>
                )}
            </div>

            {/* Barra de Búsqueda */}
            <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellidos o correo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm"
                    />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center bg-white dark:bg-dark-surface px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <Users className="w-4 h-4 mr-2 text-primary-500" />
                    Total Registrados: <span className="text-primary-500 font-bold ml-1 text-base">{filteredInquilinos.length}</span>
                </div>
            </div>

            {/* Grid de Tarjetas de Perfil */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredInquilinos.map((inquilino, index) => (
                            <motion.div
                                key={inquilino.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="glass-panel p-0 overflow-hidden group hover:border-primary-500/30 transition-all flex flex-col h-full"
                            >
                                {/* Banner Superior Decorativo */}
                                <div className="h-20 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 relative">
                                    {canDeleteData && (
                                        <button
                                            onClick={() => handleDelete(inquilino.id)}
                                            className="absolute top-2 right-2 p-1.5 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-red-500/20 backdrop-blur-sm rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="p-6 pt-0 flex-1 flex flex-col">
                                    {/* Avatar (Letras iniciales flotando) */}
                                    <div className="relative -mt-10 mb-4 flex justify-between items-end">
                                        <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary-500/30 border-4 border-white dark:border-dark-surface">
                                            {inquilino.nombre.charAt(0)}{inquilino.apellidos?.charAt(0)}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                        {inquilino.nombre} {inquilino.apellidos}
                                    </h3>

                                    <div className="space-y-3 mt-5 flex-1">
                                        {inquilino.correo && (
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-dark-bg flex items-center justify-center mr-3 border border-gray-100 dark:border-gray-800">
                                                    <Mail className="w-4 h-4" />
                                                </div>
                                                <span className="truncate">{inquilino.correo}</span>
                                            </div>
                                        )}
                                        {inquilino.telefono && (
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-dark-bg flex items-center justify-center mr-3 border border-gray-100 dark:border-gray-800">
                                                    <Phone className="w-4 h-4" />
                                                </div>
                                                <span>{inquilino.telefono}</span>
                                            </div>
                                        )}

                                        {/* Bloque Aval Visualmente distinto */}
                                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl relative">
                                            <span className="absolute -top-2 left-3 bg-white dark:bg-dark-bg px-2 text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider rounded-full border border-amber-100 dark:border-amber-900/30">
                                                Respaldo Legal
                                            </span>
                                            <div className="flex mt-1">
                                                <Shield className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-amber-900 dark:text-amber-200/70 line-clamp-2">
                                                    {inquilino.datos_aval || "Sin datos de Aval registrado. Se requiere para contratos formales."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Tarjeta */}
                                    <div className="pt-4 mt-5 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                        <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 dark:bg-dark-bg rounded-md">
                                            ID: #{inquilino.id.toString().padStart(4, '0')}
                                        </div>
                                        {inquilino.tiene_contrato_activo ? (
                                            <button
                                                onClick={() => verDetallesContrato(inquilino)}
                                                className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                                            >
                                                {loadingDetalles && selectedInquilino?.id === inquilino.id ? (
                                                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin mr-1"></div>
                                                ) : (
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                )}
                                                Rentando
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => openContratoModal(inquilino)}
                                                className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors flex items-center bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg border border-primary-200 dark:border-primary-900/30"
                                            >
                                                <FileText className="w-4 h-4 mr-1" /> Rentar Depa
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredInquilinos.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center glass-panel">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">No hay inquilinos aquí</h3>
                    <p className="text-gray-500 dark:text-gray-500 mt-2 max-w-sm mx-auto">
                        Al parecer no tienes inquilinos registrados, o tu búsqueda no arrojó resultados.
                    </p>
                </motion.div>
            )}

            {/* Modal Creación de Inquilino */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Registrar Nuevo Inquilino"
                subtitle="Crea el perfil del cliente para asociarlo a un contrato futuro."
                icon={Users}
                size="2xl"
                footer={
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm shadow-sm">Descartar</button>
                        <button type="submit" form="inquilino-form" disabled={isSubmitting} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl shadow-lg shadow-primary-500/30 transition-all text-sm disabled:opacity-50">
                            {isSubmitting ? 'Registrando...' : 'Guardar Inquilino'}
                        </button>
                    </div>
                }
            >
                <form id="inquilino-form" onSubmit={handleSubmit} className="space-y-6">

                    {/* Separador Visual: Datos Personales */}
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 pb-2 border-b border-gray-100 dark:border-gray-800">
                        Datos Personales
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre(s) *</label>
                            <input
                                type="text" required
                                value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellidos *</label>
                            <input
                                type="text" required
                                value={formData.apellidos} onChange={e => setFormData({ ...formData, apellidos: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="email"
                                    value={formData.correo} onChange={e => setFormData({ ...formData, correo: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono Móvil</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="tel"
                                    value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Separador Visual: Aval */}
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-500 pb-2 border-b border-gray-100 dark:border-gray-800 mt-8">
                        Información del Aval / Fiador (Opcional)
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Datos Completos del Aval y Garantía
                        </label>
                        <textarea
                            rows="4"
                            value={formData.datos_aval} onChange={e => setFormData({ ...formData, datos_aval: e.target.value })}
                            placeholder="Ej. Nombre completo del aval, teléfono de contacto, dirección de la propiedad en garantía (Escrituras Núm. XXXX)..."
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-white transition-all shadow-sm resize-none"
                        />
                        <p className="text-[11px] text-gray-500 mt-1.5 flex items-start">
                            <Shield className="w-3 h-3 mr-1 mt-0.5" />
                            Esta información se usará autómaticamente en el Generador de PDF de Contratos.
                        </p>
                    </div>
                </form>
            </Modal>

            {/* Modal Creación de Contrato */}
            <Modal
                isOpen={isContratoModalOpen && !!selectedInquilino}
                onClose={() => setIsContratoModalOpen(false)}
                title="Nuevo Contrato"
                subtitle={selectedInquilino ? `Asignar departamento a ${selectedInquilino.nombre}` : ''}
                icon={FileText}
                size="lg"
                footer={
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setIsContratoModalOpen(false)} className="px-5 py-2.5 bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm shadow-sm">Cancelar</button>
                        <button type="submit" form="contrato-form" disabled={isSubmittingContrato} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl shadow-lg shadow-primary-500/30 transition-all text-sm disabled:opacity-50">
                            {isSubmittingContrato ? 'Confirmando...' : 'Formalizar Contrato'}
                        </button>
                    </div>
                }
            >
                <form id="contrato-form" onSubmit={handleCreateContrato} className="space-y-5">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edificio</label>
                        <select
                            required
                            value={contratoData.edificio_id}
                            onChange={(e) => setContratoData({ ...contratoData, edificio_id: e.target.value, departamento_id: '' })}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm"
                        >
                            <option value="">Selecciona un edificio...</option>
                            {edificios.map(ed => (
                                <option key={ed.id} value={ed.id}>{ed.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Departamento Disponible</label>
                        <select
                            required disabled={!contratoData.edificio_id}
                            value={contratoData.departamento_id}
                            onChange={(e) => setContratoData({ ...contratoData, departamento_id: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm disabled:opacity-50"
                        >
                            <option value="">Selecciona un departamento...</option>
                            {contratoData.edificio_id && edificios.find(e => e.id.toString() === contratoData.edificio_id)?.departamentos
                                .filter(d => d.estado === 'Disponible')
                                .map(depa => (
                                    <option key={depa.id} value={depa.id}>
                                        Depa {depa.numero} - {formatMoney(depa.renta_mensual)}/mes
                                    </option>
                                ))}
                        </select>
                        {contratoData.edificio_id && edificios.find(e => e.id.toString() === contratoData.edificio_id)?.departamentos.filter(d => d.estado === 'Disponible').length === 0 && (
                            <p className="text-xs text-red-500 mt-1">No hay departamentos disponibles en este edificio.</p>
                        )}
                    </div>

                    {/* Duración del contrato */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duración del Contrato</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button"
                                onClick={() => {
                                    const inicio = new Date(contratoData.fecha_inicio);
                                    const fin = new Date(inicio);
                                    fin.setMonth(fin.getMonth() + 6);
                                    setContratoData({ ...contratoData, duracion_meses: 6, fecha_fin: fin.toISOString().split('T')[0] });
                                }}
                                className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${contratoData.duracion_meses === 6
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-md'
                                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'
                                    }`}
                            >
                                6 Meses
                            </button>
                            <button type="button"
                                onClick={() => {
                                    const inicio = new Date(contratoData.fecha_inicio);
                                    const fin = new Date(inicio);
                                    fin.setMonth(fin.getMonth() + 12);
                                    setContratoData({ ...contratoData, duracion_meses: 12, fecha_fin: fin.toISOString().split('T')[0] });
                                }}
                                className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${contratoData.duracion_meses === 12
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-md'
                                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'
                                    }`}
                            >
                                12 Meses
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Inicio</label>
                            <input type="date" required value={contratoData.fecha_inicio}
                                onChange={e => {
                                    const inicio = new Date(e.target.value);
                                    const fin = new Date(inicio);
                                    fin.setMonth(fin.getMonth() + contratoData.duracion_meses);
                                    setContratoData({ ...contratoData, fecha_inicio: e.target.value, fecha_fin: fin.toISOString().split('T')[0] });
                                }}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Fin</label>
                            <input type="date" required value={contratoData.fecha_fin}
                                onChange={e => setContratoData({ ...contratoData, fecha_fin: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm" />
                            <p className="text-xs text-gray-400 mt-1">Se pre-calcula según duración</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto de Depósito ($)</label>
                        <input type="number" step="0.01" value={contratoData.monto_deposito} onChange={e => setContratoData({ ...contratoData, monto_deposito: e.target.value })} placeholder="Ej. 15000" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm" />
                    </div>

                </form>
            </Modal>

            {/* Modal de Detalles del Contrato Activo */}
            <Modal
                isOpen={isDetallesModalOpen && !!contratoActivoInfo && !!selectedInquilino}
                onClose={() => setIsDetallesModalOpen(false)}
                title="Contrato Vigente"
                subtitle={selectedInquilino ? `Arrendatario: ${selectedInquilino.nombre} ${selectedInquilino.apellidos}` : ''}
                icon={Shield}
                iconColor="text-green-500"
                headerColor="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
            >
                {contratoActivoInfo && (
                    <div className="p-6 space-y-5">
                        <div className="glass-panel p-4 bg-gray-50 dark:bg-dark-bg/50 border border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Propiedad Asignada</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">Departamento {contratoActivoInfo.departamento_numero}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{contratoActivoInfo.edificio_nombre}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl">
                                <p className="text-xs text-gray-500 mb-1">Inicio de Contrato</p>
                                <p className="text-sm font-medium dark:text-white">{formatDate(contratoActivoInfo.fecha_inicio)}</p>
                            </div>
                            <div className="p-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl">
                                <p className="text-xs text-gray-500 mb-1">Fin de Contrato</p>
                                <p className="text-sm font-medium dark:text-white">{formatDate(contratoActivoInfo.fecha_fin)}</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-900/30">
                            <div>
                                <p className="text-xs text-primary-600/80 dark:text-primary-400 mb-0.5 font-bold uppercase">Renta Mensual Ajustada</p>
                                <p className="text-2xl font-black text-primary-700 dark:text-primary-300">{formatMoney(contratoActivoInfo.renta_mensual)}</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Depósito en Garantía Entregado:</p>
                            <p className="font-bold text-gray-900 dark:text-white">{formatMoney(contratoActivoInfo.monto_deposito || 0)}</p>
                        </div>

                        <div className="space-y-3 pt-2">
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await api.get(`/contratos/${contratoActivoInfo.id}/pdf`, { responseType: 'blob' });
                                        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = `Contrato_${contratoActivoInfo.id}.pdf`;
                                        link.click();
                                        window.URL.revokeObjectURL(url);
                                    } catch (error) {
                                        toast.error('Error al descargar el contrato');
                                    }
                                }}
                                className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors flex justify-center items-center text-sm shadow-sm"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Descargar Contrato PDF
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={async () => {
                                        if (!window.confirm('¿Finalizar este contrato?\n\nSe liberará el departamento y se devolverá el depósito de garantía al inquilino.')) return;
                                        try {
                                            const { data } = await api.post(`/contratos/${contratoActivoInfo.id}/finalizar`);
                                            toast.success(`✅ ${data.message}`);
                                            setIsDetallesModalOpen(false);
                                            fetchInquilinos();
                                            fetchEdificios();
                                        } catch (error) {
                                            toast.error(error.response?.data?.detail || 'Error al finalizar contrato');
                                        }
                                    }}
                                    className="py-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 font-medium rounded-xl transition-colors flex justify-center items-center text-sm border border-green-200 dark:border-green-800"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                    Finalizar Contrato
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!window.confirm('⚠️ ¿Terminar contrato por INCUMPLIMIENTO?\n\nEl depósito de garantía NO será devuelto al inquilino.')) return;
                                        try {
                                            const { data } = await api.post(`/contratos/${contratoActivoInfo.id}/incumplimiento`);
                                            toast.warning(`⚠️ ${data.message}`);
                                            setIsDetallesModalOpen(false);
                                            fetchInquilinos();
                                            fetchEdificios();
                                        } catch (error) {
                                            toast.error(error.response?.data?.detail || 'Error al procesar incumplimiento');
                                        }
                                    }}
                                    className="py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 font-medium rounded-xl transition-colors flex justify-center items-center text-sm border border-red-200 dark:border-red-800"
                                >
                                    <AlertTriangle className="w-4 h-4 mr-1.5" />
                                    Incumplimiento
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
// Trigger Vite HMR
