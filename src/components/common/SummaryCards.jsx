import React from "react";
import { Users, Percent, BookOpenCheck, Goal, GraduationCap } from "../../icons/icons";

/**
 * SummaryCards — Genérico para cualquier vigencia.
 *
 * Props:
 *   tab            "todo" | "acciones" | "procesos"
 *   acciones       filas crudas de acciones (sin filtrar)
 *   procesos       filas crudas de procesos (sin filtrar)
 *   filteredData   filas activas según tab (ya calculado por el provider)
 *   showUnique     boolean
 *   columns        { acciones: { no, actividad, … }, procesos: { no, actividad, … } }
 */

// Config de color por tarjeta — misma paleta del Dashboard
const CARD_CONFIG = {
  participantes: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
    valueColor: "text-blue-900",
    labelColor: "text-blue-600",
  },
  acciones: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-700",
    valueColor: "text-orange-900",
    labelColor: "text-orange-600",
  },
  procesos: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-700",
    valueColor: "text-purple-900",
    labelColor: "text-purple-600",
  },
  porcentaje: {
    bg: "bg-green-50",
    border: "border-green-200",
    iconBg: "bg-green-100",
    iconColor: "text-green-700",
    valueColor: "text-green-900",
    labelColor: "text-green-600",
  },
  actividades: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    valueColor: "text-emerald-900",
    labelColor: "text-emerald-600",
  },
};

// Tarjeta individual
const StatCard = (props) => {
  const { icon: Icon, label, value, configKey } = props;
  const c = CARD_CONFIG[configKey];
  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${c.bg} ${c.border}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${c.iconBg}`}>
        <Icon className={`w-4 h-4 ${c.iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${c.labelColor}`}>
          {label}
        </p>
        <p className={`text-2xl font-bold leading-none ${c.valueColor}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

const SummaryCards = ({
  tab,
  acciones,
  procesos,
  filteredData,
  showUnique,
  columns,
}) => {
  const colA = columns.acciones;
  const colP = columns.procesos;

  const getIdForRow = (d) => {
    const id = (tab === "acciones") ? d[colA.no] : (tab === "procesos") ? d[colP.no] : (d[colA.no] || d[colP.no]);
    return id ? id.toString().trim() : null;
  };

  const data = filteredData;

  const participantesTotal = showUnique
    ? new Set(data.map(getIdForRow).filter(Boolean)).size
    : data.length;

  const participantesGlobal = showUnique
    ? new Set(
        [...acciones, ...procesos]
          .map((d) => d[colA.no] || d[colP.no])
          .filter(Boolean)
      ).size
    : acciones.length + procesos.length;

  const calculateUniqueActivities = () => {
    const headerValues = [
      "Actividad/Proceso", "Nombre de la actividad",
      "actividad", "proceso", "Actividad", "Proceso",
    ];
    const actividades = new Set();
    data.forEach((item) => {
      let val;
      if (tab === "acciones")      val = item[colA.actividad];
      else if (tab === "procesos") val = item[colP.actividad];
      else                         val = item[colA.actividad] || item[colP.actividad];

      if (typeof val === "string" && val.trim() !== "") {
        const clean = val.trim();
        const isHeader = headerValues.some(
          (h) => clean.toLowerCase() === h.toLowerCase()
        );
        if (!isHeader) actividades.add(clean);
      }
    });
    return actividades.size;
  };

  const totalActividades = data.length > 0 ? calculateUniqueActivities() : 0;

  const porcentaje = participantesGlobal
    ? ((participantesTotal / participantesGlobal) * 100).toFixed(1)
    : 0;

  return (
    <div data-pdf-block className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">

      {/* Total participantes — siempre visible */}
      <StatCard
        icon={Users}
        label="Total participantes"
        value={participantesTotal.toLocaleString("es-CO")}
        configKey="participantes"
      />

      {/* % de participación */}
      <StatCard
        icon={Percent}
        label="% de participación"
        value={`${porcentaje}%`}
        configKey="porcentaje"
      />

      {/* Total actividades */}
      <StatCard
        icon={BookOpenCheck}
        label="Total de actividades"
        value={totalActividades.toLocaleString("es-CO")}
        configKey="actividades"
      />

    </div>
  );
};

export default SummaryCards;