import React, { useState } from 'react';
import { Lock, ArrowLeft, Settings } from 'lucide-react';
import { InventoryForm } from './InventoryForm';
import { DiameterControlForm } from './DiameterControlForm';
import { LogbookForm } from './LogbookForm';
import { SteelStatisticsForm } from './SteelStatisticsForm';

interface AnalystFormProps {
  onBack: () => void;
  onNavigateToSettings: () => void;
}

export const AnalystForm: React.FC<AnalystFormProps> = ({ onBack, onNavigateToSettings }) => {
  const [view, setView] = useState<'login' | 'menu' | 'inventory' | 'diameters' | 'statistics' | 'logbook'>('login');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const CORRECT_PASSWORD = 'dmh2026';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setView('menu');
      setError('');
    } else {
      setError('Contraseña incorrecta');
      setPassword('');
    }
  };

  // --- VISTAS ---

  if (view === 'inventory') {
    return <InventoryForm onBack={() => setView('menu')} />;
  }

  if (view === 'diameters') {
    return <DiameterControlForm onBack={() => setView('menu')} />;
  }

  if (view === 'logbook') {
    return <LogbookForm onBack={() => setView('menu')} />;
  }

  if (view === 'statistics') {
    return <SteelStatisticsForm onBack={() => setView('menu')} />;
  }

  if (view === 'menu') {
    return (
      <div className="min-h-screen bg-slate-100 pb-24">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Panel de Analista</h1>
            <p className="text-xs text-slate-400 mt-1">Herramientas de gestión y control</p>
          </div>
        </div>

        <main className="max-w-4xl mx-auto p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Botón 1: Inventario */}
            <button
              onClick={() => setView('inventory')}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-brand-primary/50 transition-all group text-left"
            >
              <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Inventario</h3>
              <p className="text-sm text-slate-500">Gestión de stock de aceros y triconos.</p>
            </button>

            {/* Botón 2: Control de Diámetros */}
            <button
              onClick={() => setView('diameters')}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-brand-primary/50 transition-all group text-left"
            >
              <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <div className="w-6 h-6 rounded-full border-4 border-green-600"></div>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Control de Diámetros</h3>
              <p className="text-sm text-slate-500">Registro y seguimiento de desgaste.</p>
            </button>

            {/* Botón 3: Estadística */}
            <button
              onClick={() => setView('statistics')}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-brand-primary/50 transition-all group text-left"
            >
              <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <div className="flex items-end space-x-1 h-6">
                  <div className="w-1 bg-purple-600 h-3"></div>
                  <div className="w-1 bg-purple-600 h-6"></div>
                  <div className="w-1 bg-purple-600 h-4"></div>
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Estadística de Aceros</h3>
              <p className="text-sm text-slate-500">Rendimiento y vida útil de componentes.</p>
            </button>

            {/* Botón 4: Bitácora (DESHABILITADO) */}
            <button
              disabled={true}
              className="bg-slate-50 p-8 rounded-2xl shadow-none border border-slate-100 opacity-60 cursor-not-allowed text-left grayscale"
            >
              <div className="bg-slate-200 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <div className="w-6 h-6 border-2 border-slate-400 rounded flex items-center justify-center">
                  <div className="w-3 h-0.5 bg-slate-400"></div>
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-400 mb-2">Bitácora</h3>
              <p className="text-sm text-slate-400">Deshabilitado: Acceder desde menú principal.</p>
            </button>

            {/* Botón 5: Configuración (MOVIDO AQUÍ) */}
            <button
              onClick={onNavigateToSettings}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-[#FBBF24]/50 transition-all group text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Settings className="w-24 h-24 text-[#FBBF24]" />
              </div>
              <div className="bg-yellow-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-10">
                <Settings className="w-6 h-6 text-[#FBBF24]" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2 relative z-10">Configuración</h3>
              <p className="text-sm text-slate-500 relative z-10">Ajustes de conexión y sistema.</p>
            </button>
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
  }

  // --- LOGIN VIEW ---
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-8 flex items-center justify-center flex-col">
          <div className="bg-white/20 p-3 rounded-full mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white text-center">Acceso Analista</h1>
          <p className="text-slate-200 text-xs mt-2 text-center">Ingrese contraseña para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Ingrese contraseña"
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none ${error
                ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-slate-300 focus:border-slate-800 focus:ring-2 focus:ring-slate-100'
                }`}
              autoFocus
            />
            {error && <p className="text-red-600 text-sm font-bold mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 transition-all transform hover:scale-[1.02] active:scale-95 uppercase text-sm tracking-wide"
          >
            Desbloquear
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full flex items-center justify-center text-slate-500 font-bold py-3 rounded-lg hover:bg-slate-100 transition-colors uppercase text-sm tracking-wide"
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Volver
          </button>
        </form>
      </div>
    </div>
  );
};