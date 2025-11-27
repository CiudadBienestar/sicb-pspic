import React, {
  useState,
  useEffect,
  useMemo,
  createContext,
  useContext,
  useRef,
} from "react";
import Papa from "papaparse";
import { GraduationCap, Calendar, MapPin, Users, Filter, Download, Clock, Building2, X } from "lucide-react";

const TalleresContext = createContext();

export const useTalleres = () => useContext(TalleresContext);

const SHEET_ID = "1sNID9AqNlYdfoWEf_9Eo2lS4gZfooWZw7KYRTM-QBRs";

const sheetConfig = {
  talleres: {
    gid: "808270317",
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

const DashboardTalleres = ({ children }) => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [selectedTaller, setSelectedTaller] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchSheet(sheetConfig.talleres.gid);
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
    const totalTalleres = filteredData.length;

    const talleresPorZona = {};
    filteredData.forEach(item => {
      const zona = item["Zona"] || "Sin Dato";
      talleresPorZona[zona] = (talleresPorZona[zona] || 0) + 1;
    });

    const talleresPorComuna = {};
    filteredData.forEach(item => {
      const comuna = item["Comuna/Corregimiento"] || "Sin Dato";
      talleresPorComuna[comuna] = (talleresPorComuna[comuna] || 0) + 1;
    });

    return {
      totalTalleres,
      talleresPorZona,
      talleresPorComuna,
    };
  }, [filteredData]);

  const contextValue = {
    datos,
    loading,
    filters,
    setFilters,
    filteredData,
    stats,
    selectedTaller,
    setSelectedTaller,
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
    <TalleresContext.Provider value={contextValue}>
      {children}
    </TalleresContext.Provider>
  );
};

export const SummaryCardsTalleres = () => {
  const { stats } = useTalleres();

  return (
    <div className="grid grid-cols-1 gap-6 mb-6">
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium mb-1">Total Talleres</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalTalleres}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-3 rounded-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Filtros
export const FiltersTalleres = () => {
  const { datos, filters, setFilters } = useTalleres();

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
    { key: "Zona", label: "Zona" },
    { key: "Comuna/Corregimiento", label: "Comuna/Corregimiento" },
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
                <span key={key} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">
                  {value}
                  <button onClick={() => setFilters(prev => ({ ...prev, [key]: "Todos" }))} className="ml-2 text-blue-600 hover:text-blue-800">✕</button>
                </span>
              ))}
          </div>
          <button onClick={() => setFilters({})} className="text-sm text-blue-600 hover:text-blue-800 font-medium underline">
            Limpiar todos
          </button>
        </div>
      )}
    </div>
  );
};

//Tabla
export const TablaTalleres = () => {
  const { filteredData, setSelectedTaller } = useTalleres();

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return fecha;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-600 to-blue-500">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Id</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Tema</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">

                {/* ID */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item["Id"] || "-"}
                </td>

                {/* FECHA */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                    {formatearFecha(item["Fecha Taller"])}
                  </div>
                </td>

                {/* TEMA */}
                <td className="px-6 py-4 text-sm text-gray-900">
                  {item["Tema"] || "-"}
                </td>

                {/* ACCIONES */}
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => setSelectedTaller(item)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
      {filteredData.length === 0 && (
        <div className="text-center py-8 text-gray-500">No se encontraron talleres con los filtros aplicados</div>
      )}
    </div>
  );
};

// Paletas de colores
const COLORS_ZONA = ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#e11d48', '#14b8a6', '#facc15', '#3b82f6', '#6366f1', '#ef4444', '#10b981', '#8b5cf6'];
const COLORS_COMUNA = ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#e11d48', '#14b8a6', '#facc15', '#3b82f6', '#6366f1', '#ef4444', '#10b981', '#8b5cf6'];


// PieChart
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
        <button onClick={downloadChart} className="ml-2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Descargar gráfico">
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
          <div className="text-xs"><span className="font-bold">{data[hoveredIndex].value}</span> talleres</div>
          <div className="text-xs text-gray-300">{((data[hoveredIndex].value / total) * 100).toFixed(1)}% del total</div>
        </div>
      )}
    </div>
  );
};

// Componente de Gráfico de Barras
const BarChart = ({ data, title, colors }) => {
  const chartRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const chartData = data.map(item => ({
    name: item.label,
    value: item.value,
    total,
    percent: ((item.value / total) * 100).toFixed(1)
  }));

  const downloadChart = () => {
    const dataWithPercent = data.map(item => ({
      ...item,
      percent: ((item.value / total) * 100).toFixed(1)
    }));

    const width = 600;
    const barHeight = 35;
    const height = Math.max(400, dataWithPercent.length * barHeight + 100);
    const marginLeft = 150;
    const marginRight = 120;
    const marginTop = 60;
    const chartWidth = width - marginLeft - marginRight;
    const maxValue = Math.max(...dataWithPercent.map(d => d.value));

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    svgContent += `<rect width="${width}" height="${height}" fill="white"/>`;
    svgContent += `<text x="${width / 2}" y="35" text-anchor="middle" font-size="18" font-weight="bold" fill="#1f2937" font-family="Arial, sans-serif">${title}</text>`;
    svgContent += `<text x="${width - 20}" y="35" text-anchor="end" font-size="12" fill="#6b7280" font-family="Arial, sans-serif">${total} total</text>`;

    dataWithPercent.forEach((item, index) => {
      const y = marginTop + index * barHeight;
      const barWidth = (item.value / maxValue) * chartWidth;
      const color = colors[index % colors.length];

      const labelText = item.label.length > 18 ? item.label.substring(0, 18) + "..." : item.label;
      svgContent += `<text x="${marginLeft - 10}" y="${y + barHeight / 2 + 4}" text-anchor="end" font-size="11" fill="#374151" font-family="Arial">${labelText}</text>`;
      svgContent += `<rect x="${marginLeft}" y="${y}" width="${barWidth}" height="${barHeight - 5}" fill="${color}" rx="3"/>`;
      svgContent += `<text x="${marginLeft + barWidth + 8}" y="${y + barHeight / 2 + 4}" text-anchor="start" font-size="11" font-weight="bold" fill="#374151" font-family="Arial">${item.value} (${item.percent}%)</text>`;
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

  return (
    <div ref={chartRef} className="bg-white rounded-xl shadow-lg p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {total} total
          </span>
          <button onClick={downloadChart} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Descargar gráfico">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="w-full">
        {chartData.length > 0 ? (
          <div style={{ width: '100%', height: Math.max(300, chartData.length * 40), position: 'relative' }}>
            <svg width="100%" height="100%" viewBox={`0 0 600 ${Math.max(300, chartData.length * 40)}`}>
              {chartData.map((item, index) => {
                const barY = 10 + index * 40;
                const barWidth = (item.value / Math.max(...chartData.map(d => d.value))) * 450;
                return (
                  <g key={index}>
                    <text x="120" y={barY + 20} textAnchor="end" fontSize="12" fill="#374151" fontFamily="Arial">
                      {item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name}
                    </text>
                    <rect
                      x="130"
                      y={barY + 5}
                      width={barWidth}
                      height="25"
                      fill={colors[index % colors.length]}
                      rx="3"
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onMouseEnter={(e) => {
                        setHoveredIndex(index);
                        setTooltipPosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => setTooltipPosition({ x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>No hay datos disponibles</p>
          </div>
        )}
      </div>
      {hoveredIndex !== null && (
        <div className="fixed z-50 bg-white border border-gray-200 px-4 py-3 rounded-lg shadow-xl pointer-events-none"
          style={{ left: `${tooltipPosition.x + 10}px`, top: `${tooltipPosition.y + 10}px`, transform: 'translate(0, -50%)' }}>
          <div className="font-semibold text-sm mb-1 text-gray-800">{chartData[hoveredIndex].name}</div>
          <div className="text-xs text-gray-700"><span className="font-bold">{chartData[hoveredIndex].value}</span> talleres</div>
          <div className="text-xs text-gray-600">{chartData[hoveredIndex].percent}% del total</div>
        </div>
      )}
    </div>
  );
};

// Componente de Gráficos
export const ChartsTalleres = () => {
  const { stats } = useTalleres();

  const datosPorZona = Object.entries(stats.talleresPorZona)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const datosPorComuna = Object.entries(stats.talleresPorComuna)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <PieChart data={datosPorZona} title="Talleres por Zona" colors={COLORS_ZONA} />
      <BarChart data={datosPorComuna} title="Talleres por Comuna/Corregimiento" colors={COLORS_COMUNA} />
    </div>
  );
};

// Modal de Detalle del Taller
export const DetalleTallerModal = () => {
  const { selectedTaller, setSelectedTaller } = useTalleres();

  if (!selectedTaller) return null;

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return fecha;
    }
  };

  const campos = [
    { label: "Fecha del Taller", key: "Fecha Taller", icon: Calendar },
    { label: "Tema", key: "Tema", icon: Users },
    { label: "Ubicación", key: "ubicación", icon: MapPin },
    { label: "Barrio", key: "Barrio", icon: MapPin },
    { label: "Comuna/Corregimiento", key: "Comuna/Corregimiento", icon: Building2 },
    { label: "Zona", key: "Zona", icon: MapPin },
    { label: "Equipo/Problemática", key: "Equipo/Problemática", icon: Users },
    { label: "Poblaciones", key: "Poblaciones", icon: Users },
    { label: "Responsable", key: "Responsable", icon: Users },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Detalle del Taller</h2>
            <button onClick={() => setSelectedTaller(null)} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {campos.map(campo => {
            const valor = campo.key === "Fecha Taller" ? formatearFecha(selectedTaller[campo.key]) : selectedTaller[campo.key];
            if (!valor || valor === "-") return null;
            const Icon = campo.icon;
            return (
              <div key={campo.key} className="border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-semibold text-gray-600">{campo.label}</p>
                </div>
                <p className="text-gray-900 ml-6">{valor}</p>
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end border-t">
          <button onClick={() => setSelectedTaller(null)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardTalleres;
