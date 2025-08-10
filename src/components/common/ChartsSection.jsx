import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
} from "recharts";
import { LabelList } from "recharts";
import { useDashboard } from '../vigencias/2025/DashboardParticipantes';
import columnsMap from "../../config/columnsMap";
import { Download } from 'lucide-react';

const COLORS = [
  '#0ea5e9', '#22c55e', '#f97316', '#a855f7',
  '#e11d48', '#14b8a6', '#facc15', '#3b82f6',
  '#6366f1', '#ef4444', '#10b981', '#8b5cf6'
];

const camposGenerales = [
  { field: 'curso', label: 'Curso de Vida' },
  { field: 'sexo', label: 'Sexo' },
  { field: 'comuna', label: 'Comuna/Corregimiento' },
  { field: 'entorno', label: 'Entornos Abordados' },
  { field: 'zona', label: 'Zona' }
];

const camposProcesos = [
  { field: 'preferencia', label: 'Preferencia sexual' },
  { field: 'escolaridad', label: 'Escolaridad' },
  { field: 'discapacidad', label: 'Personas con discapacidad' },
  { field: 'salud', label: 'Tipo de afiliación a salud' }
];

const ChartsSection = () => {
  const { tab, showUnique, filteredData } = useDashboard();
  const [exportingChart, setExportingChart] = React.useState(null);

  const getColumnName = (field, type) =>
    columnsMap[type]?.[field] || field;

  const data = React.useMemo(() => {
    if (!showUnique) return filteredData;

    const seen = new Set();
    return filteredData.filter(row => {
      const no = (row[getColumnName('no', 'acciones')] || row[getColumnName('no', 'procesos')])?.toString().trim();
      if (!no || seen.has(no)) return false;
      seen.add(no);
      return true;
    });
  }, [filteredData, showUnique]);

  const groupByField = (field) => {
    const count = {};
    let invalidCount = 0;

    data.forEach(item => {
      let value = '';

      if (tab === 'acciones') {
        value = item[getColumnName(field, 'acciones')];
      } else if (tab === 'procesos') {
        value = item[getColumnName(field, 'procesos')];
      } else {
        value = item[getColumnName(field, 'acciones')] || item[getColumnName(field, 'procesos')];
      }

      let key = value?.toString().trim().toLowerCase() || '';
      key = key.charAt(0).toUpperCase() + key.slice(1);

      if (key === '') {
        invalidCount++;
      } else {
        count[key] = (count[key] || 0) + 1;
      }
    });

    const result = Object.entries(count)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { data: result, invalidCount };
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const d = payload[0];
      const percent = ((d.value / d.payload.total) * 100).toFixed(1);
      return (
        <div className="bg-white p-2 border rounded shadow text-sm">
          <strong>{d.name}</strong><br />
          {d.value} participantes<br />
          {percent}% del total
        </div>
      );
    }
    return null;
  };

  const downloadSVG = (svgElement, fileName) => {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = svgElement.clientWidth * 2;
    canvas.height = svgElement.clientHeight * 2;
    ctx.scale(2, 2);
    
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  };

  const handleExportChart = async (chartId, fileName) => {
    setExportingChart(chartId);
    
    try {
      // Esperar actualizar DOM
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Forzar render
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const container = document.getElementById(chartId);
        if (container) {
          container.style.display = 'none';
          container.offsetHeight; // Trigger reflow
          container.style.display = '';
        }
      }
      
      // Espera captura de imágen
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const chartContainer = document.getElementById(chartId);
      if (!chartContainer) return;
      
      const svgElement = chartContainer.querySelector('svg');
      if (!svgElement) return;
      
      downloadSVG(svgElement, fileName);
      
    } catch (error) {
      console.error('Error al exportar:', error);
    } finally {
      setExportingChart(null);
    }
  };

  // labels gráficas de pastel
  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#000"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {`${name}: ${percent}%`}
      </text>
    );
  };

  // labels gráficas de barra
  const CustomBarLabel = ({ x, y, width, height, value, payload }) => {
    if (!value || !payload) return null;
    
    const percent = ((value / payload.total) * 100).toFixed(1);
    
    return (
      <text
        x={x + width + 5}
        y={y + height / 2}
        fontSize="11"
        fill="#000"
        textAnchor="start"
        dominantBaseline="middle"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {`${value} (${percent}%)`}
      </text>
    );
  };

  const renderChart = (field, label, useBar = false) => {
    const { data: chartData, invalidCount } = groupByField(field);
    const total = chartData.reduce((acc, item) => acc + item.value, 0);
    const dataWithTotal = chartData.map(item => ({
      ...item,
      total,
      percent: ((item.value / total) * 100).toFixed(1)
    }));
    const chartId = `chart-${field}`;
    const isExporting = exportingChart === chartId;

    return (
      <div key={field} className="bg-white p-4 rounded-lg shadow chart-card relative">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold text-gray-800">{label}</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {total} total
            </span>
            <button
              onClick={() => handleExportChart(chartId, label)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
              title="Descargar gráfico"
              disabled={isExporting}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExporting && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
            <div className="text-sm text-gray-600">Preparando descarga...</div>
          </div>
        )}

        <div className="w-full">
          <div id={chartId}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
                {useBar ? (
                  <BarChart
                    layout="vertical"
                    data={dataWithTotal}
                    margin={{ 
                      top: 10, 
                      right: isExporting ? 150 : 30, 
                      left: 120, 
                      bottom: 5 
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={isExporting ? null : <CustomTooltip />} />
                    <Bar dataKey="value">
                      <LabelList 
                        dataKey="value"
                        position="right"
                        style={{ 
                          display: isExporting ? 'block' : 'none',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          fill: '#000'
                        }}
                        content={({ x, y, value, index }) => {
                          if (!isExporting || !value || !dataWithTotal[index]) return null;
                          const item = dataWithTotal[index];
                          return (
                            <text
                              x={x + 10}
                              y={y + 4}
                              fontSize="12"
                              fill="#000"
                              textAnchor="start"
                              fontWeight="bold"
                              fontFamily="Arial, sans-serif"
                            >
                              {`${value} (${item.percent}%)`}
                            </text>
                          );
                        }}
                      />
                      {dataWithTotal.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={dataWithTotal}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={isExporting ? 60 : 100}
                      label={isExporting ? ({ name, percent }) => `${name}: ${percent}%` : false}
                      labelLine={isExporting}
                    >
                      {dataWithTotal.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={isExporting ? null : <CustomTooltip />} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>

        {invalidCount > 0 && (
          <div className="text-xs text-red-600 mt-2">
            {invalidCount} sin dato ({((invalidCount / (invalidCount + total)) * 100).toFixed(1)}%)
          </div>
        )}
      </div>
    );
  };

  const campos = React.useMemo(() => {
    let base = [...camposGenerales];
    if (tab === 'procesos') {
      base = base.map(c => c.field === 'sexo' ? { ...c, label: 'Me identifico como' } : c);
      base = [...base, ...camposProcesos];
    }
    return base;
  }, [tab]);

  const camposBar = ['curso', 'comuna', 'entorno', 'escolaridad'];

  return (
    <div className="mt-8">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Análisis por Categorías</h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Total de registros: <strong>{data.length}</strong></span>
          <span>Modo: <strong>{showUnique ? 'Únicos' : 'Todos'}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campos.map(({ field, label }) =>
          renderChart(field, label, camposBar.includes(field))
        )}
      </div>
    </div>
  );
};

export default ChartsSection;