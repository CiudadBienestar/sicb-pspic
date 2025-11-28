import React, { useMemo, useCallback } from 'react';
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
import { useDashboard } from '../vigencias/2025/DashboardParticipantes';
import columnsMap from "../../config/columnsMap";
import { Download } from 'lucide-react';

// Paleta de colores única y vibrante
const COLORS = [
  '#0ea5e9', '#22c55e', '#f97316', '#a855f7',
  '#e11d48', '#14b8a6', '#facc15', '#3b82f6',
  '#6366f1', '#ef4444', '#10b981', '#8b5cf6'
];

const getColorPalette = () => COLORS;

// Campos de análisis
const camposGenerales = [
  { field: 'curso', label: 'Curso de Vida' },
  { field: 'sexo', label: 'Sexo' },
  { field: 'etnia', label: 'Etnia' },
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

  // Obtener nombre de columna
  const getColumnName = useCallback((field, type) =>
    columnsMap[type]?.[field] || field,
    []
  );

  // Filtrar datos únicos si es necesario
  const data = useMemo(() => {
    if (!showUnique) return filteredData;

    const seen = new Set();
    return filteredData.filter(row => {
      const no = (
        row[getColumnName('no', 'acciones')] ||
        row[getColumnName('no', 'procesos')]
      )?.toString().trim();

      if (!no || seen.has(no)) return false;
      seen.add(no);
      return true;
    });
  }, [filteredData, showUnique, getColumnName]);

  // Agrupar datos por campo
  const groupByField = useCallback((field) => {
    const count = {};
    let invalidCount = 0;

    data.forEach(item => {
      let value = '';

      if (tab === 'acciones') {
        value = item[getColumnName(field, 'acciones')];
      } else if (tab === 'procesos') {
        value = item[getColumnName(field, 'procesos')];
      } else {
        value = item[getColumnName(field, 'acciones')] ||
          item[getColumnName(field, 'procesos')];
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
  }, [data, tab, getColumnName]);

  // Tooltip personalizado
  const CustomTooltip = useCallback(({ active, payload }) => {
    if (active && payload?.length) {
      const d = payload[0];
      const percent = ((d.value / d.payload.total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
          <div className="font-semibold text-gray-800 mb-1">{d.name}</div>
          <div className="text-gray-600">
            <span className="font-medium">{d.value}</span> participantes
          </div>
          <div className="text-gray-500 text-xs mt-1">
            {percent}% del total
          </div>
        </div>
      );
    }
    return null;
  }, []);

  // Función para convertir SVG a PNG
  const convertSvgToPng = useCallback((svgContent, title, width, height) => {
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

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `${title.replace(/\s+/g, "_")}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgContent)));
  }, []);

  // Descargar gráfico como PNG
  const downloadChartAsPNG = useCallback((chartData, title, useBar = false) => {
    const total = chartData.reduce((acc, item) => acc + item.value, 0);
    const dataWithPercent = chartData.map(item => ({
      ...item,
      percent: ((item.value / total) * 100).toFixed(1)
    }));

    if (useBar) {
      // Generar gráfico de barras como SVG
      const width = 700;
      const barHeight = 40;
      const height = Math.max(400, dataWithPercent.length * barHeight + 120);
      const marginLeft = 200;
      const marginRight = 150;
      const marginTop = 80;
      const chartWidth = width - marginLeft - marginRight;

      const maxValue = Math.max(...dataWithPercent.map(d => d.value));

      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
      svgContent += `<rect width="${width}" height="${height}" fill="white"/>`;
      svgContent += `<text x="${width / 2}" y="40" text-anchor="middle" font-size="22" font-weight="bold" fill="#1f2937" font-family="Arial, sans-serif">${title}</text>`;
      svgContent += `<text x="${width - 30}" y="40" text-anchor="end" font-size="14" fill="#6b7280" font-family="Arial, sans-serif">Total: ${total}</text>`;

      dataWithPercent.forEach((item, index) => {
        const y = marginTop + index * barHeight;
        const barWidth = (item.value / maxValue) * chartWidth;
        const color = COLORS[index % COLORS.length];

        // Etiqueta izquierda (nombre completo sin truncar)
        svgContent += `<text x="${marginLeft - 15}" y="${y + barHeight / 2 + 5}" text-anchor="end" font-size="12" fill="#374151" font-family="Arial">${item.name}</text>`;

        // Barra
        svgContent += `<rect x="${marginLeft}" y="${y + 5}" width="${barWidth}" height="${barHeight - 10}" fill="${color}" rx="4"/>`;

        // Valor y porcentaje
        svgContent += `<text x="${marginLeft + barWidth + 10}" y="${y + barHeight / 2 + 5}" text-anchor="start" font-size="12" font-weight="bold" fill="#374151" font-family="Arial">${item.value} (${item.percent}%)</text>`;
      });

      svgContent += `</svg>`;
      convertSvgToPng(svgContent, title, width, height);

    } else {
      // Generar gráfico de pastel
      const width = 700;
      const maxItemsPerColumn = 12;
      const columns = Math.ceil(dataWithPercent.length / maxItemsPerColumn);
      const legendHeight = Math.min(dataWithPercent.length, maxItemsPerColumn) * 28 + 80;
      const height = 400 + legendHeight;

      const centerX = width / 2;
      const centerY = 220;
      const radius = 130;

      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
      svgContent += `<rect width="${width}" height="${height}" fill="white"/>`;

      // Título principal
      svgContent += `<text x="${centerX}" y="40" text-anchor="middle" font-size="22" font-weight="bold" fill="#1f2937" font-family="Arial, sans-serif">${title}</text>`;
      svgContent += `<text x="${width - 30}" y="40" text-anchor="end" font-size="14" fill="#6b7280" font-family="Arial, sans-serif">Total: ${total}</text>`;

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

        svgContent += `<path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${color}" stroke="white" stroke-width="2"/>`;

        // Calcular posición de la etiqueta
        const midAngle = startAngle + sweepAngle / 2;
        const midRad = (midAngle * Math.PI) / 180;

        if (percentage >= 3) {
          // Para valores grandes (>= 3%): etiqueta DENTRO del pastel
          const labelRadius = radius * 0.7;
          const labelX = centerX + labelRadius * Math.cos(midRad);
          const labelY = centerY + labelRadius * Math.sin(midRad);

          const textWidth = item.percent.length * 7 + 10;
          svgContent += `<rect x="${labelX - textWidth / 2}" y="${labelY - 10}" width="${textWidth}" height="20" fill="rgba(255,255,255,0.9)" rx="3"/>`;
          svgContent += `<text x="${labelX}" y="${labelY + 4}" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="bold" fill="#1f2937" font-family="Arial">${item.percent}%</text>`;
        } else {
          // Para valores pequeños (< 3%): etiqueta FUERA del pastel con línea
          const innerRadius = radius + 10;
          const outerRadius = radius + 45;

          const innerX = centerX + innerRadius * Math.cos(midRad);
          const innerY = centerY + innerRadius * Math.sin(midRad);
          const outerX = centerX + outerRadius * Math.cos(midRad);
          const outerY = centerY + outerRadius * Math.sin(midRad);

          // Línea de conexión
          svgContent += `<line x1="${innerX}" y1="${innerY}" x2="${outerX}" y2="${outerY}" stroke="${color}" stroke-width="1.5"/>`;

          // Círculo al final de la línea
          svgContent += `<circle cx="${outerX}" cy="${outerY}" r="2" fill="${color}"/>`;

          // Determinar alineación del texto según el ángulo
          const textAnchor = Math.cos(midRad) >= 0 ? 'start' : 'end';
          const textX = outerX + (Math.cos(midRad) >= 0 ? 5 : -5);

          // Fondo del texto
          const textBgWidth = 35;
          const textBgX = Math.cos(midRad) >= 0 ? textX : textX - textBgWidth;
          svgContent += `<rect x="${textBgX}" y="${outerY - 9}" width="${textBgWidth}" height="18" fill="rgba(255,255,255,0.95)" rx="3" stroke="${color}" stroke-width="1"/>`;

          // Texto del porcentaje
          svgContent += `<text x="${textX + (Math.cos(midRad) >= 0 ? 17 : -17)}" y="${outerY + 3}" text-anchor="middle" font-size="10" font-weight="bold" fill="#1f2937" font-family="Arial">${item.percent}%</text>`;
        }

        angle = endAngle;
      });

      // Leyenda mejorada
      const legendStartY = centerY + radius + 60;
      const legendStartX = 50;
      const itemsPerColumn = Math.ceil(dataWithPercent.length / columns);
      const columnWidth = (width - 100) / columns;
      const rowHeight = 28;

      svgContent += `<line x1="50" y1="${legendStartY - 20}" x2="${width - 50}" y2="${legendStartY - 20}" stroke="#e5e7eb" stroke-width="2"/>`;
      
      dataWithPercent.forEach((item, index) => {
        const col = Math.floor(index / itemsPerColumn);
        const row = index % itemsPerColumn;
        const x = legendStartX + col * columnWidth;
        const y = legendStartY + 30 + row * rowHeight;
        const color = COLORS[index % COLORS.length];

        // Cuadro de color
        svgContent += `<rect x="${x}" y="${y - 12}" width="18" height="18" fill="${color}" rx="3" stroke="#d1d5db" stroke-width="1"/>`;

        // Nombre completo
        svgContent += `<text x="${x + 25}" y="${y + 2}" font-size="11.5" fill="#374151" font-family="Arial">${item.name}</text>`;

        // Valor y porcentaje alineado a la derecha
        svgContent += `<text x="${x + columnWidth - 15}" y="${y + 2}" text-anchor="end" font-size="11.5" font-weight="bold" fill="#1f2937" font-family="Arial">${item.value} (${item.percent}%)</text>`;
      });

      svgContent += `</svg>`;
      convertSvgToPng(svgContent, title, width, height);
    }
  }, [convertSvgToPng]);

  // Renderizar gráfico individual
  const renderChart = useCallback((field, label, useBar = false) => {
    const { data: chartData, invalidCount } = groupByField(field);

    if (chartData.length === 0 && invalidCount === 0) {
      return null;
    }

    const total = chartData.reduce((acc, item) => acc + item.value, 0);
    const dataWithTotal = chartData.map(item => ({
      ...item,
      total,
      percent: ((item.value / total) * 100).toFixed(1)
    }));

    return (
      <div key={field} className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold text-gray-800 text-lg">{label}</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
              {total} total
            </span>
            <button
              onClick={() => downloadChartAsPNG(chartData, label, useBar)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Descargar gráfico"
              aria-label={`Descargar gráfico de ${label}`}
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
              <div key={index} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded transition-colors">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs font-medium text-gray-700">
                  {item.name} ({item.percent}%)
                </span>
              </div>
            ))}
          </div>
        )}

        {invalidCount > 0 && (
          <div className="text-xs text-red-600 mt-3 bg-red-50 px-3 py-2 rounded">
            {invalidCount} sin dato ({((invalidCount / (invalidCount + total)) * 100).toFixed(1)}%)
          </div>
        )}
      </div>
    );
  }, [groupByField, downloadChartAsPNG, CustomTooltip]);

  // Determinar campos a mostrar según el tab
  const campos = useMemo(() => {
    let base = [...camposGenerales];
    if (tab === 'procesos') {
      base = base.map(c => c.field === 'sexo' ? { ...c, label: 'Me identifico como' } : c);
      base = [...base, ...camposProcesos];
    }
    return base;
  }, [tab]);

  // Campos que usan gráfico de barras
  const camposBar = ['curso', 'comuna', 'entorno', 'escolaridad'];

  return (
    <div className="mt-8">
      <div className="mb-6 bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Análisis por Categorías
        </h3>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-medium">Total de registros:</span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
              {data.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Modo:</span>
            <span className={`px-3 py-1 rounded-full font-bold ${showUnique
              ? 'bg-green-100 text-green-800'
              : 'bg-purple-100 text-purple-800'
              }`}>
              {showUnique ? 'Únicos' : 'Todos'}
            </span>
          </div>
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
