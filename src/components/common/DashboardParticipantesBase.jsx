import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import useSheetData from "../../hooks/useSheetData";
import SummaryCards from "./SummaryCards";
import Filters from "./Filters";
import ChartsSection from "./ChartsSection";

const DEFAULT_CAMPOS_GENERALES = [
  { field: "curso", label: "Curso de Vida" },
  { field: "sexo", label: "Sexo" },
  { field: "etnia", label: "Etnia" },
  { field: "comuna", label: "Comuna/Corregimiento" },
  { field: "entorno", label: "Entornos Abordados" },
  { field: "zona", label: "Zona" },
];

const DEFAULT_CAMPOS_PROCESOS = [
  { field: "preferencia", label: "Preferencia sexual" },
  { field: "escolaridad", label: "Escolaridad" },
  { field: "discapacidad", label: "Personas con discapacidad" },
  { field: "salud", label: "Tipo de afiliación a salud" },
];

const DEFAULT_FILTER_FIELDS = [
  { field: "equipo", label: "Equipo/Problemática" },
  { field: "entorno", label: "Entornos Abordados" },
  { field: "actividad", label: "Actividad/Proceso" },
  { field: "zona", label: "Zona" },
];

const EMPTY_ROWS = [];

const DashboardContext = createContext(null);

const useDashboardParticipantes = () => useContext(DashboardContext);

const normalizeText = (value) =>
  value
    ?.toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase() ?? "";

const findColumnKey = (row, expectedColumn) => {
  if (!row || !expectedColumn) return expectedColumn;
  if (Object.prototype.hasOwnProperty.call(row, expectedColumn)) {
    return expectedColumn;
  }

  const expected = normalizeText(expectedColumn);
  return Object.keys(row).find((key) => {
    const current = normalizeText(key);
    return current === expected || current.startsWith(expected);
  });
};

const normalizeRows = (rows, columnMap) =>
  rows.map((row) => {
    let normalizedRow = row;

    Object.values(columnMap).forEach((expectedColumn) => {
      if (!expectedColumn || row[expectedColumn] !== undefined) return;

      const sourceColumn = findColumnKey(row, expectedColumn);
      if (!sourceColumn || row[sourceColumn] === undefined) return;

      if (normalizedRow === row) normalizedRow = { ...row };
      normalizedRow[expectedColumn] = row[sourceColumn];
    });

    return normalizedRow;
  });

const applyFilters = (data, columnMap, filters) => {
  if (!filters || Object.keys(filters).length === 0) return data;

  return data.filter((item) =>
    Object.entries(filters).every(([key, value]) => {
      if (!value || value === "Todos") return true;
      return normalizeText(item[columnMap[key]]) === normalizeText(value);
    })
  );
};

const getRowId = (row, colAcciones, colProcesos) =>
  row[colAcciones.no] || row[colProcesos.no];

const DashboardParticipantesBase = ({
  year,
  config,
  setParticipantesGlobal,
  camposGenerales = DEFAULT_CAMPOS_GENERALES,
  camposProcesos = DEFAULT_CAMPOS_PROCESOS,
  filterFields = DEFAULT_FILTER_FIELDS,
  children,
}) => {
  const [tab, setTab] = useState("todo");
  const [showUnique, setShowUnique] = useState(false);
  const [filters, setFilters] = useState({});

  const { data, loading, error } = useSheetData(config.sheetId, config.sheets);

  const colAcciones = config.columns.acciones;
  const colProcesos = config.columns.procesos;

  const acciones = useMemo(
    () => normalizeRows(data.acciones ?? EMPTY_ROWS, colAcciones),
    [data.acciones, colAcciones]
  );

  const procesos = useMemo(
    () => normalizeRows(data.procesos ?? EMPTY_ROWS, colProcesos),
    [data.procesos, colProcesos]
  );

  const columns = useMemo(
    () => ({ acciones: colAcciones, procesos: colProcesos }),
    [colAcciones, colProcesos]
  );

  const filteredAcciones = useMemo(
    () => applyFilters(acciones, colAcciones, filters),
    [acciones, colAcciones, filters]
  );

  const filteredProcesos = useMemo(
    () => applyFilters(procesos, colProcesos, filters),
    [procesos, colProcesos, filters]
  );

  const filteredData = useMemo(() => {
    if (tab === "acciones") return filteredAcciones;
    if (tab === "procesos") return filteredProcesos;
    return [...filteredAcciones, ...filteredProcesos];
  }, [tab, filteredAcciones, filteredProcesos]);

  const participantesGlobal = useMemo(() => {
    if (!showUnique) return acciones.length + procesos.length;

    return new Set(
      [...acciones, ...procesos]
        .map((row) => getRowId(row, colAcciones, colProcesos))
        .filter(Boolean)
    ).size;
  }, [acciones, procesos, showUnique, colAcciones, colProcesos]);

  React.useEffect(() => {
    if (setParticipantesGlobal) {
      setParticipantesGlobal(participantesGlobal);
    }
  }, [participantesGlobal, setParticipantesGlobal]);

  const toggleUnique = useCallback(() => setShowUnique((prev) => !prev), []);
  const clearFilters = useCallback(() => setFilters({}), []);
  const removeFilter = useCallback(
    (key) =>
      setFilters((prev) => {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      }),
    []
  );

  const hasActiveFilters = Object.values(filters).some(
    (value) => value && value !== "Todos"
  );

  const contextValue = useMemo(
    () => ({
      acciones,
      procesos,
      filteredAcciones,
      filteredProcesos,
      filteredData,
      tab,
      setTab,
      showUnique,
      setShowUnique,
      toggleUnique,
      filters,
      setFilters,
      clearFilters,
      removeFilter,
      columns,
      participantesGlobal,
      loading,
      error,
      year,
      camposGenerales,
      camposProcesos,
      filterFields,
    }),
    [
      acciones,
      procesos,
      filteredAcciones,
      filteredProcesos,
      filteredData,
      tab,
      showUnique,
      filters,
      toggleUnique,
      clearFilters,
      removeFilter,
      columns,
      participantesGlobal,
      loading,
      error,
      year,
      camposGenerales,
      camposProcesos,
      filterFields,
    ]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">Cargando participantes {year}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center py-12 text-center">
        <div className="text-red-600 text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Error al cargar los datos
        </h3>
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

  return (
    <DashboardContext.Provider value={contextValue}>
      <ParticipantesToolbar />
      {hasActiveFilters && <ActiveFiltersBanner />}
      {children ?? <ParticipantesDefaultContent />}
    </DashboardContext.Provider>
  );
};

const ParticipantesToolbar = () => {
  const { tab, setTab, showUnique, toggleUnique } = useDashboardParticipantes();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
      <div className="flex flex-wrap gap-2">
        {[
          { key: "todo", icon: "📊", label: "Ver Todo" },
          { key: "acciones", icon: "📢", label: "Acciones Informativas" },
          { key: "procesos", icon: "🎓", label: "Procesos Formativos" },
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
  );
};

const ActiveFiltersBanner = () => {
  const { filters, removeFilter, clearFilters } = useDashboardParticipantes();

  return (
    <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
      <div className="flex items-center flex-wrap gap-2">
        <span className="text-blue-800 text-sm font-medium">🔍 Filtros activos:</span>
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters)
            .filter(([, value]) => value && value !== "Todos")
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
  );
};

export const ParticipantesFilters = () => {
  const { tab, acciones, procesos, columns, filters, setFilters, filterFields } =
    useDashboardParticipantes();

  return (
    <Filters
      tab={tab}
      acciones={acciones}
      procesos={procesos}
      columns={columns}
      filters={filters}
      setFilters={setFilters}
      filterFields={filterFields}
    />
  );
};

export const ParticipantesSummaryCards = () => {
  const {
    tab,
    acciones,
    procesos,
    filteredAcciones,
    filteredProcesos,
    filteredData,
    showUnique,
    columns,
  } = useDashboardParticipantes();

  return (
    <SummaryCards
      tab={tab}
      acciones={acciones}
      procesos={procesos}
      filteredAcciones={filteredAcciones}
      filteredProcesos={filteredProcesos}
      filteredData={filteredData}
      showUnique={showUnique}
      columns={columns}
    />
  );
};

export const ParticipantesChartsSection = () => {
  const { tab, filteredData, showUnique, columns, camposGenerales, camposProcesos } =
    useDashboardParticipantes();

  return (
    <ChartsSection
      tab={tab}
      filteredData={filteredData}
      showUnique={showUnique}
      columns={columns}
      camposGenerales={camposGenerales}
      camposProcesos={camposProcesos}
    />
  );
};

const ParticipantesDefaultContent = () => (
  <div id="reporte-participantes" className="space-y-4">
    <ParticipantesSummaryCards />
    <ParticipantesFilters />
    <ParticipantesChartsSection />
  </div>
);

export default DashboardParticipantesBase;
