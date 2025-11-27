import React, {
  useState,
  useEffect,
  useMemo,
  createContext,
  useContext,
  useCallback,
} from "react";
import Papa from "papaparse";
import columnsMap from "../../../config/columnsMap";

const DashboardContext = createContext();

export const useDashboard = () => useContext(DashboardContext);

const SHEET_ID = "1srJaMCHuNcwcKVyLbKOAREf03BNn88jeSkD5qyvN42E";

const sheetConfig = {
  acciones: { gid: "759616433" },
  procesos: { gid: "20459118" },
};

const fetchSheet = async (gid) => {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Error ${response.status}: No se pudo cargar la hoja`);
  const csv = await response.text();
  const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true, dynamicTyping: true });
  return data;
};

const DashboardParticipantes = ({ children }) => {
  const [acciones, setAcciones] = useState([]);
  const [procesos, setProcesos] = useState([]);
  const [tab, setTab] = useState("todo");
  const [showUnique, setShowUnique] = useState(false);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [accionesData, procesosData] = await Promise.all([
          fetchSheet(sheetConfig.acciones.gid),
          fetchSheet(sheetConfig.procesos.gid)
        ]);

        setAcciones(accionesData);
        setProcesos(procesosData);
      } catch (error) {
        console.error("Error cargando datos:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Función helper para filtrar datos
  const applyFilters = useCallback((data, columnMapType) => {
    if (Object.keys(filters).length === 0) return data;
    
    return data.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === "Todos") return true;
        const columnKey = columnsMap[columnMapType][key];
        return item[columnKey] === value;
      });
    });
  }, [filters]);

  const filteredAcciones = useMemo(() => 
    applyFilters(acciones, 'acciones'), 
    [acciones, applyFilters]
  );

  const filteredProcesos = useMemo(() => 
    applyFilters(procesos, 'procesos'), 
    [procesos, applyFilters]
  );

  const filteredData = useMemo(() => {
    if (tab === "acciones") return filteredAcciones;
    if (tab === "procesos") return filteredProcesos;
    return [...filteredAcciones, ...filteredProcesos];
  }, [tab, filteredAcciones, filteredProcesos]);

  // Calcular participantes globales de forma optimizada
  const participantesGlobal = useMemo(() => {
    const sumParticipantes = (data) => 
      data.reduce((sum, item) => {
        const val = parseInt(item["Número de Participantes"] || "0", 10);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

    return sumParticipantes(acciones) + sumParticipantes(procesos);
  }, [acciones, procesos]);

  // Callbacks optimizados
  const clearFilters = useCallback(() => setFilters({}), []);
  
  const removeFilter = useCallback((key) => {
    setFilters(prev => ({ ...prev, [key]: "Todos" }));
  }, []);

  const toggleUnique = useCallback(() => {
    setShowUnique(prev => !prev);
  }, []);

  const contextValue = useMemo(() => ({
    acciones,
    procesos,
    tab,
    setTab,
    showUnique,
    setShowUnique,
    toggleUnique,
    filters,
    setFilters,
    clearFilters,
    removeFilter,
    filteredAcciones,
    filteredProcesos,
    filteredData,
    participantesGlobal,
    loading,
    error,
  }), [
    acciones,
    procesos,
    tab,
    showUnique,
    filters,
    filteredAcciones,
    filteredProcesos,
    filteredData,
    participantesGlobal,
    loading,
    error,
    toggleUnique,
    clearFilters,
    removeFilter,
  ]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center py-12 text-center">
        <div className="text-red-600 text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar los datos</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const hasActiveFilters = Object.values(filters).some(value => value && value !== "Todos");

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "todo", icon: "📊", label: "Ver Todo" },
            { key: "acciones", icon: "📢", label: "Acciones Informativas" },
            { key: "procesos", icon: "🎓", label: "Procesos Formativos" }
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === key
                  ? "bg-blue-600 text-white shadow-md transform scale-105"
                  : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200"
              }`}
              onClick={() => setTab(key)}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">Mostrar:</span>
          <button
            className={`relative inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showUnique
                ? "bg-green-600 text-white shadow-md"
                : "bg-blue-600 text-white shadow-md"
            } hover:shadow-lg transform hover:scale-105`}
            onClick={toggleUnique}
          >
            <span className="mr-2">{showUnique ? "👤" : "📈"}</span>
            {showUnique ? "Participantes Únicos" : "Totales"}
          </button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-blue-800 text-sm font-medium">🔍 Filtros activos:</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters)
                .filter(([_, value]) => value && value !== "Todos")
                .map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {key}: {value}
                    <button
                      onClick={() => removeFilter(key)}
                      className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                      aria-label={`Eliminar filtro ${key}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
              >
                Limpiar todos
              </button>
            </div>
          </div>
        </div>
      )}

      {children}
    </DashboardContext.Provider>
  );
};

export default DashboardParticipantes;
