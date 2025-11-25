import React, { useState, useMemo, lazy, Suspense } from "react";
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
  Info,
  Loader2,
} from "lucide-react";

// Lazy loading de componentes pesados
const DashboardParticipantes = lazy(() => import("./vigencias/2025/DashboardParticipantes"));
const DashboardIndicadores = lazy(() => import("./vigencias/2025/DashboardIndicadores"));
const DashboardCumplimiento = lazy(() => import("./vigencias/2025/DashboardCumplimiento"));

// Importaciones normales para componentes ligeros
import SummaryCards from "../components/common/SummaryCards";
import Filters from "../components/common/Filters";
import ChartsSection from "../components/common/ChartsSection";
import ExportReportButton from "../components/common/ExportButton";
import ParticleLogo from "../components/ParticleLogo";

import DashboardIncorporacionCB, {
  SummaryCardsCB,
  FiltersCB,
  TablaActividades,
  ChartsCB
} from "./vigencias/2025/DashboardIncorporacionCB";

import DashboardTalleres, {
  SummaryCardsTalleres,
  FiltersTalleres,
  ChartsTalleres,
  TablaTalleres,
  DetalleTallerModal
} from "./vigencias/2025/DashboardTalleres";

// Constantes
const SECTION_NAMES = {
  cumplimiento: "Cumplimiento PSPIC",
  indicadores: "Indicadores",
  participantes: "Participantes",
  incorporacioncb: "Incorporación Estrategia CB",
  talleres: "Talleres"
};

const Dashboard = () => {
  // Recuperar estado inicial de localStorage
  const [activeSection, setActiveSection] = useState(() => {
    try {
      return localStorage.getItem("activeSection") || "home";
    } catch {
      return "home";
    }
  });

  const [expandedYear, setExpandedYear] = useState(() => {
    try {
      return localStorage.getItem("expandedYear") || "2025";
    } catch {
      return "2025";
    }
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [participantesGlobal, setParticipantesGlobal] = useState(0);

  const menuItems = useMemo(() => ({
    "2025": [
      { id: "cumplimiento-2025", label: "Cumplimiento PSPIC", icon: Target, color: "text-emerald-600" },
      { id: "indicadores-2025", label: "Indicadores", icon: BarChart3, color: "text-blue-600" },
      { id: "incorporacioncb-2025", label: "Incorporación CB", icon: HeartHandshake, color: "text-orange-600" },
      { id: "talleres-2025", label: "Talleres", icon: GraduationCap, color: "text-purple-600" },
      { id: "participantes-2025", label: "Participantes", icon: Users, color: "text-green-600" },
    ],
    "2026": [
      { id: "cumplimiento-2026", label: "Cumplimiento PSPIC", icon: Target, color: "text-emerald-600" },
      { id: "indicadores-2026", label: "Indicadores", icon: BarChart3, color: "text-blue-600" },
      { id: "incorporacioncb-2026", label: "Incorporación CB", icon: HeartHandshake, color: "text-orange-600" },
      { id: "talleres-2026", label: "Talleres", icon: GraduationCap, color: "text-purple-600" },
      { id: "participantes-2026", label: "Participantes", icon: Users, color: "text-green-600" },
    ]
  }), []);

  const toggleYear = (year) => {
    const newYear = expandedYear === year ? null : year;
    setExpandedYear(newYear);
    try {
      if (newYear) {
        localStorage.setItem("expandedYear", newYear);
      } else {
        localStorage.removeItem("expandedYear");
      }
    } catch (error) {
      console.error("Error saving expandedYear:", error);
    }
  };

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false);

    try {
      localStorage.setItem("activeSection", sectionId);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const renderContent = () => {
    const components = {
      "home": <HomePage participantesGlobal={participantesGlobal} />,
      "participantes-2025": <ParticipantesPage year="2025" setParticipantesGlobal={setParticipantesGlobal} />,
      "cumplimiento-2025": <CumplimientoPage year="2025" />,
      "indicadores-2025": <IndicadoresPage year="2025" />,
      "incorporacioncb-2025": <IncorporacionCBPage year="2025" />,
      "talleres-2025": <TalleresPage year="2025" />,
      "participantes-2026": <ParticipantesPage year="2026" />,
      "cumplimiento-2026": <CumplimientoPage year="2026" />,
      "indicadores-2026": <IndicadoresPage year="2026" />,
      "incorporacioncb-2026": <IncorporacionCBPage year="2026" />,
      "talleres-2026": <TalleresPage year="2026" />,
    };

    return (
      <Suspense fallback={<LoadingState />} key={activeSection}>
        {components[activeSection] || <HomePage participantesGlobal={participantesGlobal} />}
      </Suspense>
    );
  };

  const getBreadcrumb = () => {
    if (activeSection === "home") return "Inicio";

    const match = activeSection.match(/^(.+)-(\d{4})$/);
    if (!match) return "Inicio";

    const [, section, year] = match;
    return `${year} / ${SECTION_NAMES[section] || section}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-blue-600">
                  Dashboard PSPIC
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleSectionClick("home")}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 ${activeSection === "home"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
                aria-label="Ir a inicio"
                aria-current={activeSection === "home" ? "page" : undefined}
              >
                <Home className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Inicio</span>
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="flex items-center text-sm text-gray-600 truncate">
            <Home className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{getBreadcrumb()}</span>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          role="navigation"
          aria-label="Menú principal"
          className={`${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-lg shadow-xl transition-transform duration-300 ease-in-out border-r border-gray-200`}
        >
          {isMobileMenuOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/30 -z-10"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
          )}
          <div className="h-full overflow-y-auto">
            <div className="lg:hidden p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Navegación
              </h2>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <Info className="w-3 h-3 mr-1" />
                Selecciona un año para ver las opciones
              </div>
            </div>

            <nav className="mt-4 lg:mt-8 px-6" aria-label="Menú principal">
              {["2025", "2026"].map((year) => {
                const items = menuItems[year];
                if (!items) return null;
                const isExpanded = expandedYear === year;
                const hasActiveItem = items.some(item => activeSection === item.id);

                return (
                  <div key={year} className="mb-6">
                    <button
                      onClick={() => toggleYear(year)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold rounded-xl transition-all duration-300 group ${hasActiveItem
                          ? "bg-blue-50 text-blue-800 shadow-md border-l-4 border-blue-500"
                          : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                        }`}
                      aria-expanded={isExpanded}
                      aria-controls={`menu-${year}`}
                      aria-label={`Expandir menú del año ${year}`}
                    >
                      <div className="flex items-center">
                        <Calendar className={`w-5 h-5 mr-3 ${hasActiveItem ? "text-blue-600" : "text-indigo-500"}`} />
                        <span className="text-lg font-bold">{year}</span>
                        {hasActiveItem && (
                          <div className="ml-2 w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className={`transform transition-transform duration-300 ${isExpanded ? "rotate-180" : ""
                        }`}>
                        <ChevronDown className={`w-5 h-5 ${hasActiveItem ? "text-blue-600" : "text-gray-400 group-hover:text-indigo-500"}`} />
                      </div>
                    </button>

                    <div
                      id={`menu-${year}`}
                      className={`mt-3 transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                        }`}
                    >
                      <div className="ml-6 space-y-2">
                        {items.map((item, index) => {
                          const Icon = item.icon;
                          const isActive = activeSection === item.id;

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSectionClick(item.id)}
                              className={`w-full flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-md ${isActive
                                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                                  : "text-gray-600 hover:bg-white hover:text-gray-900"
                                }`}
                              style={{
                                animationDelay: `${index * 50}ms`
                              }}
                              aria-label={item.label}
                              aria-current={isActive ? "page" : undefined}
                            >
                              <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-white" : item.color}`} />
                              <span className="font-medium">{item.label}</span>
                              {isActive && (
                                <div className="ml-auto">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="mt-8 px-4 py-3 bg-gray-50 rounded-xl">
                <div className="text-xs text-gray-500 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    Vigencias disponibles
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center text-green-600">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                      2025 - Activa
                    </div>
                    <div className="flex items-center justify-center text-blue-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                      2026 - Próximamente
                    </div>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </aside>

        <main className="flex-1 lg:ml-0 p-6 lg:p-8 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center space-y-4">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
      <p className="text-gray-600">Cargando contenido...</p>
    </div>
  </div>
);

const HomePage = ({ participantesGlobal }) => (
  <div className="max-w-6xl mx-auto space-y-12">
    <div className="text-center space-y-6">
      <h3 className="text-2xl lg:text-5xl font-bold text-blue-600 leading-snug">
        Plan de Salud Pública de Intervenciones Colectivas
      </h3>
      <ParticleLogo />
      {participantesGlobal > 0 && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl max-w-md mx-auto">
          <div className="flex items-center justify-center space-x-4">
            <Users className="w-8 h-8 text-green-600" />
            <div className="text-left">
              <p className="text-sm text-gray-600">Total Participantes</p>
              <p className="text-3xl font-bold text-gray-900">{participantesGlobal.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

const PageLayout = ({ year, title, subtitle, children, exportTitle, exportId }) => (
  <div className="space-y-8">
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
      <div>
        <h2 className="text-3xl font-bold text-blue-600">
          {title} {year}
        </h2>
        <p className="text-gray-600 mt-2">
          {subtitle}
        </p>
      </div>
      {exportTitle && exportId && (
        <ExportReportButton
          containerId={exportId}
          title={`${exportTitle}_${year}`}
        />
      )}
    </div>
    {children}
  </div>
);

const ParticipantesPage = React.memo(({ year, setParticipantesGlobal }) => (
  <PageLayout
    year={year}
    title="Participantes"
    subtitle="Participantes Plan de Salud Pública de Intervenciones Colectivas"
    exportTitle="Participantes"
    exportId="reporte-participantes"
  >
    {year === "2025" ? (
      <DashboardParticipantes setParticipantesGlobal={setParticipantesGlobal}>
        <div id="reporte-participantes" className="space-y-4">
          <SummaryCards />
          <Filters />
          <ChartsSection />
        </div>
      </DashboardParticipantes>
    ) : (
      <EmptyState
        icon={Users}
        title={`Participantes ${year}`}
        description={`Esta sección permitirá visualizar la cobertura poblacional de las acciones del PSPIC de la vigencia ${year}`}
        color="from-green-600 to-green-300"
      />
    )}
  </PageLayout>
));

const CumplimientoPage = React.memo(({ year }) => (
  <PageLayout
    year={year}
    title="Cumplimiento PSPIC"
    subtitle="Seguimiento cumplimiento anexo técnico PSPIC"
  >
    {year === "2025" ? (
      <DashboardCumplimiento />
    ) : (
      <EmptyState
        icon={Target}
        title="Seguimiento de Cumplimiento"
        description={`Esta sección permitirá realizar el seguimiento al cumplimiento del anexo técnico PSPIC vigencia ${year}`}
        color="from-green-600 to-green-300"
      />
    )}
  </PageLayout>
));

const IndicadoresPage = React.memo(({ year }) => (
  <PageLayout
    year={year}
    title="Tablero de Control Indicadores CB"
    subtitle="Implementación indicadores CB"
  >
    {year === "2025" ? (
      <DashboardIndicadores />
    ) : (
      <EmptyState
        icon={BarChart3}
        title="Indicadores"
        description={`Esta sección permitirá realizar el seguimiento a la implementación de indicadores CB vigencia ${year}`}
        color="from-blue-600 to-blue-500"
      />
    )}
  </PageLayout>
));

const IncorporacionCBPage = React.memo(({ year }) => (
  <PageLayout
    year={year}
    title="Incorporación Estrategia CB"
    subtitle="Incorporación de la estrategia Ciudad Bienestar"
  >
    {year === "2025" ? (
      <DashboardIncorporacionCB>
        <SummaryCardsCB />
        <FiltersCB />
        <ChartsCB />
        <TablaActividades />
      </DashboardIncorporacionCB>
    ) : (
      <EmptyState
        icon={Info}
        title={`Incorporación Estrategia CB ${year}`}
        description={`Esta sección permitirá realizar el seguimiento a la incorporación de la estrategia Ciudad Bienestar durante la vigencia ${year}`}
        color="from-orange-600 to-orange-400"
      />
    )}
  </PageLayout>
));

const TalleresPage = React.memo(({ year }) => (
  <PageLayout
    year={year}
    title="Talleres"
    subtitle="Talleres realizados vigencia 2025"
  >
    {year === "2025" ? (
      <DashboardTalleres>
        <SummaryCardsTalleres />
        <FiltersTalleres />
        <ChartsTalleres />
        <TablaTalleres />
        <DetalleTallerModal />
      </DashboardTalleres>
    ) : (
      <EmptyState
        icon={Calendar}
        title={`Talleres ${year}`}
        description={`Esta sección permitirá visualizar los talleres realizados en la vigencia ${year}`}
        color="from-purple-600 to-purple-400"
      />
    )}
  </PageLayout>
));

const EmptyState = ({ icon: Icon, title, description, color }) => (
  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 border border-white/20 shadow-xl text-center">
    <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${color} rounded-full mb-6 shadow-lg`}>
      <Icon className="w-8 h-8 text-white" />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
    <p className="text-gray-600 max-w-md mx-auto leading-relaxed">{description}</p>
    <button className={`mt-6 bg-gradient-to-r ${color} text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}>
      Próximamente
    </button>
  </div>
);

export default Dashboard;
