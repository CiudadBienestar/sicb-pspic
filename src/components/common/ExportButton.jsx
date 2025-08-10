import React from 'react';
import { usePdfGenerator } from "../../hooks/usePdfGenerator";

export default function ExportReportButton({ containerId, title = "Reporte_PSPIC", className = "" }) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const { generatePDF } = usePDFGenerator();

  const handleExport = async () => {
    setIsGenerating(true);
    const result = await generatePDF(containerId, `${title}_${new Date().toISOString().slice(0, 10)}.pdf`, {
      addCover: true,
      title: "Participantes PSPIC",
      subtitle: "Estrategia Ciudad Bienestar – 2025"
    });

    if (!result.success) {
      alert("Error al generar el PDF: " + result.error);
    }

    setIsGenerating(false);
  };

  return (
    <button
      onClick={handleExport}
      disabled={isGenerating}
      className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-all ${className} ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {isGenerating ? "Generando PDF..." : "Descargar PDF"}
    </button>
  );
}
