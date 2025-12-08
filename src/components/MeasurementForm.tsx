import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { generateUUID } from '../constants';
import { saveMeasurementLocally, getSavedScriptUrl, markMeasurementAsSynced } from '../services/storageService';
import { uploadDataToSheet } from '../services/googleScriptService';
import type { MeasurementData as MeasurementDataType, ShiftType } from '../types';

interface MeasurementFormProps {
  onBack: () => void;
}

const STORAGE_KEY = 'drilllog_measurements';

export const MeasurementForm: React.FC<MeasurementFormProps> = ({ onBack }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<MeasurementDataType>({
    id: generateUUID(),
    date: new Date().toISOString().split('T')[0],
    shift: 'A',
    drillId: '',
    barraSeguidoraSuperior: '',
    barraSeguidoraMedio: '',
    barraSeguidoraInferior: '',
    barraPatéraSuperior: '',
    barraPatéraMedio: '',
    barraPatéraInferior: '',
    adaptadorInferiorMedio: '',
    status: 'pending',
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const lastMeasurement = JSON.parse(saved);
        setFormData(prev => ({
          ...prev,
          ...lastMeasurement,
          id: generateUUID(),
          date: new Date().toISOString().split('T')[0],
        }));
      }
    } catch (e) {
      console.warn('Error loading measurements:', e);
    }
  }, []);

  const handleInputChange = (field: keyof MeasurementDataType, value: string | ShiftType) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.date || !formData.shift || !formData.drillId) {
      alert('Por favor completa los campos de Fecha, Turno y Perforadora');
      return;
    }

    setIsSaving(true);

    try {
      const scriptUrl = getSavedScriptUrl();
      const measurementToSave = {
        ...formData,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(measurementToSave));
      saveMeasurementLocally(measurementToSave);

      if (scriptUrl && navigator.onLine) {
        const res = await uploadDataToSheet(null, null, measurementToSave, null, scriptUrl);
        if (res.success) {
          // Marcar como sincronizado para evitar duplicados
          markMeasurementAsSynced(measurementToSave.id);
          alert('✅ Mediciones guardadas y sincronizadas correctamente');
        } else {
          alert('⚠️ Mediciones guardadas localmente.\nNo se pudo sincronizar con el servidor.\n\nSe sincronizarán cuando tengas conexión.');
        }
      } else {
        alert('⚠️ Mediciones guardadas localmente.\nSe sincronizarán cuando tengas conexión y configures el Script.');
      }

      // Limpiar formulario manteniendo datos de cabecera
      setFormData(prev => ({
        ...prev,
        id: generateUUID(),
        barraSeguidoraSuperior: '',
        barraSeguidoraMedio: '',
        barraSeguidoraInferior: '',
        barraPatéraSuperior: '',
        barraPatéraMedio: '',
        barraPatéraInferior: '',
        adaptadorInferiorMedio: '',
        status: 'pending'
      }));

      // Eliminar datos guardados en localStorage para evitar que se recarguen al volver
      localStorage.removeItem(STORAGE_KEY);

      onBack();
    } catch (error) {
      console.error('Error saving:', error);
      alert(`❌ Error al guardar: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Medición de Aceros</h1>
          <p className="text-xs text-slate-400 mt-1">Registre las mediciones de los aceros</p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="space-y-6">
          {/* Header Fields */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Información General</h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={formData.date}
                  onChange={e => handleInputChange('date', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Turno
                </label>
                <select
                  className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={formData.shift}
                  onChange={e => handleInputChange('shift', e.target.value as ShiftType)}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Perforadora
                </label>
                <select
                  className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={formData.drillId}
                  onChange={e => handleInputChange('drillId', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {['101', '102', '103', '104', '105', '106', '111', '112'].map(drill => (
                    <option key={drill} value={drill}>{drill}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {/* Barra Seguidora */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center">
              <div className="bg-blue-100 p-1.5 rounded-lg mr-3">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Barra Seguidora</h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Superior (pulg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={formData.barraSeguidoraSuperior}
                  onChange={e => handleInputChange('barraSeguidoraSuperior', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Medio (pulg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={formData.barraSeguidoraMedio}
                  onChange={e => handleInputChange('barraSeguidoraMedio', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Inferior (pulg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={formData.barraSeguidoraInferior}
                  onChange={e => handleInputChange('barraSeguidoraInferior', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Barra Patera */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center">
              <div className="bg-green-100 p-1.5 rounded-lg mr-3">
                <span className="text-sm font-bold text-green-600">2</span>
              </div>
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Barra Patera</h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Superior (pulg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  value={formData.barraPatéraSuperior}
                  onChange={e => handleInputChange('barraPatéraSuperior', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Medio (pulg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  value={formData.barraPatéraMedio}
                  onChange={e => handleInputChange('barraPatéraMedio', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Inferior (pulg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  value={formData.barraPatéraInferior}
                  onChange={e => handleInputChange('barraPatéraInferior', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Adaptador Inferior */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center">
              <div className="bg-purple-100 p-1.5 rounded-lg mr-3">
                <span className="text-sm font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Adaptador Inferior</h3>
            </div>
            <div className="p-5">
              <div className="max-w-xs">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Medio (pulg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  className="w-full border-slate-300 bg-white border p-3 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  value={formData.adaptadorInferiorMedio}
                  onChange={e => handleInputChange('adaptadorInferiorMedio', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center justify-center text-slate-500 font-bold px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-xs md:text-sm uppercase tracking-wide">Volver</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center bg-brand-primary text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-blue-800 transition-all transform hover:scale-[1.02] active:scale-95 uppercase text-sm tracking-wide flex-grow md:flex-grow-0 md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="mr-2 w-5 h-5" />
            {isSaving ? 'Guardando...' : 'Guardar Mediciones'}
          </button>
        </div>
      </div>
    </div>
  );
};