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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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

export const SummaryCardsCB = () => {
  const context = useIncorporacionCB();
  
  if (!context || !context.stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  const { stats } = context;
  const cards = [
    { title: "Total Actividades", value: stats.totalActividades, icon: Target,
      color: "from-blue-500 to-blue-600", textColor: "text-blue-600" },
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
    { key: "Productos", label: "Productos" },
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={options.length === 0}
              >
                <option value="Todos">Todos</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">{options.length} opción{options.length !== 1 ? 'es' : ''}</p>
            </div>
          );
        })}
      </div>
      {Object.keys(filters).some(key => filters[key] && filters[key] !== "Todos") && (
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).filter(([_, v]) => v && v !== "Todos").map(([key, value]) => (
              <span key={key} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">
                {value}
                <button onClick={() => setFilters({ ...filters, [key]: "Todos" })} className="ml-2 text-blue-600 hover:text-blue-800">✕</button>
              </span>
            ))}
          </div>
          <button onClick={() => setFilters({})} className="text-sm text-blue-600 hover:text-blue-800 font-medium underline">Limpiar todos</button>
        </div>
      )}
    </div>
  );
};

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
          <thead className="bg-gradient-to-r from-blue-500 to-blue-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Actividad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Equipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Poblaciones</th>
              {premisas.map(cap => (
                <th key={cap} className="px-6 py-3 text-center text-xs font-medium text-white uppercase">{cap.split(" ")[0]}</th>
              ))}
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((item, index) => (
              <tr key={index} className="hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-900">{item["Actividad"]}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item["Equipo/Problemática"]}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item["Poblaciones"]}</td>
                {premisas.map(cap => (
                  <td key={cap} className="px-6 py-4 text-center">
                    {verificarCumplimiento(item[cap]) ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-red-400 mx-auto" />}
                  </td>
                ))}
                <td className="px-6 py-4 text-center">
                  <button onClick={() => setSelectedActividad(item)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Ver detalle</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredData.length === 0 && <div className="text-center py-8 text-gray-500">No se encontraron actividades</div>}
    </div>
  );
};

const COLORS = [
  '#0ea5e9', '#22c55e', '#f97316', '#a855f7',
  '#e11d48', '#14b8a6', '#facc15', '#3b82f6',
  '#6366f1', '#ef4444', '#10b981', '#8b5cf6'
];

const PieChart = ({ data, title, colors = COLORS }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const slices = useMemo(() => {
    let currentAngle = -90;
    return data.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = startAngle + angle;
      currentAngle = endAngle;
      return {
        ...item,
        percentage,
        startAngle,
        endAngle,
        color: colors[index % colors.length],
      };
    });
  }, [data, total, colors]);

  const downloadPNG = () => {
    const width = 500;
    const height = 400;
    const centerX = width / 2;
    const centerY = 180;
    const radius = 100;

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    svgContent += `<rect width="${width}" height="${height}" fill="white"/>`;
    svgContent += `<text x="${centerX}" y="35" text-anchor="middle" font-size="20" font-weight="bold" fill="#1f2937" font-family="Arial, sans-serif">${title}</text>`;
    
    let angle = -90;
    slices.forEach((slice, index) => {
      const startAngle = angle;
      const sweepAngle = (slice.percentage / 100) * 360;
      const endAngle = startAngle + sweepAngle;
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);
      
      const largeArc = sweepAngle > 180 ? 1 : 0;
      
      svgContent += `<path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${slice.color}"/>`;
      
      if (slice.percentage >= 5) {
        const midAngle = startAngle + sweepAngle / 2;
        const midRad = (midAngle * Math.PI) / 180;
        const labelRadius = radius * 0.6;
        const labelX = centerX + labelRadius * Math.cos(midRad);
        const labelY = centerY + labelRadius * Math.sin(midRad);
        svgContent += `<text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="bold" fill="white" font-family="Arial">${slice.percentage.toFixed(0)}%</text>`;
      }
      
      angle = endAngle;
    });
    
    const legendStartY = 310;
    const legendStartX = 30;
    const itemsPerRow = 3;
    const itemWidth = 150;
    const rowHeight = 22;
    
    slices.forEach((slice, index) => {
      const col = index % itemsPerRow;
      const row = Math.floor(index / itemsPerRow);
      const x = legendStartX + col * itemWidth;
      const y = legendStartY + row * rowHeight;
      
      svgContent += `<rect x="${x}" y="${y}" width="14" height="14" fill="${slice.color}" rx="3"/>`;
      const labelText = slice.label.length > 15 ? slice.label.substring(0, 15) + "..." : slice.label;
      svgContent += `<text x="${x + 20}" y="${y + 11}" font-size="11" fill="#374151" font-family="Arial">${labelText} (${slice.value})</text>`;
    });
    
    svgContent += `</svg>`;
    
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);
    
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const link = document.createElement("a");
      link.download = `${title.replace(/\s+/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgContent)));
  };

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="text-center text-gray-500 py-8">No hay datos disponibles</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 relative" ref={containerRef}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800 text-center w-full">{title}</h3>
        <button onClick={downloadPNG} className="absolute right-4 top-4 p-2 rounded-lg hover:bg-gray-200" title="Descargar">
          <Download className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="w-full max-w-xs aspect-square">
          <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
            {slices.map((slice, index) => {
              const startX = 50 + 35 * Math.cos((slice.startAngle * Math.PI) / 180);
              const startY = 50 + 35 * Math.sin((slice.startAngle * Math.PI) / 180);
              const endX = 50 + 35 * Math.cos((slice.endAngle * Math.PI) / 180);
              const endY = 50 + 35 * Math.sin((slice.endAngle * Math.PI) / 180);
              const largeArc = slice.percentage > 50 ? 1 : 0;

              return (
                <path
                  key={index}
                  d={`M 50 50 L ${startX} ${startY} A 35 35 0 ${largeArc} 1 ${endX} ${endY} Z`}
                  fill={slice.color}
                  className="cursor-pointer hover:opacity-80"
                  onMouseEnter={(e) => { setHoveredIndex(index); setTooltipPosition({ x: e.clientX, y: e.clientY }); }}
                  onMouseMove={(e) => setTooltipPosition({ x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>
        </div>

        <div className="flex flex-wrap justify-center gap-3 px-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 px-2 py-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="text-xs font-medium">{item.label} ({((item.value / total) * 100).toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      </div>

      {hoveredIndex !== null && (
        <div className="fixed bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl z-50" style={{ left: tooltipPosition.x + 10, top: tooltipPosition.y + 10, pointerEvents: "none" }}>
          <div className="font-semibold text-sm">{data[hoveredIndex].label}</div>
          <div className="text-xs">{data[hoveredIndex].value} registros</div>
          <div className="text-xs opacity-70">{((data[hoveredIndex].value / total) * 100).toFixed(1)}%</div>
        </div>
      )}
    </div>
  );
};

export const ChartsCB = () => {
  const { filteredData } = useIncorporacionCB();

  const normalize = (value) => {
    if (!value) return "";
    return value.toString().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const normalizeBoolean = (value) => {
    const v = normalize(value);
    if (["si", "sí", "1", "x", "true"].includes(v)) return "Sí";
    if (["no", "0", "", "false"].includes(v)) return "No";
    return value;
  };

  const getCounts = (column) => {
    const counts = {};
    filteredData.forEach((item) => {
      let raw = item[column];
      if (!raw) return;
      let val = raw;
      if (["sí", "si", "no", "1", "0", "Sí", "SI"].includes(raw.trim())) {
        val = normalizeBoolean(raw);
      }
      val = val.trim();
      if (!val) return;
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🎯 Objetivos</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PieChart data={getCounts("Objetivo 1")} title="Objetivo 1" />
          <PieChart data={getCounts("Objetivo 2")} title="Objetivo 2" />
          <PieChart data={getCounts("Objetivo 3")} title="Objetivo 3" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🪧 Premisas CB</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PieChart data={getCounts("Participación Significativa")} title="Participación Significativa" />
          <PieChart data={getCounts("Cuerpo Territorio")} title="Cuerpo Territorio" />
          <PieChart data={getCounts("Ciudadanía Activa")} title="Ciudadanía Activa" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🔍 Enfoques</h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <PieChart data={getCounts("Enfoque Territorial")} title="Territorial" />
          <PieChart data={getCounts("Enfoque Poblacional")} title="Poblacional" />
          <PieChart data={getCounts("Enfoque Intercultural")} title="Intercultural" />
          <PieChart data={getCounts("Enfoque Diferencial")} title="Diferencial" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">👁️ Perspectivas</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieChart data={getCounts("Perspectiva de Derechos")} title="Perspectiva de Derechos" />
          <PieChart data={getCounts("Perspectiva de Determinación Social")} title="Determinación Social" />
        </div>
      </div>
    </div>
  );
};

export const DetalleActividadModal = () => {
  const { selectedActividad, setSelectedActividad } = useIncorporacionCB();
  if (!selectedActividad) return null;

  const campos = [
    { label: "Actividad", key: "Actividad" },
    { label: "Equipo/Problemática", key: "Equipo/Problemática" },
    { label: "Productos", key: "Productos" },
    { label: "Poblaciones", key: "Poblaciones" },
    { label: "Grupo", key: "Grupo" },
    { label: "Característica Sesión", key: "Característica Sesión" },
    { label: "Objetivo 1", key: "Objetivo 1" },
    { label: "Objetivo 2", key: "Objetivo 2" },
    { label: "Objetivo 3", key: "Objetivo 3" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">📄 Detalle de Actividad</h2>
            <button onClick={() => setSelectedActividad(null)} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"><X className="w-6 h-6" /></button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {campos.map(campo => selectedActividad[campo.key] && (
            <div key={campo.key} className="border-b border-gray-200 pb-3">
              <p className="text-sm font-semibold text-gray-600 mb-1">{campo.label}</p>
              <p className="text-gray-900">{selectedActividad[campo.key]}</p>
            </div>
          ))}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
              <h4 className="font-semibold text-blue-800 mb-3">🎯 Premisas CB</h4>
              {["Participación Significativa", "Cuerpo Territorio", "Ciudadanía Activa"].map(cap => (
                <div key={cap} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">{cap}</span>
                  {selectedActividad[cap]?.toLowerCase() === "si" || selectedActividad[cap]?.toLowerCase() === "sí" ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-400" />}
                </div>
              ))}
            </div>
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
              <h4 className="font-semibold text-green-800 mb-3">🔍 Enfoques</h4>
              {["Enfoque Territorial", "Enfoque Poblacional", "Enfoque Intercultural", "Enfoque Diferencial"].map(enf => (
                <div key={enf} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">{enf.replace("Enfoque ", "")}</span>
                  {selectedActividad[enf]?.toLowerCase() === "si" || selectedActividad[enf]?.toLowerCase() === "sí" ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-400" />}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-400">
            <h4 className="font-semibold text-purple-800 mb-3">👁️ Perspectivas</h4>
            {["Perspectiva de Derechos", "Perspectiva de Determinación Social"].map(per => (
              <div key={per} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">{per}</span>
                {selectedActividad[per]?.toLowerCase() === "si" || selectedActividad[per]?.toLowerCase() === "sí" ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-400" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardIncorporacionCB;