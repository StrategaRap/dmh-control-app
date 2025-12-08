import React, { useState } from 'react';
import type { SteelChangeData } from '../types';
import { ShiftType, SteelType } from '../types';
import { DRILL_OPTIONS, STEEL_OPTIONS, generateUUID } from '../constants';
import { saveSteelChangeLocally } from '../services/storageService';
import { ArrowLeft, Save } from 'lucide-react';

interface SteelChangeFormProps {
  onBack: () => void;
}

export const SteelChangeForm: React.FC<SteelChangeFormProps> = ({ onBack }) => {
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

  const handleSave = () => {
    if (!formData.serialNumber) {
        alert("Ingrese número de serie");
        return;
    }
    saveSteelChangeLocally(formData);
    alert("Cambio de acero registrado localmente.");
    onBack();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden min-h-[80vh]">
        <div className="bg-brand-primary p-6 flex items-center text-white">
            <button 
                onClick={onBack}
                className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors mr-4"
            >
                <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="text-xl font-black uppercase tracking-wide">
                    Cambio de Aceros
                </h2>
                <p className="text-blue-100 text-xs font-medium mt-1">
                    Registre reemplazos y movimientos de componentes
                </p>
            </div>
        </div>

        <div className="p-6 grid gap-6">
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha del Cambio</label>
                <input type="date" className="block w-full rounded-lg border-slate-300 bg-white border p-3 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                    value={formData.date} onChange={e => handleChange('date', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Perforadora</label>
                    <select className="block w-full rounded-lg border-slate-300 bg-white border p-3 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                        value={formData.drillId} onChange={e => handleChange('drillId', e.target.value)}>
                        {DRILL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Turno</label>
                    <select className="block w-full rounded-lg border-slate-300 bg-white border p-3 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                        value={formData.shift} onChange={e => handleChange('shift', e.target.value)}>
                        <option value={ShiftType.A}>Turno A</option>
                        <option value={ShiftType.B}>Turno B</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Componente (Tipo de Acero)</label>
                <select className="block w-full rounded-lg border-slate-300 bg-white border p-3 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                    value={formData.steelType} onChange={e => handleChange('steelType', e.target.value)}>
                    {STEEL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">N° de Serie</label>
                <input type="text" placeholder="Ingrese serie del componente nuevo" className="block w-full rounded-lg border-slate-300 bg-white border p-3 text-sm focus:ring-2 focus:ring-brand-primary outline-none font-medium"
                    value={formData.serialNumber} onChange={e => handleChange('serialNumber', e.target.value)} />
            </div>

            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Comentarios</label>
                <textarea className="block w-full rounded-lg border-slate-300 bg-white border p-3 text-sm focus:ring-2 focus:ring-brand-primary outline-none" rows={3}
                    placeholder="Motivo del cambio, observaciones, etc."
                    value={formData.comments} onChange={e => handleChange('comments', e.target.value)} />
            </div>

            <div className="flex justify-end pt-6 space-x-4">
                 <button 
                    onClick={handleSave}
                    className="w-full flex items-center justify-center bg-brand-primary text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-blue-800 transition-all uppercase tracking-wide"
                 >
                    <Save className="mr-2" size={20} /> Guardar Registro
                 </button>
            </div>
        </div>
    </div>
  );
};