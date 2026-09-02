// Wrapper para compatibilidad: reutiliza `useSheetData` existente
import useSheetData from "./useSheetData";

export default function useGoogleSheetData(sheetId, sheetsConfig, options = {}) {
  // `useSheetData` ya implementa la lógica de fetch y parsing CSV/PapaParse.
  return useSheetData(sheetId, sheetsConfig, options);
}