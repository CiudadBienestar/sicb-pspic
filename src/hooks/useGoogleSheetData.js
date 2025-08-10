import { useEffect, useState } from "react";
import Papa from "papaparse";

export default function useGoogleSheetData(sheetId, sheetsConfig) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const results = await Promise.all(
        Object.entries(sheetsConfig).map(async ([key, { gid }]) => {
          const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
          const response = await fetch(url);
          const text = await response.text();
          const parsed = Papa.parse(text, { header: true }).data;
          return [key, parsed];
        })
      );
      const newData = Object.fromEntries(results);
      setData(newData);
      setLoading(false);
    }

    fetchData();
  }, [sheetId, sheetsConfig]);

  return { data, loading };
}
