export const ShiftType = {
  A: 'A',
  B: 'B'
} as const;
export type ShiftType = typeof ShiftType[keyof typeof ShiftType];

export const DrillModel = {
  D101: '101',
  D102: '102',
  D103: '103',
  D104: '104',
  D105: '105',
  D106: '106',
  D111: '111',
  D112: '112'
} as const;
export type DrillModel = typeof DrillModel[keyof typeof DrillModel];

export const Diameter = {
  D7_78: '7 7/8"',
  D10_58: '10 5/8"'
} as const;
export type Diameter = typeof Diameter[keyof typeof Diameter];

export const TerrainType = {
  BLANDO: 'Blando',
  MEDIO: 'Medio',
  DURO: 'Duro'
} as const;
export type TerrainType = typeof TerrainType[keyof typeof TerrainType];

export const SteelType = {
  AMORTIGUADOR: 'Amortiguador',
  ADAPTADOR_SUP: 'Adaptador superior',
  BARRA_SEGUIDORA: 'Barra Seguidora',
  BARRA_PATERA: 'Barra Patera',
  ADAPTADOR_INF: 'Adaptador inferior',
  ANILLO_GUIA: 'Anillo Guia',
  TRICONO: 'Tricono'
} as const;
export type SteelType = typeof SteelType[keyof typeof SteelType];

export interface HoleRecord {
  id: string;
  holeNumber: string;
  meters: number;
  cumulativeMeters: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  terrain: TerrainType;
  pulldown: string;
  rpm: string;
  comments: string;
}

export interface ShiftReportData {
  id: string;
  date: string;
  shift: ShiftType;
  drillId: string;
  operatorName: string;
  bench: string;
  phase: string;
  mesh: string;
  bitBrand: string;
  bitModel: string;
  bitSerial: string;
  bitDiameter: string;
  holes: HoleRecord[];
  status: 'draft' | 'synced' | 'pending';
  aiSummary?: string;
}

export interface SteelChangeData {
  id: string;
  date: string;
  drillId: string;
  shift: ShiftType;
  steelType: SteelType;
  serialNumber: string;
  brand?: string;
  model?: string;
  comments: string;
  status: 'pending' | 'synced';
}

export interface MeasurementData {
  id: string;
  date: string;
  shift: ShiftType;
  drillId: string;
  barraSeguidoraSuperior: string;
  barraSeguidoraMedio: string;
  barraSeguidoraInferior: string;
  barraPatéraSuperior: string;
  barraPatéraMedio: string;
  barraPatéraInferior: string;
  adaptadorInferiorMedio: string;
  status: 'pending' | 'synced';
}

export interface InventoryItem {
  d1: number;
  d2: number;
}

export interface InventoryData {
  date: string;
  inventory: { [key: string]: InventoryItem };
}