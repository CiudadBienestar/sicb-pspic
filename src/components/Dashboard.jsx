import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  Home,
  BarChart3,
  Users,
  Target,
  Menu,
  X,
  Calendar,
} from "lucide-react";

import DashboardParticipantes from "./vigencias/2025/DashboardParticipantes";
import DashboardIndicadores from "./vigencias/2025/DashboardIndicadores";
import DashboardCumplimiento from "./vigencias/2025/DashboardCumplimiento";
import SummaryCards from "../components/common/SummaryCards";
import Filters from "../components/common/Filters";
import ChartsSection from "../components/common/ChartsSection";
import ExportReportButton from "../components/common/ExportButton";
import ParticleLogo from "../components/ParticleLogo";

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [expandedYear, setExpandedYear] = useState(null); // No expandido por defecto
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [participantesGlobal, setParticipantesGlobal] = useState(0);

  // Aseguramos que las claves del objeto sean strings
  const menuItems = useMemo(() => ({
    "2025": [
      { id: "cumplimiento-2025", label: "Cumplimiento PSPIC", icon: Target, color: "text-emerald-600" },
      { id: "indicadores-2025", label: "Indicadores", icon: BarChart3, color: "text-blue-600" },
      { id: "participantes-2025", label: "Participantes", icon: Users, color: "text-purple-600" },
    ],
    "2026": [
      { id: "cumplimiento-2026", label: "Cumplimiento PSPIC", icon: Target, color: "text-emerald-600" },
      { id: "indicadores-2026", label: "Indicadores", icon: BarChart3, color: "text-blue-600" },
      { id: "participantes-2026", label: "Participantes", icon: Users, color: "text-purple-600" },
    ],
  }), []);

  const toggleYear = (year) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false);
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
      "participantes-2026": <ParticipantesPage year="2026" />,
      "cumplimiento-2026": <CumplimientoPage year="2026" />,
      "indicadores-2026": <IndicadoresPage year="2026" />,
    };

    return components[activeSection] || <HomePage participantesGlobal={participantesGlobal} />;
  };

  const getBreadcrumb = () => {
    if (activeSection === "home") return "Inicio";
    const parts = activeSection.split("-");
    const year = parts[1];
    const section = parts[0];
    const sectionNames = {
      "cumplimiento": "Cumplimiento PSPIC",
      "indicadores": "Indicadores",
      "participantes": "Participantes"
    };
    return `${year} / ${sectionNames[section] || section}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
                  Dashboard PSPIC
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleSectionClick("home")}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 ${activeSection === "home"
                  ? "bg-gradient-to-r from-blue-500 to-blue-500 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
              >
                <Home className="w-4 h-4 mr-2" />
                Inicio
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Home className="w-4 h-4 mr-2" />
            {getBreadcrumb()}
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-lg shadow-xl transition-transform duration-300 ease-in-out border-r border-gray-200`}>
          {isMobileMenuOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/30 -z-10"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
          <div className="h-full overflow-y-auto">
            {/* Header del menú móvil */}
            <div className="lg:hidden p-4 border-b border-gray-200 bg-white/90">
              <h2 className="text-lg font-semibold text-gray-800">Navegación</h2>
            </div>

            <nav className="mt-4 lg:mt-8 px-6">
              {["2025", "2026"].map((year) => {
                const items = menuItems[year];
                if (!items) return null;

                return (
                  <div key={year} className="mb-6">
                    <button
                      onClick={() => toggleYear(year)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 group"
                    >
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 mr-3 text-indigo-500" />
                        <span className="text-lg font-bold">{year}</span>
                      </div>
                      <div className={`transform transition-transform duration-300 ${expandedYear === year ? 'rotate-180' : ''
                        }`}>
                        <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
                      </div>
                    </button>
                    <div className={`mt-3 transition-all duration-300 ease-out overflow-hidden ${expandedYear === year ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="ml-6 space-y-2">
                        {items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSectionClick(item.id)}
                              className={`w-full flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-md ${activeSection === item.id
                                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                                : "text-gray-600 hover:bg-white hover:text-gray-900"
                                }`}
                            >
                              <Icon className={`w-5 h-5 mr-3 ${activeSection === item.id ? 'text-white' : item.color
                                }`} />
                              <span className="font-medium">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
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

const HomePage = ({ participantesGlobal }) => (
  <div className="max-w-6xl mx-auto space-y-12">
    <div className="text-center space-y-6">
      <h3 className="text-2xl lg:text-5xl font-bold bg-gradient-to-r from-blue-800 to-blue-500 bg-clip-text text-transparent leading-snug">
        Plan de Salud Pública de Intervenciones Colectivas
      </h3>
      <ParticleLogo />
    </div>
  </div>
);

const ParticipantesPage = ({ year, setParticipantesGlobal }) => (
  <div className="space-y-8">
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
          Participantes {year}
        </h2>
        <p className="text-gray-600 mt-2">
          Participantes Plan de Salud Pública de Intervenciones Colectivas
        </p>
      </div>
      <ExportReportButton
        containerId="reporte-participantes"
        title={`Participantes_${year}`}
      />
    </div>

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
        color="from-purple-500 to-pink-500"
      />
    )}
  </div>
);

const CumplimientoPage = ({ year }) => (
  <div className="space-y-8">
    <div>
      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
        Cumplimiento PSPIC {year}
      </h2>
      <p className="text-gray-600 mt-2">
        Seguimiento cumplimiento anexo técnico PSPIC
      </p>
    </div>
    {year === "2025" ? (
      <DashboardCumplimiento />
    ) : (
      <EmptyState
        icon={Target}
        title="Seguimiento de Cumplimiento"
        description={`Esta sección permitirá realizar el seguimiento al cumplimiento del anexo técnico PSPIC vigencia ${year}`}
        color="from-emerald-500 to-teal-500"
      />
    )}
  </div>
);

const IndicadoresPage = ({ year }) => (
  <div className="space-y-8">
    <div>
      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
        Tablero de Control Indicadores CB {year}
      </h2>
      <p className="text-gray-600 mt-2">
        Implementación indicadores CB
      </p>
    </div>

    {year === "2025" ? (
      <DashboardIndicadores />
    ) : (
      <EmptyState
        icon={BarChart3}
        title="Indicadores"
        description={`Esta sección permitirá realizar el seguimiento a la implementación de indicadores CB vigencia ${year}`}
        color="from-blue-500 to-cyan-500"
      />
    )}
  </div>
);

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
