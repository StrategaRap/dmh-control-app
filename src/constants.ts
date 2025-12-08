import { DrillModel, Diameter, SteelType } from './types';

// NOTA: Esta URL será reemplazada por el usuario en la configuración de la App.
export const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbzuYjBU0Va9nJ1ias4ZkGmVh-PBoZxN9_leNA3nhcOPQ8uXi7I2e8bmQLAxDmXv7tY/exec";

export const DRILL_OPTIONS = Object.values(DrillModel);
export const DIAMETER_OPTIONS = Object.values(Diameter);
export const STEEL_OPTIONS = Object.values(SteelType);

// Updated URLs provided by user
export const CODELCO_LOGO_URL = "https://thumbs2.imgbox.com/f8/bb/R3O876rn_t.jpg";
export const DRILLCO_LOGO_URL = "https://thumbs2.imgbox.com/fe/03/PRRq0luH_t.jpg";

// Utility ultra-segura para generar IDs únicos (Versión Simplificada Matemática)
// Evita errores de 'crypto is not defined' en navegadores antiguos o contextos no seguros
export const generateUUID = () => {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `id-${timestamp}-${randomPart}`;
};