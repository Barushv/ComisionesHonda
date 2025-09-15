// /js/export.js
// Funciones para construir el XLSX y COMPARTIR (con fallback a descarga)

export function buildWorksheetData(sales, totals) {
  const rows = [
    [
      "Fecha",
      "Modelo",
      "Versión",
      "Tipo",
      "Banco",
      "Tramo",
      "Base",
      "Bono Financ.",
      "Subtotal",
      "Notas",
    ],
  ];
  for (const s of sales) {
    rows.push([
      new Date(s.createdAt).toISOString().slice(0, 10),
      s.model,
      s.versionKey,
      (s.type || "").toUpperCase(),
      s.bank ? s.bank.toUpperCase() : "",
      s.tierApplied,
      s.base,
      s.bonus,
      s.subtotal,
      s.notes || "",
    ]);
  }
  rows.push([]);
  rows.push([
    "Unidades",
    totals.count,
    "Tramo",
    totals.tier,
    "Base",
    totals.base,
    "Bonos",
    totals.bonus,
    "Total",
    totals.total,
  ]);
  return rows;
}

export function makeXlsxBlob(rows, sheetName = "Comisiones") {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

// Comparte el XLSX usando Web Share API si está disponible; si no, descarga
export async function shareXlsxOrDownload(sales, totals, filename) {
  const rows = buildWorksheetData(sales, totals);
  const blob = makeXlsxBlob(rows, "Comisiones");
  const file = new File([blob], filename, { type: blob.type });

  try {
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: filename,
        text: "Comisiones del mes",
      });
      return { shared: true };
    }
  } catch (e) {
    // Si share falla por permiso/OS, haremos fallback a descarga abajo
  }

  // Fallback universal: descarga
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return { downloaded: true };
}
