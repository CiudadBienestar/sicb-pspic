export default async function handler(req, res) {
  const { sheetId, gid } = req.query;

  if (!sheetId || !gid) {
    return res.status(400).json({
      error: 'Faltan parámetros: sheetId o gid.',
    });
  }

  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/export?format=csv&gid=${encodeURIComponent(gid)}&usp=sharing`;

  try {
    const response = await fetch(url, {
      headers: {
        Referer: 'https://docs.google.com/',
        'User-Agent': 'Mozilla/5.0',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).send(
        text || `Error ${response.status}: No se pudo cargar la hoja.`
      );
    }

    const csv = await response.text();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('[api/sheets]', error);
    return res.status(500).json({
      error: 'No se pudo cargar la hoja desde Google Sheets.',
      detail: error.message,
    });
  }
}
