import React, { useState, useMemo } from "react";
import useGoogleSheetData from "../../../hooks/useGoogleSheetData";
import { Eye, X } from "lucide-react";

const SHEET_ID = "1pp0vSZMI0Lfkm329ZZ1bUjJF8eLlOzckJ_vmpyXdWwI";
const SHEETS = {
  actividades: { gid: "1913714559" },
};

const columnasDeseadas = [
  "Equipo",
  "Descripción Producto",
  "Actividad",
  "Evidencia",
  "Cumplimiento Tarea",
  "Estado",
  "Entornos",
  "Tecnologías",
];

const renderProgressBar = (valor) => {
  if (!valor) return <span className="text-gray-400 italic">Sin datos</span>;

  const porcentaje = parseFloat(valor.toString().replace("%", "").trim());
  if (isNaN(porcentaje)) {
    return <span className="text-gray-400 italic">Sin datos</span>;
  }

  const porcentajeClamped = Math.max(0, Math.min(porcentaje, 100));
  let color = "bg-red-500";

  if (porcentajeClamped >= 75) color = "bg-green-500";
  else if (porcentajeClamped >= 50) color = "bg-yellow-500";
  else if (porcentajeClamped >= 25) color = "bg-orange-400";

  return (
    <div className="w-full h-3 bg-gray-200 rounded-full">
      <div
        className={`${color} h-3 rounded-full transition-all duration-300`}
        style={{ width: `${porcentajeClamped}%` }}
        title={`${porcentajeClamped}%`}
      />
    </div>
  );
};
// Modal Detalle de Actividad
const ModalDetalleActividad = ({ isOpen, onClose, actividad }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 transform transition-all max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Detalle de Actividad
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {actividad?.["Actividad"]} - {actividad?.["Estado"]}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Equipo</h4>
                <p className="text-gray-900">{actividad?.["Equipo"] || "No especificado"}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Tecnologías</h4>
                <p className="text-gray-900">{actividad?.["Tecnologías"] || "No especificado"}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">Descripción del Producto</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 leading-relaxed">
                  {actividad?.["Descripción Producto"] || "No hay descripción disponible."}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">Evidencia</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 leading-relaxed">
                  {actividad?.["Evidencia"] || "No hay evidencia disponible."}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">Cumplimiento de Tarea</h4>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  {renderProgressBar(actividad?.["Cumplimiento Tarea"])}
                </div>
                <span className="text-lg font-medium text-gray-900 min-w-[4rem]">
                  {actividad?.["Cumplimiento Tarea"] || "0%"}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Observación Cumplimiento
              </h4>
              <p className="text-blue-900 leading-relaxed">
                {actividad?.["Observación Cumplimiento"] || "No hay observaciones disponibles para esta actividad."}
              </p>
            </div>
          </div>

          <div className="flex justify-end p-6 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const filtros = ["Equipo", "Estado", "Entornos"];

function DashboardActividades() {
  const { data, loading, error } = useGoogleSheetData(SHEET_ID, SHEETS);
  const actividadesData = data.actividades || [];
  const [filtrosSeleccionados, setFiltrosSeleccionados] = useState({
    Equipo: "",
    Estado: "",
    Entornos: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);

  const abrirModal = (actividad) => {
    setActividadSeleccionada(actividad);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setActividadSeleccionada(null);
  };

  // Filtros inicial
  const datosFiltrados = useMemo(() => {
    return actividadesData.filter((item) =>
      filtros.every((filtro) =>
        filtrosSeleccionados[filtro]
          ? item[filtro] === filtrosSeleccionados[filtro]
          : true
      )
    );
  }, [filtrosSeleccionados, actividadesData]);

  // Filtros secundarios interdependientes
  const opcionesFiltro = useMemo(() => {
    const opciones = {};

    filtros.forEach((filtroActual) => {
      const filtrosActivos = { ...filtrosSeleccionados };
      delete filtrosActivos[filtroActual];

      const datosFiltradosParcial =
        Object.values(filtrosActivos).every((v) => v === "")
          ? actividadesData
          : actividadesData.filter((item) =>
            Object.entries(filtrosActivos).every(
              ([clave, valor]) =>
                !valor ||
                (item[clave]?.toString().trim() === valor.toString().trim())
            )
          );

      opciones[filtroActual] = [
        ...new Set(
          datosFiltradosParcial
            .map((item) => (item[filtroActual] || "").toString().trim())
            .filter(Boolean)
        ),
      ].sort();
    });

    return opciones;
  }, [filtrosSeleccionados, actividadesData]);


  const estadisticas = useMemo(() => {
    const equiposUnicos = new Set(datosFiltrados.map(item => item.Equipo)).size;
    const tecnologias = new Set(datosFiltrados.map(item => item.Tecnologías)).size;
    const estadosUnicos = new Set(datosFiltrados.map(item => item.Estado)).size;

    const cumplimientos = datosFiltrados
      .map(item => parseFloat(item["Cumplimiento Tarea"]?.toString().replace("%", "").trim() || "0"))
      .filter(val => !isNaN(val));
    const promedioCumplimiento = cumplimientos.length > 0
      ? (cumplimientos.reduce((a, b) => a + b, 0) / cumplimientos.length).toFixed(1)
      : 0;

    return { equiposUnicos, tecnologias, estadosUnicos, promedioCumplimiento };
  }, [datosFiltrados]);

  const handleFiltroChange = (e, filtro) => {
    setFiltrosSeleccionados((prev) => ({
      ...prev,
      [filtro]: e.target.value,
    }));
  };

  const limpiarFiltros = () => {
    const limpio = filtros.reduce((acc, filtro) => {
      acc[filtro] = "";
      return acc;
    }, {});
    setFiltrosSeleccionados(limpio);
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Carga de información */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando datos...</span>
        </div>
      )}

      {/* Error de carga de datos */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error al cargar los datos</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Encabezado */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Fecha: {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* Tarjetas*/}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Total Actividades</h3>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{datosFiltrados.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Equipos</h3>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{estadisticas.equiposUnicos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Tecnologías</h3>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">{estadisticas.tecnologias}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Promedio Cumplimiento</h3>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">{estadisticas.promedioCumplimiento}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white shadow-md rounded-xl p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
              <button
                onClick={limpiarFiltros}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg transition-colors duration-200"
              >
                Limpiar filtros
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtros.map((filtro) => (
                <div key={filtro}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {filtro}
                  </label>
                  <select
                    value={filtrosSeleccionados[filtro]}
                    onChange={(e) => handleFiltroChange(e, filtro)}
                    className="w-full border border-gray-300 rounded-lg p-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  >
                    <option value="">Todos ({opcionesFiltro[filtro]?.length || 0})</option>
                    {opcionesFiltro[filtro]?.map((valor) => (
                      <option key={valor} value={valor}>
                        {valor}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Tabla de Datos*/}
          <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Actividades ({datosFiltrados.length} registros)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[60px]">
                      Equipo
                    </th>
                    <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">
                      Descripción Producto
                    </th>
                    <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">
                      Actividad
                    </th>
                    <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">
                      Evidencia
                    </th>
                    <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                      Cumplimiento
                    </th>
                    <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                      Estado
                    </th>
                    <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                      Tecnologías
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {datosFiltrados.length > 0 ? (
                    datosFiltrados.map((fila, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 font-medium">
                          <div className="truncate max-w-[60px]" title={fila["Equipo"]}>
                            {fila["Equipo"] || <span className="text-gray-400 italic">Sin datos</span>}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                          <div className="max-w-[200px] sm:max-w-[300px]">
                            <p className="line-clamp-2 sm:line-clamp-3 leading-relaxed" title={fila["Descripción Producto"]}>
                              {fila["Descripción Producto"] || <span className="text-gray-400 italic">Sin datos</span>}
                            </p>
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                          <div className="max-w-[150px] sm:max-w-[200px]">
                            <p className="line-clamp-2 leading-relaxed" title={fila["Actividad"]}>
                              {fila["Actividad"] || <span className="text-gray-400 italic">Sin datos</span>}
                            </p>
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                          <div className="max-w-[150px] sm:max-w-[200px]">
                            <p className="line-clamp-2 leading-relaxed" title={fila["Evidencia"]}>
                              {fila["Evidencia"] || <span className="text-gray-400 italic">Sin datos</span>}
                            </p>
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <div className="w-12 sm:w-16 flex-shrink-0">
                              {renderProgressBar(fila["Cumplimiento Tarea"])}
                            </div>
                            <span className="text-xs text-gray-600 font-medium">
                              {fila["Cumplimiento Tarea"] || "0%"}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs sm:text-sm">
                          <button
                            onClick={() => abrirModal(fila)}
                            className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-1 py-0.5"
                            title="Ver detalles de la actividad"
                          >
                            {fila["Estado"] || "Sin estado"}
                          </button>
                        </td>
                        <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                          <div className="max-w-[120px] sm:max-w-[150px]">
                            <p className="line-clamp-2 leading-relaxed" title={fila["Tecnologías"]}>
                              {fila["Tecnologías"] || <span className="text-gray-400 italic">Sin datos</span>}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="text-lg font-medium">No se encontraron actividades</p>
                          <p className="text-sm">Rajustar los filtros para ver más resultados</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}

      {/* Modal Detalle Actividad*/}
      <ModalDetalleActividad
        isOpen={modalOpen}
        onClose={cerrarModal}
        actividad={actividadSeleccionada}
      />
    </div>
  );
}

export default DashboardActividades;