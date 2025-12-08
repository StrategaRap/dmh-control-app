import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Calendar, AlertCircle } from 'lucide-react';
import { getSavedScriptUrl } from '../services/storageService';
import { DEFAULT_API_URL } from '../constants';

interface SteelStatisticsFormProps {
    onBack: () => void;
}

const DRILLS = ['101', '102', '103', '104', '105', '106', '111', '112'];

const COMPONENTS = [
    'Tricono',
    'Anillo Guia',
    'Adaptador Inferior',
    'Barra Patera',
    'Barra Seguidora',
    'Adaptador Superior',
    'Amortiguador'
];

interface SteelChange {
    drillId: string;
    date: string;
    component: string;
    serie: string;
}

// Vista de detalle de una perforadora
const DrillDetailView: React.FC<{
    drillId: string;
    changes: SteelChange[];
    onBack: () => void;
}> = ({ drillId, changes, onBack }) => {
    // Filtrar cambios para esta perforadora
    const drillChanges = changes.filter(c => c.drillId === drillId);

    // Obtener la última fecha de cambio y serie por componente
    const getLastChange = (component: string): { date: string; serie: string } => {
        const componentChanges = drillChanges
            .filter(c => c.component === component);

        if (componentChanges.length === 0) {
            return { date: 'Sin Registro', serie: '' };
        }

        // Tomar el último (la data viene del sheet, última fila = más reciente)
        const lastChange = componentChanges[componentChanges.length - 1];

        try {
            const date = new Date(lastChange.date);
            const formattedDate = isNaN(date.getTime())
                ? lastChange.date
                : date.toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            return { date: formattedDate, serie: lastChange.serie || '' };
        } catch {
            return { date: lastChange.date, serie: lastChange.serie || '' };
        }
    };

    const getComponentColor = (index: number): string => {
        const colors = [
            'bg-amber-100 text-amber-700 border-amber-200',   // Tricono
            'bg-blue-100 text-blue-700 border-blue-200',      // Anillo Guia
            'bg-purple-100 text-purple-700 border-purple-200', // Adaptador Inferior
            'bg-green-100 text-green-700 border-green-200',   // Barra Patera
            'bg-cyan-100 text-cyan-700 border-cyan-200',      // Barra Seguidora
            'bg-rose-100 text-rose-700 border-rose-200',      // Adaptador Superior
            'bg-orange-100 text-orange-700 border-orange-200' // Amortiguador
        ];
        return colors[index] || 'bg-slate-100 text-slate-700 border-slate-200';
    };

    return (
        <div className="min-h-screen bg-slate-100 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-primary text-white font-black text-2xl w-16 h-16 rounded-xl flex items-center justify-center shadow-lg">
                            {drillId}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">Perforadora {drillId}</h1>
                            <p className="text-xs text-slate-400">Últimos cambios de componentes</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto p-4 md:p-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Último Cambio por Componente</h3>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {COMPONENTS.map((component, index) => {
                            const lastChange = getLastChange(component);
                            const hasRecord = lastChange.date !== 'Sin Registro';

                            return (
                                <div
                                    key={component}
                                    className="px-5 py-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${getComponentColor(index).split(' ')[0]}`}></div>
                                        <span className="font-bold text-slate-700">{component}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${hasRecord
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-slate-100 text-slate-400'
                                            }`}>
                                            {hasRecord ? (
                                                <>
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{lastChange.date}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span>{lastChange.date}</span>
                                                </>
                                            )}
                                        </div>
                                        {hasRecord && lastChange.serie && (
                                            <span className="text-xs text-slate-500 mt-1">Serie: {lastChange.serie}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-50">
                <div className="max-w-4xl mx-auto flex justify-start">
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center text-slate-500 font-bold px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        <span className="text-sm uppercase tracking-wide">Volver</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Vista principal con grid de perforadoras
export const SteelStatisticsForm: React.FC<SteelStatisticsFormProps> = ({ onBack }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [changes, setChanges] = useState<SteelChange[]>([]);
    const [selectedDrill, setSelectedDrill] = useState<string | null>(null);

    const fetchSteelChanges = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const scriptUrl = getSavedScriptUrl() || DEFAULT_API_URL;

            if (!scriptUrl || scriptUrl.includes("INSERT_YOUR")) {
                setError("URL del Script no configurada");
                setIsLoading(false);
                return;
            }

            const response = await fetch(scriptUrl, {
                method: 'POST',
                body: JSON.stringify({ type: 'steel_changes_fetch', data: {} }),
                redirect: "follow",
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const text = await response.text();

            if (text.trim().startsWith("<") || text.includes("<!DOCTYPE html>")) {
                setError("Error de permisos en el Script");
                setIsLoading(false);
                return;
            }

            const result = JSON.parse(text);

            if (result.success && result.data) {
                setChanges(result.data);
            } else {
                setChanges([]);
            }
        } catch (e) {
            console.error("Error fetching steel changes:", e);
            setError("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSteelChanges();
    }, []);

    // Si hay una perforadora seleccionada, mostrar el detalle
    if (selectedDrill) {
        return (
            <DrillDetailView
                drillId={selectedDrill}
                changes={changes}
                onBack={() => setSelectedDrill(null)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 pb-24">
            {isLoading && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary mb-4"></div>
                        <p className="font-bold text-slate-700">Cargando datos...</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Estadística de Aceros</h1>
                        <p className="text-xs text-slate-400 mt-1">Selecciona una perforadora para ver detalles</p>
                    </div>
                    <button
                        onClick={fetchSteelChanges}
                        disabled={isLoading}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                        title="Actualizar"
                    >
                        <RefreshCw className={`w-5 h-5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <main className="max-w-4xl mx-auto p-4 md:p-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* Grid de Perforadoras */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Perforadoras</h3>
                    </div>

                    <div className="p-6 grid grid-cols-2 gap-4">
                        {DRILLS.map(drill => (
                            <button
                                key={drill}
                                onClick={() => setSelectedDrill(drill)}
                                className="bg-brand-primary hover:bg-blue-800 text-white font-black text-3xl py-8 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center"
                            >
                                <span className="text-4xl mb-2">{drill}</span>
                                <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                                    Ver Estadística
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-50">
                <div className="max-w-4xl mx-auto flex justify-start">
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center text-slate-500 font-bold px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        <span className="text-sm uppercase tracking-wide">Volver</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
