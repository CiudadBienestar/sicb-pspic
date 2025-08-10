import React from "react";
import { useDashboard } from "../vigencias/2025/DashboardParticipantes";
import columnsMap from "../../config/columnsMap";
import { Users, Percent, BookOpenCheck, Goal, GraduationCap } from "../../icons/icons.js";


const SummaryCards = () => {
  const {
    tab,
    filteredAcciones,
    filteredProcesos,
    filteredData,
    showUnique,
  } = useDashboard();

  const getFilteredData = () => {
    switch (tab) {
      case "acciones":
        return filteredAcciones;
      case "procesos":
        return filteredProcesos;
      default:
        return filteredData;
    }
  };

  const data = getFilteredData();

 const getIdKey = (tipo) => columnsMap[tipo]?.no || "No de Identificación";

const participantesTotal = showUnique
  ? new Set(
      data.map((d) => {
        const tipo =
          tab === "acciones"
            ? "acciones"
            : tab === "procesos"
            ? "procesos"
            : d["Nombre de la actividad"]
            ? "acciones"
            : "procesos";
        return d[getIdKey(tipo)];
      }).filter(Boolean)
    ).size
  : data.length;

const participantesGlobal = showUnique
  ? new Set(
      [...filteredAcciones, ...filteredProcesos]
        .map((d) => {
          const tipo = d["Nombre de la actividad"] ? "acciones" : "procesos";
          return d[getIdKey(tipo)];
        })
        .filter(Boolean)
    ).size
  : [...filteredAcciones, ...filteredProcesos].length;


  const calculateUniqueActivities = () => {
    const actividades = new Set();
    const headerValues = [
      "Actividad/Proceso",
      "Nombre de la actividad",
      "actividad",
      "proceso",
      "Actividad",
      "Proceso",
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
          (header) => cleanValue.toLowerCase() === header.toLowerCase()
        );
        if (!isHeader) {
          actividades.add(cleanValue);
        }
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <div className="bg-white shadow rounded-lg p-4">
        <h4 className="text-sm text-gray-500 mb-1 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          Total Participantes
        </h4>
        <p className="text-2xl font-semibold text-gray-900">
          {participantesGlobal}
        </p>
      </div>

      {tab !== "todo" && (
        <>
          <div className="bg-white shadow rounded-lg p-4">
            <h4 className="text-sm text-gray-500 mb-1 flex items-center gap-2">
              {tab === "acciones" && <Goal className="w-4 h-4 text-blue-500" />}
              {tab === "procesos" && <GraduationCap className="w-4 h-4 text-green-500" />}
              {tab === "acciones"
                ? "Participantes en Acciones Masivas/Informativas"
                : tab === "procesos"
                  ? "Participantes en Procesos Formativos"
                  : "Participantes en esta pestaña"}
            </h4>

            <p className="text-2xl font-semibold text-gray-900">
              {participantesTotal}
            </p>
          </div>
        </>
      )}

      <div className="bg-white shadow rounded-lg p-4">
        <h4 className="text-sm text-gray-500 mb-1 flex items-center gap-2">
          <Percent className="w-4 h-4 text-blue-500" />
          {tab === "todo"
            ? "Participantes"
            : " de Participación"}
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
        <p className="text-2xl font-semibold text-gray-900">
          {totalActividades}
        </p>
      </div>
    </div>
  );
};

export default SummaryCards;
