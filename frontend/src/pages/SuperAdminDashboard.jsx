import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, CreditCard, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import api from '../api';
import { formatMoney } from '../utils/formatMoney';
import { useToast } from '../components/Toast';

export default function SuperAdminDashboard() {
    const toast = useToast();
    const [metrics, setMetrics] = useState({
        total_empresas: 0,
        empresas_activas: 0,
        mrr: 0,
        alertas_vencimiento: []
    });
    const [loading, setLoading] = useState(true);

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            const res = await api.get('/superadmin/dashboard-metrics');
            setMetrics(res.data);
        } catch (error) {
            console.error("Error fetching metrics", error);
            toast.error("Error al cargar las métricas del dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    const cards = [
        {
            title: 'MRR (Mensual)',
            value: formatMoney(metrics.mrr),
            icon: TrendingUp,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            title: 'Empresas Totales',
            value: metrics.total_empresas,
            icon: Building2,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            title: 'Empresas Activas',
            value: metrics.empresas_activas,
            icon: Activity,
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        }
    ];

    if (loading) {
        return <div className="flex items-center justify-center h-full text-gray-500">Cargando métricas...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard General (SaaS)</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Resumen financiero y operativo de todas las empresas cliente.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, idx) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-panel p-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${card.bg}`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{card.value}</h3>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Próximos Vencimientos */}
            <div className="glass-panel p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                        Próximos Vencimientos (30 días)
                    </h2>
                </div>
                {metrics.alertas_vencimiento && metrics.alertas_vencimiento.length > 0 ? (
                    <div className="space-y-3">
                        {metrics.alertas_vencimiento.map((alerta, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-dark-bg p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-white">{alerta.empresa_nombre}</p>
                                    <p className="text-sm text-gray-500">
                                        Vence: {new Date(alerta.fecha_vencimiento).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs font-bold rounded-full">
                                    Por Vencer
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-bg rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                        No hay empresas próximas a vencer en los siguientes 30 días.
                    </div>
                )}
            </div>
        </div>
    );
}
