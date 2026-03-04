import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Wrench, CheckCircle2, MoreVertical, Search, DollarSign, X, AlertCircle } from 'lucide-react';
import { usePermissions } from '../context/usePermissions';
import api from '../api';

const statusConfig = {
    'Pendiente': { icon: Clock, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    'En Reparación': { icon: Wrench, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    'Resuelto': { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' }
};

export default function Mantenimiento() {
    const { canEditFinances } = usePermissions();

    const [tickets, setTickets] = useState([]);
    const [departamentos, setDepartamentos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Modales
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Formularios
    const [newTicket, setNewTicket] = useState({ departamento_id: '', descripcion: '', costo_reparacion: 0 });
    const [editingTicket, setEditingTicket] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            const [ticketsRes, edifRes] = await Promise.all([
                api.get('/tickets'),
                api.get('/edificios')
            ]);

            // Normalizar el estado por si hay datos viejos en BD sin tilde
            const normalizedTickets = ticketsRes.data.map(t => ({
                ...t,
                estado: t.estado === 'En Reparacion' ? 'En Reparación' : t.estado
            }));

            setTickets(normalizedTickets);

            // Extraer y aplanar todos los departamentos de los edificios
            const allDeptos = [];
            if (edifRes.data && edifRes.data.length > 0) {
                edifRes.data.forEach(edif => {
                    if (edif.departamentos) {
                        edif.departamentos.forEach(dep => {
                            allDeptos.push({
                                id: dep.id,
                                numero: dep.numero,
                                edificio_nombre: edif.nombre
                            });
                        });
                    }
                });
            }
            setDepartamentos(allDeptos);
        } catch (err) {
            console.error("Error obteniendo datos:", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/tickets', {
                departamento_id: parseInt(newTicket.departamento_id),
                descripcion: newTicket.descripcion,
                estado: "Pendiente",
                costo_reparacion: parseFloat(newTicket.costo_reparacion) || 0
            });
            await fetchData();
            setIsCreateModalOpen(false);
            setNewTicket({ departamento_id: '', descripcion: '', costo_reparacion: 0 });
        } catch (error) {
            alert("Error al crear el ticket");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateTicket = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put(`/tickets/${editingTicket.id}`, {
                descripcion: editingTicket.descripcion,
                estado: editingTicket.estado,
                costo_reparacion: parseFloat(editingTicket.costo_reparacion) || 0
            });
            await fetchData();
            setIsEditModalOpen(false);
            setEditingTicket(null);
        } catch (error) {
            alert("Error al actualizar el ticket");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Drag and Drop Logic
    const onDragStart = (e, ticketId) => {
        e.dataTransfer.setData('ticketId', ticketId);
    };

    const onDragOver = (e) => {
        e.preventDefault(); // Necesario para permitir el Drop
    };

    const onDrop = async (e, newStatus) => {
        e.preventDefault();
        const ticketId = e.dataTransfer.getData('ticketId');
        if (!ticketId) return;

        const ticket = tickets.find(t => t.id.toString() === ticketId);
        if (ticket && ticket.estado !== newStatus) {

            // Si lo pasamos a Resuelto, podríamos querer abrir el modal para fijar costo
            if (newStatus === 'Resuelto' && parseFloat(ticket.costo_reparacion) === 0) {
                setEditingTicket({ ...ticket, estado: newStatus });
                setIsEditModalOpen(true);
            } else {
                // Actualización Optimista en UI
                setTickets(prev => prev.map(t => t.id.toString() === ticketId ? { ...t, estado: newStatus } : t));

                // Actualizar DB en background
                try {
                    await api.put(`/tickets/${ticketId}`, {
                        descripcion: ticket.descripcion,
                        estado: newStatus,
                        costo_reparacion: parseFloat(ticket.costo_reparacion) || 0
                    });
                } catch (error) {
                    console.error("Error moviendo ticket");
                    fetchData(); // revertir si falla
                }
            }
        }
    };

    const filteredTickets = tickets.filter(t =>
        t.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.departamento_numero.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = ['Pendiente', 'En Reparación', 'Resuelto'];

    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
            {/* Header del Módulo */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Centro de Mantenimiento</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Arrastra las tarjetas para cambiar su estado.</p>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar ticket..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white shadow-sm"
                        />
                    </div>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary flex items-center whitespace-nowrap bg-primary-600 hover:bg-primary-500 shadow-primary-500/30">
                        <Plus className="w-4 h-4 mr-1 ml-[-0.25rem]" />
                        Nuevo Ticket
                    </button>
                </div>
            </div>

            {/* KANBAN BOARD */}
            <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar items-start">
                {columns.map(status => {
                    const statusTickets = filteredTickets.filter(t => t.estado === status);
                    const config = statusConfig[status];
                    const Icon = config.icon;

                    return (
                        <div
                            key={status}
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, status)}
                            className="min-w-[320px] max-w-[350px] w-full flex-shrink-0 flex flex-col max-h-full glass-panel border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-dark-surface/40 overflow-hidden"
                        >
                            {/* Header de Columna */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white/50 dark:bg-dark-bg/50">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${config.bg} ${config.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-gray-800 dark:text-white">{status}</h3>
                                </div>
                                <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold px-2 py-1 rounded-full">
                                    {statusTickets.length}
                                </span>
                            </div>

                            {/* Contenido de Columna (Scrollable) */}
                            <div className="p-3 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-[150px]">
                                <AnimatePresence>
                                    {statusTickets.map(ticket => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            key={ticket.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, ticket.id.toString())}
                                            onClick={() => { setEditingTicket(ticket); setIsEditModalOpen(true); }}
                                            className="bg-white dark:bg-dark-bg p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 cursor-grab active:cursor-grabbing hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                                    TK-{ticket.id.toString().padStart(4, '0')}
                                                </span>
                                                <div className="flex items-center text-xs text-gray-500 font-medium">
                                                    <AlertCircle className="w-3 h-3 mr-1" /> Depa {ticket.departamento_numero}
                                                </div>
                                            </div>

                                            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                {ticket.descripcion}
                                            </p>

                                            <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-3">
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(ticket.fecha_reporte).toLocaleDateString()}
                                                </span>
                                                {parseFloat(ticket.costo_reparacion) > 0 && canEditFinances && (
                                                    <span className="flex items-center text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">
                                                        <DollarSign className="w-3 h-3 mr-0.5" />
                                                        {parseFloat(ticket.costo_reparacion).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {statusTickets.length === 0 && (
                                        <div className="h-24 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center text-gray-400 text-sm font-medium">
                                            Arrastra tickets aquí
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL CREAR TICKET */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-dark-surface relative z-10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <h3 className="font-bold text-lg dark:text-white">Reportar Nueva Falla</h3>
                                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleCreateTicket} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidad Afectada</label>
                                    <select required value={newTicket.departamento_id} onChange={e => setNewTicket({ ...newTicket, departamento_id: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
                                        <option value="">Selecciona un departamento...</option>
                                        {departamentos.map(d => (
                                            <option key={d.id} value={d.id}>Depa {d.numero} - {d.edificio_nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción del Problema</label>
                                    <textarea required rows={4} placeholder="Ej. Fuga de agua en lavabo del baño principal..." value={newTicket.descripcion} onChange={e => setNewTicket({ ...newTicket, descripcion: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                                </div>
                                {canEditFinances && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Costo Estimado de Reparación ($)</label>
                                        <input type="number" step="0.01" value={newTicket.costo_reparacion} onChange={e => setNewTicket({ ...newTicket, costo_reparacion: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-red-500 dark:text-red-400 outline-none focus:ring-2 focus:ring-red-500" />
                                        <p className="text-xs text-gray-500 mt-1">* Si aún no sabes el costo, déjalo en 0. Puedes actualizarlo después.</p>
                                    </div>
                                )}
                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition">Cancelar</button>
                                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-primary-500/30 transition">{isSubmitting ? 'Guardando...' : 'Crear Ticket'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL EDITAR TICKET (Costos y Estado) */}
            <AnimatePresence>
                {isEditModalOpen && editingTicket && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-dark-surface relative z-10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-dark-bg/50">
                                <div>
                                    <h3 className="font-bold text-lg dark:text-white">Detalle del Ticket</h3>
                                    <p className="text-xs text-gray-500">TK-{editingTicket.id.toString().padStart(4, '0')} • Depa {editingTicket.departamento_numero}</p>
                                </div>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleUpdateTicket} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                                    <textarea required rows={3} value={editingTicket.descripcion} onChange={e => setEditingTicket({ ...editingTicket, descripcion: e.target.value })} className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                                        <select value={editingTicket.estado} onChange={e => setEditingTicket({ ...editingTicket, estado: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
                                            <option value="Pendiente">Pendiente</option>
                                            <option value="En Reparación">En Reparación</option>
                                            <option value="Resuelto">Resuelto</option>
                                        </select>
                                    </div>
                                    {canEditFinances && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Costo de Reparación ($)</label>
                                            <input type="number" step="0.01" value={editingTicket.costo_reparacion} onChange={e => setEditingTicket({ ...editingTicket, costo_reparacion: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-red-500 dark:text-red-400 outline-none focus:ring-2 focus:ring-red-500" />
                                        </div>
                                    )}
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition">Cancelar</button>
                                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-primary-500/30 transition">{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
