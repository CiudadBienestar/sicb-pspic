import React, { useMemo, useCallback } from 'react';
import { useDashboard } from "../vigencias/2025/DashboardParticipantes";
import columnsMap from "../../config/columnsMap";

// Configuración centralizada
const FILTER_CONFIG = {
  equipo: "Equipo/Problemática",
  entorno: "Entornos Abordados", 
  actividad: "Actividad/Proceso",
  zona: "Zona"
};

const FilterSelect = ({ label, field }) => {
  const { filters, setFilters, tab, acciones, procesos } = useDashboard();

  // Memoizar función de obtención de datos
  const getData = useCallback(() => {
    switch (tab) {
      case 'acciones': return acciones;
      case 'procesos': return procesos;
      default: return [...acciones, ...procesos];
    }
  }, [tab, acciones, procesos]);

  // Memoizar función de mapeo de columnas
  const getColumnName = useCallback((field, dataType) => {
    return columnsMap[dataType]?.[field] || field;
  }, []);

  // Memoizar valores únicos con dependencias específicas
  const values = useMemo(() => {
    let data = getData();

    // Aplicar filtros existentes (excepto el actual)
    const otherFilters = Object.fromEntries(
      Object.entries(filters).filter(([key]) => key !== field)
    );

    if (Object.keys(otherFilters).length > 0) {
      data = data.filter(item => {
        return Object.entries(otherFilters).every(([filterKey, filterValue]) => {
          if (!filterValue) return true;

          let itemValue;
          if (tab === 'acciones') {
            itemValue = item[getColumnName(filterKey, 'acciones')];
          } else if (tab === 'procesos') {
            itemValue = item[getColumnName(filterKey, 'procesos')];
          } else {
            // Para 'todo', intentar ambos tipos
            itemValue = item[getColumnName(filterKey, 'acciones')] || 
                       item[getColumnName(filterKey, 'procesos')];
          }

          return itemValue?.toString().trim() === filterValue;
        });
      });
    }

    // Extraer valores únicos
    const uniqueValues = new Set();
    
    data.forEach(item => {
      let value;
      
      if (tab === 'acciones') {
        value = item[getColumnName(field, 'acciones')];
      } else if (tab === 'procesos') {
        value = item[getColumnName(field, 'procesos')];
      } else {
        value = item[getColumnName(field, 'acciones')] || 
                item[getColumnName(field, 'procesos')];
      }

      if (value?.toString().trim()) {
        uniqueValues.add(value.toString().trim());
      }
    });

    return Array.from(uniqueValues).sort();
  }, [getData, filters, field, tab, getColumnName]);

  // Memoizar handler de cambio
  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      
      if (value === '' || value === 'Todos') {
        delete newFilters[field];
      } else {
        newFilters[field] = value;
      }
      
      return newFilters;
    });
  }, [field, setFilters]);

  const isDisabled = values.length === 0;
  const currentValue = filters[field] || '';

  return (
    <div className="flex flex-col text-sm">
      <label className="text-gray-700 font-medium mb-1">{label}</label>
      <select
        className={`border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'
        }`}
        value={currentValue}
        onChange={handleChange}
        disabled={isDisabled}
        aria-label={`Filtrar por ${label}`}
      >
        <option value="">
          {isDisabled ? 'No hay opciones disponibles' : 'Todos'}
        </option>
        {values.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      {isDisabled && (
        <span className="text-xs text-gray-500 mt-1">
          Sin opciones con los filtros actuales
        </span>
      )}
    </div>
  );
};

const Filters = () => {
  const { filters, setFilters } = useDashboard();

  // Memoizar función de limpieza
  const clearFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  // Memoizar función de remoción individual
  const removeFilter = useCallback((filterKey) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      delete newFilters[filterKey];
      return newFilters;
    });
  }, [setFilters]);

  // Memoizar estado de filtros activos
  const hasActiveFilters = useMemo(() => 
    Object.keys(filters).length > 0, 
    [filters]
  );

  // Memoizar entradas de filtros
  const filterEntries = useMemo(() => 
    Object.entries(filters), 
    [filters]
  );

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-600 hover:text-red-800 underline transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800 font-medium mb-2">
            Filtros activos:
          </div>
          <div className="flex flex-wrap gap-2">
            {filterEntries.map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {FILTER_CONFIG[key] || key}: {value}
                <button
                  onClick={() => removeFilter(key)}
                  className="ml-1 text-blue-600 hover:text-blue-800 transition-colors focus:outline-none"
                  aria-label={`Remover filtro ${FILTER_CONFIG[key] || key}`}
                >
                  ×
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