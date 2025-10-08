// src/core/calc.js
// ====== Normalización de claves de modelo para tablas ======
export function normalizeModelKey(model, isHEV=false) {
  // Entrada visible en UI: "BR-V", "HR-V", "CR-V", "CR-V HEV", "CIVIC", etc.
  const m = (model || "").toUpperCase().trim();
  if (m.startsWith("BR-")) return "BRV";
  if (m.startsWith("HR-")) return "HRV";
  if (m.startsWith("CR-")) return isHEV || m.includes("HEV") ? "CRV HEV" : "CRV";
  if (m.includes("HEV")) {
    // CIVIC HEV, ACCORD HEV
    if (m.includes("CIVIC")) return "CIVIC HEV";
    if (m.includes("ACCORD")) return "ACCORD HEV";
  }
  // Otros mapeos iguales a claves
  return m.replace("  ", " ");
}

export function getTramo(totalUnidades) {
  if (totalUnidades >= 11) return "11+";
  if (totalUnidades >= 8)  return "8-10";
  if (totalUnidades >= 5)  return "5-7";
  return "1-4";
}

// ====== Q1 (vehículo + financiamiento) ======
export function getVehiculoComision(model, tramo, tablas) {
  // model: visible (p.ej. "CR-V" o "CR-V HEV"), se normaliza a claves de tablas
  const isHEV = !!(model && model.toUpperCase().includes("HEV"));
  const key = normalizeModelKey(model, isHEV);
  const venta = tablas.tabuladores?.venta || {};
  const byModel = venta[key];
  if (!byModel) return 0;
  return byModel[tramo] ?? 0;
}

export function getFinanciamientoComision(model, pago, banco, tablas) {
  if (pago !== "CREDITO") return 0;
  if (!banco || banco === "OTRO") return 0; // Otro banco no paga financiamiento
  const isHEV = !!(model && model.toUpperCase().includes("HEV"));
  const key = normalizeModelKey(model, isHEV);
  const map = tablas.financiamiento?.financiamiento || {};
  // Para CRV HEV/CIVIC HEV/ACCORD HEV hay claves directas en el JSON
  // Para CRV (no HEV) hay "CRV"
  return map[key] ?? 0;
}

// ====== Q2 (seguro + garantía + 10% accesorios + bonos) ======
export function getSeguroMonto(model, anios, tablas) {
  if (!anios || anios === 0) return 0;
  const isHEV = !!(model && model.toUpperCase().includes("HEV"));
  const key = normalizeModelKey(model, isHEV);
  const tbl = tablas.seguros?.seguros || {};
  const byModel = tbl[key] || tbl[key.replace(" HEV","")] || {};
  return byModel[String(anios)] ?? 0;
}

export function getGarantiaMonto(model, anios, tablas) {
  if (!anios || anios === 0) return 0;
  const isHEV = !!(model && model.toUpperCase().includes("HEV"));
  const key = normalizeModelKey(model, isHEV);
  const tbl = tablas.garantias?.garantias || {};
  const byModel = tbl[key] || tbl[key.replace(" HEV","")] || {};
  return byModel[String(anios)] ?? 0;
}

export function calcQ1(venta, tramo, tablas) {
  const veh = getVehiculoComision(venta.modeloReal, tramo, tablas);
  const fin = getFinanciamientoComision(venta.modeloReal, venta.pago, venta.banco, tablas);
  return veh + fin;
}

export function calcQ2(venta, tablas) {
  const seg = getSeguroMonto(venta.modeloReal, venta.seguroAnios, tablas);
  const gar = getGarantiaMonto(venta.modeloReal, venta.garantiaAnios, tablas);
  const acc = Math.round((venta.accesoriosMonto || 0) * 0.10);
  const bonos = (venta.bonoAdicional || 0) + (venta.bonoDemo || 0);
  return seg + gar + acc + bonos;
}

export function calcSaleTotals(venta, tramo, tablas) {
  const q1 = calcQ1(venta, tramo, tablas);
  const q2 = calcQ2(venta, tablas);
  return { q1, q2, total: q1 + q2 };
}

export function summarize(ventas, tablas) {
  const totalUnidades = ventas.length;
  const tramo = getTramo(totalUnidades);
  let sumQ1 = 0, sumQ2 = 0;
  const detalladas = ventas.map(v => {
    const t = calcSaleTotals(v, tramo, tablas);
    sumQ1 += t.q1; sumQ2 += t.q2;
    return { ...v, ...t };
  });
  return {
    tramo,
    totalUnidades,
    q1: sumQ1,
    q2: sumQ2,
    total: sumQ1 + sumQ2,
    ventas: detalladas
  };
}
