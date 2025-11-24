import React, {
  useState,
  useEffect,
  useMemo,
  createContext,
  useContext,
  useRef,
} from "react";
import Papa from "papaparse";
import { Info, Target, Users, Check, X, Filter, Download } from "lucide-react";

const IncorporacionCBContext = createContext();

export const useIncorporacionCB = () => useContext(IncorporacionCBContext);

const SHEET_ID = "19dsKUelE6ecqIHHG1C6POQ6EPPlxtpD4OW3PKpNwhto";

const sheetConfig = {
  incorporacionCB: {
    gid: "1634857209",
  },
};

const fetchSheet = async (gid) => {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("No se pudo cargar la hoja: " + response.status);
  const csv = await response.text();
  const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });
  return data;
};

const DashboardIncorporacionCB = ({ children }) => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [selectedActividad, setSelectedActividad] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchSheet(sheetConfig.incorporacionCB.gid);
        setDatos(data);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    return datos.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === "Todos") return true;
        return item[key] === value;
      });
    });
  }, [datos, filters]);

  const stats = useMemo(() => {
    return { totalActividades: filteredData.length };
  }, [filteredData]);

  const contextValue = {
    datos, loading, filters, setFilters, filteredData, stats,
    selectedActividad, setSelectedActividad,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  return (
    <IncorporacionCBContext.Provider value={contextValue}>
      {children}
    </IncorporacionCBContext.Provider>
  );
};

// Componente de Tarjetas de Resumen
export const SummaryCardsCB = () => {
  const { stats } = useIncorporacionCB();

  const cards = [
    {
      title: "Número de Procesos",
      value: stats.totalActividades,
      icon: Target,
      color: "from-blue-500 to-blue-600",
      textColor: "text-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">{card.title}</p>
              <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
            </div>
            <div className={`bg-gradient-to-br ${card.color} p-3 rounded-lg`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Componente de Filtros
export const FiltersCB = () => {
  const { datos, filters, setFilters } = useIncorporacionCB();

  const getAvailableOptions = (filterKey) => {
    let dataToFilter = datos;
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== filterKey && value && value !== "Todos") {
        dataToFilter = dataToFilter.filter(item => item[key] === value);
      }
    });
    return [...new Set(dataToFilter.map(d => d[filterKey]).filter(Boolean))].sort();
  };

  const filterConfig = [
    { key: "Equipo/Problemática", label: "Equipo/Problemática" },
    { key: "Producto", label: "Producto" },
    { key: "Grupo", label: "Grupo" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filterConfig.map(({ key, label }) => {
          const options = getAvailableOptions(key);
          return (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
              <select
                value={filters[key] || "Todos"}
                onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={options.length === 0}
              >
                <option value="Todos">Todos</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {options.length} opción{options.length !== 1 ? 'es' : ''} disponible{options.length !== 1 ? 's' : ''}
              </p>
            </div>
          );
        })}
      </div>

      {Object.keys(filters).some(key => filters[key] && filters[key] !== "Todos") && (
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters)
              .filter(([_, value]) => value && value !== "Todos")
              .map(([key, value]) => (
                <span key={key} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-800 font-medium">
                  {value}
                  <button onClick={() => setFilters(prev => ({ ...prev, [key]: "Todos" }))} className="ml-2 text-orange-600 hover:text-orange-800">✕</button>
                </span>
              ))}
          </div>
          <button onClick={() => setFilters({})} className="text-sm text-orange-600 hover:text-orange-800 font-medium underline">
            Limpiar todos
          </button>
        </div>
      )}
    </div>
  );
};

// Componente de Tabla de Actividades
export const TablaActividades = () => {
  const { filteredData, setSelectedActividad } = useIncorporacionCB();
  const premisas = ["Participación Significativa", "Cuerpo Territorio", "Ciudadanía Activa"];

  const verificarCumplimiento = (valor) => {
    const v = valor?.toLowerCase();
    return v === "si" || v === "sí" || valor === "1";
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-orange-500 to-orange-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actividad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Equipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Poblaciones</th>
              {premisas.map(cap => (
                <th key={cap} className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">{cap.split(" ")[0]}</th>
              ))}
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-900">{item["Actividad"]}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item["Equipo/Problemática"]}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item["Poblaciones"]}</td>
                {premisas.map(cap => (
                  <td key={cap} className="px-6 py-4 text-center">
                    {verificarCumplimiento(item[cap]) ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-red-400 mx-auto" />}
                  </td>
                ))}
                <td className="px-6 py-4 text-center">
                  <button onClick={() => setSelectedActividad(item)} className="text-orange-600 hover:text-orange-800 font-medium text-sm">Ver detalle</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredData.length === 0 && (
        <div className="text-center py-8 text-gray-500">No se encontraron actividades con los filtros aplicados</div>
      )}
    </div>
  );
};

// Paletas de colores sobrias (degradados por sección)
const COLORS_OBJETIVOS = ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];  // Naranjas
const COLORS_PREMISAS = ['#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0']; // Verdes
const COLORS_ENFOQUES = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];    // Azules
const COLORS_PERSPECTIVAS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe']; // Púrpuras

// Componente PieChart
const PieChart = ({ data, title, colors }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const chartRef = useRef(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">{title}</h3>
        <div className="text-center text-gray-500 py-8">No hay datos disponibles</div>
      </div>
    );
  }

  const downloadChart = () => {
    if (!chartRef.current) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 2;
    canvas.width = 800 * scale;
    canvas.height = 900 * scale;
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 900);
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, 400, 40);

    const centerX = 400, centerY = 300, radius = 180;
    let currentAngle = -Math.PI / 2;

    data.forEach((item, index) => {
      const percentage = item.value / total;
      const angle = percentage * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      currentAngle += angle;
    });

    let legendY = 520;
    const legendX = 100;
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'left';
    ctx.fillText('Distribución de datos:', legendX, legendY);
    legendY += 30;

    data.forEach((item, index) => {
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(legendX, legendY - 12, 20, 20);
      ctx.fillStyle = '#1f2937';
      ctx.font = '14px Arial';
      const pct = ((item.value / total) * 100).toFixed(1);
      ctx.fillText(`${item.label}: ${item.value} (${pct}%)`, legendX + 30, legendY + 5);
      legendY += 30;
    });

    legendY += 10;
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Total: ${total} registros`, legendX, legendY);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${title.replace(/\s+/g, '_')}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const generateSlices = () => {
    const slices = [];
    let cumulativeAngle = -90;

    if (data.length === 1) {
      return (
        <circle cx="50" cy="50" r="45" fill={colors[0]}
          className="transition-all duration-300 hover:opacity-80 cursor-pointer"
          onMouseEnter={(e) => { setHoveredIndex(0); setTooltipPosition({ x: e.clientX, y: e.clientY }); }}
          onMouseMove={(e) => setTooltipPosition({ x: e.clientX, y: e.clientY })}
          onMouseLeave={() => setHoveredIndex(null)}
        />
      );
    }

    data.forEach((item, index) => {
      const percentage = (item.value / total) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const startX = 50 + 45 * Math.cos(startRad);
      const startY = 50 + 45 * Math.sin(startRad);
      const endX = 50 + 45 * Math.cos(endRad);
      const endY = 50 + 45 * Math.sin(endRad);
      const largeArc = angle > 180 ? 1 : 0;
      const path = `M 50 50 L ${startX} ${startY} A 45 45 0 ${largeArc} 1 ${endX} ${endY} Z`;

      slices.push(
        <path key={index} d={path} fill={colors[index % colors.length]} stroke="#ffffff" strokeWidth="0.5"
          className="transition-all duration-300 hover:opacity-80 cursor-pointer"
          onMouseEnter={(e) => { setHoveredIndex(index); setTooltipPosition({ x: e.clientX, y: e.clientY }); }}
          onMouseMove={(e) => setTooltipPosition({ x: e.clientX, y: e.clientY })}
          onMouseLeave={() => setHoveredIndex(null)}
        />
      );
      cumulativeAngle = endAngle;
    });
    return slices;
  };

  return (
    <div ref={chartRef} className="bg-white rounded-xl shadow-lg p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 text-center flex-1">{title}</h3>
        <button onClick={downloadChart} className="ml-2 p-2 text-gray-600 hover:text-blue-800" title="Descargar gráfico">
          <Download className="w-5 h-5" />
        </button>
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="w-full max-w-xs aspect-square">
          <svg viewBox="0 0 100 100" className="w-full h-full">{generateSlices()}</svg>
        </div>
        <div className="flex flex-wrap justify-center gap-3 px-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
              onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)}>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="text-xs font-medium text-gray-700">{item.label}</span>
              <span className="text-xs text-gray-500">({((item.value / total) * 100).toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      </div>
      {hoveredIndex !== null && (
        <div className="fixed z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl pointer-events-none"
          style={{ left: `${tooltipPosition.x + 10}px`, top: `${tooltipPosition.y + 10}px`, transform: 'translate(0, -50%)' }}>
          <div className="font-semibold text-sm mb-1">{data[hoveredIndex].label}</div>
          <div className="text-xs"><span className="font-bold">{data[hoveredIndex].value}</span> registros</div>
          <div className="text-xs text-gray-300">{((data[hoveredIndex].value / total) * 100).toFixed(1)}% del total</div>
        </div>
      )}
    </div>
  );
};

// Componente ChartsCB
export const ChartsCB = () => {
  const { filteredData } = useIncorporacionCB();

  const calcularDatos = (campo) => {
    const conteo = {};
    filteredData.forEach(item => {
      const valor = item[campo]?.trim();
      if (valor && valor !== "") {
        conteo[valor] = (conteo[valor] || 0) + 1;
      }
    });
    return Object.entries(conteo).map(([label, value]) => ({ label, value }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🎯 Objetivos</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PieChart data={calcularDatos("Objetivo 1")} title="Objetivo 1" colors={COLORS_OBJETIVOS} />
          <PieChart data={calcularDatos("Objetivo 2")} title="Objetivo 2" colors={COLORS_OBJETIVOS} />
          <PieChart data={calcularDatos("Objetivo 3")} title="Objetivo 3" colors={COLORS_OBJETIVOS} />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🪧 Premisas CB</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PieChart data={calcularDatos("Participación Significativa")} title="Participación Significativa" colors={COLORS_PREMISAS} />
          <PieChart data={calcularDatos("Cuerpo Territorio")} title="Cuerpo Territorio" colors={COLORS_PREMISAS} />
          <PieChart data={calcularDatos("Ciudadanía Activa")} title="Ciudadanía Activa" colors={COLORS_PREMISAS} />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">👓 Perspectivas</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieChart data={calcularDatos("Perspectiva de Derechos")} title="Perspectiva de Derechos" colors={COLORS_PERSPECTIVAS} />
          <PieChart data={calcularDatos("Perspectiva de Determinación Social")} title="Perspectiva de Determinación Social" colors={COLORS_PERSPECTIVAS} />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🔎 Enfoques</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <PieChart data={calcularDatos("Enfoque Territorial")} title="Territorial" colors={COLORS_ENFOQUES} />
          <PieChart data={calcularDatos("Enfoque Poblacional")} title="Poblacional" colors={COLORS_ENFOQUES} />
          <PieChart data={calcularDatos("Enfoque Intercultural")} title="Intercultural" colors={COLORS_ENFOQUES} />
          <PieChart data={calcularDatos("Enfoque Diferencial")} title="Diferencial" colors={COLORS_ENFOQUES} />
        </div>
      </div>


    </div>
  );
};

// Modal de Detalle de Actividad
export const DetalleActividadModal = () => {
  const { selectedActividad, setSelectedActividad } = useIncorporacionCB();
  if (!selectedActividad) return null;

  const campos = [
    { label: "Actividad", key: "Actividad" },
    { label: "Equipo/Problemática", key: "Equipo/Problemática" },
    { label: "Producto", key: "Producto" },
    { label: "Poblaciones", key: "Poblaciones" },
    { label: "Grupo", key: "Grupo" },
    { label: "Característica Sesión", key: "Característica Sesión" },
    { label: "Objetivo 1", key: "Objetivo 1" },
    { label: "Objetivo 2", key: "Objetivo 2" },
    { label: "Objetivo 3", key: "Objetivo 3" },
  ];

  const verificar = (v) => v?.toLowerCase() === "si" || v?.toLowerCase() === "sí";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Detalle de Actividad</h2>
            <button onClick={() => setSelectedActividad(null)} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {campos.map(campo => (
            selectedActividad[campo.key] && (
              <div key={campo.key} className="border-b border-gray-200 pb-3">
                <p className="text-sm font-semibold text-gray-600 mb-1">{campo.label}</p>
                <p className="text-gray-900">{selectedActividad[campo.key]}</p>
              </div>
            )
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-3">Premisas CB</h4>
              {["Participación Significativa", "Cuerpo Territorio", "Ciudadanía Activa"].map(cap => (
                <div key={cap} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">{cap}</span>
                  {verificar(selectedActividad[cap]) ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-400" />}
                </div>
              ))}
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-800 mb-3">Perspectivas</h4>
              {["Perspectiva de Derechos", "Perspectiva de Determinación Social"].map(per => (
                <div key={per} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">{per}</span>
                  {verificar(selectedActividad[per]) ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-400" />}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-3">Enfoques CB</h4>
            {["Enfoque Territorial", "Enfoque Poblacional", "Enfoque Intercultural", "Enfoque Diferencial"].map(enf => (
              <div key={enf} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">{enf.replace("Enfoque ", "")}</span>
                {verificar(selectedActividad[enf]) ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-400" />}
              </div>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
};

export default DashboardIncorporacionCB;