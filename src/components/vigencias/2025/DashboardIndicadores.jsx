import React, { useState, useMemo } from "react";
import useGoogleSheetData from "../../../hooks/useGoogleSheetData";
import { Eye } from "lucide-react";

const SHEET_ID = "1yzHOO9ZHq9UFjNz4x73LGjv1SQ4DEUrZjzbXy8xX3i0";
const SHEETS = {
  indicadores: { gid: "36239036" },
};

const columnasDeseadas = [
  "Equipo",
  "Producto",
  "Actividad",
  "Grupo Poblacional",
  "Indicador Aplicado",
  "Tipo de Indicador",
  "Ámbito",
  "Meta 2025",
  "Resultado 2025",
  "Estado Indicador",
];

const renderProgressBar = (valor) => {
  if (!valor || valor.trim() === "") return <span className="text-gray-400 italic">Sin datos</span>;

  const porcentaje = parseFloat(valor.toString().replace("%", "").trim());

  if (isNaN(porcentaje)) {
    return <span className="text-gray-700 italic">{valor}</span>;
  }

  const porcentajeClamped = Math.max(0, Math.min(porcentaje, 100));
  let color = "bg-red-500";

  if (porcentajeClamped >= 75) color = "bg-green-500";
  else if (porcentajeClamped >= 50) color = "bg-yellow-500";
  else if (porcentajeClamped >= 25) color = "bg-orange-400";

  return (
    <div className="w-full h-4 bg-gray-200 rounded relative">
      <div
        className={`${color} h-4 rounded`}
        style={{ width: `${porcentajeClamped}%` }}
        title={`${porcentajeClamped}%`}
      />
    </div>
  );
};

// Modal de Interpretación
const ModalInterpretacion = ({ isOpen, onClose, indicador }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 transform transition-all">
          {/* Encabezado */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Interpretación del Indicador
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {indicador?.["Indicador Aplicado"]} - {indicador?.["Estado Indicador"]}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Eye className="w-5 h-5 text-gray-500" />

            </button>
          </div>

          {/* Contenido */}
          <div className="p-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Equipo</h4>
                <p className="text-gray-900">{indicador?.["Equipo"]}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Ámbito</h4>
                <p className="text-gray-900">{indicador?.["Ámbito"]}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Meta 2025</h4>
                <p className="text-gray-900">{indicador?.["Meta 2025"]}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Resultado 2025</h4>
                <p className="text-gray-900">{indicador?.["Resultado 2025"]}</p>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">Cumplimiento de Meta</h4>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  {renderProgressBar(indicador?.["Resultado 2025"])}
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {indicador?.["Resultado 2025"]}
                </span>
              </div>
            </div>

            {/* Interpretación Indicador */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Interpretación de Resultados
              </h4>
              <p className="text-blue-900 leading-relaxed">
                {indicador?.["Interpretación General de Resultados"] || "No hay interpretación disponible para este indicador."}
              </p>
            </div>

            {/* Enlace a Evidencias */}
            {indicador?.["Enlace URL evidencias indicadores"] && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Evidencias de implemtación Indicador
                </h4>
                <a
                  href={indicador["Enlace URL evidencias indicadores"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-green-700 hover:text-green-900 hover:underline font-medium transition-colors"
                >
                  <span className="break-all">Ver evidencias</span>
                  <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>

          {/* Pie de Página */}
          <div className="flex justify-end p-6 border-t border-gray-200">
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

const filtros = ["Equipo", "Indicador Aplicado", "Grupo Poblacional", "Ámbito"];

function DashboardIndicadores() {
  const { data, loading, error } = useGoogleSheetData(SHEET_ID, SHEETS);
  const indicadoresData = data.indicadores || [];

  const [filtrosSeleccionados, setFiltrosSeleccionados] = useState({
    Equipo: "",
    "Indicador Aplicado": "",
    "Tipo de Indicador": "",
    Ámbito: "",
  });

  // Estados para el modal
  const [modalOpen, setModalOpen] = useState(false);
  const [indicadorSeleccionado, setIndicadorSeleccionado] = useState(null);

  // Función para abrir el modal
  const abrirModal = (indicador) => {
    setIndicadorSeleccionado(indicador);
    setModalOpen(true);
  };

  // Función para cerrar el modal
  const cerrarModal = () => {
    setModalOpen(false);
    setIndicadorSeleccionado(null);
  };

  // Datos Únicos filtros
  const opcionesFiltro = useMemo(() => {
    const opciones = {};

    filtros.forEach((filtroActual) => {
      const filtrosActivos = { ...filtrosSeleccionados };
      delete filtrosActivos[filtroActual];

      const datosFiltradosParcial = indicadoresData.filter((item) =>
        Object.entries(filtrosActivos).every(
          ([clave, valor]) => !valor || item[clave] === valor
        )
      );

      opciones[filtroActual] = [
        ...new Set(
          datosFiltradosParcial.map((item) => item[filtroActual]).filter(Boolean)
        ),
      ].sort();
    });

    return opciones;
  }, [indicadoresData, filtrosSeleccionados]);

  // Filtrar datos según selección
  const datosFiltrados = useMemo(() => {
    return indicadoresData.filter((item) =>
      filtros.every((filtro) =>
        filtrosSeleccionados[filtro]
          ? item[filtro] === filtrosSeleccionados[filtro]
          : true
      )
    );
  }, [indicadoresData, filtrosSeleccionados]);

  // Estadísticas actualizadas
  const estadisticas = useMemo(() => {
    const equiposUnicos = new Set(datosFiltrados.map(item => item.Equipo)).size;

    // Filtrar solo indicadores con estado válido)
    const indicadoresConEstado = datosFiltrados.filter(item => {
      const estado = item["Estado Indicador"];
      return estado &&
        estado.trim() !== "" &&
        estado.toLowerCase() !== "no aplica" &&
        estado.toLowerCase() !== "n/a";
    });

    const metaCumplida = indicadoresConEstado.filter(item =>
      item["Estado Indicador"] &&
      item["Estado Indicador"].toLowerCase().includes("meta cumplida")
    ).length;

    const metaNoCumplida = indicadoresConEstado.filter(item =>
      item["Estado Indicador"] &&
      item["Estado Indicador"].toLowerCase().includes("meta no cumplida")
    ).length;

    return { equiposUnicos, metaCumplida, metaNoCumplida };
  }, [datosFiltrados]);

  const handleFiltroChange = (e, filtro) => {
    setFiltrosSeleccionados((prev) => ({
      ...prev,
      [filtro]: e.target.value,
    }));
  };

  const limpiarFiltros = () => {
    setFiltrosSeleccionados({
      Equipo: "",
      "Indicador Aplicado": "",
      "Tipo de Indicador": "",
      Ámbito: "",
    });
  };

  // Estados
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> No es posible cargar los datos intente más tarde. {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Fecha: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Tarjetas de Datos*/}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl p-6 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Total Indicadores</h3>
              <p className="text-2xl font-bold text-blue-600">{datosFiltrados.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl p-6 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Equipos</h3>
              <p className="text-2xl font-bold text-green-600">{estadisticas.equiposUnicos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl p-6 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Meta Cumplida</h3>
              <p className="text-2xl font-bold text-green-600">{estadisticas.metaCumplida}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl p-6 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Meta no Cumplida</h3>
              <p className="text-2xl font-bold text-red-600">{estadisticas.metaNoCumplida}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros*/}
      <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
          <button
            onClick={limpiarFiltros}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg transition-colors duration-200"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Tabla de Datos */}
      <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Resultados ({datosFiltrados.length} indicadores)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                {columnasDeseadas.map((col) => (
                  <th
                    key={col}
                    className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[80px] max-w-[150px]"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {datosFiltrados.length > 0 ? (
                datosFiltrados.map((fila, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                    {columnasDeseadas.map((col) => (
                      <td
                        key={col}
                        className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-900"
                      >
                        {col === "Resultado 2025" ? (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 justify-center">
                            <div className="w-10 sm:w-12 flex-shrink-0">
                              {renderProgressBar(fila[col])}
                            </div>
                            <span className="text-xs text-gray-600 font-medium">
                              {fila[col] || "0%"}
                            </span>
                          </div>
                        ) : col === "Estado Indicador" ? (
                          <button
                            onClick={() => abrirModal(fila)}
                            className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-1 py-0.5"
                            title="Ver interpretación del indicador"
                          >
                            {fila[col] || "Sin estado"}
                          </button>
                        ) : (
                          <div className="max-w-[100px] sm:max-w-[130px]">
                            <p className="line-clamp-2 leading-relaxed text-center" title={fila[col]}>
                              {fila[col] || <span className="text-gray-400 italic">Sin datos</span>}
                            </p>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columnasDeseadas.length} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-lg font-medium">No se encontraron indicadores</p>
                      <p className="text-sm">Ajustar los filtros para ver más resultados</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Interpretación */}
      <ModalInterpretacion
        isOpen={modalOpen}
        onClose={cerrarModal}
        indicador={indicadorSeleccionado}
      />
    </div>
  );
}

export default DashboardIndicadores;
