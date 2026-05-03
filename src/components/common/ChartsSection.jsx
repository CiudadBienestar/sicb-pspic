import React, { useMemo, useCallback } from "react";
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
import { Download } from "lucide-react";

const COLORS = [
  "#0ea5e9", "#22c55e", "#f97316", "#a855f7",
  "#e11d48", "#14b8a6", "#facc15", "#3b82f6",
  "#6366f1", "#ef4444", "#10b981", "#8b5cf6",
];

/**
 * Campos por defecto que se muestran para la vista de acciones/todo.
 * Se pueden sobreescribir via prop `camposGenerales`.
 */
const DEFAULT_CAMPOS_GENERALES = [
  { field: "curso",   label: "Curso de Vida"           },
  { field: "sexo",    label: "Sexo"                    },
  { field: "etnia",   label: "Etnia"                   },
  { field: "comuna",  label: "Comuna/Corregimiento"    },
  { field: "entorno", label: "Entornos Abordados"      },
  { field: "zona",    label: "Zona"                    },
];

/**
 * Campos adicionales que aparecen sólo en la vista "procesos".
 * Se pueden sobreescribir via prop `camposProcesos`.
 */
const DEFAULT_CAMPOS_PROCESOS = [
  { field: "preferencia",  label: "Preferencia sexual"              },
  { field: "escolaridad",  label: "Escolaridad"                     },
  { field: "discapacidad", label: "Personas con discapacidad"       },
  { field: "salud",        label: "Tipo de afiliación a salud"      },
];

/** Campos que se renderizan como BarChart en lugar de PieChart. */
const BAR_FIELDS = ["curso", "comuna", "entorno", "escolaridad"];

/**
 * ChartsSection — Genérico para cualquier vigencia.
 *
 * Props:
 *   tab              "todo" | "acciones" | "procesos"
 *   filteredData     filas activas (ya filtradas + ya mezcladas según tab)
 *   showUnique       boolean
 *   columns          { acciones: { no, curso, sexo, … }, procesos: { no, curso, sexo, … } }
 *   camposGenerales  Array<{ field, label }> — sobreescribe los campos por defecto
 *   camposProcesos   Array<{ field, label }> — sobreescribe los campos de procesos
 *   barFields        string[]               — sobreescribe qué campos usan BarChart
 */
const ChartsSection = ({
  tab,
  filteredData,
  showUnique,
  columns,
  camposGenerales = DEFAULT_CAMPOS_GENERALES,
  camposProcesos  = DEFAULT_CAMPOS_PROCESOS,
  barFields       = BAR_FIELDS,
}) => {
  const colA = columns.acciones;
  const colP = columns.procesos;

  const getColumnName = useCallback(
    (field, type) => (type === "acciones" ? colA[field] : colP[field]) || field,
    [colA, colP]
  );

  // Aplicar deduplicación por ID si showUnique está activo
  const data = useMemo(() => {
    if (!showUnique) return filteredData;
    const seen = new Set();
    return filteredData.filter((row) => {
      const no = (row[getColumnName("no", "acciones")] || row[getColumnName("no", "procesos")])
        ?.toString()
        .trim();
      if (!no || seen.has(no)) return false;
      seen.add(no);
      return true;
    });
  }, [filteredData, showUnique, getColumnName]);

  const groupByField = useCallback(
    (field) => {
      const count = {};
      let invalidCount = 0;
      data.forEach((item) => {
        let value;
        if (tab === "acciones")      value = item[getColumnName(field, "acciones")];
        else if (tab === "procesos") value = item[getColumnName(field, "procesos")];
        else                         value = item[getColumnName(field, "acciones")] || item[getColumnName(field, "procesos")];

        let key = value?.toString().trim().toLowerCase() || "";
        key = key.charAt(0).toUpperCase() + key.slice(1);
        if (key === "") invalidCount++;
        else count[key] = (count[key] || 0) + 1;
      });
      const result = Object.entries(count)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      return { data: result, invalidCount };
    },
    [data, tab, getColumnName]
  );

  // ── SVG export ──────────────────────────────────────────────────────────────

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

  const downloadChartAsPNG = useCallback(
    (chartData, title, useBar = false) => {
      const total = chartData.reduce((acc, item) => acc + item.value, 0);
      const dataWithPercent = chartData.map((item) => ({
        ...item,
        percent: ((item.value / total) * 100).toFixed(1),
      }));

      if (useBar) {
        const width = 700;
        const barHeight = 40;
        const height = Math.max(400, dataWithPercent.length * barHeight + 120);
        const marginLeft = 200, marginRight = 150, marginTop = 80;
        const chartWidth = width - marginLeft - marginRight;
        const maxValue = Math.max(...dataWithPercent.map((d) => d.value));
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
        svg += `<rect width="${width}" height="${height}" fill="white"/>`;
        svg += `<text x="${width / 2}" y="40" text-anchor="middle" font-size="22" font-weight="bold" fill="#1f2937" font-family="Arial">${title}</text>`;
        svg += `<text x="${width - 30}" y="40" text-anchor="end" font-size="14" fill="#6b7280" font-family="Arial">Total: ${total}</text>`;
        dataWithPercent.forEach((item, i) => {
          const y = marginTop + i * barHeight;
          const bw = (item.value / maxValue) * chartWidth;
          const color = COLORS[i % COLORS.length];
          svg += `<text x="${marginLeft - 15}" y="${y + barHeight / 2 + 5}" text-anchor="end" font-size="12" fill="#374151" font-family="Arial">${item.name}</text>`;
          svg += `<rect x="${marginLeft}" y="${y + 5}" width="${bw}" height="${barHeight - 10}" fill="${color}" rx="4"/>`;
          svg += `<text x="${marginLeft + bw + 10}" y="${y + barHeight / 2 + 5}" font-size="12" font-weight="bold" fill="#374151" font-family="Arial">${item.value} (${item.percent}%)</text>`;
        });
        svg += `</svg>`;
        convertSvgToPng(svg, title, width, height);
      } else {
        const width = 700, height = 500;
        const cx = width / 2, cy = 220, r = 130;
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
        svg += `<rect width="${width}" height="${height}" fill="white"/>`;
        svg += `<text x="${cx}" y="40" text-anchor="middle" font-size="22" font-weight="bold" fill="#1f2937" font-family="Arial">${title}</text>`;
        let angle = -90;
        dataWithPercent.forEach((item, i) => {
          const sweep = (parseFloat(item.percent) / 100) * 360;
          const sr = (angle * Math.PI) / 180;
          const er = ((angle + sweep) * Math.PI) / 180;
          const x1 = cx + r * Math.cos(sr), y1 = cy + r * Math.sin(sr);
          const x2 = cx + r * Math.cos(er), y2 = cy + r * Math.sin(er);
          const la = sweep > 180 ? 1 : 0;
          svg += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${la} 1 ${x2} ${y2} Z" fill="${COLORS[i % COLORS.length]}" stroke="white" stroke-width="2"/>`;
          angle += sweep;
        });
        let ly = cy + r + 40;
        dataWithPercent.forEach((item, i) => {
          svg += `<rect x="50" y="${ly - 10}" width="16" height="16" fill="${COLORS[i % COLORS.length]}" rx="3"/>`;
          svg += `<text x="74" y="${ly + 3}" font-size="12" fill="#374151" font-family="Arial">${item.name}: ${item.value} (${item.percent}%)</text>`;
          ly += 24;
        });
        svg += `</svg>`;
        convertSvgToPng(svg, title, width, height);
      }
    },
    [convertSvgToPng]
  );

  // ── Tooltip ─────────────────────────────────────────────────────────────────

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
          <div className="text-gray-500 text-xs mt-1">{percent}% del total</div>
        </div>
      );
    }
    return null;
  }, []);

  // ── renderChart ─────────────────────────────────────────────────────────────

  const renderChart = useCallback(
    (field, label, useBar = false) => {
      const { data: chartData, invalidCount } = groupByField(field);
      if (chartData.length === 0 && invalidCount === 0) return null;

      const total = chartData.reduce((acc, item) => acc + item.value, 0);
      const dataWithTotal = chartData.map((item) => ({
        ...item,
        total,
        percent: ((item.value / total) * 100).toFixed(1),
      }));

      return (
        <div
          key={field}
          data-pdf-block
          className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
        >
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
              <ResponsiveContainer
                width="100%"
                height={Math.max(300, chartData.length * 40)}
              >
                {useBar ? (
                  <BarChart
                    layout="vertical"
                    data={dataWithTotal}
                    margin={{ top: 10, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 12 }}
                    />
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

          {!useBar && chartData.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-4 px-2">
              {dataWithTotal.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded transition-colors"
                >
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
              {invalidCount} sin dato (
              {((invalidCount / (invalidCount + total)) * 100).toFixed(1)}%)
            </div>
          )}
        </div>
      );
    },
    [groupByField, downloadChartAsPNG, CustomTooltip]
  );

  // ── Campos a renderizar según tab ────────────────────────────────────────────

  const campos = useMemo(() => {
    let base = [...camposGenerales];
    if (tab === "procesos") {
      // En procesos, la etiqueta de "sexo" cambia
      base = base.map((c) =>
        c.field === "sexo" ? { ...c, label: "Me identifico como" } : c
      );
      base = [...base, ...camposProcesos];
    }
    return base;
  }, [tab, camposGenerales, camposProcesos]);

  return (
    <div className="mt-8">
      <div
        data-pdf-block
        className="mb-6 bg-white rounded-xl shadow-md p-6 border border-gray-100"
      >
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
            <span
              className={`px-3 py-1 rounded-full font-bold ${
                showUnique
                  ? "bg-green-100 text-green-800"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              {showUnique ? "Únicos" : "Todos"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campos.map(({ field, label }) =>
          renderChart(field, label, barFields.includes(field))
        )}
      </div>
    </div>
  );
};

export default ChartsSection;
