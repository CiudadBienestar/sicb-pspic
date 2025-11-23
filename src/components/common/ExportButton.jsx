import React, { useState, useCallback } from 'react';
import usePdfGenerator from '../../hooks/usePdfGenerator';
import { Download, Loader2 } from 'lucide-react';

export default function ExportReportButton({ 
  containerId, 
  title = "Reporte_PSPIC",
  reportTitle = "Participantes PSPIC",
  subtitle = "Estrategia Ciudad Bienestar – 2025",
  className = "" 
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { generatePDF } = usePdfGenerator();

  const handleExport = useCallback(async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      const result = await generatePDF(
        containerId,
        `${title}_${new Date().toISOString().slice(0, 10)}.pdf`,
        { addCover: true, title: reportTitle, subtitle }
      );

      if (!result.success) {
        console.error("Error PDF:", result.error);
        alert("Error al generar el PDF: " + result.error);
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      alert("Error inesperado al generar el PDF");
    } finally {
      setIsGenerating(false);
    }
  }, [containerId, title, reportTitle, subtitle, generatePDF, isGenerating]);

  return (
    <button
      onClick={handleExport}
      disabled={isGenerating}
      className={`
        inline-flex items-center gap-2 px-4 py-2 
        bg-blue-600 hover:bg-blue-700 
        text-white font-medium text-sm
        rounded-lg shadow-md hover:shadow-lg
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600
        ${className}
      `}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Descargar PDF
        </>
      )}
    </button>
  );
}