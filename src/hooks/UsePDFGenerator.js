// src/hooks/usePdfGenerator.js
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";

export default function usePdfGenerator() {
  const generatePDF = async (
    containerId,
    fileName = "reporte.pdf",
    options = {}
  ) => {
    try {
      const input = document.getElementById(containerId);
      if (!input) {
        return {
          success: false,
          error: `Elemento con ID "${containerId}" no encontrado`,
        };
      }

      // 1. Esperar a que el contenido, especialmente los gráficos, esté completamente renderizado.
      // Puedes usar una función de retardo si es necesario.
      // Aquí simulamos una espera de 300ms.
      await new Promise((resolve) => setTimeout(resolve, 300));

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // Margen de 10mm
      const contentWidth = pageWidth - 2 * margin;

      // Opcional: Agregar portada
      if (options.addCover) {
        pdf.setFontSize(20);
        pdf.text(
          options.title || "Reporte PSPIC",
          pageWidth / 2,
          pageHeight / 2 - 10,
          { align: "center" }
        );
        pdf.setFontSize(14);
        pdf.text(
          options.subtitle || "",
          pageWidth / 2,
          pageHeight / 2 + 10,
          { align: "center" }
        );
        pdf.addPage();
      }

      // 2. Convertir el contenedor en canvas
      const canvas = await html2canvas(input, {
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        scale: 2, // Mayor resolución
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0); // Usar JPEG con alta calidad

      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * contentWidth) / imgProps.width;

      let position = margin;
      let remainingHeight = pdfHeight;
      let pageNumber = 1;

      // 3. Manejo multipágina y ajuste del contenido
      while (remainingHeight > 0) {
        if (pageNumber > 1) {
          pdf.addPage();
        }

        const currentHeightOnPage = Math.min(
          remainingHeight,
          pageHeight - 2 * margin
        );

        pdf.addImage(
          imgData,
          "JPEG",
          margin,
          position,
          contentWidth,
          pdfHeight
        );

        remainingHeight -= currentHeightOnPage;
        position -= currentHeightOnPage;

        pageNumber++;
      }

      pdf.save(fileName);
      return { success: true };
    } catch (error) {
      console.error("Error al generar PDF:", error);
      return { success: false, error: error.message };
    }
  };

  return { generatePDF };
}