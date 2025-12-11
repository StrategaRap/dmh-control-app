import React from 'react';
import type { HoleRecord } from '../types';
import { TerrainType } from '../types';
import { Clock, Trash2, ArrowRight } from 'lucide-react';

const TimePicker: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
    const [h, m] = (value || "00:00").split(':');
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    return (
        <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white w-full">
            <select
                value={h}
                onChange={(e) => onChange(`${e.target.value}:${m}`)}
                className="w-1/2 p-2 text-sm font-medium focus:outline-none appearance-none text-center bg-transparent cursor-pointer hover:bg-slate-50"
            >
                {hours.map(hour => <option key={hour} value={hour}>{hour}</option>)}
            </select>
            <span className="flex items-center text-slate-400 font-bold px-1">:</span>
            <select
                value={m}
                onChange={(e) => onChange(`${h}:${e.target.value}`)}
                className="w-1/2 p-2 text-sm font-medium focus:outline-none appearance-none text-center bg-transparent cursor-pointer hover:bg-slate-50"
            >
                {minutes.map(min => <option key={min} value={min}>{min}</option>)}
            </select>
        </div>
    );
};

interface HoleRowProps {
    data: HoleRecord;
    index: number;
    onChange: (id: string, field: keyof HoleRecord, value: any) => void;
    onRemove: (id: string) => void;
}

export const HoleRow: React.FC<HoleRowProps> = ({ data, index, onChange, onRemove }) => {

    // NOTA: Se ha eliminado el useEffect que calculaba el tiempo automáticamente aquí.
    // Ahora el cálculo se realiza en el componente padre (ShiftForm) para evitar bloqueos.

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative transition-all duration-200 hover:shadow-md hover:border-brand-primary/30">

            {/* Header of the Card */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                    <span className="bg-slate-800 text-white text-xs font-bold px-2.5 py-1 rounded-md mr-2">
                        #{index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Pozo
                    </span>
                </div>
                <button onClick={() => onRemove(data.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Row 1: Identifiers */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">N° Pozo</label>
                    <input
                        type="text"
                        className="w-full border-slate-200 border bg-slate-50 rounded-lg p-2 focus:ring-2 focus:ring-brand-primary focus:border-transparent font-bold text-slate-700 text-center outline-none"
                        value={data.holeNumber}
                        onChange={(e) => onChange(data.id, 'holeNumber', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">Metros</label>
                    <input
                        type="number"
                        className="w-full border-brand-primary/30 border-2 rounded-lg p-2 font-black text-brand-primary bg-blue-50/50 focus:ring-2 focus:ring-brand-primary outline-none text-center"
                        value={data.meters}
                        onChange={(e) => onChange(data.id, 'meters', parseFloat(e.target.value) || 0)}
                    />
                </div>

                {/* Row 2: Times */}
                <div className="col-span-2 md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                        <Clock size={10} className="mr-1" /> Horario (Inicio <ArrowRight size={8} className="mx-1" /> Fin)
                    </label>
                    <div className="flex space-x-2">
                        <TimePicker
                            value={data.startTime}
                            onChange={(val) => onChange(data.id, 'startTime', val)}
                        />
                        <TimePicker
                            value={data.endTime}
                            onChange={(val) => onChange(data.id, 'endTime', val)}
                        />
                    </div>
                </div>

                {/* Row 3: Technical */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Terreno</label>
                    <select
                        className="w-full border-slate-200 border bg-white rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-brand-primary outline-none"
                        value={data.terrain}
                        onChange={(e) => onChange(data.id, 'terrain', e.target.value)}
                    >
                        {Object.values(TerrainType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tiempo</label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-center font-mono text-slate-600 font-bold text-sm">
                        {data.durationMinutes} min
                    </div>
                </div>

                {/* Extended Fields */}
                <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pulldown / RPM</label>
                    <div className="flex space-x-2">
                        <input
                            type="text" placeholder="Pull"
                            className="w-1/2 border-slate-200 bg-white border rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                            value={data.pulldown}
                            onChange={(e) => onChange(data.id, 'pulldown', e.target.value)}
                        />
                        <input
                            type="text" placeholder="RPM"
                            className="w-1/2 border-slate-200 bg-white border rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                            value={data.rpm}
                            onChange={(e) => onChange(data.id, 'rpm', e.target.value)}
                        />
                    </div>
                </div>

                <div className="md:col-span-3 lg:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Observaciones</label>
                    <input
                        type="text"
                        placeholder="Comentarios del pozo..."
                        className="w-full border-slate-200 bg-white border rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                        value={data.comments}
                        onChange={(e) => onChange(data.id, 'comments', e.target.value)}
                    />
                </div>
            </div>

            <div className="mt-4 pt-2 border-t border-dashed border-slate-200 flex justify-end">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Acumulado: <span className="font-black text-slate-700 ml-1 text-sm">{data.cumulativeMeters.toFixed(1)} m</span>
                </span>
            </div>
        </div>
    );
};