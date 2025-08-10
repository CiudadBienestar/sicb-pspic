import { useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const usePdfGenerator = () => {
  const generatePDF = useCallback(async (elementId, filename = 'reporte.pdf', options = {}) => {
    try {
      const {
        addCover = true,
        title = 'Reporte de Participantes',
        subtitle = 'Vigencia 2025',
        margin = 20,
        maxWidth = 180
      } = options;

      const element = document.getElementById(elementId);
      if (!element) throw new Error(`Elemento con ID "${elementId}" no encontrado`);

      const clone = element.cloneNode(true);
      applyCompatibleStyles(clone);

      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = element.offsetWidth + 'px';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.padding = '20px';
      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      const canvas = await html2canvas(clone, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: element.offsetWidth,
        height: clone.scrollHeight,
        ignoreElements: (el) =>
          el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.classList.contains('no-pdf')
      });

      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png');
const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

const pageWidth = pdf.internal.pageSize.getWidth();
const pageHeight = pdf.internal.pageSize.getHeight();

// Ajustamos imagen al ancho máximo disponible y proporcionalmente la altura
const padding = 10;
const maxImgWidth = pageWidth - padding * 2;
const imgWidth = maxImgWidth;
const imgHeight = (canvas.height * imgWidth) / canvas.width;

// Si la imagen es más alta que una página, vamos a dividirla en varias
let position = 0;
let heightLeft = imgHeight;

if (addCover) {
  pdf.setFillColor(14, 165, 233);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, margin, 80, { maxWidth });
  pdf.setFontSize(14);
  pdf.text(subtitle, margin, 100, { maxWidth });
  pdf.addPage();
}

// Paginación automática
pdf.addImage(imgData, 'PNG', padding, position, imgWidth, imgHeight);
heightLeft -= pageHeight;

while (heightLeft > 0) {
  position = heightLeft - imgHeight;
  pdf.addPage();
  pdf.addImage(imgData, 'PNG', padding, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
}
      pdf.save(filename);
      return { success: true, message: 'PDF generado exitosamente' };
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return { generatePDF };
};

// Función auxiliar
const applyCompatibleStyles = (element) => {
  const elements = element.querySelectorAll('*');
  elements.forEach(el => {
    const cls = el.classList;
    if (cls.contains('bg-white')) el.style.backgroundColor = '#ffffff';
    if (cls.contains('bg-gray-50')) el.style.backgroundColor = '#f9fafb';
    if (cls.contains('bg-blue-50')) el.style.backgroundColor = '#eff6ff';
    if (cls.contains('text-gray-800')) el.style.color = '#1f2937';
    if (cls.contains('text-blue-600')) el.style.color = '#2563eb';
    if (cls.contains('text-red-600')) el.style.color = '#dc2626';
    if (cls.contains('border-gray-300')) el.style.borderColor = '#d1d5db';
  });
};

export default usePdfGenerator;
