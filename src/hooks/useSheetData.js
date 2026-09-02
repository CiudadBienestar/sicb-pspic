import { useEffect, useState, useCallback, useRef } from "react";
import Papa from "papaparse";

const fetchSheet = async (sheetId, gid, headerRow = 1) => {
  const url = `/api/sheets/${encodeURIComponent(sheetId)}/${encodeURIComponent(gid)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "text/csv,application/csv,text/plain,*/*",
    },
  });
  if (!response.ok) {
    throw new Error(`Error ${response.status}: No se pudo cargar la hoja (gid: ${gid})`);
  }
  let csv = await response.text();

  // Si el encabezado real no está en la primera fila (p. ej. la hoja
  // tiene un título o una fila extra arriba), se descartan las filas
  // anteriores para que Papa.parse tome la fila correcta como header.
  if (headerRow > 1) {
    const lines = csv.split(/\r\n|\n/);
    csv = lines.slice(headerRow - 1).join("\n");
  }

  // Normalizar encabezados para evitar warnings por duplicados
  const headerSeen = {};
  const { data } = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    transformHeader: (h) => {
      const name = h?.toString().trim();
      if (!name) return name;
      if (headerSeen[name] === undefined) {
        headerSeen[name] = 0;
        return name;
      }
      headerSeen[name] += 1;
      return `${name}_${headerSeen[name]}`;
    },
  });
  // Post-procesar filas: normalizar claves quitando sufijos _n generados
  const normalizeKey = (k) => {
    if (!k) return k;
    return k.toString().trim().replace(/_\d+$/i, "");
  };

  const normalized = data.map((row) => {
    const out = {};
    Object.keys(row).forEach((origKey) => {
      const base = normalizeKey(origKey);
      if (!base) return; // omitir cabeceras vacías

      const val = row[origKey];
      // Si aún no existe el campo base, asignarlo.
      // Si ya existe y está vacío, reemplazar por el nuevo valor no vacío.
      if (out[base] === undefined || out[base] === null || out[base] === "") {
        out[base] = val;
      }
    });
    return out;
  });

  return normalized;
};

/**
 * @param {string} sheetId        - ID del Google Spreadsheet
 * @param {Object} sheetsConfig   - { nombreHoja: { gid: "..." }, ... }
 * @param {Object} [options]
 * @param {boolean} [options.skip] - Si es true, no carga nada (para vigencias no listas)
 */
export default function useSheetData(sheetId, sheetsConfig, { skip = false } = {}) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);

  const configRef = useRef(sheetsConfig);
  configRef.current = sheetsConfig;

  const load = useCallback(async () => {
    if (skip || !sheetId || sheetId.startsWith("SHEET_ID_")) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const entries = Object.entries(configRef.current);
      const results = await Promise.all(
        entries.map(async ([key, { gid, headerRow }]) => {
          const rows = await fetchSheet(sheetId, gid, headerRow);
          return [key, rows];
        })
      );

      // Log de depuración: mostrar cabeceras y primera fila por hoja (más explícito)
      try {
        const expectedKeys = [
          "Equipo",
          "Actividad",
          "Descripción Producto",
          "Evidencia",
          "Cumplimiento Tarea",
          "Estado",
          "Tecnologías",
          "Id",
          "Fecha Taller",
          "Tema",
        ];

        results.forEach(([sheetName, rows]) => {
          if (!Array.isArray(rows) || rows.length === 0) {
            console.debug(`[useSheetData] Hoja: ${sheetName} sin filas`);
            return;
          }

          const cols = Object.keys(rows[0]);
          console.debug(`[useSheetData] Hoja: ${sheetName}, filas cargadas: ${rows.length}, columnas:`, cols);
          try {
            console.debug(`[useSheetData] Hoja: ${sheetName}, primera fila JSON: ${JSON.stringify(rows[0])}`);
          } catch (err) {
            console.debug(`[useSheetData] Hoja: ${sheetName}, primera fila (no serializable)`, rows[0]);
          }

          const present = expectedKeys.filter((k) => cols.includes(k));
          console.debug(`[useSheetData] Hoja: ${sheetName}, claves esperadas presentes:`, present);
        });
      } catch (e) {
        console.warn("[useSheetData] Error al generar logs de depuración:", e);
      }

      setData(Object.fromEntries(results));
    } catch (err) {
      console.error("Error cargando datos de Google Sheets:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sheetId, skip]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}