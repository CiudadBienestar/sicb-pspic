import React, {
  useState,
  useEffect,
  useMemo,
  createContext,
  useContext,
} from "react";
import Papa from "papaparse";
import columnsMap from "../../../config/columnsMap";

const DashboardContext = createContext();

export const useDashboard = () => useContext(DashboardContext);

const SHEET_ID = "1srJaMCHuNcwcKVyLbKOAREf03BNn88jeSkD5qyvN42E";

const sheetConfig = {
  acciones: {
    gid: "759616433",
  },
  procesos: {
    gid: "20459118",
  },
};

const fetchSheet = async (gid) => {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("No se pudo cargar la hoja: " + response.status);
  const csv = await response.text();
  const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });
  return data;
};

const DashboardParticipantes = ({ children }) => {
  const [acciones, setAcciones] = useState([]);
  const [procesos, setProcesos] = useState([]);
  const [tab, setTab] = useState("todo");
  const [showUnique, setShowUnique] = useState(false);
  const [filters, setFilters] = useState({});
  const [participantesGlobal, setParticipantesGlobal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const accionesData = await fetchSheet(sheetConfig.acciones.gid);
        const procesosData = await fetchSheet(sheetConfig.procesos.gid);

        setAcciones(accionesData);
        setProcesos(procesosData);

        // Calcular el total de participantes para acciones
        const totalAcciones = accionesData.reduce((sum, item) => {
          const val = parseInt(item["Número de Participantes"] || "0", 10);
          return sum + (isNaN(val) ? 0 : val);
        }, 0);

        // Calcular el total de participantes para procesos
        const totalProcesos = procesosData.reduce((sum, item) => {
          const val = parseInt(item["Número de Participantes"] || "0", 10);
          return sum + (isNaN(val) ? 0 : val);
        }, 0);

        // Sumar ambos y actualizar el contexto
        if (setParticipantesGlobal) {
          setParticipantesGlobal(totalAcciones + totalProcesos);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredAcciones = useMemo(() => {
    return acciones.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === "Todos") return true;
        const columnKey = columnsMap.acciones[key];
        return item[columnKey] === value;
      });
    });
  }, [acciones, filters]);

  const filteredProcesos = useMemo(() => {
    return procesos.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === "Todos") return true;
        const columnKey = columnsMap.procesos[key];
        return item[columnKey] === value;
      });
    });
  }, [procesos, filters]);

  const filteredData = useMemo(() => {
    if (tab === "acciones") return filteredAcciones;
    if (tab === "procesos") return filteredProcesos;
    return [...filteredAcciones, ...filteredProcesos];
  }, [tab, filteredAcciones, filteredProcesos]);

  const contextValue = {
    acciones,
    procesos,
    tab,
    setTab,
    showUnique,
    setShowUnique,
    filters,
    setFilters,
    filteredAcciones,
    filteredProcesos,
    filteredData,
    participantesGlobal,
    setParticipantesGlobal,
    loading,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={contextValue}>
      {/* Header mejorado con mejor responsive y spacing */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
        {/* Tabs con mejor diseño */}
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === "todo"
                ? "bg-blue-600 text-white shadow-md transform scale-105"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200"
            }`}
            onClick={() => setTab("todo")}
          >
            📊 Ver Todo
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === "acciones"
                ? "bg-blue-600 text-white shadow-md transform scale-105"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200"
            }`}
            onClick={() => setTab("acciones")}
          >
            📢 Acciones Informativas
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === "procesos"
                ? "bg-blue-600 text-white shadow-md transform scale-105"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200"
            }`}
            onClick={() => setTab("procesos")}
          >
            🎓 Procesos Formativos
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">
            Mostrar:
          </span>
          <button
            className={`relative inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showUnique
                ? "bg-green-600 text-white shadow-md"
                : "bg-blue-600 text-white shadow-md"
            } hover:shadow-lg transform hover:scale-105`}
            onClick={() => setShowUnique(!showUnique)}
          >
            {showUnique ? (
              <>
                <span className="mr-2">👤</span>
                Participantes Únicos
              </>
            ) : (
              <>
                <span className="mr-2">📈</span>
                Totales
              </>
            )}
          </button>
        </div>
      </div>

      {/* Indicador de filtros activos */}
      {Object.keys(filters).some(key => filters[key] && filters[key] !== "Todos") && (
        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
          <div className="flex items-center">
            <span className="text-blue-800 text-sm font-medium">
              🔍 Filtros activos: 
            </span>
            <div className="ml-2 flex flex-wrap gap-2">
              {Object.entries(filters)
                .filter(([_, value]) => value && value !== "Todos")
                .map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {key}: {value}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, [key]: "Todos" }))}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ✕
                    </button>
                  </span>
                ))
              }
              <button
                onClick={() => setFilters({})}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
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