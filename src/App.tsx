import React, { useState, useEffect, Component } from 'react';
import type { ErrorInfo } from 'react';
import { Header } from './components/Header';
import { ShiftForm } from './components/ShiftForm';
import { SteelChangeForm } from './components/SteelChangeForm';
import { AnalystForm } from './components/AnalystForm';
import { MeasurementForm } from './components/MeasurementForm';
import { DEFAULT_API_URL } from './constants';
import { LogbookForm } from './components/LogbookForm';
import {
    getLocalShiftReports,
    getLocalSteelChanges,
    getLocalMeasurements,
    markShiftReportAsSynced,
    markSteelChangeAsSynced,
    markMeasurementAsSynced,
    getSavedScriptUrl,
    saveScriptUrl,
    resetAllData
} from './services/storageService';
import { uploadDataToSheet } from './services/googleScriptService';
import { CloudUpload, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

// --- ERROR BOUNDARY COMPONENT ---
// Clases de React son necesarias para capturar errores de renderizado (Pantalla Blanca)
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: string }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: '' };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error: error.toString() };
    }

    componentDidCatch(error: any, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-black text-slate-800 mb-2">Algo salió mal</h1>
                        <p className="text-slate-500 mb-6 text-sm">
                            La aplicación ha encontrado un error crítico. Esto suele pasar por datos antiguos incompatibles.
                        </p>
                        <div className="bg-slate-100 p-3 rounded mb-6 text-xs text-left font-mono text-slate-600 overflow-auto max-h-32 border border-slate-200">
                            {this.state.error}
                        </div>
                        <button
                            onClick={() => resetAllData()}
                            className="w-full bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-red-700 transition-all flex items-center justify-center"
                        >
                            <Trash2 className="mr-2" size={20} /> RESTAURAR DE FÁBRICA
                        </button>
                        <p className="mt-4 text-[10px] text-red-400 font-bold uppercase tracking-wider">
                            Al hacer clic se borrarán los datos locales y se reiniciará la app.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}



interface SettingsViewProps {
    onSave: (url: string) => void;
    onBack: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onSave, onBack }) => {
    const [localUrl, setLocalUrl] = useState(() => getSavedScriptUrl() || DEFAULT_API_URL);

    return (
        <div className="bg-white p-8 rounded-xl shadow-md max-w-lg mx-auto mt-10 border border-slate-200">
            <h2 className="text-xl font-black text-slate-800 mb-6 border-b pb-2 uppercase tracking-tight">Configuración de Conexión</h2>
            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                        URL del Web App (Google Apps Script)
                    </label>
                    <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                        Pegue aquí la URL generada al implementar el script en Google Sheets (debe terminar en <code>/exec</code>).
                    </p>
                    <input
                        className="w-full border-slate-300 bg-slate-50 border p-3 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary outline-none font-mono text-slate-600"
                        value={localUrl}
                        onChange={(e) => setLocalUrl(e.target.value)}
                        placeholder="https://script.google.com/macros/s/..."
                    />
                </div>

                <button
                    onClick={() => onSave(localUrl)}
                    className="w-full bg-brand-primary text-white font-bold px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors uppercase text-sm shadow-md"
                >
                    Guardar Configuración
                </button>

                <button
                    onClick={onBack}
                    className="w-full mt-4 bg-white text-slate-500 font-bold px-4 py-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors uppercase text-sm shadow-sm"
                >
                    Volver
                </button>

                <div className="pt-8 mt-8 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-red-400 uppercase mb-2">Zona de Peligro</h3>
                    <button
                        onClick={() => {
                            if (confirm("¿Estás seguro? Esto borrará todos los datos guardados en el dispositivo.")) {
                                resetAllData();
                            }
                        }}
                        className="w-full border border-red-200 text-red-500 hover:bg-red-50 font-bold px-4 py-3 rounded-lg transition-colors text-xs flex items-center justify-center"
                    >
                        <Trash2 size={14} className="mr-2" /> BORRAR DATOS Y REINICIAR
                    </button>
                </div>
            </div>
        </div>
    );
};

function AppContent() {
    const [view, setView] = useState<'shift' | 'steel' | 'settings' | 'analyst' | 'measurement' | 'events'>('shift');
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);



    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (typeof navigator !== 'undefined') {
            setIsOnline(navigator.onLine);
            const handleStatusChange = () => setIsOnline(navigator.onLine);
            window.addEventListener('online', handleStatusChange);
            window.addEventListener('offline', handleStatusChange);
            return () => {
                window.removeEventListener('online', handleStatusChange);
                window.removeEventListener('offline', handleStatusChange);
            };
        }
    }, []);

    const checkPending = () => {
        try {
            const reports = getLocalShiftReports();
            const steels = getLocalSteelChanges();
            const measurements = getLocalMeasurements();

            const pendingReports = Array.isArray(reports) ? reports.filter(r => r.status === 'pending') : [];
            const pendingSteels = Array.isArray(steels) ? steels.filter(s => s.status === 'pending') : [];
            const pendingMeasurements = Array.isArray(measurements) ? measurements.filter(m => m.status === 'pending') : [];

            setPendingCount(pendingReports.length + pendingSteels.length + pendingMeasurements.length);
        } catch (e) {
            console.warn("Error verificando pendientes:", e);
            setPendingCount(0);
        }
    };

    useEffect(() => {
        checkPending();
        const interval = setInterval(checkPending, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSync = async () => {
        if (!isOnline) {
            alert("No hay conexión a internet.");
            return;
        }

        const currentScriptUrl = getSavedScriptUrl() || DEFAULT_API_URL;

        if (!currentScriptUrl || currentScriptUrl.includes("INSERT")) {
            alert("Por favor configura la URL del Google Apps Script en Ajustes (icono de engranaje).");
            setView('settings');
            return;
        }

        setIsSyncing(true);

        try {
            const reports = getLocalShiftReports().filter(r => r.status === 'pending');
            const steels = getLocalSteelChanges().filter(s => s.status === 'pending');
            const measurements = getLocalMeasurements().filter(m => m.status === 'pending');

            let successCount = 0;
            let errors = 0;
            let lastErrorMessage = '';

            for (const report of reports) {
                const res = await uploadDataToSheet(report, null, null, null, currentScriptUrl);
                if (res.success) {
                    markShiftReportAsSynced(report.id);
                    successCount++;
                } else {
                    errors++;
                    lastErrorMessage = res.message;
                }
            }

            for (const steel of steels) {
                const res = await uploadDataToSheet(null, steel, null, null, currentScriptUrl);
                if (res.success) {
                    markSteelChangeAsSynced(steel.id);
                    successCount++;
                } else {
                    errors++;
                    lastErrorMessage = res.message;
                }
            }

            for (const measurement of measurements) {
                const res = await uploadDataToSheet(null, null, measurement, null, currentScriptUrl);
                if (res.success) {
                    markMeasurementAsSynced(measurement.id);
                    successCount++;
                } else {
                    errors++;
                    lastErrorMessage = res.message;
                }
            }

            checkPending();

            if (errors === 0 && successCount > 0) {
                alert(`✅ Sincronización Completa: ${successCount} registros subidos.`);
            } else if (errors > 0) {
                alert(`⚠️ Finalizado con advertencias.\nSubidos: ${successCount}\nFallidos: ${errors}\n\nÚltimo error: ${lastErrorMessage}\n\nVerifique su conexión e intente nuevamente.`);
            } else if (successCount === 0 && errors === 0) {
                alert("No habían datos pendientes reales para subir.");
            }
        } catch (e) {
            alert("Error crítico durante la sincronización.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSaveSettings = (url: string) => {
        saveScriptUrl(url);
        setView('shift');
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans pb-10">
            {view !== 'analyst' && view !== 'measurement' && view !== 'events' && <Header isOnline={isOnline} />}

            <main className={view === 'analyst' || view === 'measurement' || view === 'events' ? '' : 'max-w-4xl mx-auto p-4 md:p-6'}>

                {view !== 'analyst' && view !== 'measurement' && view !== 'events' && pendingCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center text-amber-900 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center mb-3 sm:mb-0">
                            <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
                            <span className="font-bold text-sm">
                                Tienes {pendingCount} registro(s) sin subir a la nube.
                            </span>
                        </div>
                        <button
                            onClick={handleSync}
                            disabled={!isOnline || isSyncing}
                            className="w-full sm:w-auto flex items-center justify-center bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                        >
                            {isSyncing ? <RefreshCw className="mr-2 animate-spin" size={18} /> : <CloudUpload size={18} className="mr-2" />}
                            {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
                        </button>
                    </div>
                )}



                {view === 'shift' && (
                    <ShiftForm
                        onNavigateToSteel={() => setView('steel')}
                        onNavigateToAnalyst={() => setView('analyst')}
                        onNavigateToMeasurement={() => setView('measurement')}
                        onNavigateToEvents={() => setView('events')}
                    />
                )}

                {view === 'steel' && (
                    <SteelChangeForm
                        onBack={() => setView('shift')}
                    />
                )}

                {view === 'analyst' && (
                    <AnalystForm
                        onBack={() => setView('shift')}
                        onNavigateToSettings={() => setView('settings')}
                    />
                )}

                {view === 'measurement' && (
                    <MeasurementForm
                        onBack={() => setView('shift')}
                    />
                )}

                {view === 'events' && (
                    <LogbookForm
                        onBack={() => setView('shift')}
                    />
                )}



                {view === 'settings' && (
                    <SettingsView
                        onSave={(url) => handleSaveSettings(url)}
                        onBack={() => setView('shift')}
                    />
                )}

            </main>
        </div>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>
    );
}

export default App;