import type { ShiftReportData, SteelChangeData, MeasurementData, InventoryData } from '../types';

export const uploadDataToSheet = async (
  reportData: ShiftReportData | null,
  steelData: SteelChangeData | null,
  measurementData: MeasurementData | null,
  inventoryData: InventoryData | null,
  scriptUrl: string,
  customType?: string
): Promise<{ success: boolean; message: string; data?: any }> => {

  if (!scriptUrl || scriptUrl.includes("INSERT_YOUR")) {
    return { success: false, message: "URL del Script no configurada." };
  }

  try {
    let type = 'shift_report';
    let data: any = reportData;

    if (customType) {
      type = customType;
      data = inventoryData || {};
    } else if (steelData) {
      type = 'steel_change';
      data = steelData;
    } else if (measurementData) {
      type = 'measurement';
      data = measurementData;
    } else if (inventoryData) {
      type = 'inventory_update';
      data = inventoryData;
    }

    const payload = {
      type: type,
      data: data
    };

    const response = await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      redirect: "follow",
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const text = await response.text();

    // Verificar si la respuesta es HTML (Login de Google o Error)
    if (text.trim().startsWith("<") || text.includes("<!DOCTYPE html>")) {
      return {
        success: false,
        message: "Error de Permisos: El script devolvió una página de login. Verifica que el Web App esté desplegado como 'Anyone' (Cualquier usuario)."
      };
    }

    try {
      const result = JSON.parse(text);
      return result;
    } catch (e) {
      return { success: false, message: "Respuesta inválida del servidor (No es JSON)." };
    }

  } catch (error) {
    console.error("Error de subida:", error);
    return {
      success: false,
      message: `Error de conexión: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};