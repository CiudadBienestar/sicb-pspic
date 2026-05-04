import React from "react";
import DashboardParticipantesBase from "../../common/DashboardParticipantesBase";
import { getVigenciaConfig } from "../../../config/vigencias";
import { AlertTriangle } from "lucide-react";

const YEAR = "2026";

const camposGenerales = [
  { field: "curso",    label: "Curso de Vida" },
  { field: "sexo",     label: "Sexo" },
  { field: "etnia",    label: "Etnia" },
  { field: "comuna",   label: "Comuna/Corregimiento" },
  { field: "entorno",  label: "Entornos Abordados" },
  { field: "zona",     label: "Zona" },
];

const camposProcesos = [
  { field: "preferencia",  label: "Preferencia sexual" },
  { field: "escolaridad",  label: "Escolaridad" },
  { field: "discapacidad", label: "Personas con discapacidad" },
  { field: "salud",        label: "Tipo de afiliación a salud" },
];

const filterFields = [
  { field: "equipo",    label: "Equipo/Problemática" },
  { field: "entorno",   label: "Entornos Abordados" },
  { field: "actividad", label: "Actividad/Proceso" },
  { field: "zona",      label: "Zona" },
];

const DashboardParticipantes2026 = ({ setParticipantesGlobal }) => {
  // Obtener config aquí dentro para evitar crash si retorna null
  const config = getVigenciaConfig(YEAR, "participantes");

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <p className="text-base font-semibold text-gray-800 mb-1">
          Configuración no disponible
        </p>
        <p className="text-sm text-gray-500 max-w-xs">
          La vigencia {YEAR} aún no tiene una hoja de Google Sheets configurada.
        </p>
      </div>
    );
  }

  return (
    <DashboardParticipantesBase
      year={YEAR}
      config={config}
      setParticipantesGlobal={setParticipantesGlobal}
      camposGenerales={camposGenerales}
      camposProcesos={camposProcesos}
      filterFields={filterFields}
    />
  );
};

export default DashboardParticipantes2026;