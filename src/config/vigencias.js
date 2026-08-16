export const AVAILABLE_YEARS = ["2025", "2026"];

export const VIGENCIAS_CONFIG = {
  "2025": {
    label: "2025",
    status: "archived", // "active" | "upcoming" | "archived"
    participantes: {
      sheetId: "1srJaMCHuNcwcKVyLbKOAREf03BNn88jeSkD5qyvN42E",
      sheets: {
        acciones: { gid: "759616433" },
        procesos: { gid: "20459118" },
      },
      // Mapeo de columnas
      columns: {
        acciones: {
          equipo: "Equipo",
          entorno: "Entornos Abordados",
          actividad: "Actividad/Temática",
          zona: "Zona",
          curso: "Curso de Vida",
          sexo: "Sexo",
          etnia: "Etnia",
          comuna: "Comuna/Corregimiento",
          no: "No de Identificación",
        },
        procesos: {
          equipo: "Eje/Equipo",
          entorno: "Entornos Abordados",
          actividad: "Nombre del Proceso o Grupo",
          zona: "Zona",
          curso: "Curso de Vida",
          sexo: "Se identifica como",
          preferencia: "Preferencia Sexual",
          etnia: "Etnia",
          escolaridad: "Escolaridad",
          discapacidad: "Posee algún tipo de Discapacidad",
          comuna: "Comuna/Corregimiento",
          salud: "Tipo de afiliación a Salud",
          no: "No de Identificación",
        },
      },
    },
    cumplimiento: {
      sheetId: "1pp0vSZMI0Lfkm329ZZ1bUjJF8eLlOzckJ_vmpyXdWwI",
      sheets: {
        actividades: { gid: "1913714559" },
      },
      columns: {
        actividades: {
          equipo: "Equipo",
          descripcion: "Descripción Producto",
          actividad: "Actividad",
          evidencia: "Evidencia",
          cumplimiento: "Cumplimiento Tarea",
          estado: "Estado",
          entornos: "Entornos",
          tecnologias: "Tecnologías",
        },
      },
    },
    indicadores: {
      sheetId: "1yzHOO9ZHq9UFjNz4x73LGjv1SQ4DEUrZjzbXy8xX3i0",
      sheets: {
        indicadores: { gid: "36239036" },
      },
      columns: {
        indicadores: {
          equipo: "Equipo",
          producto: "Producto",
          actividad: "Actividad",
          grupo: "Grupo Poblacional",
          indicador: "Indicador Aplicado",
          tipo: "Tipo de Indicador",
          ambito: "Ámbito",
          resultado: "Resultado 2025",
          estado: "Estado Indicador",
          interpretacion: "Interpretación General de Resultados",
        },
      },
    },
    incorporacioncb: {
      sheetId: "19dsKUelE6ecqIHHG1C6POQ6EPPlxtpD4OW3PKpNwhto",
      sheets: {
        incorporacionCB: { gid: "1634857209" },
      },
      columns: {
        incorporacionCB: {
          equipo: "Equipo",
          actividad: "Actividad",
          estado: "Estado",
          // Agregar las columnas reales de esta hoja
        },
      },
    },
    talleres: {
      sheetId: "1sNID9AqNlYdfoWEf_9Eo2lS4gZfooWZw7KYRTM-QBRs",
      sheets: {
        talleres: { gid: "808270317" },
      },
      columns: {
        talleres: {
          equipo: "Equipo",
          taller: "Nombre Taller",
          fecha: "Fecha",
          lugar: "Lugar",
          participantes: "No. Participantes",
          // Agregar las columnas reales de esta hoja
        },
      },
    },
  },

  // ──────────────────────────────────────────────────────────
  // VIGENCIA 2026
 // ──────────────────────────────────────────────────────────
  "2026": {
    label: "2026",
    status: "active",
    participantes: {
      sheetId: "18wucE2vx-dTQ0OngyKogjBPnJc1sBCYQ6mHzjKJ5ULA",
      sheets: {
        acciones: { gid: "964788065" },   // <-- reemplazar
        procesos: { gid: "619074197" },   // <-- reemplazar
      },
      // Columnas actualizadas para 2026 (pueden diferir de 2025)
      columns: {
        acciones: {
          equipo: "Equipo/Problemática",
          entorno: "Entornos Abordados",
          actividad: "Actividad/Proceso",
          zona: "Zona",
          curso: "Curso de Vida",
          sexo: "Sexo",
          etnia: "Etnia",
          comuna: "Comuna/Corregimiento",
          no: "No de Identificación",
          // Nuevas columnas 2026:
          pic: "Tecnologías del PIC Implementadas",
          fecha: "Fecha",
        },
        procesos: {
          equipo: "Equipo/Problemática",
          entorno: "Entornos Abordados",
          actividad: "Actividad/Proceso",
          zona: "Zona",
          curso: "Curso de Vida",
          sexo: "Se identifica así mismo como",
          preferencia: "Preferencia Sexual",
          etnia: "Etnia",
          escolaridad: "Escolaridad",
          discapacidad: "Posee algún tipo de Discapacidad",
          comuna: "Comuna/Corregimiento",
          salud: "Tipo de afiliación a Salud",
          no: "No de Identificación",
          // Nuevas columnas 2026:
          pic: "Tecnologías del PIC Implementadas",
        },
      },
    },
    cumplimiento: {
      sheetId: "SHEET_ID_CUMPLIMIENTO_2026",
      sheets: {
        actividades: { gid: "GID_ACTIVIDADES_2026" },
      },
      columns: {
        actividades: {
          equipo: "Equipo",
          descripcion: "Descripción Producto",
          actividad: "Actividad",
          evidencia: "Evidencia",
          cumplimiento: "Cumplimiento Tarea",
          estado: "Estado",
          entornos: "Entornos",
          tecnologias: "Tecnologías",
          // Nuevas columnas 2026:
        },
      },
    },
    indicadores: {
      sheetId: "SHEET_ID_INDICADORES_2026",
      sheets: {
        indicadores: { gid: "GID_INDICADORES_2026" },
      },
      columns: {
        indicadores: {
          equipo: "Equipo",
          producto: "Producto",
          actividad: "Actividad",
          grupo: "Grupo Poblacional",
          indicador: "Indicador Aplicado",
          tipo: "Tipo de Indicador",
          ambito: "Ámbito",
          resultado: "Resultado 2026", // <-- actualizado
          estado: "Estado Indicador",
          interpretacion: "Interpretación General de Resultados",
          // Nuevas columnas 2026:
        },
      },
    },
    incorporacioncb: {
      sheetId: "SHEET_ID_CB_2026",
      sheets: {
        incorporacionCB: { gid: "GID_CB_2026" },
      },
      columns: {
        incorporacionCB: {
          equipo: "Equipo",
          actividad: "Actividad",
          estado: "Estado",
          // Nuevas columnas 2026:
        },
      },
    },
    talleres: {
      sheetId: "SHEET_ID_TALLERES_2026",
      sheets: {
        talleres: { gid: "GID_TALLERES_2026" },
      },
      columns: {
        talleres: {
          equipo: "Equipo",
          taller: "Nombre Taller",
          fecha: "Fecha",
          lugar: "Lugar",
          participantes: "No. Participantes",
          // Nuevas columnas 2026:
        },
      },
    },
  },
};

/**
 * Devuelve la configuración de una sección para una vigencia dada.
 * @param {string} year  - "2025" | "2026" | ...
 * @param {string} section - "participantes" | "cumplimiento" | ...
 */
export function getVigenciaConfig(year, section) {
  return VIGENCIAS_CONFIG[year]?.[section] ?? null;
}

/**
 * Indica si una vigencia tiene datos reales listos
 * (sheetId no es un placeholder).
 */
export function isVigenciaReady(year, section) {
  const cfg = getVigenciaConfig(year, section);
  if (!cfg) return false;
  return !cfg.sheetId.startsWith("SHEET_ID_");
}
