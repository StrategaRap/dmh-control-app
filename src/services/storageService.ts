import type { ShiftReportData, SteelChangeData, MeasurementData } from '../types';
import { DEFAULT_API_URL } from '../constants';

const REPORTS_KEY = 'drill_reports_v1';
const STEEL_KEY = 'steel_changes_v1';
const MEASUREMENTS_KEY = 'measurements_v1';
const OPERATOR_KEY = 'saved_operator_name';
const SCRIPT_URL_KEY = 'script_url';

// --- SAFE STORAGE IMPLEMENTATION ---
// Esto evita que la app se ponga en blanco si el dispositivo bloquea las cookies/localStorage
const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      // Si falla (seguridad/privacidad), usamos memoria RAM
    }
    return memoryStorage[key] || null;
  },
  setItem: (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      // Fallback a memoria RAM
    }
    memoryStorage[key] = value;
  },
  clear: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (e) { }
    for (const key in memoryStorage) delete memoryStorage[key];
  }
};
// -----------------------------------

// === EMERGENCY RESET ===
export const resetAllData = () => {
  safeStorage.clear();
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

export const saveOperatorName = (name: string) => {
  safeStorage.setItem(OPERATOR_KEY, name);
};

export const getSavedOperatorName = (): string => {
  return safeStorage.getItem(OPERATOR_KEY) || '';
};

export const saveScriptUrl = (url: string) => {
  safeStorage.setItem(SCRIPT_URL_KEY, url);
}

export const getSavedScriptUrl = (): string => {
  const url = safeStorage.getItem(SCRIPT_URL_KEY);
  if (!url || url === "undefined" || url === "null" || url.includes("INSERT")) {
    return DEFAULT_API_URL;
  }
  return url;
}

export const saveShiftReportLocally = (report: ShiftReportData) => {
  const existing = getLocalShiftReports();
  const updated = [...existing, { ...report, status: 'pending' as const }];
  safeStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
};

export const getLocalShiftReports = (): ShiftReportData[] => {
  try {
    const data = safeStorage.getItem(REPORTS_KEY);
    if (!data || data === "undefined" || data === "null") return [];

    const parsed = JSON.parse(data);
    // Validación crítica: Asegurar que sea un array. Si es null o algo raro, devolver array vacío.
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error leyendo reportes locales:", e);
    return [];
  }
};

export const markShiftReportAsSynced = (id: string) => {
  const reports = getLocalShiftReports();
  const updated = reports.map(r =>
    r.id === id ? { ...r, status: 'synced' as const } : r
  );
  safeStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
};

export const saveSteelChangeLocally = (change: SteelChangeData) => {
  const existing = getLocalSteelChanges();
  const updated = [...existing, { ...change, status: 'pending' as const }];
  safeStorage.setItem(STEEL_KEY, JSON.stringify(updated));
};

export const getLocalSteelChanges = (): SteelChangeData[] => {
  try {
    const data = safeStorage.getItem(STEEL_KEY);
    if (!data || data === "undefined" || data === "null") return [];

    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error leyendo cambios de acero locales:", e);
    return [];
  }
};

export const markSteelChangeAsSynced = (id: string) => {
  const changes = getLocalSteelChanges();
  const updated = changes.map(s =>
    s.id === id ? { ...s, status: 'synced' as const } : s
  );
  safeStorage.setItem(STEEL_KEY, JSON.stringify(updated));
};

export const clearSyncedData = () => {
  const reports = getLocalShiftReports().filter(r => r.status === 'pending');
  const steel = getLocalSteelChanges().filter(s => s.status === 'pending');
  const measurements = getLocalMeasurements().filter(m => m.status === 'pending');
  safeStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  safeStorage.setItem(STEEL_KEY, JSON.stringify(steel));
  safeStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(measurements));
};

export const saveMeasurementLocally = (measurement: MeasurementData) => {
  const existing = getLocalMeasurements();
  const updated = [...existing, { ...measurement, status: 'pending' as const }];
  safeStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(updated));
};

export const getLocalMeasurements = (): MeasurementData[] => {
  try {
    const data = safeStorage.getItem(MEASUREMENTS_KEY);
    if (!data || data === "undefined" || data === "null") return [];

    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error leyendo mediciones locales:", e);
    return [];
  }
};

export const markMeasurementAsSynced = (id: string) => {
  const measurements = getLocalMeasurements();
  const updated = measurements.map(m =>
    m.id === id ? { ...m, status: 'synced' as const } : m
  );
  safeStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(updated));
};