import { useEffect, useState } from "react";
import Papa from "papaparse";

export default function useGoogleSheetData(sheetId, sheetsConfig) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const results = await Promise.all(
          Object.entries(sheetsConfig).map(async ([key, { gid }]) => {
            const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`Error ${response.status}: No se pudo cargar la hoja "${key}"`);
            }
            const text = await response.text();
            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true }).data;
            return [key, parsed];
          })
        );

        const newData = Object.fromEntries(results);
        setData(newData);
      } catch (err) {
        console.error("Error cargando datos de Google Sheets:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sheetId, sheetsConfig]);

  return { data, loading, error };
}