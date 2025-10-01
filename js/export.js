// /js/export.js
// Construye XLSX con Q1 (Base+Fin), Q2 (Extras) y resumen por quincenas.
// No requiere VEHICLES: usa los valores ya recalculados en window.SALES_FOR_EXPORT.

export function buildWorksheetData(sales) {
  const header = [
    "Fecha",
    "Modelo",
    "Versión",
    "Tipo",
    "Banco",
    "Tramo",
    "Base (Q1)",
    "Fin (Q1)",
    "Q1",
    "Seguro años",
    "Seguro $",
    "Garantía años",
    "Garantía $",
    "Accesorios venta",
    "Accesorios 10%",
    "Bono extra",
    "Bono demo",
    "Q2",
    "Subtotal",
    "Notas",
  ];

  const rows = [header];

  // Acumuladores para el resumen
  let baseSum = 0,
    finSum = 0,
    q1Sum = 0;
  let segSum = 0,
    garSum = 0,
    accVentaSum = 0,
    accComSum = 0,
    bonoExtraSum = 0,
    bonoDemoSum = 0,
    q2Sum = 0;
  let grand = 0;

  for (const s of sales) {
    const fecha = new Date(s.createdAt).toISOString().slice(0, 10);
    const tipo = (s.type || "").toUpperCase();
    const banco = s.bank ? s.bank.toUpperCase() : "";

    const base = Number(s.baseNow ?? s.base ?? 0);
    const fin = Number(s.bonusNow ?? s.bonus ?? 0);
    const q1 = Number(s.q1Now ?? base + fin);

    const segY = Number(s.seguroYears || 0);
    const seg = Number(s.seguro || 0);

    const garY = Number(s.garantiaYears || 0);
    const gar = Number(s.garantia || 0);

    const accV = Number(s.accesoriosVenta || 0);
    const accC = Number(s.accesoriosComision || 0);

    const bextra = Number(s.bonoExtra || 0);
    const bdemo = Number(s.bonoDemo || 0);

    const q2 = Number(s.q2Now ?? seg + gar + accC + bextra + bdemo);
    const sub = Number(s.subtotalNow ?? q1 + q2);

    rows.push([
      fecha,
      s.model,
      s.versionKey,
      tipo,
      banco,
      s.tierNow || s.tierApplied || "",
      base,
      fin,
      q1,
      segY || "",
      seg || "",
      garY || "",
      gar || "",
      accV || "",
      accC || "",
      bextra || "",
      bdemo || "",
      q2,
      sub,
      "",
    ]);

    baseSum += base;
    finSum += fin;
    q1Sum += q1;
    segSum += seg;
    garSum += gar;
    accVentaSum += accV;
    accComSum += accC;
    bonoExtraSum += bextra;
    bonoDemoSum += bdemo;
    q2Sum += q2;
    grand += sub;
  }

  // Espacio + Resumen
  rows.push([]);
  rows.push(["RESUMEN 1ª QUINCENA (Autos + Financiamiento)"]);
  rows.push(["Base total", baseSum, "", "Fin total", finSum, "", "Q1 total", q1Sum]);

  rows.push([]);
  rows.push(["RESUMEN 2ª QUINCENA (Adicionales)"]);
  rows.push(["Seguros", segSum, "", "Garantías", garSum, "", "Accesorios 10%", accComSum]);
  rows.push(["Bonos extra", bonoExtraSum, "", "Bono demo", bonoDemoSum, "", "Q2 total", q2Sum]);

  rows.push([]);
  rows.push(["TOTAL MES", grand]);

  return rows;
}

export function makeXlsxBlob(rows, sheetName = "Comisiones") {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Ajuste simple de widths
  const widths = [12, 12, 28, 10, 12, 8, 12, 12, 12, 12, 12, 14, 12, 16, 16, 12, 12, 12, 12, 12];
  ws["!cols"] = widths.map((w) => ({ wch: w }));

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export async function shareXlsxOrDownload(sales, totals, filename) {
  const rows = buildWorksheetData(sales); // totals no es necesario aquí
  const blob = makeXlsxBlob(rows, "Comisiones");
  const file = new File([blob], filename, { type: blob.type });

  try {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: filename, text: "Comisiones del mes" });
      return { shared: true };
    }
  } catch (e) {
    // fallback a descarga
  }

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
