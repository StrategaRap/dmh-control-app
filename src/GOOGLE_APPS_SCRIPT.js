
// ------------------------------------------------------------------
// CÓDIGO BACKEND PARA GOOGLE APPS SCRIPT
// Copia todo este contenido dentro del archivo Code.gs en el editor de Google.
// ------------------------------------------------------------------

/**
 * Función principal que recibe los datos desde la App (React)
 */
function doPost(e) {
  // Bloqueo de seguridad para evitar errores si se accede desde el navegador directamente
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "No se recibieron datos POST. Asegúrate de enviar una petición POST con body JSON."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const json = JSON.parse(e.postData.contents);
    const type = json.type; // 'shift_report', 'steel_change', 'measurement', 'inventory_update', 'inventory_fetch'
    const data = json.data;

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // ==========================================
    // LÓGICA 1: REPORTE DE TURNO (PERFORACIÓN)
    // ==========================================
    if (type === 'shift_report') {
      let sheet = ss.getSheetByName("Reportes_Turno");

      // Si no existe, la crea
      if (!sheet) {
        sheet = ss.insertSheet("Reportes_Turno");
      }

      // Si es nueva, crea las cabeceras
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "ID", "Fecha", "Turno", "Perforadora", "Operador", "Banco", "Fase", "Malla",
          "Tricono Marca", "Tricono Modelo", "Tricono Serie", "Tricono Diametro",
          "N° Pozo", "Metros", "Acumulado", "Inicio", "Fin", "Duración", "Terreno", "Pulldown", "RPM", "Comentarios", "AI Summary"
        ]);
        // Formato negrita a la cabecera
        sheet.getRange(1, 1, 1, 23).setFontWeight("bold").setBackground("#e2e8f0");
      }

      // Preparar los datos para insertar
      // Si hay pozos, crea una fila por cada pozo repitiendo los datos de cabecera (Fecha, Operador, etc)
      if (data.holes && data.holes.length > 0) {
        const rows = data.holes.map(hole => [
          data.id,
          data.date,
          data.shift,
          data.drillId,
          data.operatorName,
          data.bench,
          data.phase,
          data.mesh,
          data.bitBrand,
          data.bitModel,
          data.bitSerial,
          data.bitDiameter,
          hole.holeNumber,
          hole.meters,
          hole.cumulativeMeters,
          hole.startTime,
          hole.endTime,
          hole.durationMinutes,
          hole.terrain,
          hole.pulldown,
          hole.rpm,
          hole.comments,
          data.aiSummary || "N/A"
        ]);

        // Insertar en bloque (más rápido)
        const lastRow = sheet.getLastRow();
        sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);
      } else {
        // Si no hay pozos (ej: turno en mantención), guarda solo una fila general
        sheet.appendRow([
          data.id, data.date, data.shift, data.drillId, data.operatorName, data.bench, data.phase, data.mesh,
          data.bitBrand, data.bitModel, data.bitSerial, data.bitDiameter,
          "SIN POZOS", 0, 0, "", "", 0, "", "", "", "", data.aiSummary || ""
        ]);
      }

      // Generar PDF y enviar correo
      sendPdfEmail(data);

      // ==========================================
      // LÓGICA 2: CAMBIO DE ACEROS
      // ==========================================
    } else if (type === 'steel_change') {
      let sheet = ss.getSheetByName("Cambios_Aceros");

      if (!sheet) {
        sheet = ss.insertSheet("Cambios_Aceros");
      }

      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["ID", "Fecha", "Perforadora", "Turno", "Tipo Acero", "Serie", "Comentarios", "Marca", "Modelo"]);
        sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#e2e8f0");
      }

      sheet.appendRow([
        data.id, data.date, data.drillId, data.shift, data.steelType, data.serialNumber, data.comments, data.brand || "", data.model || ""
      ]);

      // ==========================================
      // LÓGICA 3: MEDICIÓN DE ACEROS
      // ==========================================
    } else if (type === 'measurement') {
      let sheet = ss.getSheetByName("Mediciones_Aceros");

      if (!sheet) {
        sheet = ss.insertSheet("Mediciones_Aceros");
      }

      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "ID", "Fecha", "Turno", "Perforadora",
          "Barra Seg. Sup", "Barra Seg. Med", "Barra Seg. Inf",
          "Barra Pat. Sup", "Barra Pat. Med", "Barra Pat. Inf",
          "Adapt. Inf. Med"
        ]);
        sheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#e2e8f0");
      }

      sheet.appendRow([
        data.id, data.date, data.shift, data.drillId,
        data.barraSeguidoraSuperior, data.barraSeguidoraMedio, data.barraSeguidoraInferior,
        data.barraPatéraSuperior, data.barraPatéraMedio, data.barraPatéraInferior,
        data.adaptadorInferiorMedio
      ]);

      // ==========================================
      // LÓGICA 4: ACTUALIZACIÓN DE INVENTARIO
      // ==========================================
    } else if (type === 'inventory_update') {
      let sheet = ss.getSheetByName("Inventario");

      if (!sheet) {
        sheet = ss.insertSheet("Inventario");
      }

      // Cabeceras si es nueva
      if (sheet.getLastRow() === 0) {
        const headers = ["Fecha"];
        // Orden fijo de items para consistencia
        const items = [
          "Amortiguador", "Adaptador superior", "Barra Seguidora", "Barra Patera",
          "Adaptador inferior", "Anillo Guia", "Tricono"
        ];

        items.forEach(item => {
          headers.push(`${item} (D1)`, `${item} (D2)`);
        });

        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
      }

      // Preparar fila
      const row = [data.date];
      const items = [
        "Amortiguador", "Adaptador superior", "Barra Seguidora", "Barra Patera",
        "Adaptador inferior", "Anillo Guia", "Tricono"
      ];

      items.forEach(item => {
        // data.inventory es el objeto { "Amortiguador": {d1: x, d2: y}, ... }
        const itemData = data.inventory[item] || { d1: 0, d2: 0 };
        row.push(itemData.d1, itemData.d2);
      });

      sheet.appendRow(row);

      // ==========================================
      // LÓGICA 5: OBTENER ÚLTIMO INVENTARIO
      // ==========================================
    } else if (type === 'measurements_fetch') {
      const sheet = ss.getSheetByName("Mediciones_Aceros");
      let measurements = [];

      if (sheet && sheet.getLastRow() > 1) {
        const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11);
        const data = dataRange.getValues();

        measurements = data.map(row => ({
          id: row[0],
          date: row[1],
          shift: row[2],
          drillId: String(row[3]),
          barraSeguidoraSuperior: String(row[4] || ''),
          barraSeguidoraMedio: String(row[5] || ''),
          barraSeguidoraInferior: String(row[6] || ''),
          barraPatéraSuperior: String(row[7] || ''),
          barraPatéraMedio: String(row[8] || ''),
          barraPatéraInferior: String(row[9] || ''),
          adaptadorInferiorMedio: String(row[10] || '')
        }));
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: measurements
      })).setMimeType(ContentService.MimeType.JSON);

    } else if (type === 'inventory_fetch') {
      const sheet = ss.getSheetByName("Inventario");
      let lastInventory = null;

      if (sheet && sheet.getLastRow() > 1) {
        const lastRowIndex = sheet.getLastRow();
        const lastRowData = sheet.getRange(lastRowIndex, 1, 1, 15).getValues()[0]; // 1 fecha + 14 datos

        // Reconstruir objeto
        const items = [
          "Amortiguador", "Adaptador superior", "Barra Seguidora", "Barra Patera",
          "Adaptador inferior", "Anillo Guia", "Tricono"
        ];

        lastInventory = {};
        // Index 0 es fecha, datos empiezan en 1
        let colIndex = 1;
        items.forEach(item => {
          lastInventory[item] = {
            d1: Number(lastRowData[colIndex]) || 0,
            d2: Number(lastRowData[colIndex + 1]) || 0
          };
          colIndex += 2;
        });
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: lastInventory
      })).setMimeType(ContentService.MimeType.JSON);

    } else if (type === 'logbook_entry') {
      const logData = data;

      // ID de la carpeta de Google Drive para fotos de bitácora
      const DRIVE_FOLDER_ID = '1MJRNLCajzhT2EpWj5lP48uoOIRb17yCI';

      let photoUrl = '';

      // Si hay foto, guardarla en Drive
      if (logData.photoBase64 && logData.photoBase64.length > 0) {
        try {
          const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
          const photoBlob = Utilities.newBlob(
            Utilities.base64Decode(logData.photoBase64),
            'image/jpeg',
            logData.photoName || 'bitacora_' + logData.id + '.jpg'
          );
          const file = folder.createFile(photoBlob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          photoUrl = file.getUrl();
        } catch (e) {
          console.error("Error guardando foto:", e);
        }
      }

      // Guardar en hoja Bitácora
      let sheet = ss.getSheetByName("Bitácora");
      if (!sheet) {
        sheet = ss.insertSheet("Bitácora");
        sheet.appendRow(["ID", "Fecha", "Título", "Descripción", "Responsable", "URL_Foto", "Timestamp"]);
      }

      sheet.appendRow([
        logData.id,
        logData.date,
        logData.title,
        logData.description || '',
        logData.responsible,
        photoUrl,
        new Date().toISOString()
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Registro de bitácora guardado correctamente.",
        photoUrl: photoUrl
      })).setMimeType(ContentService.MimeType.JSON);

    } else if (type === 'logbook_fetch') {
      const sheet = ss.getSheetByName("Bitácora");
      let events = [];

      if (sheet && sheet.getLastRow() > 1) {
        const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7);
        const data = dataRange.getValues();

        events = data.map(row => ({
          id: row[0],
          date: row[1],
          title: row[2],
          description: row[3],
          responsible: row[4],
          photoUrl: row[5],
          timestamp: row[6]
        }));
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: events
      })).setMimeType(ContentService.MimeType.JSON);

    } else if (type === 'steel_changes_fetch') {
      const sheet = ss.getSheetByName("Cambios_Aceros");
      let changes = [];

      if (sheet && sheet.getLastRow() > 1) {
        // Columnas: A=ID, B=Fecha, C=Perforadora, D=Turno, E=Tipo Acero, F=Serie, G=Comentarios, H=Marca, I=Modelo
        const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9);
        const data = dataRange.getValues();

        changes = data.map(row => ({
          drillId: String(row[2]),   // Columna C = Perforadora
          date: row[1],              // Columna B = Fecha
          component: row[4],         // Columna E = Tipo Acero
          serie: row[5] || '',       // Columna F = Serie
          brand: row[7] || '',       // Columna H = Marca
          model: row[8] || ''        // Columna I = Modelo
        }));
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: changes
      })).setMimeType(ContentService.MimeType.JSON);

    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Tipo de datos desconocido: " + type
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Respuesta exitosa al Frontend (para los casos que no retornan antes)
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Datos guardados y procesados correctamente."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Manejo de errores
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Error en Google Script: " + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Genera un PDF formateado y lo envía al dueño del script
 */
function sendPdfEmail(data) {
  try {
    const docName = `Reporte_${data.drillId}_${data.date}_${data.shift}`;
    const doc = DocumentApp.create(docName);
    const body = doc.getBody();

    // Estilos
    const titleStyle = {};
    titleStyle[DocumentApp.Attribute.FONT_SIZE] = 18;
    titleStyle[DocumentApp.Attribute.BOLD] = true;
    titleStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = '#004B8D'; // Drillco Blue

    const subtitleStyle = {};
    subtitleStyle[DocumentApp.Attribute.FONT_SIZE] = 12;
    subtitleStyle[DocumentApp.Attribute.BOLD] = true;
    subtitleStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = '#666666';

    // --- ENCABEZADO ---
    body.appendParagraph("REPORTE DIARIO DE PERFORACIÓN").setAttributes(titleStyle).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph("FAENA MINISTRO HALES").setAttributes(subtitleStyle).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph("\n");

    // --- TABLA DATOS GENERALES ---
    // Creamos una matriz para la tabla
    const infoData = [
      ["Fecha:", data.date, "Turno:", data.shift],
      ["Perforadora:", data.drillId, "Operador:", data.operatorName],
      ["Banco:", data.bench, "Fase:", data.phase],
      ["Malla:", data.mesh, "", ""]
    ];

    const infoTable = body.appendTable(infoData);
    // Estilo básico tabla info
    infoTable.setBorderWidth(0); // Sin bordes visibles para layout limpio
    for (let r = 0; r < infoTable.getNumRows(); r++) {
      infoTable.getRow(r).getCell(0).setBold(true).setWidth(80);
      infoTable.getRow(r).getCell(2).setBold(true).setWidth(80);
    }

    body.appendParagraph("\n--------------------------------------------------------------------------------\n");

    // --- DATOS DEL TRICONO ---
    body.appendParagraph("DATOS DE HERRAMIENTA (TRICONO)").setHeading(DocumentApp.ParagraphHeading.HEADING3).setForegroundColor('#004B8D');
    const bitText = `Marca: ${data.bitBrand}  |  Modelo: ${data.bitModel}\nSerie: ${data.bitSerial}  |  Diámetro: ${data.bitDiameter}`;
    body.appendParagraph(bitText).setFontFamily("Consolas").setFontSize(10);
    body.appendParagraph("\n");

    // --- TABLA DE POZOS ---
    body.appendParagraph("DETALLE DE POZOS").setHeading(DocumentApp.ParagraphHeading.HEADING3).setForegroundColor('#004B8D');

    if (data.holes && data.holes.length > 0) {
      // Cabeceras tabla pozos
      const tableCells = [['N°', 'Metros', 'Inicio', 'Fin', 'Dur (min)', 'Terreno', 'Obs']];

      // Llenar datos
      data.holes.forEach(h => {
        tableCells.push([
          h.holeNumber.toString(),
          h.meters.toFixed(1),
          h.startTime,
          h.endTime,
          h.durationMinutes.toString(),
          h.terrain,
          h.comments
        ]);
      });

      const table = body.appendTable(tableCells);

      // Estilo Tabla Pozos
      const headerRow = table.getRow(0);
      for (let i = 0; i < headerRow.getNumCells(); i++) {
        headerRow.getCell(i).setBackgroundColor('#004B8D').setForegroundColor('#FFFFFF').setBold(true);
      }

      // Calcular total metros
      const totalMeters = data.holes.reduce((acc, h) => acc + h.meters, 0);
      body.appendParagraph("\n");
      body.appendParagraph(`TOTAL METROS PERFORADOS: ${totalMeters.toFixed(1)} m`).setAttributes(titleStyle).setFontSize(14);

    } else {
      body.appendParagraph("NOTA: No se registraron pozos en este turno.");
    }

    // --- AI SUMMARY ---
    if (data.aiSummary) {
      body.appendParagraph("\nRESUMEN INTELIGENTE (IA)").setHeading(DocumentApp.ParagraphHeading.HEADING3).setForegroundColor('#004B8D');
      const summaryPar = body.appendParagraph(data.aiSummary);
      summaryPar.setItalic(true).setBackgroundColor('#f8fafc').setPaddingLeft(10);
    }

    doc.saveAndClose();

    // --- ENVÍO DE CORREO ---
    const pdf = doc.getAs(MimeType.PDF);
    const emailAddr = Session.getActiveUser().getEmail(); // Se envía al dueño del script

    MailApp.sendEmail({
      to: emailAddr,
      subject: `[DrillLog] Reporte ${data.drillId} - ${data.date} - Turno ${data.shift}`,
      body: `Estimado/a,\n\nAdjunto encontrará el reporte de perforación generado automáticamente.\n\nResumen:\n- Equipo: ${data.drillId}\n- Operador: ${data.operatorName}\n- Fecha: ${data.date}\n\nAtte,\nSistema DrillLog Pro`,
      attachments: [pdf]
    });

    // Limpieza: Borrar el doc temporal para no llenar el Drive
    DriveApp.getFileById(doc.getId()).setTrashed(true);

  } catch (e) {
    Logger.log("Error generando PDF: " + e.toString());
    // No lanzamos el error para no fallar la respuesta al frontend, solo lo logueamos en Apps Script
  }
}