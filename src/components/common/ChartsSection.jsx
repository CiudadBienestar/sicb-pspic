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
  LabelList,
} from "recharts";
import { useDashboard } from '../vigencias/2025/DashboardParticipantes';
import columnsMap from "../../config/columnsMap";
import { Download } from 'lucide-react';

const COLOR_PALETTES = {
  'curso': ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#e11d48', '#14b8a6', '#facc15', '#3b82f6'],
  'sexo': ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#e11d48', '#14b8a6', '#facc15', '#3b82f6'],
  'comuna': ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#e11d48', '#14b8a6', '#facc15', '#3b82f6'],
  'entorno': ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#e11d48', '#14b8a6', '#facc15', '#3b82f6'],
  'zona': ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#e11d48', '#14b8a6', '#facc15', '#3b82f6'],
  'preferencia': ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#e11d48', '#14b8a6', '#facc15', '#3b82f6'],
  'escolaridad': ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#e11d48', '#14b8a6', '#facc15', '#3b82f6'],
  'discapacidad': ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#e11d48', '#14b8a6', '#facc15', '#3b82f6'],
  'salud': ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#e11d48', '#14b8a6', '#facc15', '#3b82f6'],
};

const getColorPalette = (field) => {
  return COLOR_PALETTES[field] || COLOR_PALETTES['curso'];
};

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

  // ========== FUNCIÓN DE DESCARGA MEJORADA ==========
  const downloadChartAsPNG = (chartData, title, useBar = false, field) => {
    const total = chartData.reduce((acc, item) => acc + item.value, 0);
    const dataWithPercent = chartData.map(item => ({
      ...item,
      percent: ((item.value / total) * 100).toFixed(1)
    }));

    const COLORS = getColorPalette(field); // Obtener paleta específica para este campo

    if (useBar) {
      // Generar gráfico de barras como SVG
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
        const color = COLORS[index % COLORS.length];

        // Etiqueta izquierda
        const labelText = item.name.length > 18 ? item.name.substring(0, 18) + "..." : item.name;
        svgContent += `<text x="${marginLeft - 10}" y="${y + barHeight / 2 + 4}" text-anchor="end" font-size="11" fill="#374151" font-family="Arial">${labelText}</text>`;

        // Barra
        svgContent += `<rect x="${marginLeft}" y="${y}" width="${barWidth}" height="${barHeight - 5}" fill="${color}" rx="3"/>`;

        // Valor y porcentaje
        svgContent += `<text x="${marginLeft + barWidth + 8}" y="${y + barHeight / 2 + 4}" text-anchor="start" font-size="11" font-weight="bold" fill="#374151" font-family="Arial">${item.value} (${item.percent}%)</text>`;
      });

      svgContent += `</svg>`;

      convertSvgToPng(svgContent, title, width, height);

    } else {
      // Generar gráfico de pastel como SVG
      const width = 500;
      const height = 400;
      const centerX = width / 2;
      const centerY = 180;
      const radius = 100;

      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
      svgContent += `<rect width="${width}" height="${height}" fill="white"/>`;
      svgContent += `<text x="${centerX}" y="35" text-anchor="middle" font-size="18" font-weight="bold" fill="#1f2937" font-family="Arial, sans-serif">${title}</text>`;
      svgContent += `<text x="${width - 20}" y="35" text-anchor="end" font-size="12" fill="#6b7280" font-family="Arial, sans-serif">${total} total</text>`;

      let angle = -90;
      dataWithPercent.forEach((item, index) => {
        const percentage = parseFloat(item.percent);
        const sweepAngle = (percentage / 100) * 360;
        const startAngle = angle;
        const endAngle = startAngle + sweepAngle;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = centerX + radius * Math.cos(startRad);
        const y1 = centerY + radius * Math.sin(startRad);
        const x2 = centerX + radius * Math.cos(endRad);
        const y2 = centerY + radius * Math.sin(endRad);

        const largeArc = sweepAngle > 180 ? 1 : 0;
        const color = COLORS[index % COLORS.length];

        svgContent += `<path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${color}"/>`;

        // Etiqueta dentro del slice si es >= 5%
        if (percentage >= 5) {
          const midAngle = startAngle + sweepAngle / 2;
          const midRad = (midAngle * Math.PI) / 180;
          const labelRadius = radius * 0.65;
          const labelX = centerX + labelRadius * Math.cos(midRad);
          const labelY = centerY + labelRadius * Math.sin(midRad);
          svgContent += `<text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="bold" fill="white" font-family="Arial">${item.percent}%</text>`;
        }

        angle = endAngle;
      });

      // Leyenda
      const legendStartY = 310;
      const legendStartX = 30;
      const itemsPerRow = 3;
      const itemWidth = 150;
      const rowHeight = 22;

      dataWithPercent.forEach((item, index) => {
        const col = index % itemsPerRow;
        const row = Math.floor(index / itemsPerRow);
        const x = legendStartX + col * itemWidth;
        const y = legendStartY + row * rowHeight;
        const color = COLORS[index % COLORS.length];

        svgContent += `<rect x="${x}" y="${y}" width="14" height="14" fill="${color}" rx="3"/>`;
        const labelText = item.name.length > 12 ? item.name.substring(0, 12) + "..." : item.name;
        svgContent += `<text x="${x + 20}" y="${y + 11}" font-size="10" fill="#374151" font-family="Arial">${labelText} (${item.value})</text>`;
      });

      svgContent += `</svg>`;

      convertSvgToPng(svgContent, title, width, height);
    }
  };

  const convertSvgToPng = (svgContent, title, width, height) => {
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

  const renderChart = (field, label, useBar = false) => {
    const { data: chartData, invalidCount } = groupByField(field);
    const total = chartData.reduce((acc, item) => acc + item.value, 0);
    const dataWithTotal = chartData.map(item => ({
      ...item,
      total,
      percent: ((item.value / total) * 100).toFixed(1)
    }));

    const COLORS = getColorPalette(field); // Obtener paleta específica para este campo

    return (
      <div key={field} className="bg-white p-4 rounded-lg shadow chart-card relative">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold text-gray-800">{label}</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {total} total
            </span>
            <button
              onClick={() => downloadChartAsPNG(chartData, label, useBar, field)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Descargar gráfico"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
              {useBar ? (
                <BarChart
                  layout="vertical"
                  data={dataWithTotal}
                  margin={{ top: 10, right: 30, left: 120, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value">
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
                    outerRadius={100}
                    label={false}
                  >
                    {dataWithTotal.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No hay datos disponibles</p>
            </div>
          )}
        </div>

        {/* Leyenda para gráficos de pastel */}
        {!useBar && chartData.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mt-4 px-2">
            {dataWithTotal.map((item, index) => (
              <div key={index} className="flex items-center gap-2 px-2 py-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs font-medium">{item.name} ({item.percent}%)</span>
              </div>
            ))}
          </div>
        )}

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
        <h3 className="text-xl font-bold text-gray-800 mb-2">📊 Análisis por Categorías</h3>
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
