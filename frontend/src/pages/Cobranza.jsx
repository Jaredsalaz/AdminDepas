import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/formatMoney';
import { Wallet, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';
import api from '../api';

export default function Cobranza() {
    const { empresaActiva } = useAuth();
    const [cargando, setCargando] = useState(true);
    const [estadoCuenta, setEstadoCuenta] = useState([]);
    const [filtroEstado, setFiltroEstado] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 15;

    useEffect(() => {
        if (empresaActiva) {
            fetchEstadoCuenta();
        }
    }, [empresaActiva, page]);

    const fetchEstadoCuenta = async () => {
        try {
            setCargando(true);
            const skip = (page - 1) * limit;
            const res = await api.get(`/cobranza/estado_cuenta?skip=${skip}&limit=${limit}`);
            const items = res.data?.items || res.data || [];
            const total = res.data?.total || 0;
            setEstadoCuenta(Array.isArray(items) ? items : []);
            setTotalItems(total);
            setTotalPages(Math.ceil(total / limit));
        } catch (error) {
            console.error("Error al obtener el estado de cuenta", error);
        } finally {
            setCargando(false);
        }
    };

    const filtrados = estadoCuenta.filter(item => {
        const matchEstado = filtroEstado === 'Todos' || item.estado === filtroEstado;
        const matchBusqueda = item.inquilino_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            item.departamento_numero.toLowerCase().includes(busqueda.toLowerCase());
        return matchEstado && matchBusqueda;
    });

    const totalAlCorriente = estadoCuenta.filter(item => item.estado === 'Al corriente' || item.estado === 'Adelantado').length;
    const totalMorosos = estadoCuenta.filter(item => item.estado === 'Morosos').length;
    const deudaTotal = estadoCuenta.reduce((acc, curr) => acc + curr.monto_adeudado, 0);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Wallet className="w-8 h-8 text-primary-500" />
                Cobranza y Estado de Cuenta
            </h1>

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Contratos al Corriente</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalAlCorriente}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Contratos Morosos</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalMorosos}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-50 text-gray-200 dark:text-gray-700 pointer-events-none transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                        <Wallet className="w-24 h-24" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Deuda Total Esperada</p>
                        <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">{formatMoney(deudaTotal)}</p>
                    </div>
                </div>
            </div>

            {/* Controles: Busqueda y Filtro */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por inquilino o departamento..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-white"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                <div className="flex bg-white dark:bg-dark-surface rounded-xl p-1 border border-gray-200 dark:border-gray-700 w-full sm:w-auto">
                    {['Todos', 'Al corriente', 'Morosos'].map(estado => (
                        <button
                            key={estado}
                            onClick={() => setFiltroEstado(estado)}
                            className={`flex-1 sm:px-6 py-2 rounded-lg text-sm font-medium transition-colors ${filtroEstado === estado
                                ? 'bg-primary-500 text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            {estado}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-dark-bg text-gray-500 dark:text-gray-400 text-sm font-medium">
                                <th className="px-6 py-4">Inquilino</th>
                                <th className="px-6 py-4">Departamento</th>
                                <th className="px-6 py-4">Renta Mensual</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Adeudo</th>
                                <th className="px-6 py-4">Próximo Pago</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                            {cargando ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500 text-base font-medium">
                                        Cargando estado de cuenta...
                                    </td>
                                </tr>
                            ) : filtrados.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500 text-base font-medium">
                                        No se encontraron contratos con estos filtros.
                                    </td>
                                </tr>
                            ) : (
                                filtrados.map(item => (
                                    <tr key={item.contrato_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {item.inquilino_nombre}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-900 dark:text-gray-200">Depa {item.departamento_numero}</span>
                                            <br />
                                            <span className="text-xs text-gray-500">{item.edificio_nombre}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 dark:text-gray-200">
                                            {formatMoney(item.renta_mensual)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${item.estado === 'Al corriente' || item.estado === 'Adelantado'
                                                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-green-500/30'
                                                : 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-500/30'
                                                }`}>
                                                {item.estado === 'Al corriente' || item.estado === 'Adelantado' ? (
                                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                                ) : (
                                                    <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                                                )}
                                                {item.estado.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.meses_adeudados > 0 ? (
                                                <div className="text-red-600 dark:text-red-400 font-semibold">
                                                    {formatMoney(item.monto_adeudado)}
                                                    <span className="text-xs ml-2 font-normal">({item.meses_adeudados} mes{item.meses_adeudados > 1 ? 'es' : ''})</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 dark:text-gray-300">
                                            {new Date(item.proximo_pago).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Paginación */}
            {!cargando && totalPages > 1 && (
                <div className="flex justify-between items-center bg-white dark:bg-dark-surface p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Mostrando <span className="font-bold text-gray-900 dark:text-white">{(page - 1) * limit + 1}</span> a <span className="font-bold text-gray-900 dark:text-white">{Math.min(page * limit, totalItems)}</span> de <span className="font-bold text-gray-900 dark:text-white">{totalItems}</span> registros
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
