// src/hooks/usePdfGenerator.js
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";

export default function usePdfGenerator() {

  // ─── Utilidad: convierte un elemento DOM en imagen y retorna { imgData, imgWidth, imgHeight }
  const elementToImage = async (element) => {
    const canvas = await html2canvas(element, {
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      scale: 2,
    });
    return {
      imgData: canvas.toDataURL("image/jpeg", 0.95),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
    };
  };

  // ─── Genera el PDF capturando cada "bloque" por separado para evitar cortes
  const generatePDF = async (
    containerId,
    fileName = "reporte.pdf",
    options = {}
  ) => {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        return {
          success: false,
          error: `Elemento con ID "${containerId}" no encontrado`,
        };
      }

      // Esperar render completo
      await new Promise((resolve) => setTimeout(resolve, 500));

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth  = pdf.internal.pageSize.getWidth();   // 210 mm
      const pageHeight = pdf.internal.pageSize.getHeight();  // 297 mm
      const margin     = 10; // mm
      const contentW   = pageWidth  - 2 * margin;
      const contentH   = pageHeight - 2 * margin;

      let cursorY = margin; // posición Y actual dentro de la página

      // ── Portada ──────────────────────────────────────────────────────────
      if (options.addCover) {
        pdf.setFontSize(22);
        pdf.setTextColor(30, 64, 175); // azul
        pdf.text(
          options.title || "Reporte PSPIC",
          pageWidth / 2,
          pageHeight / 2 - 15,
          { align: "center" }
        );
        pdf.setFontSize(14);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          options.subtitle || "",
          pageWidth / 2,
          pageHeight / 2 + 5,
          { align: "center" }
        );
        pdf.setFontSize(11);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Generado el ${new Date().toLocaleDateString("es-ES", {
            day: "2-digit", month: "long", year: "numeric"
          })}`,
          pageWidth / 2,
          pageHeight / 2 + 20,
          { align: "center" }
        );
        pdf.addPage();
        cursorY = margin;
      }

      // ── Detectar bloques imprimibles ──────────────────────────────────────
      // Busca elementos con data-pdf-block="true" dentro del contenedor.
      // Si no hay ninguno, cae al modo legacy (captura total).
      const bloques = container.querySelectorAll("[data-pdf-block]");

      if (bloques.length === 0) {
        // ── MODO LEGACY: captura total (comportamiento anterior mejorado) ──
        const { imgData, canvasWidth, canvasHeight } = await elementToImage(container);
        const imgW = contentW;
        const imgH = (canvasHeight * imgW) / canvasWidth;
        const totalPages = Math.ceil(imgH / contentH);

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) { pdf.addPage(); }
          const yOffset = margin - page * contentH;
          pdf.addImage(imgData, "JPEG", margin, yOffset, imgW, imgH);
        }

      } else {
        // ── MODO BLOQUES: cada elemento se captura por separado ───────────
        for (let i = 0; i < bloques.length; i++) {
          const bloque = bloques[i];

          // Pequeña pausa para asegurar visibilidad del elemento
          await new Promise((r) => setTimeout(r, 80));

          const { imgData, canvasWidth, canvasHeight } = await elementToImage(bloque);

          // Calcular altura proporcional en mm
          const imgW = contentW;
          const imgH = (canvasHeight * imgW) / canvasWidth;

          // Si el bloque NO cabe en el espacio restante de la página actual → nueva página
          // (excepto si es el primer bloque de la página, para evitar página en blanco)
          const espacioRestante = pageHeight - cursorY - margin;
          if (imgH > espacioRestante && cursorY > margin + 5) {
            pdf.addPage();
            cursorY = margin;
          }

          // Si el bloque es más alto que una página completa → lo dividimos en sub-páginas
          if (imgH > contentH) {
            const subPages = Math.ceil(imgH / contentH);
            for (let sp = 0; sp < subPages; sp++) {
              if (sp > 0) { pdf.addPage(); cursorY = margin; }
              const yOffset = cursorY - sp * contentH;
              pdf.addImage(imgData, "JPEG", margin, yOffset, imgW, imgH);
            }
            cursorY = margin + (imgH % contentH || contentH);
          } else {
            pdf.addImage(imgData, "JPEG", margin, cursorY, imgW, imgH);
            cursorY += imgH + 4; // 4mm de espacio entre bloques
          }
        }
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