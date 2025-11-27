import React, { useMemo, useCallback } from 'react';
import { useDashboard } from "../vigencias/2025/DashboardParticipantes";
import columnsMap from "../../config/columnsMap";

const FILTER_CONFIG = {
  equipo: "Equipo/Problemática",
  entorno: "Entornos Abordados", 
  actividad: "Actividad/Proceso",
  zona: "Zona"
};

const FilterSelect = ({ label, field }) => {
  const { filters, setFilters, tab, acciones, procesos } = useDashboard();

  // Obtener nombre de columna según el tipo de datos
  const getColumnName = useCallback((field, dataType) => {
    return columnsMap[dataType]?.[field] || field;
  }, []);

  // Obtener datos según el tab actual
  const currentData = useMemo(() => {
    switch (tab) {
      case 'acciones': return acciones;
      case 'procesos': return procesos;
      default: return [...acciones, ...procesos];
    }
  }, [tab, acciones, procesos]);

  // Obtener valor de un item según el tab
  const getItemValue = useCallback((item, field) => {
    if (tab === 'acciones') {
      return item[getColumnName(field, 'acciones')];
    } else if (tab === 'procesos') {
      return item[getColumnName(field, 'procesos')];
    } else {
      return item[getColumnName(field, 'acciones')] || 
             item[getColumnName(field, 'procesos')];
    }
  }, [tab, getColumnName]);

  // Aplicar filtros excepto el actual
  const filteredData = useMemo(() => {
    const otherFilters = Object.entries(filters).filter(([key]) => key !== field);
    
    if (otherFilters.length === 0) return currentData;

    return currentData.filter(item => {
      return otherFilters.every(([filterKey, filterValue]) => {
        if (!filterValue) return true;
        const itemValue = getItemValue(item, filterKey);
        return itemValue?.toString().trim() === filterValue;
      });
    });
  }, [currentData, filters, field, getItemValue]);

  // Extraer valores únicos
  const values = useMemo(() => {
    const uniqueValues = new Set();
    
    filteredData.forEach(item => {
      const value = getItemValue(item, field);
      const trimmedValue = value?.toString().trim();
      
      if (trimmedValue) {
        uniqueValues.add(trimmedValue);
      }
    });

    return Array.from(uniqueValues).sort((a, b) => 
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );
  }, [filteredData, field, getItemValue]);

  // Handler de cambio
  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setFilters(prev => {
      if (!value || value === 'Todos') {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [field]: value };
    });
  }, [field, setFilters]);

  const isDisabled = values.length === 0;
  const currentValue = filters[field] || '';

  return (
    <div className="flex flex-col">
      <label 
        htmlFor={`filter-${field}`}
        className="text-sm text-gray-700 font-medium mb-2"
      >
        {label}
      </label>
      <select
        id={`filter-${field}`}
        className={`border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
          isDisabled 
            ? 'bg-gray-100 cursor-not-allowed text-gray-500' 
            : 'bg-white hover:border-gray-400'
        }`}
        value={currentValue}
        onChange={handleChange}
        disabled={isDisabled}
        aria-label={`Filtrar por ${label}`}
      >
        <option value="">
          {isDisabled ? 'No hay opciones' : 'Todos'}
        </option>
        {values.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      <div className="h-5 mt-1">
        {isDisabled ? (
          <span className="text-xs text-gray-500">
            Sin opciones disponibles
          </span>
        ) : (
          <span className="text-xs text-gray-500">
            {values.length} opción{values.length !== 1 ? 'es' : ''} disponible{values.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
};

const Filters = () => {
  const { filters, setFilters } = useDashboard();

  // Limpiar todos los filtros
  const clearFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  // Remover filtro individual
  const removeFilter = useCallback((filterKey) => {
    setFilters(prev => {
      const { [filterKey]: _, ...rest } = prev;
      return rest;
    });
  }, [setFilters]);

  // Estado de filtros activos
  const activeFilters = useMemo(() => 
    Object.entries(filters).filter(([_, value]) => value),
    [filters]
  );

  const hasActiveFilters = activeFilters.length > 0;

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
        {Object.entries(FILTER_CONFIG).map(([field, label]) => (
          <FilterSelect 
            key={field} 
            label={label} 
            field={field} 
          />
        ))}
      </div>

      {/* Filtros activos */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Filtros activos:
            </span>
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
                <span className="font-semibold">{FILTER_CONFIG[key] || key}:</span>
                <span>{value}</span>
                <button
                  onClick={() => removeFilter(key)}
                  className="ml-1 text-blue-600 hover:text-blue-900 hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label={`Remover filtro ${FILTER_CONFIG[key] || key}`}
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
