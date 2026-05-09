import React, {
  useState,
  useMemo,
  Suspense,
  useCallback,
  useEffect,
} from "react";
import {
  ChevronDown,
  Home,
  BarChart3,
  Users,
  Target,
  Menu,
  X,
  Calendar,
  HeartHandshake,
  GraduationCap,
  Loader2,
  ArrowRight,
  Activity,
} from "lucide-react";

import ParticleLogo from "./ParticleLogo";
import ExportReportButton from "./common/ExportButton";

import { AVAILABLE_YEARS, VIGENCIAS_CONFIG } from "../config/vigencias";
import { getVigenciaComponent } from "../config/vigenciaComponents";

import {
  SummaryCardsTalleres,
  FiltersTalleres,
  ChartsTalleres,
  TablaTalleres,
  DetalleTallerModal,
} from "./vigencias/2025/DashboardTalleres";

import {
  SummaryCardsCB,
  FiltersCB,
  ChartsCB,
  TablaActividades,
  DetalleActividadModal,
} from "./vigencias/2025/DashboardIncorporacionCB";

// ── Helpers ──────────────────────────────────────────────────────────────────

const localStorageHelper = {
  get: (key, defaultValue) => {
    try {
      return localStorage.getItem(key) || defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      if (value) {
        localStorage.setItem(key, value);
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  },
};

// ── Constantes ────────────────────────────────────────────────────────────────

const SECTION_META = {
  cumplimiento: {
    label: "Cumplimiento PSPIC",
    icon: Target,
    // colores semánticos por sección
    accent: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-100",
    dot: "bg-emerald-500",
  },
  indicadores: {
    label: "Indicadores",
    icon: BarChart3,
    accent: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-100",
    dot: "bg-blue-500",
  },
  incorporacioncb: {
    label: "Incorporación CB",
    icon: HeartHandshake,
    accent: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    iconBg: "bg-orange-100",
    dot: "bg-orange-500",
  },
  talleres: {
    label: "Talleres",
    icon: GraduationCap,
    accent: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    iconBg: "bg-purple-100",
    dot: "bg-purple-500",
  },
  participantes: {
    label: "Participantes",
    icon: Users,
    accent: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    iconBg: "bg-green-100",
    dot: "bg-green-500",
  },
};

const SECTION_NAMES = Object.fromEntries(
  Object.entries(SECTION_META).map(([k, v]) => [k, v.label])
);

const STATUS_CONFIG = {
  active: {
    label: "Activa",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  upcoming: {
    label: "Próximamente",
    dot: "bg-blue-400",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  archived: {
    label: "Archivada",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-500 border border-gray-200",
  },
};

const CURRENT_YEAR =
  AVAILABLE_YEARS.find((year) => VIGENCIAS_CONFIG[year]?.status === "active") ||
  AVAILABLE_YEARS[0];

// ── Dashboard principal ───────────────────────────────────────────────────────

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [expandedYear, setExpandedYear] = useState(() =>
    localStorageHelper.get("expandedYear", CURRENT_YEAR)
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [participantesGlobal, setParticipantesGlobal] = useState(0);

  const menuItems = useMemo(() => {
    return Object.fromEntries(
      AVAILABLE_YEARS.map((year) => [
        year,
        Object.entries(SECTION_META).map(([sectionKey, meta]) => ({
          id: `${sectionKey}-${year}`,
          label: meta.label,
          icon: meta.icon,
          accent: meta.accent,
          bg: meta.bg,
          border: meta.border,
          iconBg: meta.iconBg,
          dot: meta.dot,
        })),
      ])
    );
  }, []);

  useEffect(() => {
    localStorageHelper.set("activeSection", activeSection);
  }, [activeSection]);

  useEffect(() => {
    localStorageHelper.set("expandedYear", expandedYear);
  }, [expandedYear]);

  const toggleYear = useCallback((year) => {
    setExpandedYear((prev) => (prev === year ? null : year));
  }, []);

  const handleSectionClick = useCallback((sectionId) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const breadcrumb = useMemo(() => {
    if (activeSection === "home") return null;
    const match = activeSection.match(/^(.+)-(\d{4})$/);
    if (!match) return null;
    const [, section, year] = match;
    return { year, label: SECTION_NAMES[section] || section };
  }, [activeSection]);

  const renderContent = () => {
    if (activeSection === "home") {
      return (
        <HomePage
          participantesGlobal={participantesGlobal}
          menuItems={menuItems}
          handleSectionClick={handleSectionClick}
        />
      );
    }

    const match = activeSection.match(/^(.+)-(\d{4})$/);
    if (!match) return <HomePage participantesGlobal={participantesGlobal} menuItems={menuItems} handleSectionClick={handleSectionClick} />;

    const [, sectionKey, year] = match;

    return (
      <Suspense fallback={<LoadingState />} key={activeSection}>
        <SectionPage
          sectionKey={sectionKey}
          year={year}
          setParticipantesGlobal={setParticipantesGlobal}
        />
      </Suspense>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Izquierda: hamburger + logo + breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Logo badge */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-sm font-semibold text-gray-900">PSPIC</span>
                  <span className="text-sm text-gray-400 mx-1.5">·</span>
                  <span className="text-sm text-gray-500">Ciudad Bienestar</span>
                </div>
                <span className="sm:hidden text-sm font-semibold text-gray-900">PSPIC</span>
              </div>

              {/* Breadcrumb */}
              {breadcrumb && (
                <div className="hidden md:flex items-center gap-1.5 text-sm text-gray-400">
                  <span>/</span>
                  <span className="text-gray-400">{breadcrumb.year}</span>
                  <span>/</span>
                  <span className="text-gray-700 font-medium">{breadcrumb.label}</span>
                </div>
              )}
            </div>

            {/* Derecha: botón Inicio */}
            <button
              onClick={() => handleSectionClick("home")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeSection === "home"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
              aria-label="Ir a inicio"
              aria-current={activeSection === "home" ? "page" : undefined}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Inicio</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Layout principal ── */}
      <div className="flex">
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          closeMobileMenu={closeMobileMenu}
          menuItems={menuItems}
          expandedYear={expandedYear}
          toggleYear={toggleYear}
          activeSection={activeSection}
          handleSectionClick={handleSectionClick}
        />
        <main className="flex-1 p-6 lg:p-8 min-w-0">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

// ── SectionPage ───────────────────────────────────────────────────────────────

const SectionPage = React.memo(({ sectionKey, year, setParticipantesGlobal }) => {
  const sectionMeta = SECTION_META[sectionKey];

  const sectionInfo = {
    participantes: {
      title: "Participantes",
      subtitle: "Participantes Plan de Salud Pública de Intervenciones Colectivas",
      exportTitle: "Participantes",
      exportId: "reporte-participantes",
      componentKey: "DashboardParticipantes",
    },
    cumplimiento: {
      title: "Cumplimiento PSPIC",
      subtitle: "Seguimiento cumplimiento anexo técnico PSPIC",
      exportTitle: null,
      exportId: null,
      componentKey: "DashboardCumplimiento",
    },
    indicadores: {
      title: "Tablero de Control Indicadores CB",
      subtitle: "Implementación indicadores CB",
      exportTitle: null,
      exportId: null,
      componentKey: "DashboardIndicadores",
    },
    incorporacioncb: {
      title: "Incorporación Estrategia CB",
      subtitle: "Incorporación de la estrategia Ciudad Bienestar",
      exportTitle: null,
      exportId: null,
      componentKey: "DashboardIncorporacionCB",
    },
    talleres: {
      title: "Talleres",
      subtitle: `Talleres realizados vigencia ${year}`,
      exportTitle: null,
      exportId: null,
      componentKey: "DashboardTalleres",
    },
  };

  const info = sectionInfo[sectionKey];
  if (!info || !sectionMeta) {
    return <div className="text-gray-500">Sección no encontrada.</div>;
  }

  const DashboardComponent = getVigenciaComponent(year, info.componentKey);

  const childrenByYear = {
    "2025": {
      talleres: (
        <>
          <SummaryCardsTalleres />
          <FiltersTalleres />
          <ChartsTalleres />
          <TablaTalleres />
          <DetalleTallerModal />
        </>
      ),
      incorporacioncb: (
        <>
          <SummaryCardsCB />
          <FiltersCB />
          <ChartsCB />
          <TablaActividades />
          <DetalleActividadModal />
        </>
      ),
      cumplimiento: null,
      indicadores: null,
    },
  };

  return (
    <PageLayout
      year={year}
      title={info.title}
      subtitle={info.subtitle}
      exportTitle={info.exportTitle}
      exportId={info.exportId}
      sectionMeta={sectionMeta}
    >
      {DashboardComponent ? (
        <DashboardComponent
          year={year}
          setParticipantesGlobal={
            sectionKey === "participantes" ? setParticipantesGlobal : undefined
          }
        >
          {childrenByYear[year]?.[sectionKey] ?? null}
        </DashboardComponent>
      ) : (
        <EmptyState
          icon={sectionMeta.icon}
          title={`${info.title} ${year}`}
          description={`Esta sección permitirá visualizar la información del PSPIC para la vigencia ${year}.`}
          sectionMeta={sectionMeta}
        />
      )}
    </PageLayout>
  );
});

// ── Sidebar ───────────────────────────────────────────────────────────────────

const Sidebar = React.memo(
  ({
    isMobileMenuOpen,
    closeMobileMenu,
    menuItems,
    expandedYear,
    toggleYear,
    activeSection,
    handleSectionClick,
  }) => (
    <aside
      role="navigation"
      aria-label="Menú principal"
      className={`${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 fixed lg:static top-14 lg:top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out flex-shrink-0`}
    >
      {/* Overlay mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 -z-10"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <div className="h-full overflow-y-auto">
        {/* Header mobile del sidebar */}
        <div className="lg:hidden px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Navegación</p>
        </div>

        <nav className="px-3 py-4" aria-label="Menú principal">
          {AVAILABLE_YEARS.map((year) => {
            const items = menuItems[year];
            if (!items) return null;
            const isExpanded = expandedYear === year;
            const hasActiveItem = items.some((item) => activeSection === item.id);
            return (
              <YearSection
                key={year}
                year={year}
                items={items}
                isExpanded={isExpanded}
                hasActiveItem={hasActiveItem}
                toggleYear={toggleYear}
                activeSection={activeSection}
                handleSectionClick={handleSectionClick}
              />
            );
          })}

          <VigenciasIndicator />
        </nav>
      </div>
    </aside>
  )
);

// ── YearSection ───────────────────────────────────────────────────────────────

const YearSection = React.memo(
  ({
    year,
    items,
    isExpanded,
    hasActiveItem,
    toggleYear,
    activeSection,
    handleSectionClick,
  }) => {
    const vigenciaStatus = VIGENCIAS_CONFIG[year]?.status ?? "upcoming";
    const statusCfg = STATUS_CONFIG[vigenciaStatus] ?? STATUS_CONFIG.upcoming;

    return (
      <div className="mb-1">
        {/* Botón año */}
        <button
          onClick={() => toggleYear(year)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
            hasActiveItem
              ? "bg-blue-50 text-blue-800"
              : "text-gray-700 hover:bg-gray-50"
          }`}
          aria-expanded={isExpanded}
          aria-controls={`menu-${year}`}
        >
          <div className="flex items-center gap-2.5">
            <Calendar className={`w-4 h-4 flex-shrink-0 ${hasActiveItem ? "text-blue-600" : "text-gray-400"}`} />
            <span className="font-semibold text-base">{year}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.badge}`}>
              {statusCfg.label}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${
              isExpanded ? "rotate-180" : ""
            } ${hasActiveItem ? "text-blue-600" : "text-gray-400"}`}
          />
        </button>

        {/* Ítems del año */}
        <div
          id={`menu-${year}`}
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
          }`}
        >
          <div className="ml-3 pl-3 border-l border-gray-100 space-y-0.5">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionClick(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? `${item.bg} ${item.accent} ${item.border} border`
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                    isActive ? item.iconBg : "bg-gray-100"
                  }`}>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? item.accent : "text-gray-500"}`} />
                  </div>
                  <span className="font-medium truncate">{item.label}</span>
                  {isActive && (
                    <div className={`ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.dot}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

// ── VigenciasIndicator ────────────────────────────────────────────────────────

const VigenciasIndicator = React.memo(() => (
  <div className="mt-6 mx-1 px-3 py-3 bg-gray-50 rounded-lg border border-gray-100">
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
      Vigencias
    </p>
    <div className="space-y-1.5">
      {AVAILABLE_YEARS.map((year) => {
        const status = VIGENCIAS_CONFIG[year]?.status ?? "upcoming";
        const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.upcoming;
        return (
          <div key={year} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              <span className="text-xs text-gray-600">{year}</span>
            </div>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
        );
      })}
    </div>
  </div>
));

// ── LoadingState ──────────────────────────────────────────────────────────────

const LoadingState = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center space-y-3">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
      <p className="text-sm text-gray-500">Cargando contenido…</p>
    </div>
  </div>
);

// ── HomePage ──────────────────────────────────────────────────────────────────

const QUICK_ACCESS = [
  { key: "participantes", year: CURRENT_YEAR },
  { key: "talleres", year: CURRENT_YEAR },
  { key: "indicadores", year: CURRENT_YEAR },
  { key: "cumplimiento", year: CURRENT_YEAR },
];

const HomePage = React.memo(({ participantesGlobal, handleSectionClick }) => (
  <div className="max-w-4xl mx-auto space-y-10">

    {/* Hero */}
    <div className="text-center space-y-4 pt-4">
      <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
        Pasto Salud E.S.E · Ciudad Bienestar
      </p>
      <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
        Plan de Salud Pública de<br />
        <span className="text-blue-600">Intervenciones Colectivas</span>
      </h2>
      <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
        Seguimiento y análisis de indicadores, participantes y actividades del PSPIC.
      </p>
    </div>

    {/* Logo de partículas */}
    <div className="flex justify-center">
      <ParticleLogo />
    </div>

    {/* Tarjeta de participantes (si hay datos) */}
    {participantesGlobal > 0 && (
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-5 max-w-sm mx-auto">
        <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
          <Users className="w-6 h-6 text-green-700" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
            Total participantes
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {participantesGlobal.toLocaleString("es-CO")}
          </p>
        </div>
      </div>
    )}

    {/* Acceso rápido */}
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Acceso rápido · Vigencia {CURRENT_YEAR}
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK_ACCESS.map(({ key, year }) => {
          const meta = SECTION_META[key];
          if (!meta) return null;
          const Icon = meta.icon;
          const sectionId = `${key}-${year}`;
          return (
            <button
              key={sectionId}
              onClick={() => handleSectionClick(sectionId)}
              className={`group text-left p-4 rounded-xl border transition-all hover:shadow-sm ${meta.bg} ${meta.border}`}
            >
              <div className={`w-8 h-8 rounded-lg ${meta.iconBg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${meta.accent}`} />
              </div>
              <p className={`text-sm font-semibold ${meta.accent} mb-0.5`}>{meta.label}</p>
              <p className="text-xs text-gray-400">{year}</p>
              <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${meta.accent} opacity-0 group-hover:opacity-100 transition-opacity`}>
                Ver sección <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          );
        })}
      </div>
    </div>

  </div>
));

// ── PageLayout ────────────────────────────────────────────────────────────────

const PageLayout = React.memo(
  ({ year, title, subtitle, children, exportTitle, exportId, sectionMeta }) => {
    const Icon = sectionMeta?.icon;
    return (
      <div className="space-y-6">
        {/* Encabezado de sección */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div className="flex items-start gap-3">
            {Icon && sectionMeta && (
              <div className={`w-10 h-10 rounded-xl ${sectionMeta.iconBg} border ${sectionMeta.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`w-5 h-5 ${sectionMeta.accent}`} />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {title}{" "}
                <span className={`${sectionMeta?.accent ?? "text-blue-600"}`}>{year}</span>
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          {exportTitle && exportId && (
            <ExportReportButton
              containerId={exportId}
              title={`${exportTitle}_${year}`}
              reportTitle={`${exportTitle} ${year}`}
              subtitle={`${subtitle} – ${year}`}
            />
          )}
        </div>

        {/* Separador */}
        <div className="border-t border-gray-100" />

        {children}
      </div>
    );
  }
);

// ── EmptyState ────────────────────────────────────────────────────────────────

const EmptyState = React.memo(({ icon, title, description, sectionMeta }) => {
  const Icon = icon;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
      <div className={`inline-flex items-center justify-center w-14 h-14 ${sectionMeta?.iconBg ?? "bg-blue-50"} border ${sectionMeta?.border ?? "border-blue-200"} rounded-xl mb-5`}>
        <Icon className={`w-7 h-7 ${sectionMeta?.accent ?? "text-blue-600"}`} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed mb-6">
        {description}
      </p>
      <span className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border ${sectionMeta?.bg ?? "bg-blue-50"} ${sectionMeta?.accent ?? "text-blue-700"} ${sectionMeta?.border ?? "border-blue-200"}`}>
        Próximamente disponible
      </span>
    </div>
  );
});

export default Dashboard;