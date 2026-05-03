import { lazy } from "react";

// ── 2025 ──────────────────────────────────────────────────────
const components2025 = {
  DashboardParticipantes: lazy(() =>
    import("../components/vigencias/2025/DashboardParticipantes")
  ),
  DashboardCumplimiento: lazy(() =>
    import("../components/vigencias/2025/DashboardCumplimiento")
  ),
  DashboardIndicadores: lazy(() =>
    import("../components/vigencias/2025/DashboardIndicadores")
  ),
  DashboardIncorporacionCB: lazy(() =>
    import("../components/vigencias/2025/DashboardIncorporacionCB")
  ),
  DashboardTalleres: lazy(() =>
    import("../components/vigencias/2025/DashboardTalleres")
  ),
};

// ── 2026 ──────────────────────────────────────────────────────
// DashboardParticipantes ya está refactorizado y listo.
// Los demás se activan cuando sus componentes estén implementados.
const components2026 = {
  DashboardParticipantes: lazy(() =>
    import("../components/vigencias/2026/DashboardParticipantes")
  ),
  DashboardCumplimiento:    null, // lazy(() => import("../components/vigencias/2026/DashboardCumplimiento")),
  DashboardIndicadores:     null, // lazy(() => import("../components/vigencias/2026/DashboardIndicadores")),
  DashboardIncorporacionCB: null, // lazy(() => import("../components/vigencias/2026/DashboardIncorporacionCB")),
  DashboardTalleres:        null, // lazy(() => import("../components/vigencias/2026/DashboardTalleres")),
};

// ── Agregar 2027 cuando sea necesario ─────────────────────────
// const components2027 = { ... };

/**
 * Mapa principal: year → componentes disponibles.
 * Un valor null en un componente indica "aún no implementado" (muestra EmptyState).
 */
export const VIGENCIA_COMPONENTS = {
  "2025": components2025,
  "2026": components2026,
  // "2027": components2027,
};

/**
 * Devuelve el componente lazy de un dashboard para una vigencia dada,
 * o null si aún no existe.
 *
 * @param {string} year         - "2025" | "2026" | ...
 * @param {string} componentKey - "DashboardParticipantes" | "DashboardCumplimiento" | ...
 * @returns {React.LazyExoticComponent | null}
 */
export function getVigenciaComponent(year, componentKey) {
  return VIGENCIA_COMPONENTS[year]?.[componentKey] ?? null;
}
