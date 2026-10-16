export const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const normalizar = (value) =>
  value
    ?.toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase() ?? "";

const nombreMes = (index) => {
  const mes = MESES_ES[index];
  return mes ? mes.charAt(0).toUpperCase() + mes.slice(1) : null;
};

const esFechaValida = (year, month, day) => {
  const fecha = new Date(year, month - 1, day);
  return fecha.getFullYear() === year && fecha.getMonth() === month - 1 && fecha.getDate() === day;
};

/**
 * Devuelve el mes de una fecha de Google Sheets sin depender del parser del navegador.
 * La hoja puede entregar fechas como Date, texto local (dd/mm/aaaa) o seriales de Sheets.
 */
export const extractMonthFromDate = (value) => {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return nombreMes(value.getMonth());
  }

  const raw = value.toString().trim();
  const normalized = normalizar(raw);
  const byName = MESES_ES.find((mes) => normalized.includes(mes));
  if (byName) return nombreMes(MESES_ES.indexOf(byName));

  // Formato local de la hoja: d/m/aa(aa), con hora opcional.
  const localDate = raw.match(/^(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{2,4})(?:\s|T|$)/);
  if (localDate) {
    const day = Number(localDate[1]);
    const month = Number(localDate[2]);
    const year = localDate[3].length === 2 ? 2000 + Number(localDate[3]) : Number(localDate[3]);
    return esFechaValida(year, month, day) ? nombreMes(month - 1) : null;
  }

  // ISO: se toma el mes escrito, evitando que la zona horaria lo desplace.
  const isoDate = raw.match(/^(\d{4})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})(?:\s|T|$)/);
  if (isoDate) {
    const year = Number(isoDate[1]);
    const month = Number(isoDate[2]);
    const day = Number(isoDate[3]);
    return esFechaValida(year, month, day) ? nombreMes(month - 1) : null;
  }

  // Papa Parse puede convertir un serial de Sheets a número.  El origen es
  // 1899-12-30, igual que Excel/Google Sheets para los seriales modernos.
  if (/^\d+(?:\.\d+)?$/.test(raw)) {
    const number = Number(raw);
    if (number >= 1 && number < 100000) {
      const serialDate = new Date(1899, 11, 30 + Math.floor(number));
      return nombreMes(serialDate.getMonth());
    }
  }

  return null;
};
