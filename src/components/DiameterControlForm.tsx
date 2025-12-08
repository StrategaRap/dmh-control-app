import React, { useState, useEffect } from 'react';
import { ArrowLeft, Activity, RefreshCw, Calendar, Clock } from 'lucide-react';
import { getSavedScriptUrl } from '../services/storageService';
import { DEFAULT_API_URL } from '../constants';
import type { MeasurementData } from '../types';

interface DiameterControlFormProps {
    onBack: () => void;
}

const DRILLS = ['101', '102', '103', '104', '105', '106', '111', '112'];

type DrillStatus = 'gray' | 'green' | 'yellow' | 'red';

const getStatusColor = (status: DrillStatus): string => {
    switch (status) {
        case 'green': return 'bg-green-500 hover:bg-green-600';
        case 'yellow': return 'bg-yellow-500 hover:bg-yellow-600';
        case 'red': return 'bg-red-500 hover:bg-red-600';
        default: return 'bg-slate-400 hover:bg-slate-500';
    }
};

const getStatusLabel = (status: DrillStatus): string => {
    switch (status) {
        case 'green': return 'OK';
        case 'yellow': return 'Precaución';
        case 'red': return 'Crítico';
        default: return 'Sin datos';
    }
};

const getStatusBgLight = (status: DrillStatus): string => {
    switch (status) {
        case 'green': return 'bg-green-100 text-green-700';
        case 'yellow': return 'bg-yellow-100 text-yellow-700';
        case 'red': return 'bg-red-100 text-red-700';
        default: return 'bg-slate-100 text-slate-500';
    }
};

// Función auxiliar para parsear decimales, maneja comas y puntos
const parseDecimal = (value: any): number => {
    if (typeof value === 'number') return value;
    if (!value || value === '' || value === null || value === undefined) return 0;

    // Convertir a string y reemplazar coma por punto
    const strValue = String(value).replace(',', '.').trim();
    const parsed = parseFloat(strValue);
    return isNaN(parsed) ? 0 : parsed;
};

const calculateDrillStatus = (drillId: string, measurements: MeasurementData[]): DrillStatus => {
    // Filtrar mediciones de esta perforadora (la última fila del sheet es la más reciente)
    const drillMeasurements = measurements.filter(m => m.drillId === drillId);

    if (drillMeasurements.length === 0) {
        return 'gray';
    }

    // Tomar la última entrada (última fila del sheet = más reciente)
    const lastMeasurement = drillMeasurements[drillMeasurements.length - 1];

    // Extraer todas las medidas numéricas con parsing mejorado
    const values = [
        parseDecimal(lastMeasurement.barraSeguidoraSuperior),
        parseDecimal(lastMeasurement.barraSeguidoraMedio),
        parseDecimal(lastMeasurement.barraSeguidoraInferior),
        parseDecimal(lastMeasurement.barraPatéraSuperior),
        parseDecimal(lastMeasurement.barraPatéraMedio),
        parseDecimal(lastMeasurement.barraPatéraInferior),
        parseDecimal(lastMeasurement.adaptadorInferiorMedio),
    ].filter(v => v > 0);

    if (values.length === 0) {
        return 'gray';
    }

    // Umbrales según el tipo de perforadora
    const is111or112 = drillId === '111' || drillId === '112';

    const greenThreshold = is111or112 ? 6.2 : 8.9;
    const redThreshold = is111or112 ? 5.9 : 8.6;

    // Verificar condiciones
    const allAboveGreen = values.every(v => v > greenThreshold);
    const anyBelowRed = values.some(v => v < redThreshold);

    if (anyBelowRed) {
        return 'red';
    } else if (allAboveGreen) {
        return 'green';
    } else {
        return 'yellow';
    }
};

// Componente para mostrar el detalle de una perforadora
const DrillDetailView: React.FC<{
    drillId: string;
    measurements: MeasurementData[];
    status: DrillStatus;
    onBack: () => void;
}> = ({ drillId, measurements, status, onBack }) => {
    // Filtrar mediciones de esta perforadora (última fila = más reciente)
    const drillMeasurements = measurements.filter(m => m.drillId === drillId);

    // Tomar la última entrada (última fila del sheet = más reciente)
    const lastMeasurement = drillMeasurements.length > 0
        ? drillMeasurements[drillMeasurements.length - 1]
        : null;
    const is111or112 = drillId === '111' || drillId === '112';
    const greenThreshold = is111or112 ? 6.2 : 8.9;
    const redThreshold = is111or112 ? 5.9 : 8.6;

    const getValueColor = (value: number): string => {
        if (value === 0) return 'text-slate-400';
        if (value < redThreshold) return 'text-red-600 font-bold';
        if (value > greenThreshold) return 'text-green-600';
        return 'text-yellow-600';
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-CL');
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 pb-20">
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <div className={`${getStatusColor(status)} text-white font-black text-2xl w-16 h-16 rounded-xl flex items-center justify-center shadow-lg`}>
                            {drillId}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">Perforadora {drillId}</h1>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusBgLight(status)}`}>
                                {getStatusLabel(status)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto p-4 md:p-6">
                {/* Umbrales para esta perforadora */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Umbrales para esta perforadora</h3>
                    <p className="text-sm text-slate-600">
                        Verde: &gt; {greenThreshold}" | Rojo: &lt; {redThreshold}"
                    </p>
                </div>

                {/* Última medición */}
                {lastMeasurement ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Última Medición</h3>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(lastMeasurement.date)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Turno {lastMeasurement.shift}
                                </span>
                            </div>
                        </div>

                        <div className="p-5 space-y-6">
                            {/* Barra Seguidora */}
                            <div>
                                <h4 className="text-xs font-bold text-blue-600 uppercase mb-3">Barra Seguidora</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <p className="text-[10px] text-slate-400 uppercase mb-1">Superior</p>
                                        <p className={`text-xl font-bold ${getValueColor(parseDecimal(lastMeasurement.barraSeguidoraSuperior))}`}>
                                            {parseDecimal(lastMeasurement.barraSeguidoraSuperior) || '-'}"
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <p className="text-[10px] text-slate-400 uppercase mb-1">Medio</p>
                                        <p className={`text-xl font-bold ${getValueColor(parseDecimal(lastMeasurement.barraSeguidoraMedio))}`}>
                                            {parseDecimal(lastMeasurement.barraSeguidoraMedio) || '-'}"
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <p className="text-[10px] text-slate-400 uppercase mb-1">Inferior</p>
                                        <p className={`text-xl font-bold ${getValueColor(parseDecimal(lastMeasurement.barraSeguidoraInferior))}`}>
                                            {parseDecimal(lastMeasurement.barraSeguidoraInferior) || '-'}"
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Barra Patera */}
                            <div>
                                <h4 className="text-xs font-bold text-green-600 uppercase mb-3">Barra Patera</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <p className="text-[10px] text-slate-400 uppercase mb-1">Superior</p>
                                        <p className={`text-xl font-bold ${getValueColor(parseDecimal(lastMeasurement.barraPatéraSuperior))}`}>
                                            {parseDecimal(lastMeasurement.barraPatéraSuperior) || '-'}"
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <p className="text-[10px] text-slate-400 uppercase mb-1">Medio</p>
                                        <p className={`text-xl font-bold ${getValueColor(parseDecimal(lastMeasurement.barraPatéraMedio))}`}>
                                            {parseDecimal(lastMeasurement.barraPatéraMedio) || '-'}"
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <p className="text-[10px] text-slate-400 uppercase mb-1">Inferior</p>
                                        <p className={`text-xl font-bold ${getValueColor(parseDecimal(lastMeasurement.barraPatéraInferior))}`}>
                                            {parseDecimal(lastMeasurement.barraPatéraInferior) || '-'}"
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Adaptador Inferior */}
                            <div>
                                <h4 className="text-xs font-bold text-purple-600 uppercase mb-3">Adaptador Inferior</h4>
                                <div className="max-w-xs">
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <p className="text-[10px] text-slate-400 uppercase mb-1">Medio</p>
                                        <p className={`text-xl font-bold ${getValueColor(parseDecimal(lastMeasurement.adaptadorInferiorMedio))}`}>
                                            {parseDecimal(lastMeasurement.adaptadorInferiorMedio) || '-'}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center mb-6">
                        <p className="text-slate-500">No hay mediciones registradas para esta perforadora</p>
                    </div>
                )}

                {/* Historial de mediciones */}
                {drillMeasurements.length > 1 && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
                            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">
                                Historial ({drillMeasurements.length} registros)
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                            {drillMeasurements.slice(1).map((m, idx) => (
                                <div key={idx} className="px-5 py-3 flex justify-between items-center text-sm">
                                    <span className="text-slate-600">{formatDate(m.date)} - Turno {m.shift}</span>
                                    <div className="flex gap-2 text-xs">
                                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">
                                            BS: {parseDecimal(m.barraSeguidoraMedio) || '-'}
                                        </span>
                                        <span className="bg-green-50 text-green-600 px-2 py-1 rounded">
                                            BP: {parseDecimal(m.barraPatéraMedio) || '-'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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

export const DiameterControlForm: React.FC<DiameterControlFormProps> = ({ onBack }) => {
    const [drillStatuses, setDrillStatuses] = useState<Record<string, DrillStatus>>({});
    const [measurements, setMeasurements] = useState<MeasurementData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDrill, setSelectedDrill] = useState<string | null>(null);

    const fetchMeasurementsFromCloud = async () => {
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
                body: JSON.stringify({ type: 'measurements_fetch', data: {} }),
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
                const fetchedMeasurements: MeasurementData[] = result.data;
                setMeasurements(fetchedMeasurements);

                const statuses: Record<string, DrillStatus> = {};
                DRILLS.forEach(drill => {
                    statuses[drill] = calculateDrillStatus(drill, fetchedMeasurements);
                });
                setDrillStatuses(statuses);
            } else {
                setMeasurements([]);
                const statuses: Record<string, DrillStatus> = {};
                DRILLS.forEach(drill => {
                    statuses[drill] = 'gray';
                });
                setDrillStatuses(statuses);
            }
        } catch (e) {
            console.error("Error fetching measurements:", e);
            setError("Error de conexión");
            const statuses: Record<string, DrillStatus> = {};
            DRILLS.forEach(drill => {
                statuses[drill] = 'gray';
            });
            setDrillStatuses(statuses);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMeasurementsFromCloud();
    }, []);

    // Si hay una perforadora seleccionada, mostrar el detalle
    if (selectedDrill) {
        return (
            <DrillDetailView
                drillId={selectedDrill}
                measurements={measurements}
                status={drillStatuses[selectedDrill] || 'gray'}
                onBack={() => setSelectedDrill(null)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 pb-20">
            {isLoading && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary mb-4"></div>
                        <p className="font-bold text-slate-700">Cargando datos...</p>
                    </div>
                </div>
            )}

            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Control de Diámetros</h1>
                        <p className="text-xs text-slate-400 mt-1">Toca una perforadora para ver detalles</p>
                    </div>
                    <button
                        onClick={fetchMeasurementsFromCloud}
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

                {/* Leyenda */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Leyenda</h3>
                    <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-500"></div>
                            <span>OK - Todas las medidas correctas</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-yellow-500"></div>
                            <span>Precaución - Revisar pronto</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-500"></div>
                            <span>Crítico - Requiere atención</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-slate-400"></div>
                            <span>Sin datos - No hay mediciones</span>
                        </div>
                    </div>
                </div>

                {/* Umbrales */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Umbrales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="font-bold text-slate-700 mb-1">Perforadoras 101-106</p>
                            <p className="text-slate-500">Verde: &gt; 8.9" | Rojo: &lt; 8.6"</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="font-bold text-slate-700 mb-1">Perforadoras 111-112</p>
                            <p className="text-slate-500">Verde: &gt; 6.2" | Rojo: &lt; 5.9"</p>
                        </div>
                    </div>
                </div>

                {/* Grid de Perforadoras */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center">
                        <div className="bg-brand-primary/10 p-1.5 rounded-lg mr-3">
                            <Activity className="w-5 h-5 text-brand-primary" />
                        </div>
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Estado por Perforadora</h3>
                    </div>

                    <div className="p-6 grid grid-cols-2 gap-4">
                        {DRILLS.map(drill => {
                            const status = drillStatuses[drill] || 'gray';
                            return (
                                <button
                                    key={drill}
                                    onClick={() => setSelectedDrill(drill)}
                                    className={`${getStatusColor(status)} text-white font-black text-3xl py-8 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center`}
                                >
                                    <span className="text-4xl mb-2">{drill}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                                        {getStatusLabel(status)}
                                    </span>
                                </button>
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
