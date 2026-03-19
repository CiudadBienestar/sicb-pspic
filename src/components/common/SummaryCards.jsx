import React from "react";
import { useDashboard } from "../vigencias/2025/DashboardParticipantes";
import columnsMap from "../../config/columnsMap";
import { Users, Percent, BookOpenCheck, Goal, GraduationCap } from "../../icons/icons";

const SummaryCards = () => {
  const {
    tab,
    acciones,
    procesos,
    filteredAcciones,
    filteredProcesos,
    filteredData,
    showUnique,
  } = useDashboard();

  const getFilteredData = () => {
    switch (tab) {
      case "acciones": return filteredAcciones;
      case "procesos": return filteredProcesos;
      default:         return filteredData;
    }
  };

  const data = getFilteredData();

  const getIdKey = (tipo) => columnsMap[tipo]?.no || "No de Identificación";

  // Fix: en modo "todo", usar ambas claves de ID en lugar de "Nombre de la actividad" (campo inexistente)
  const getIdForRow = (d, tabActual) => {
    if (tabActual === "acciones") return d[getIdKey("acciones")];
    if (tabActual === "procesos") return d[getIdKey("procesos")];
    return d[getIdKey("acciones")] || d[getIdKey("procesos")];
  };

  const participantesTotal = showUnique
    ? new Set(
        data.map((d) => getIdForRow(d, tab)).filter(Boolean)
      ).size
    : data.length;

  // Fix: participantesGlobal debe basarse en datos SIN filtrar (acciones y procesos crudos)
  const participantesGlobal = showUnique
    ? new Set(
        [...acciones, ...procesos]
          .map((d) => d[getIdKey("acciones")] || d[getIdKey("procesos")])
          .filter(Boolean)
      ).size
    : acciones.length + procesos.length;

  const calculateUniqueActivities = () => {
    const actividades = new Set();
    const headerValues = [
      "Actividad/Proceso", "Nombre de la actividad",
      "actividad", "proceso", "Actividad", "Proceso",
    ];
    data.forEach((item) => {
      let actividadValue;
      if (tab === "acciones") {
        actividadValue = item[columnsMap.acciones.actividad];
      } else if (tab === "procesos") {
        actividadValue = item[columnsMap.procesos.actividad];
      } else {
        actividadValue =
          item[columnsMap.acciones.actividad] ||
          item[columnsMap.procesos.actividad];
      }
      if (typeof actividadValue === "string" && actividadValue.trim() !== "") {
        const cleanValue = actividadValue.trim();
        const isHeader = headerValues.some(
          (h) => cleanValue.toLowerCase() === h.toLowerCase()
        );
        if (!isHeader) actividades.add(cleanValue);
      }
    });
    return actividades.size;
  };

  const totalActividades = data.length > 0 ? calculateUniqueActivities() : 0;

  const porcentaje =
    tab === "todo"
      ? 100
      : participantesGlobal
        ? ((participantesTotal / participantesGlobal) * 100).toFixed(1)
        : 0;

  return (
    // ✅ data-pdf-block: el generador PDF tratará estas tarjetas como un bloque único
    <div data-pdf-block className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <div className="bg-white shadow rounded-lg p-4">
        <h4 className="text-sm text-gray-500 mb-1 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          Total Participantes
        </h4>
        <p className="text-2xl font-semibold text-gray-900">{participantesGlobal}</p>
      </div>

      {tab !== "todo" && (
        <div className="bg-white shadow rounded-lg p-4">
          <h4 className="text-sm text-gray-500 mb-1 flex items-center gap-2">
            {tab === "acciones" && <Goal className="w-4 h-4 text-blue-500" />}
            {tab === "procesos" && <GraduationCap className="w-4 h-4 text-green-500" />}
            {tab === "acciones"
              ? "Participantes en Acciones Masivas/Informativas"
              : "Participantes en Procesos Formativos"}
          </h4>
          <p className="text-2xl font-semibold text-gray-900">{participantesTotal}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-4">
        <h4 className="text-sm text-gray-500 mb-1 flex items-center gap-2">
          <Percent className="w-4 h-4 text-blue-500" />
          {tab === "todo" ? "Participantes" : "% de Participación"}
        </h4>
        <p className="text-2xl font-semibold text-gray-900">
          {tab === "todo" ? "100%" : `${porcentaje}%`}
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <h4 className="text-sm text-gray-500 mb-1 flex items-center gap-2">
          <BookOpenCheck className="w-4 h-4 text-blue-500" />
          Total de Actividades
        </h4>
        <p className="text-2xl font-semibold text-gray-900">{totalActividades}</p>
      </div>
    </div>
  );
};

export default SummaryCards;