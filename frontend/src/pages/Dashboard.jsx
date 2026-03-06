import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, ReceiptText, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePermissions } from '../context/usePermissions';
import { useAuth } from '../context/AuthContext';
import EmpresaSelector from '../components/EmpresaSelector';
import api from '../api';

const dataIngresos = [
    { name: 'Ene', ingresos: 40000, gastos: 24000 },
    { name: 'Feb', ingresos: 30000, gastos: 13980 },
    { name: 'Mar', ingresos: 20000, gastos: 9800 },
    { name: 'Abr', ingresos: 27800, gastos: 3908 },
    { name: 'May', ingresos: 18900, gastos: 4800 },
    { name: 'Jun', ingresos: 23900, gastos: 3800 },
    { name: 'Jul', ingresos: 34900, gastos: 4300 },
];

const StatCard = ({ title, value, icon: Icon, trend, trendValue }) => (
    <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        className="glass-panel p-6 flex flex-col justify-between"
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
                <h3 className="text-3xl font-bold mt-2 text-gray-800 dark:text-gray-100">{value}</h3>
            </div>
            <div className="p-3 bg-primary-50 dark:bg-primary-900/40 rounded-xl text-primary-500">
                <Icon className="w-6 h-6" />
            </div>
        </div>

        <div className="mt-4 flex items-center">
            {trend === 'up' ? (
                <span className="flex items-center text-sm text-green-500 font-medium bg-green-500/10 px-2 py-1 rounded-full">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    {trendValue}
                </span>
            ) : (
                <span className="flex items-center text-sm text-red-500 font-medium bg-red-500/10 px-2 py-1 rounded-full">
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                    {trendValue}
                </span>
            )}
            <span className="text-sm text-gray-400 ml-2">vs último mes</span>
        </div>
    </motion.div>
);

export default function Dashboard() {
    const { canEditFinances } = usePermissions();
    const { empresaActiva } = useAuth();
    const [stats, setStats] = useState({
        totalDepas: 0,
        rentados: 0,
        ticketsAbiertos: 0
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [edificiosRes, ticketsRes] = await Promise.all([
                    api.get('/edificios?per_page=999'),
                    api.get('/tickets')
                ]);

                const edificios = edificiosRes.data?.items || edificiosRes.data || [];
                const tickets = ticketsRes.data?.items || ticketsRes.data || [];

                let total = 0;
                let ocupados = 0;

                if (Array.isArray(edificios)) {
                    edificios.forEach(edificio => {
                        total += edificio.departamentos?.length || 0;
                        ocupados += edificio.departamentos?.filter(d => d.estado === 'Rentado').length || 0;
                    });
                }

                const abiertos = Array.isArray(tickets) ? tickets.filter(t => t.estado !== 'Resuelto').length : 0;

                setStats({
                    totalDepas: total,
                    rentados: ocupados,
                    ticketsAbiertos: abiertos
                });
            } catch (error) {
                console.error("Error al obtener datos:", error);
            }
        };

        fetchDashboardData();
    }, [empresaActiva?.id]);

    return (
        <div className="space-y-6">
            <EmpresaSelector />

            {/* Cards de Métricas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {canEditFinances && <StatCard title="Ingreso Mensual" value="$124,500.00" icon={ReceiptText} trend="up" trendValue="12.5%" />}
                <StatCard title="Depas Ocupados" value={`${stats.rentados} / ${stats.totalDepas}`} icon={Building2} trend="up" trendValue="5%" />
                <StatCard title="Tickets Abiertos" value={stats.ticketsAbiertos} icon={Activity} trend="down" trendValue="2" />
                {canEditFinances && <StatCard title="Cobros Vencidos" value="$12,000.00" icon={Users} trend="up" trendValue="2%" />}
            </div>

            {/* Sección principal (Gráficas + Listas) */}
            {canEditFinances && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">

                    {/* Gráfica de Ingresos */}
                    <div className="lg:col-span-2 glass-panel p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Flujo Financiero Semestral</h3>
                            <select className="bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 text-gray-600 dark:text-gray-300">
                                <option>Últimos 6 meses</option>
                                <option>Este año</option>
                            </select>
                        </div>

                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dataIngresos} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIngreso" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="ingresos" stroke="#22c55e" fillOpacity={1} fill="url(#colorIngreso)" />
                                    <Area type="monotone" dataKey="gastos" stroke="#ef4444" fillOpacity={1} fill="url(#colorGasto)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Lista de Pagos Recientes */}
                    <div className="glass-panel p-6 overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Pagos Pendientes</h3>
                            <button className="text-primary-500 text-sm hover:underline font-medium">Ver todos</button>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                            {[1, 2, 3, 4, 5].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-surface cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center font-bold">
                                            D{i + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">Depa {100 + i}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Juan Pérez Vaso</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">$8,500</p>
                                        <p className="text-xs text-red-500 flex items-center"><Activity className="w-3 h-3 mr-1" /> -5 Días</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
