import React, { useState, useEffect, useCallback } from 'react';
import type { ShiftReportData, HoleRecord } from '../types';
import { ShiftType, TerrainType, Diameter } from '../types';
import { DRILL_OPTIONS, DIAMETER_OPTIONS, generateUUID, DEFAULT_API_URL } from '../constants';
import { saveOperatorName, getSavedOperatorName, saveShiftReportLocally, getSavedScriptUrl, markShiftReportAsSynced } from '../services/storageService';
import { HoleRow } from './HoleRow';
import { PlusCircle, Save, Wrench, FileText, Activity, AlertCircle, Ruler } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { uploadDataToSheet } from '../services/googleScriptService';

interface ShiftFormProps {
  onNavigateToSteel: () => void;
  onNavigateToAnalyst: () => void;
  onNavigateToMeasurement: () => void;
}

const getCurrentTime = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

export const ShiftForm: React.FC<ShiftFormProps> = ({ onNavigateToSteel, onNavigateToAnalyst, onNavigateToMeasurement }) => {
  const [rememberMe, setRememberMe] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Form State
  const [formData, setFormData] = useState<ShiftReportData>({
    id: generateUUID(),
    date: new Date().toISOString().split('T')[0],
    shift: ShiftType.A,
    drillId: DRILL_OPTIONS[0],
    operatorName: '',
    bench: '',
    phase: '',
    mesh: '',
    bitBrand: '',
    bitModel: '',
    bitSerial: '',
    bitDiameter: DIAMETER_OPTIONS[0],
    holes: [],
    status: 'draft'
  });

  // Load operator name on mount
  useEffect(() => {
    try {
      const saved = getSavedOperatorName();
      if (saved) {
        setFormData(prev => ({ ...prev, operatorName: saved }));
        setRememberMe(true);
      }
    } catch (e) {
      console.warn("Error loading operator name", e);
    }
  }, []);

  // State for steel changes
  const [steelChanges, setSteelChanges] = useState<any[]>([]);

  // Fetch steel changes on mount
  useEffect(() => {
    const fetchSteelChanges = async () => {
      if (navigator.onLine) {
        try {
          const scriptUrl = getSavedScriptUrl() || DEFAULT_API_URL;
          if (scriptUrl && !scriptUrl.includes("INSERT_YOUR")) {
            const response = await fetch(scriptUrl, {
              method: 'POST',
              body: JSON.stringify({ type: 'steel_changes_fetch' }),
              redirect: "follow",
              headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const result = await response.json();
            if (result.success) {
              setSteelChanges(result.data);
            }
          }
        } catch (e) {
          console.error("Error fetching steel changes:", e);
        }
      }
    };
    fetchSteelChanges();
  }, []);

  // Autofill tricone data when drillId changes
  useEffect(() => {
    if (formData.drillId) {
      // 1. Set Diameter based on Drill ID
      let diameter = formData.bitDiameter;
      const drillNum = parseInt(formData.drillId);

      if (drillNum >= 101 && drillNum <= 106) {
        diameter = Diameter.D10_58;
      } else if (drillNum >= 111 && drillNum <= 112) {
        diameter = Diameter.D7_78;
      }

      // 2. Autofill from Steel Changes
      let triconeUpdates = {};
      if (steelChanges.length > 0) {
        // Filter for this drill and 'Tricono' component
        const drillChanges = steelChanges.filter(c =>
          c.drillId === formData.drillId &&
          (c.component === 'Tricono')
        );

        // Sort by date descending to get the latest
        drillChanges.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (drillChanges.length > 0) {
          const lastTricono = drillChanges[0];
          triconeUpdates = {
            bitBrand: lastTricono.brand || '',
            bitModel: lastTricono.model || '',
            bitSerial: lastTricono.serie || ''
          };
        }
      }

      setFormData(prev => ({
        ...prev,
        bitDiameter: diameter,
        ...triconeUpdates
      }));
    }
  }, [formData.drillId, steelChanges]);

  // Función auxiliar para recalcular acumulados
  const recalculateCumulatives = (holes: HoleRecord[]): HoleRecord[] => {
    if (!holes || !Array.isArray(holes)) return [];
    let runningTotal = 0;
    return holes.map(hole => {
      runningTotal += (hole.meters || 0);
      return { ...hole, cumulativeMeters: runningTotal };
    });
  };

  const handleInputChange = (field: keyof ShiftReportData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOperatorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    handleInputChange('operatorName', name);
    if (rememberMe) {
      saveOperatorName(name);
    }
  };

  const handleRememberToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setRememberMe(checked);
    if (checked) {
      saveOperatorName(formData.operatorName);
    } else {
      saveOperatorName('');
    }
  };

  const addHole = () => {
    setFormData(prev => {
      const currentHoles = Array.isArray(prev.holes) ? prev.holes : [];
      const lastHole = currentHoles[currentHoles.length - 1];
      const newHole: HoleRecord = {
        id: generateUUID(),
        holeNumber: lastHole ? String(parseInt(lastHole.holeNumber || '0') + 1) : '1',
        meters: 0,
        cumulativeMeters: 0,
        startTime: lastHole ? lastHole.endTime : getCurrentTime(),
        endTime: getCurrentTime(),
        durationMinutes: 0,
        terrain: TerrainType.MEDIO,
        pulldown: '',
        rpm: '',
        comments: ''
      };
      const newHoles = [...currentHoles, newHole];
      return { ...prev, holes: recalculateCumulatives(newHoles) };
    });
  };

  const handleHoleChange = useCallback((id: string, field: keyof HoleRecord, value: any) => {
    setFormData(prev => {
      if (!prev.holes || !Array.isArray(prev.holes)) return prev;

      // Encontramos el índice
      const index = prev.holes.findIndex(h => h.id === id);
      if (index === -1) return prev;

      // Copiamos el array
      const updatedHoles = [...prev.holes];
      // Copiamos el objeto pozo a modificar
      const hole = { ...updatedHoles[index], [field]: value };

      // Lógica de cálculo de tiempo
      if (field === 'startTime' || field === 'endTime') {
        const start = field === 'startTime' ? value : hole.startTime;
        const end = field === 'endTime' ? value : hole.endTime;

        if (start && end) {
          // Usamos fecha arbitraria para calcular diferencia
          const d1 = new Date("1970-01-01T" + start);
          const d2 = new Date("1970-01-01T" + end);

          if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
            let diff = (d2.getTime() - d1.getTime()) / 1000 / 60;
            // Ajuste para cambios de día (ej: 23:50 a 00:10)
            if (diff < 0) diff += 24 * 60;
            hole.durationMinutes = Math.round(diff);
          }
        }
      }

      // Asignamos el pozo modificado al array
      updatedHoles[index] = hole;

      // Si cambiaron los metros, recalculamos todos los acumulados
      if (field === 'meters') {
        return { ...prev, holes: recalculateCumulatives(updatedHoles) };
      }

      return { ...prev, holes: updatedHoles };
    });
  }, []);

  const removeHole = (id: string) => {
    setFormData(prev => {
      const remainingHoles = prev.holes.filter(h => h.id !== id);
      return { ...prev, holes: recalculateCumulatives(remainingHoles) };
    });
  };

  const handleSave = async () => {
    if (!formData.operatorName || formData.operatorName.trim() === '') {
      alert("⚠️ Falta el OPERADOR. Por favor ingrese el nombre.");
      return;
    }
    if (!formData.drillId) {
      alert("⚠️ Falta seleccionar la PERFORADORA.");
      return;
    }

    let apiKey = null;
    try {
      // @ts-ignore
      if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        // @ts-ignore
        apiKey = process.env.API_KEY;
      }
    } catch (e) {
      // Ignorar errores de entorno
    }

    if (apiKey && formData.holes.length > 0) {
      setIsSummarizing(true);
      try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const comments = formData.holes.map(h => h.comments).filter(c => c).join('; ');

        if (comments.length > 5) {
          const prompt = `Resumir brevemente los eventos operacionales de este turno de perforación basados en estos comentarios: "${comments}". Formato lista corta.`;
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });
          const summary = response.text;
          formData.aiSummary = summary;
        }
      } catch (e) {
        console.error("Error IA:", e);
      }
      setIsSummarizing(false);
    }

    try {
      const reportToSave = JSON.parse(JSON.stringify(formData));

      // 1. Guardar localmente primero
      saveShiftReportLocally(reportToSave);

      // 2. Intentar enviar si hay conexión
      if (navigator.onLine) {
        const scriptUrl = getSavedScriptUrl() || DEFAULT_API_URL;
        if (scriptUrl && !scriptUrl.includes("INSERT_YOUR")) {
          setIsSummarizing(true); // Reusamos estado de carga
          const res = await uploadDataToSheet(reportToSave, null, null, null, scriptUrl);
          setIsSummarizing(false);

          if (res.success) {
            markShiftReportAsSynced(reportToSave.id);
            alert("✅ REPORTE GUARDADO Y SINCRONIZADO\n\nSe ha enviado el reporte y el correo.");

            // Reset form
            setFormData(prev => ({
              ...prev,
              id: generateUUID(),
              holes: [],
              aiSummary: undefined,
            }));
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          } else {
            console.warn("Error sync:", res.message);
          }
        }
      }

      // 3. Fallback a local
      alert("⚠️ REPORTE GUARDADO EN DISPOSITIVO (OFFLINE)\n\nPresiona 'Sincronizar' en Analista cuando tengas internet.");

      setFormData(prev => ({
        ...prev,
        id: generateUUID(),
        holes: [],
        aiSummary: undefined,
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      setIsSummarizing(false);
      alert(`❌ Error al guardar: ${error}`);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* 1. Header Data */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center">
          <div className="bg-brand-primary/10 p-1.5 rounded-lg mr-3">
            <FileText className="w-5 h-5 text-brand-primary" />
          </div>
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">
            Datos del Turno
          </h3>
        </div>

        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha</label>
            <input type="date" className="block w-full rounded-lg border-slate-300 bg-white shadow-sm border p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
              value={formData.date} onChange={e => handleInputChange('date', e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Turno</label>
            <select className="block w-full rounded-lg border-slate-300 bg-white shadow-sm border p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
              value={formData.shift} onChange={e => handleInputChange('shift', e.target.value)}>
              <option value={ShiftType.A}>TURNO A</option>
              <option value={ShiftType.B}>TURNO B</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">N° Perforadora</label>
            <select className="block w-full rounded-lg border-slate-300 bg-white shadow-sm border p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
              value={formData.drillId} onChange={e => handleInputChange('drillId', e.target.value)}>
              {DRILL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Operador <span className="text-red-500">*</span></label>
            <input
              type="text"
              className={`block w-full rounded-lg shadow-sm border p-2.5 text-sm font-medium focus:ring-2 outline-none transition-all ${!formData.operatorName ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-brand-primary'}`}
              value={formData.operatorName} onChange={handleOperatorChange} placeholder="Nombre completo" required />
            <div className="flex items-center mt-2">
              <input id="remember" type="checkbox" className="h-3.5 w-3.5 text-brand-primary rounded border-gray-300 focus:ring-brand-primary cursor-pointer"
                checked={rememberMe} onChange={handleRememberToggle} />
              <label htmlFor="remember" className="ml-2 text-xs text-slate-500 cursor-pointer">Guardar nombre</label>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Banco</label>
            <input placeholder="3250" className="w-full border-slate-300 bg-white border p-2.5 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none" value={formData.bench} onChange={e => handleInputChange('bench', e.target.value)} />
          </div>
          <div className="col-span-1 md:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fase</label>
            <input placeholder="11" className="w-full border-slate-300 bg-white border p-2.5 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none" value={formData.phase} onChange={e => handleInputChange('phase', e.target.value)} />
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Malla</label>
            <input placeholder="M-20" className="w-full border-slate-300 bg-white border p-2.5 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none" value={formData.mesh} onChange={e => handleInputChange('mesh', e.target.value)} />
          </div>
        </div>
      </div>

      {/* 2. Tricono / Bit Data */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center">
          <div className="bg-brand-secondary/10 p-1.5 rounded-lg mr-3">
            <Activity className="w-5 h-5 text-brand-secondary" />
          </div>
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">
            Datos Tricono
          </h3>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Marca</label>
            <input className="w-full border-slate-300 bg-white border p-2.5 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none" value={formData.bitBrand} onChange={e => handleInputChange('bitBrand', e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Modelo</label>
            <input className="w-full border-slate-300 bg-white border p-2.5 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none" value={formData.bitModel} onChange={e => handleInputChange('bitModel', e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Serie</label>
            <input className="w-full border-slate-300 bg-white border p-2.5 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none" value={formData.bitSerial} onChange={e => handleInputChange('bitSerial', e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Diámetro</label>
            <select className="w-full border-slate-300 bg-white border p-2.5 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none" value={formData.bitDiameter} onChange={e => handleInputChange('bitDiameter', e.target.value)}>
              {DIAMETER_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Hole by Hole Log */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight">Registro de Pozos</h3>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Total Metros</span>
            <span className="text-xl font-black text-brand-primary bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm block">
              {formData.holes.reduce((acc, h) => acc + (h.meters || 0), 0).toFixed(1)}m
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto">
            {formData.holes.length === 0 && (
              <div className="text-center py-10 bg-slate-50">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-sm font-medium">No hay pozos registrados en este turno.</p>
              </div>
            )}

            {formData.holes.length > 0 && (
              <div className="divide-y divide-slate-100 p-3 space-y-3">
                {formData.holes.map((hole, idx) => (
                  <div key={hole.id} className="pt-3 first:pt-0">
                    <HoleRow
                      data={hole}
                      index={idx}
                      onChange={handleHoleChange}
                      onRemove={removeHole}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={addHole}
            className="w-full py-3 bg-slate-50 border-t border-slate-200 text-brand-primary hover:bg-brand-primary/5 flex items-center justify-center font-bold transition-all group"
          >
            <PlusCircle className="mr-2 group-hover:scale-110 transition-transform" size={18} /> AGREGAR POZO
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] gap-2">
        <button
          onClick={onNavigateToSteel}
          className="flex flex-col md:flex-row items-center justify-center md:space-x-2 text-slate-500 font-bold px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          <Wrench className="w-5 h-5 mb-1 md:mb-0" />
          <span className="text-[10px] md:text-sm uppercase tracking-wide">Cambio Aceros</span>
        </button>

        <button
          onClick={onNavigateToMeasurement}
          className="flex flex-col md:flex-row items-center justify-center md:space-x-2 text-slate-500 font-bold px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          <Ruler className="w-5 h-5 mb-1 md:mb-0" />
          <span className="text-[10px] md:text-sm uppercase tracking-wide">Medición Aceros</span>
        </button>

        <button
          onClick={onNavigateToAnalyst}
          className="flex flex-col md:flex-row items-center justify-center md:space-x-2 text-slate-500 font-bold px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          <FileText className="w-5 h-5 mb-1 md:mb-0" />
          <span className="text-[10px] md:text-sm uppercase tracking-wide">Analista</span>
        </button>

        <button
          onClick={handleSave}
          disabled={isSummarizing}
          className="flex items-center justify-center bg-brand-primary text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-95 uppercase text-sm tracking-wide flex-grow md:flex-grow-0 md:w-auto"
        >
          <Save className="mr-2 w-5 h-5" />
          {isSummarizing ? 'Procesando...' : 'Guardar Registro'}
        </button>
      </div>
    </div>
  );
};