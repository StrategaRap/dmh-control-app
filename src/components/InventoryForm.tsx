import React, { useState, useEffect } from 'react';
import { STEEL_OPTIONS, DEFAULT_API_URL } from '../constants';
import { Plus, Minus, ArrowLeft, Save } from 'lucide-react';
import type { InventoryItem, InventoryData } from '../types';
import { uploadDataToSheet } from '../services/googleScriptService';

import { getSavedScriptUrl } from '../services/storageService';

interface InventoryFormProps {
  onBack: () => void;
}

interface SteelCount {
  [key: string]: InventoryItem;
}

const STORAGE_KEY = 'drilllog_inventory';

export const InventoryForm: React.FC<InventoryFormProps> = ({ onBack }) => {
  // d1: 6 1/2" (o 7 7/8" para Triconos)
  // d2: 9 1/4" (o 10 5/8" para Triconos)
  const [inventory, setInventory] = useState<SteelCount>({});
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  useEffect(() => {
    // Cargar inventario local primero
    loadLocalInventory();

    // Intentar cargar desde la nube
    fetchRemoteInventory(getSavedScriptUrl() || DEFAULT_API_URL);
  }, []);

  const loadLocalInventory = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migración simple si el formato es antiguo
        if (typeof Object.values(parsed)[0] === 'number') {
          const migrated: SteelCount = {};
          STEEL_OPTIONS.forEach(steel => {
            migrated[steel] = { d1: 0, d2: 0 };
          });
          setInventory(migrated);
        } else {
          setInventory(parsed);
        }
      } else {
        initializeInventory();
      }
    } catch (e) {
      console.warn('Error loading inventory:', e);
      initializeInventory();
    }
  };

  const fetchRemoteInventory = async (url: string) => {
    setIsLoading(true);
    try {
      // Priorizar URL pasada, sino buscar en storage, sino default
      const effectiveUrl = url || getSavedScriptUrl() || DEFAULT_API_URL;
      const result = await uploadDataToSheet(null, null, null, null, effectiveUrl, 'inventory_fetch');
      if (result.success && result.data) {
        // Actualizar con datos remotos
        setInventory(result.data);
        // Guardar localmente también
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
      }
    } catch (e) {
      console.error("Error fetching remote inventory:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeInventory = () => {
    const initialInventory: SteelCount = {};
    STEEL_OPTIONS.forEach((steel) => {
      initialInventory[steel] = { d1: 0, d2: 0 };
    });
    setInventory(initialInventory);
  };

  const saveInventoryLocal = (newInventory: SteelCount) => {
    setInventory(newInventory);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newInventory));
    } catch (e) {
      console.warn('Error saving inventory:', e);
    }
  };

  const handleChange = (steel: string, diameter: 'd1' | 'd2', value: string) => {
    const numValue = parseInt(value) || 0;
    const current = inventory[steel] || { d1: 0, d2: 0 };
    const updated = {
      ...inventory,
      [steel]: { ...current, [diameter]: Math.max(0, numValue) }
    };
    saveInventoryLocal(updated);
  };

  const handleIncrement = (steel: string, diameter: 'd1' | 'd2') => {
    const current = inventory[steel] || { d1: 0, d2: 0 };
    const updated = {
      ...inventory,
      [steel]: { ...current, [diameter]: current[diameter] + 1 }
    };
    saveInventoryLocal(updated);
  };

  const handleDecrement = (steel: string, diameter: 'd1' | 'd2') => {
    const current = inventory[steel] || { d1: 0, d2: 0 };
    const updated = {
      ...inventory,
      [steel]: { ...current, [diameter]: Math.max(0, current[diameter] - 1) }
    };
    saveInventoryLocal(updated);
  };

  const handleUpdateStock = async () => {
    if (!window.confirm('¿Confirmar actualización de stock en Excel?')) return;

    setIsLoading(true);
    try {
      const inventoryData: InventoryData = {
        date: date,
        inventory: inventory
      };

      const effectiveUrl = getSavedScriptUrl() || DEFAULT_API_URL;
      const result = await uploadDataToSheet(null, null, null, inventoryData, effectiveUrl);

      if (result.success) {
        alert('✅ Stock actualizado correctamente en Excel.');
      } else {
        alert(`❌ Error al actualizar: ${result.message}`);
      }
    } catch (e) {
      alert('❌ Error de conexión al actualizar stock.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalItems = Object.values(inventory).reduce((sum, item) => sum + (item?.d1 || 0) + (item?.d2 || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary mb-4"></div>
            <p className="font-bold text-slate-700">Sincronizando...</p>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Inventario</h1>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-100 border border-slate-300 rounded px-3 py-1 font-bold text-slate-700 focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="text-right w-full md:w-auto flex justify-between md:block">
            <span className="text-xs text-slate-400 font-bold uppercase block">Total Ítems</span>
            <span className="text-2xl font-black text-brand-primary">{totalItems}</span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6">
          {STEEL_OPTIONS.map((steel) => {
            const isTricone = steel.toLowerCase().includes('tricono');
            const labelD1 = isTricone ? '7 7/8"' : '6 1/2"';
            const labelD2 = isTricone ? '10 5/8"' : '9 1/4"';
            const counts = inventory[steel] || { d1: 0, d2: 0 };

            return (
              <div key={steel} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">{steel}</h3>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Columna D1 */}
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase mb-3 bg-slate-100 px-2 py-1 rounded">{labelD1}</span>
                    <div className="flex items-center space-x-3 w-full max-w-[200px]">
                      <button
                        onClick={() => handleDecrement(steel, 'd1')}
                        className="bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-lg transition-colors disabled:opacity-50"
                        disabled={counts.d1 === 0}
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <input
                        type="number"
                        value={counts.d1}
                        onChange={(e) => handleChange(steel, 'd1', e.target.value)}
                        className="w-full text-center text-3xl font-black text-brand-primary border-b-2 border-slate-200 focus:border-brand-primary outline-none py-1"
                      />
                      <button
                        onClick={() => handleIncrement(steel, 'd1')}
                        className="bg-green-50 hover:bg-green-100 text-green-600 p-3 rounded-lg transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Columna D2 */}
                  <div className="flex flex-col items-center border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                    <span className="text-xs font-bold text-slate-400 uppercase mb-3 bg-slate-100 px-2 py-1 rounded">{labelD2}</span>
                    <div className="flex items-center space-x-3 w-full max-w-[200px]">
                      <button
                        onClick={() => handleDecrement(steel, 'd2')}
                        className="bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-lg transition-colors disabled:opacity-50"
                        disabled={counts.d2 === 0}
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <input
                        type="number"
                        value={counts.d2}
                        onChange={(e) => handleChange(steel, 'd2', e.target.value)}
                        className="w-full text-center text-3xl font-black text-brand-primary border-b-2 border-slate-200 focus:border-brand-primary outline-none py-1"
                      />
                      <button
                        onClick={() => handleIncrement(steel, 'd2')}
                        className="bg-green-50 hover:bg-green-100 text-green-600 p-3 rounded-lg transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

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
            onClick={handleUpdateStock}
            className="flex items-center justify-center bg-brand-primary text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-blue-800 transition-all transform hover:scale-[1.02] active:scale-95 uppercase text-sm tracking-wide flex-grow md:flex-grow-0 md:w-auto"
          >
            <Save className="mr-2 w-5 h-5" />
            Actualizar Stock
          </button>
        </div>
      </div>
    </div>
  );
};
