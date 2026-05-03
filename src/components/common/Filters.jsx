import React, { useMemo, useCallback } from "react";

/**
 * Filters — Genérico para cualquier vigencia.
 *
 * Props:
 *   tab            "todo" | "acciones" | "procesos"
 *   acciones       filas crudas de acciones
 *   procesos       filas crudas de procesos
 *   filters        { [campo]: valor }
 *   setFilters     setter de estado
 *   columns        { acciones: { equipo, entorno, actividad, zona, … },
 *                    procesos:  { equipo, entorno, actividad, zona, … } }
 *   filterFields   Array de { field: string, label: string }
 *                  Campos que se mostrarán como filtros.
 *                  Por defecto: equipo, entorno, actividad, zona.
 */

const DEFAULT_FILTER_FIELDS = [
  { field: "equipo",    label: "Equipo/Problemática"  },
  { field: "entorno",   label: "Entornos Abordados"   },
  { field: "actividad", label: "Actividad/Proceso"    },
  { field: "zona",      label: "Zona"                 },
];

const normalizeText = (value) =>
  value
    ?.toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase() ?? "";

const FIELD_ALIASES = {
  actividad: ["actividad/proceso", "actividad/tematica", "actividad", "proceso", "nombre del proceso"],
  equipo: ["equipo/problematica", "eje/equipo", "equipo"],
  entorno: ["entornos abordados", "entorno"],
  zona: ["zona"],
  pic: ["tecnologias del pic implementadas", "tecnologias del pic", "pic implementadas", "pic"],
};

// Nombre de meses en español para ordenar
const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/**
 * Intenta extraer el mes desde un valor de fecha.
 * Acepta: Date serializable, "dd/mm/yyyy", "yyyy-mm-dd", nombre de mes, número de mes.
 */
const extractMonth = (value) => {
  if (!value) return null;
  const str = value.toString().trim();

  // Nombre de mes directo
  const normalized = normalizeText(str);
  const byName = MESES_ES.find((m) => normalized.includes(m));
  if (byName) return byName.charAt(0).toUpperCase() + byName.slice(1);

  // Intentar parsear como fecha
  let date = null;

  // dd/mm/yyyy o d/m/yyyy
  const ddmmyyyy = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    const fullYear = y.length === 2 ? `20${y}` : y;
    date = new Date(`${fullYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
  } else {
    date = new Date(str);
  }

  if (date && !isNaN(date.getTime())) {
    const mes = MESES_ES[date.getMonth()];
    return mes.charAt(0).toUpperCase() + mes.slice(1);
  }

  return null;
};

const findColumnKey = (row, expectedColumn, field) => {
  if (!row || !expectedColumn) return expectedColumn;
  if (Object.prototype.hasOwnProperty.call(row, expectedColumn)) {
    return expectedColumn;
  }

  const expected = normalizeText(expectedColumn);
  const exactOrPrefixMatch = Object.keys(row).find((key) => {
    const current = normalizeText(key);
    return current === expected || current.startsWith(expected);
  });

  if (exactOrPrefixMatch) return exactOrPrefixMatch;

  const aliases = FIELD_ALIASES[field] ?? [];
  return Object.keys(row).find((key) => {
    const current = normalizeText(key);
    return aliases.some((alias) => current.includes(alias));
  });
};

// ─── FilterSelect ────────────────────────────────────────────────────────────

const FilterSelect = ({ label, field, tab, acciones, procesos, columns, filters, setFilters }) => {
  const colA = columns.acciones;
  const colP = columns.procesos;

  // Campo "mes" es especial: extrae el mes de la columna "fecha" de acciones
  const isMesField = field === "mes";

  const getColumnName = useCallback(
    (f, type) => (type === "acciones" ? colA[f] : colP[f]) || f,
    [colA, colP]
  );

  const currentData = useMemo(() => {
    if (tab === "acciones") return acciones;
    if (tab === "procesos") return procesos;
    return [...acciones, ...procesos];
  }, [tab, acciones, procesos]);

  const getItemValue = useCallback(
    (item, f) => {
      if (f === "mes") {
        // Lee la columna "fecha" de acciones
        const fechaCol = colA["fecha"] || "Fecha";
        const resolvedCol = findColumnKey(item, fechaCol, "fecha");
        return extractMonth(item[resolvedCol]);
      }

      const getValue = (type) => {
        const columnName = getColumnName(f, type);
        const resolvedColumn = findColumnKey(item, columnName, f);
        return item[resolvedColumn];
      };

      if (tab === "acciones") return getValue("acciones");
      if (tab === "procesos") return getValue("procesos");
      return getValue("acciones") || getValue("procesos");
    },
    [tab, getColumnName, colA]
  );

  // Datos con todos los filtros aplicados excepto el actual (cascada)
  const filteredData = useMemo(() => {
    const others = Object.entries(filters).filter(([k]) => k !== field);
    if (others.length === 0) return currentData;
    return currentData.filter((item) =>
      others.every(([k, v]) => {
        if (!v) return true;
        return normalizeText(getItemValue(item, k)) === normalizeText(v);
      })
    );
  }, [currentData, filters, field, getItemValue]);

  const values = useMemo(() => {
    const collectValues = (rows) => {
      const set = new Set();
      rows.forEach((item) => {
        const v = getItemValue(item, field)?.toString().trim();
        if (v) set.add(v);
      });
      return set;
    };

    let set = collectValues(filteredData);

    // Si una combinación previa deja la cascada sin opciones, evita deshabilitar
    // el filtro: muestra las opciones disponibles de la vista actual.
    if (set.size === 0 && filteredData !== currentData) {
      set = collectValues(currentData);
    }

    return Array.from(set).sort((a, b) => {
      if (isMesField) {
        const ia = MESES_ES.indexOf(a.toLowerCase());
        const ib = MESES_ES.indexOf(b.toLowerCase());
        return ia - ib;
      }
      return a.localeCompare(b, "es", { sensitivity: "base" });
    });
  }, [filteredData, currentData, field, getItemValue, isMesField]);

  const valueCount = values.length;

  const handleChange = useCallback(
    (e) => {
      const value = e.target.value;
      setFilters((prev) => {
        if (!value || value === "Todos") {
          const { [field]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [field]: value };
      });
    },
    [field, setFilters]
  );

  const isDisabled = valueCount === 0;
  const currentValue = filters[field] || "";

  return (
    <div className="flex flex-col">
      <label htmlFor={`filter-${field}`} className="text-sm text-gray-700 font-medium mb-2">
        {label}
      </label>
      <select
        id={`filter-${field}`}
        className={`border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
          isDisabled
            ? "bg-gray-100 cursor-not-allowed text-gray-500"
            : "bg-white hover:border-gray-400"
        }`}
        value={currentValue}
        onChange={handleChange}
        disabled={isDisabled}
        aria-label={`Filtrar por ${label}`}
      >
        <option value="">{isDisabled ? "No hay opciones" : "Todos"}</option>
        {values.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
      <div className="h-5 mt-1">
        {isDisabled ? (
          <span className="text-xs text-gray-500">Sin opciones disponibles</span>
        ) : (
          <span className="text-xs text-gray-500">
            {values.length} opción{values.length !== 1 ? "es" : ""} disponible
            {values.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Filters ─────────────────────────────────────────────────────────────────

const Filters = ({
  tab,
  acciones,
  procesos,
  columns,
  filters,
  setFilters,
  filterFields = DEFAULT_FILTER_FIELDS,
}) => {
  const clearFilters = useCallback(() => setFilters({}), [setFilters]);

  const removeFilter = useCallback(
    (key) => setFilters((prev) => { const { [key]: _, ...rest } = prev; return rest; }),
    [setFilters]
  );

  // Filtros visibles según el tab activo (respeta onlyTabs)
  const visibleFields = useMemo(
    () => filterFields.filter(({ onlyTabs }) => !onlyTabs || onlyTabs.includes(tab) || tab === "todo"),
    [filterFields, tab]
  );

  // Cuando cambia el tab, limpiar filtros que ya no son aplicables
  const prevTabRef = React.useRef(tab);
  React.useEffect(() => {
    if (prevTabRef.current !== tab) {
      prevTabRef.current = tab;
      const visibleFieldKeys = new Set(visibleFields.map((f) => f.field));
      setFilters((prev) => {
        const filtered = Object.fromEntries(
          Object.entries(prev).filter(([k]) => visibleFieldKeys.has(k))
        );
        return Object.keys(filtered).length === Object.keys(prev).length ? prev : filtered;
      });
    }
  }, [tab, visibleFields, setFilters]);

  const activeFilters = useMemo(
    () => Object.entries(filters).filter(([, v]) => v),
    [filters]
  );

  const hasActiveFilters = activeFilters.length > 0;

  // Mapa field→label para los badges de filtros activos
  const fieldLabelMap = useMemo(
    () => Object.fromEntries(filterFields.map(({ field, label }) => [field, label])),
    [filterFields]
  );

  return (
    <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="text-xl">🔍</span>
          Filtros
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
            aria-label="Limpiar todos los filtros"
          >
            Limpiar todos
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {visibleFields.map(({ field, label }) => (
          <FilterSelect
            key={field}
            label={label}
            field={field}
            tab={tab}
            acciones={acciones}
            procesos={procesos}
            columns={columns}
            filters={filters}
            setFilters={setFilters}
          />
        ))}
      </div>

      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-gray-700">Filtros activos:</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
              {activeFilters.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <span className="font-semibold">{fieldLabelMap[key] || key}:</span>
                <span>{value}</span>
                <button
                  onClick={() => removeFilter(key)}
                  className="ml-1 text-blue-600 hover:text-blue-900 hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label={`Remover filtro ${fieldLabelMap[key] || key}`}
                  title="Remover filtro"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;
