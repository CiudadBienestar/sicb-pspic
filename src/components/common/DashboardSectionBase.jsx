import React, { useMemo, useState } from "react";
import { AlertTriangle, BarChart3, RefreshCw } from "lucide-react";
import useSheetData from "../../hooks/useSheetData";

const cleanValue = (value) => String(value ?? "").trim();

// Normaliza texto para comparar encabezados sin importar tildes,
// mayúsculas o espacios extra (mismo criterio que usa Filters.jsx).
const normalizeText = (value) =>
  value
    ?.toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase() ?? "";

// Dado el nombre de columna "esperado" (el que está en vigencias.js),
// busca en las filas reales una clave que coincida de forma flexible.
// Si el encabezado real difiere levemente (tilde, mayúscula, espacio,
// o texto adicional), esto evita que la columna quede en blanco.
const resolveColumn = (rows, expectedColumn) => {
  if (!expectedColumn) return expectedColumn;
  if (rows.some((row) => Object.prototype.hasOwnProperty.call(row, expectedColumn))) {
    return expectedColumn;
  }
  const expected = normalizeText(expectedColumn);
  for (const row of rows) {
    const match = Object.keys(row).find((key) => {
      const current = normalizeText(key);
      return current === expected || current.startsWith(expected) || expected.startsWith(current);
    });
    if (match) return match;
  }
  return expectedColumn;
};

const numberValue = (value) => {
  const normalized = cleanValue(value)
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
};

const average = (rows, column) => {
  if (!column) return null;
  const values = rows
    .map((row) => numberValue(row[column]))
    .filter((value) => Number.isFinite(value));
  return values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : null;
};

const distribution = (rows, column) => {
  if (!column) return [];
  const counts = rows.reduce((result, row) => {
    const value = cleanValue(row[column]) || "Sin dato";
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {});
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
};

const LoadingState = () => (
  <div className="bg-white rounded-xl border border-gray-200 py-14 text-center text-sm text-gray-500">
    Cargando información de la vigencia…
  </div>
);

const ConfigState = ({ sectionLabel }) => (
  <div className="bg-amber-50 rounded-xl border border-amber-200 p-8 text-center">
    <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-3" />
    <h3 className="font-semibold text-amber-900">Fuente de datos pendiente</h3>
    <p className="text-sm text-amber-800 mt-2 max-w-xl mx-auto">
      La vista de {sectionLabel} está lista. Registra el ID del archivo y el GID de la pestaña de Google Sheets para la vigencia 2026 en <code>src/config/vigencias.js</code>.
    </p>
  </div>
);

export default function DashboardSectionBase({ config, definition }) {
  const [filters, setFilters] = useState({});
  const isConfigured = Boolean(
    config?.sheetId &&
      !config.sheetId.startsWith("SHEET_ID_") &&
      Object.values(config.sheets || {}).every(({ gid }) => gid && !String(gid).startsWith("GID_"))
  );
  const { data, loading, error, refetch } = useSheetData(
    config?.sheetId,
    config?.sheets || {},
    { skip: !isConfigured }
  );

  const rows = useMemo(() => {
    const source = Object.values(data).flat();
    return source.filter((row) => Object.values(row).some((value) => cleanValue(value)));
  }, [data]);

  // Resuelve una sola vez los nombres de columna "esperados" (los de
  // vigencias.js) contra las claves reales que trae la hoja.
  const resolvedDefinition = useMemo(() => {
    if (!rows.length) return definition;
    const resolve = (col) => resolveColumn(rows, col);
    return {
      ...definition,
      filters: definition.filters.map((f) => ({ ...f, column: resolve(f.column) })),
      metrics: definition.metrics.map((m) => ({ ...m, column: resolve(m.column) })),
      chart: { ...definition.chart, column: resolve(definition.chart.column) },
      columns: definition.columns.map((c) => ({ ...c, column: resolve(c.column) })),
    };
  }, [rows, definition]);

  const filteredRows = useMemo(
    () => rows.filter((row) => Object.entries(filters).every(([column, value]) => !value || cleanValue(row[column]) === value)),
    [filters, rows]
  );

  const filterOptions = useMemo(() => Object.fromEntries(
    resolvedDefinition.filters.map(({ column }) => [
      column,
      [...new Set(rows.map((row) => cleanValue(row[column])).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
    ])
  ), [resolvedDefinition.filters, rows]);

  const chartData = useMemo(
    () => distribution(filteredRows, resolvedDefinition.chart.column),
    [filteredRows, resolvedDefinition.chart.column]
  );
  const maxChartValue = chartData[0]?.value || 1;

  if (!isConfigured) return <ConfigState sectionLabel={definition.label} />;
  if (loading) return <LoadingState />;

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <span>No fue posible cargar la hoja: {error}</span>
            <button onClick={refetch} className="inline-flex items-center gap-1 font-medium whitespace-nowrap">
              <RefreshCw className="w-4 h-4" /> Reintentar
            </button>
          </div>
          <p className="text-xs leading-relaxed text-red-700">
            Verifica que la hoja de Google Sheets esté compartida con acceso de lectura para todos y que el ID de la hoja y el GID de la pestaña sean correctos.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {resolvedDefinition.metrics.map((metric) => {
          const value = metric.type === "sum"
            ? filteredRows.reduce((total, row) => total + numberValue(row[metric.column]), 0)
            : metric.type === "average"
              ? average(filteredRows, metric.column)
              : metric.type === "unique"
                ? new Set(filteredRows.map((row) => cleanValue(row[metric.column])).filter(Boolean)).size
                : filteredRows.length;
          return (
            <div key={metric.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{metric.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {value === null ? "—" : metric.type === "average" ? `${value.toFixed(1)}${metric.suffix || ""}` : value.toLocaleString("es-CO")}
              </p>
            </div>
          );
        })}
      </div>

      <section className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3 className="font-semibold text-gray-800">Filtros</h3>
          <button onClick={() => setFilters({})} className="text-sm text-blue-700 hover:text-blue-900">Limpiar filtros</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {resolvedDefinition.filters.map(({ column, label }) => (
            <label key={column} className="text-sm text-gray-700">
              <span className="block mb-1 font-medium">{label}</span>
              <select
                value={filters[column] || ""}
                onChange={(event) => setFilters((current) => ({ ...current, [column]: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                {filterOptions[column].map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          ))}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">{resolvedDefinition.chart.label}</h3>
        </div>
        {chartData.length ? <div className="space-y-3">
          {chartData.map(({ label, value }) => (
            <div key={label} className="grid grid-cols-[minmax(90px,180px)_1fr_auto] items-center gap-3 text-sm">
              <span className="truncate text-gray-600" title={label}>{label}</span>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: `${(value / maxChartValue) * 100}%` }} /></div>
              <span className="font-semibold text-gray-800">{value}</span>
            </div>
          ))}
        </div> : <p className="text-sm text-gray-500 py-4">No hay registros para los filtros seleccionados.</p>}
      </section>

      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Registros</h3>
          <span className="text-sm text-gray-500">{filteredRows.length} de {rows.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>{resolvedDefinition.columns.map(({ column, label }) => <th key={column} className="px-4 py-3 font-semibold whitespace-nowrap">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.map((row, index) => <tr key={index} className="hover:bg-gray-50">
                {resolvedDefinition.columns.map(({ column }) => <td key={column} className="px-4 py-3 text-gray-700 max-w-xs">{cleanValue(row[column]) || "—"}</td>)}
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}