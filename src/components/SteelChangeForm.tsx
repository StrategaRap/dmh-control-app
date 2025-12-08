import React, { useState } from 'react';
import type { SteelChangeData } from '../types';
import { ShiftType, SteelType } from '../types';
import { DRILL_OPTIONS, STEEL_OPTIONS, generateUUID, DEFAULT_API_URL } from '../constants';
import { saveSteelChangeLocally, getSavedScriptUrl, markSteelChangeAsSynced } from '../services/storageService';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';

interface SteelChangeFormProps {
    onBack: () => void;
}

export const SteelChangeForm: React.FC<SteelChangeFormProps> = ({ onBack }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<SteelChangeData>({
        id: generateUUID(),
        date: new Date().toISOString().split('T')[0],
        shift: ShiftType.A,
        drillId: DRILL_OPTIONS[0],
        steelType: SteelType.TRICONO,
        serialNumber: '',
        comments: '',
        status: 'pending'
    });

    const handleChange = (field: keyof SteelChangeData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.serialNumber) {
            alert("Ingrese número de serie");
            return;
        }

        setIsSaving(true);

        // 1. Guardar localmente primero (como backup/pending)
        saveSteelChangeLocally(formData);

        // 2. Intentar enviar si hay conexión
        if (navigator.onLine) {
            try {
                const scriptUrl = getSavedScriptUrl() || DEFAULT_API_URL;

                if (!scriptUrl || scriptUrl.includes("INSERT_YOUR")) {
                    throw new Error("URL de script no configurada");
                }

                const response = await fetch(scriptUrl, {
                    method: 'POST',
                    body: JSON.stringify({
                        type: 'steel_change',
                        data: formData
                    }),
                    redirect: "follow",
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8',
                    },
                });

                if (response.ok) {
                    const text = await response.text();
                    // Verificar si es respuesta válida JSON
                    try {
                        const result = JSON.parse(text);
                        if (result.success) {
                            // Marcar como sincronizado
                            markSteelChangeAsSynced(formData.id);
                            alert("✅ Cambio registrado y sincronizado con la nube.");
                            onBack();
                            return;
                        }
                    } catch (e) {
                        console.warn("Respuesta no JSON:", text);
                    }
                }
            } catch (e) {
                console.error("Error al sincronizar:", e);
                // Fallar silenciosamente y mostrar mensaje de guardado local
            }
        }

        // 3. Si falló la red o no hay conexión
        alert("⚠️ Guardado LOCALMENTE. Sin conexión o error de red.\n\nRecuerda sincronizar desde el Inventario cuando tengas internet.");
        setIsSaving(false);
        onBack();
    };

    return (
        <div className="min-h-screen bg-slate-100 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Cambio de Aceros</h1>
                    <p className="text-xs text-slate-400 mt-1">Registre reemplazos y movimientos de componentes</p>
                </div>
            </div>

            <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
                {/* Fecha */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Fecha del Cambio</h3>
                    </div>
                    <div className="p-5">
                        <input
                            type="date"
                            className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={formData.date}
                            onChange={e => handleChange('date', e.target.value)}
                        />
                    </div>
                </div>

                {/* Perforadora y Turno */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Perforadora y Turno</h3>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Perforadora</label>
                            <select
                                className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={formData.drillId}
                                onChange={e => handleChange('drillId', e.target.value)}
                            >
                                {DRILL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Turno</label>
                            <select
                                className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={formData.shift}
                                onChange={e => handleChange('shift', e.target.value)}
                            >
                                <option value={ShiftType.A}>Turno A</option>
                                <option value={ShiftType.B}>Turno B</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Componente */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Componente (Tipo de Acero)</h3>
                    </div>
                    <div className="p-5">
                        <select
                            className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={formData.steelType}
                            onChange={e => handleChange('steelType', e.target.value)}
                        >
                            {STEEL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                </div>

                {/* Serie */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">N° de Serie *</h3>
                    </div>
                    <div className="p-5">
                        <input
                            type="text"
                            placeholder="Ingrese serie del componente nuevo"
                            className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                            value={formData.serialNumber}
                            onChange={e => handleChange('serialNumber', e.target.value)}
                        />
                    </div>
                </div>

                {/* Comentarios */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Comentarios</h3>
                    </div>
                    <div className="p-5">
                        <textarea
                            className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            rows={3}
                            placeholder="Motivo del cambio, observaciones, etc."
                            value={formData.comments}
                            onChange={e => handleChange('comments', e.target.value)}
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-50">
                <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center text-slate-500 font-bold px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        <span className="text-sm uppercase tracking-wide">Volver</span>
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center justify-center bg-brand-primary text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-blue-800 transition-all transform hover:scale-[1.02] active:scale-95 uppercase text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <RefreshCw className="mr-2 w-5 h-5 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 w-5 h-5" />
                                Guardar Registro
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};