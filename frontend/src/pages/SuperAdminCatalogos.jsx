import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Edit, Trash2, CreditCard } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function SuperAdminCatalogos() {
    const toast = useToast();
    const [planes, setPlanes] = useState([]);
    const [tiposPago, setTiposPago] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('planes'); // 'planes' | 'pagos'

    // Form Modals
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isTipoModalOpen, setIsTipoModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial States
    const initialPlan = { nombre: '', limite_edificios: '', precio_mensual: '' };
    const initialTipo = { nombre: '' };

    const [planForm, setPlanForm] = useState(initialPlan);
    const [tipoForm, setTipoForm] = useState(initialTipo);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pRes, tRes] = await Promise.all([
                api.get('/superadmin/planes'),
                api.get('/superadmin/tipos-pago')
            ]);
            setPlanes(pRes.data);
            setTiposPago(tRes.data);
        } catch (error) {
            toast.error("Error al cargar catálogos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- MANEJADORES DE PLANES ---
    const handleSavePlan = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                nombre: planForm.nombre,
                limite_edificios: planForm.limite_edificios === '' ? null : parseInt(planForm.limite_edificios),
                precio_mensual: parseFloat(planForm.precio_mensual)
            };

            if (editingItem) {
                await api.put(`/superadmin/planes/${editingItem.id}`, payload);
                toast.success("Plan actualizado");
            } else {
                await api.post('/superadmin/planes', payload);
                toast.success("Plan creado");
            }
            setIsPlanModalOpen(false);
            setEditingItem(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error al guardar el plan");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- MANEJADORES DE TIPOS DE PAGO ---
    const handleSaveTipoPago = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingItem) {
                await api.put(`/superadmin/tipos-pago/${editingItem.id}`, { nombre: tipoForm.nombre });
                toast.success("Tipo de pago actualizado");
            } else {
                await api.post('/superadmin/tipos-pago', { nombre: tipoForm.nombre });
                toast.success("Tipo de pago creado");
            }
            setIsTipoModalOpen(false);
            setEditingItem(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Error al guardar el tipo de pago");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando catálogos...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                        <FileText className="w-6 h-6 mr-3 text-primary-500" />
                        Catálogos Globales
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Configura planes de suscripción y métodos de pago.</p>
                </div>
            </div>

            {/* TAB NAV */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => setActiveTab('planes')}
                    className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'planes'
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    Planes Suscripción
                </button>
                <button
                    onClick={() => setActiveTab('pagos')}
                    className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'pagos'
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    Métodos de Pago
                </button>
            </div>

            {/* CONTENT */}
            {activeTab === 'planes' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setEditingItem(null);
                                setPlanForm(initialPlan);
                                setIsPlanModalOpen(true);
                            }}
                            className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center hover:bg-primary-500 shadow-md shadow-primary-500/20"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Plan
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {planes.map(p => (
                            <div key={p.id} className="glass-panel p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{p.nombre}</h3>
                                        <button onClick={() => {
                                            setEditingItem(p);
                                            setPlanForm({ nombre: p.nombre, limite_edificios: p.limite_edificios || '', precio_mensual: p.precio_mensual });
                                            setIsPlanModalOpen(true);
                                        }} className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-3xl font-extrabold text-primary-600 dark:text-primary-400 mb-4 flex items-baseline">
                                        ${p.precio_mensual} <span className="text-sm font-medium text-gray-500 ml-1">/mes</span>
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        Límite Edificios: <span className="font-bold">{p.limite_edificios || 'Ilimitado'}</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {activeTab === 'pagos' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setEditingItem(null);
                                setTipoForm(initialTipo);
                                setIsTipoModalOpen(true);
                            }}
                            className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center hover:bg-primary-500 shadow-md shadow-primary-500/20"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Tipo
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {tiposPago.map(t => (
                            <div key={t.id} className="glass-panel p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{t.nombre}</span>
                                </div>
                                <button onClick={() => {
                                    setEditingItem(t);
                                    setTipoForm({ nombre: t.nombre });
                                    setIsTipoModalOpen(true);
                                }} className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors">
                                    <Edit className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* MODAL PLAN */}
            <Modal
                isOpen={isPlanModalOpen}
                onClose={() => setIsPlanModalOpen(false)}
                title={editingItem ? "Editar Plan" : "Nuevo Plan"}
                footer={
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsPlanModalOpen(false)} className="px-4 py-2 border rounded-xl">Cancelar</button>
                        <button type="submit" form="plan-form" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-xl shadow-md">{isSubmitting ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                }
            >
                <form id="plan-form" onSubmit={handleSavePlan} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nombre del Plan</label>
                        <input required type="text" value={planForm.nombre} onChange={e => setPlanForm({ ...planForm, nombre: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ej. Premium" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Precio Mensual ($)</label>
                        <input required type="number" step="0.01" value={planForm.precio_mensual} onChange={e => setPlanForm({ ...planForm, precio_mensual: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-primary-600 dark:text-primary-400 outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Límite de Edificios</label>
                        <input type="number" value={planForm.limite_edificios} onChange={e => setPlanForm({ ...planForm, limite_edificios: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500" placeholder="Dejar vacío para ilimitado" />
                        <p className="text-xs text-gray-500 mt-1">Si se deja vacío, la empresa podrá agregar edificios sin límite.</p>
                    </div>
                </form>
            </Modal>

            {/* MODAL TIPO PAGO */}
            <Modal
                isOpen={isTipoModalOpen}
                onClose={() => setIsTipoModalOpen(false)}
                title={editingItem ? "Editar Tipo de Pago" : "Nuevo Tipo de Pago"}
                footer={
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsTipoModalOpen(false)} className="px-4 py-2 border rounded-xl">Cancelar</button>
                        <button type="submit" form="tipo-form" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-xl shadow-md">{isSubmitting ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                }
            >
                <form id="tipo-form" onSubmit={handleSaveTipoPago} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nombre del Método</label>
                        <input required type="text" value={tipoForm.nombre} onChange={e => setTipoForm({ ...tipoForm, nombre: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ej. Transferencia SPEI" />
                    </div>
                </form>
            </Modal>
        </div>
    );
}
