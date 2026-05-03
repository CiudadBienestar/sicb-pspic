import { useEffect, useState, useCallback, useRef } from "react";
import Papa from "papaparse";

const fetchSheet = async (sheetId, gid) => {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error ${response.status}: No se pudo cargar la hoja (gid: ${gid})`);
  }
  const csv = await response.text();
  const { data } = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  return data;
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

  // Evitar re-fetches si sheetsConfig cambia de referencia pero no de contenido
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
        entries.map(async ([key, { gid }]) => {
          const rows = await fetchSheet(sheetId, gid);
          return [key, rows];
        })
      );

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
