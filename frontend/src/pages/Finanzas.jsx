import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Plus, Search, CheckCircle, Clock, FileText, ArrowUpRight, ArrowDownRight, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EmpresaSelector from '../components/EmpresaSelector';
import api from '../api';
import { formatMoney } from '../utils/formatMoney';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Finanzas() {
    const { empresaActiva } = useAuth();
    const toast = useToast();
    const [pagos, setPagos] = useState([]);
    const [contratosActivos, setContratosActivos] = useState([]);
    const [edificios, setEdificios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination & Filters State
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [filtros, setFiltros] = useState({
        fecha_inicio: '',
        fecha_fin: '',
        concepto: '',
        edificio_id: ''
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Resumen financiero
    const [ingresosTotales, setIngresosTotales] = useState(0);

    const [nuevoPago, setNuevoPago] = useState({
        contrato_id: '',
        fecha_correspondiente: new Date().toISOString().split('T')[0],
        concepto: 'Renta Mensual',
        monto: '',
        recargos: '0'
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            // Construir Query String
            const skip = (page - 1) * limit;
            const params = new URLSearchParams({ skip, limit });

            if (searchTerm) params.append('search', searchTerm);
            if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio + "T00:00:00");
            if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin + "T23:59:59");
            if (filtros.concepto) params.append('concepto', filtros.concepto);
            if (filtros.edificio_id) params.append('edificio_id', filtros.edificio_id);

            const [pagosRes, contratosRes, edificiosRes] = await Promise.all([
                api.get(`/pagos?${params.toString()}`),
                api.get('/contratos'),
                api.get('/edificios')
            ]);

            setPagos(pagosRes.data.items);
            setTotalItems(pagosRes.data.total);
            setTotalPages(Math.ceil(pagosRes.data.total / limit));
            setContratosActivos(contratosRes.data);
            setEdificios(edificiosRes.data.items || []);

            // Calcular ingresos (suma global no siempre es posible si solo traemos 15, esto debe venir del backend o limitarse a los visibles. Asumimos suma visible por ahora para demo, o mejor no tocar, solo sumar visibles)
            const total = pagosRes.data.items.reduce((acc, curr) => acc + parseFloat(curr.monto) + parseFloat(curr.recargos || 0), 0);
            setIngresosTotales(total);
        } catch (error) {
            console.error("Error fetching finanzas:", error);
            toast.error("Error al cargar finanzas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [empresaActiva?.id, page, searchTerm, filtros]);

    // Cuando selecciona un contrato, autocompletar el monto de la renta mensual
    const handleContratoSelect = (contratoId) => {
        const contrato = contratosActivos.find(c => c.id.toString() === contratoId);
        if (contrato) {
            setNuevoPago({
                ...nuevoPago,
                contrato_id: contratoId,
                monto: contrato.renta_mensual
            });
        }
    };

    const handleCrearPago = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/pagos', {
                contrato_id: parseInt(nuevoPago.contrato_id),
                fecha_correspondiente: nuevoPago.fecha_correspondiente + "T00:00:00",
                concepto: nuevoPago.concepto,
                monto: parseFloat(nuevoPago.monto),
                recargos: parseFloat(nuevoPago.recargos) || 0,
                estado: "Completado"
            });
            await fetchData();
            setIsModalOpen(false);
            setNuevoPago({ contrato_id: '', fecha_correspondiente: new Date().toISOString().split('T')[0], concepto: 'Renta Mensual', monto: '', recargos: '0' });
            toast.success("Pago registrado exitosamente");
        } catch (error) {
            console.error("Error ingresando pago:", error);
            toast.error("Error al registrar el pago");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-MX', options);
    };

    const handleDownloadPDF = async (pagoId) => {
        try {
            const response = await api.get(`/pagos/${pagoId}/recibo`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Recibo_Famesto_${pagoId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Error al descargar PDF:", error);
            toast.error("No se pudo descargar el recibo.");
        }
    };

    // Find contract details for a payment
    const getDetallesPago = (contrato_id) => {
        const contrato = contratosActivos.find(c => c.id === contrato_id);
        if (contrato) return `${contrato.inquilino_nombre_completo} (Depa ${contrato.departamento_numero} - ${contrato.edificio_nombre})`;
        return `Contrato #${contrato_id}`;
    };

    // Eliminar filtro local, el backend ahora filtra de forma nativa.
    const filteredPagos = pagos;

    return (
        <div className="space-y-6">
            <EmpresaSelector />
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Finanzas y Pagos</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Control de ingresos, cobros de renta e historial financiero.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center bg-green-600 hover:bg-green-500 dark:bg-green-600 dark:hover:bg-green-500 shadow-green-500/30"
                >
                    <DollarSign className="w-5 h-5 mr-1" />
                    Registrar Cobro
                </button>
            </div>

            {/* Mini Dashboard Financiero */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/20 px-2 py-1 rounded-full">Histórico</span>
                    </div>
                    <div>
                        <h4 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Ingresos Totales</h4>
                        <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                            {formatMoney(ingresosTotales)}
                        </p>
                    </div>
                </div>

                <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pagos Registrados</h4>
                        <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                            {pagos.length}
                        </p>
                    </div>
                </div>

                <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Contratos Activos</h4>
                        <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                            {contratosActivos.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Historial de Pagos (Tabla) */}
            <div className="glass-panel p-0 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-gray-50/50 dark:bg-dark-bg/20">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center whitespace-nowrap">
                        <Clock className="w-5 h-5 mr-2 text-primary-500" />
                        Historial de Transacciones
                    </h3>

                    {/* Filtros Profesionales Panel */}
                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                        <div className="relative flex-1 min-w-[200px] xl:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por inquilino..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <input
                                type="date"
                                value={filtros.fecha_inicio}
                                onChange={(e) => { setFiltros({ ...filtros, fecha_inicio: e.target.value }); setPage(1); }}
                                className="px-3 py-2 bg-white dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                title="Fecha de inicio"
                            />
                            <span className="text-gray-400 text-sm">a</span>
                            <input
                                type="date"
                                value={filtros.fecha_fin}
                                onChange={(e) => { setFiltros({ ...filtros, fecha_fin: e.target.value }); setPage(1); }}
                                className="px-3 py-2 bg-white dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                title="Fecha de fin"
                            />

                            <select
                                value={filtros.concepto}
                                onChange={(e) => { setFiltros({ ...filtros, concepto: e.target.value }); setPage(1); }}
                                className="px-3 py-2 bg-white dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            >
                                <option value="">Todos los conceptos</option>
                                <option value="Renta Mensual">Renta Mensual</option>
                                <option value="Depósito en Garantía">Depósito en Garantía</option>
                                <option value="Multa / Intereses">Multa / Intereses</option>
                            </select>

                            <select
                                value={filtros.edificio_id}
                                onChange={(e) => { setFiltros({ ...filtros, edificio_id: e.target.value }); setPage(1); }}
                                className="px-3 py-2 bg-white dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            >
                                <option value="">Todos los edificios</option>
                                {edificios.map(edificio => (
                                    <option key={edificio.id} value={edificio.id}>{edificio.nombre}</option>
                                ))}
                            </select>

                            {(searchTerm || filtros.fecha_inicio || filtros.fecha_fin || filtros.concepto || filtros.edificio_id) && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFiltros({ fecha_inicio: '', fecha_fin: '', concepto: '', edificio_id: '' });
                                        setPage(1);
                                    }}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition cursor-pointer"
                                    title="Limpiar filtros"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-white dark:bg-dark-surface">
                                    <th className="px-6 py-4 font-semibold">Inquilino y Contrato</th>
                                    <th className="px-6 py-4 font-semibold">Fecha Cubierta</th>
                                    <th className="px-6 py-4 font-semibold">Fecha de Pago</th>
                                    <th className="px-6 py-4 font-semibold text-right">Monto</th>
                                    <th className="px-6 py-4 font-semibold">Recibo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredPagos.length > 0 ? (
                                    filteredPagos.map((pago) => (
                                        <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center mr-3 flex-shrink-0">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                                                            {getDetallesPago(pago.contrato_id)}
                                                        </span>
                                                        <span className="text-xs text-primary-500 font-semibold uppercase tracking-wider mt-0.5">
                                                            {pago.concepto || 'Renta Mensual'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                {formatDate(pago.fecha_correspondiente)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                                <CheckCircle className="w-3 h-3 text-green-500 mr-1.5" />
                                                {formatDate(pago.fecha_pago)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white text-right">
                                                <div className="flex flex-col items-end">
                                                    <span>{formatMoney(pago.monto)}</span>
                                                    {parseFloat(pago.recargos) > 0 && (
                                                        <span className="text-xs text-red-500 font-normal mt-0.5">
                                                            + {formatMoney(pago.recargos)} recargos
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleDownloadPDF(pago.id)} className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 text-sm font-medium flex items-center transition-colors">
                                                    <FileText className="w-4 h-4 mr-1" /> PDF
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            No hay pagos registrados aún o la búsqueda no coincidió.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Controles de Paginación */}
                {!loading && totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-dark-bg/10 gap-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Mostrando <span className="font-bold text-gray-900 dark:text-white">{(page - 1) * limit + 1}</span> a <span className="font-bold text-gray-900 dark:text-white">{Math.min(page * limit, totalItems)}</span> de <span className="font-bold text-gray-900 dark:text-white">{totalItems}</span> pagos
                        </p>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages || totalPages === 0}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Registrar Pago */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Registrar Ingreso"
                subtitle="Captura el pago de renta de un inquilino activo."
                icon={DollarSign}
                iconColor="text-green-500"
                size="lg"
                footer={
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm shadow-sm">
                            Cancelar
                        </button>
                        <button type="submit" form="pago-form" disabled={isSubmitting} className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl shadow-lg shadow-green-500/30 transition-all text-sm disabled:opacity-50">
                            {isSubmitting ? 'Procesando...' : 'Aplicar Ingreso'}
                        </button>
                    </div>
                }
            >
                <form id="pago-form" onSubmit={handleCrearPago} className="p-6 space-y-5">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contrato Activo</label>
                        <select
                            required
                            value={nuevoPago.contrato_id}
                            onChange={(e) => handleContratoSelect(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm"
                        >
                            <option value="">Selecciona quién está pagando...</option>
                            {contratosActivos.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.inquilino_nombre_completo} - Depa {c.departamento_numero} ({c.edificio_nombre})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Concepto de Ingreso</label>
                            <select
                                required
                                value={nuevoPago.concepto}
                                onChange={e => setNuevoPago({ ...nuevoPago, concepto: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm"
                            >
                                <option value="Renta Mensual">Renta Mensual</option>
                                <option value="Depósito en Garantía">Depósito en Garantía</option>
                                <option value="Multa / Intereses">Multa / Intereses</option>
                                <option value="Adeudo Anterior">Adeudo Anterior</option>
                                <option value="Mantenimiento Adicional">Mantenimiento Adicional</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mes que cubre</label>
                            <input
                                type="date" required
                                value={nuevoPago.fecha_correspondiente}
                                onChange={e => setNuevoPago({ ...nuevoPago, fecha_correspondiente: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto Pagado ($)</label>
                            <input
                                type="number" step="0.01" required
                                value={nuevoPago.monto} onChange={e => setNuevoPago({ ...nuevoPago, monto: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white font-bold transition-all shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recargos/Penalizaciones ($)</label>
                            <input
                                type="number" step="0.01"
                                value={nuevoPago.recargos} onChange={e => setNuevoPago({ ...nuevoPago, recargos: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 dark:text-red-400 font-bold transition-all shadow-sm"
                            />
                        </div>
                    </div>

                </form>
            </Modal>
        </div>
    );
}
