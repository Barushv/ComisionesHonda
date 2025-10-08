// src/services/export-xlsx.js
import { store, tablas } from '../core/state.js';
import { getTramo } from '../core/calc.js';

/**
 * Genera y descarga un XLSX con 4 hojas:
 * - Q1 (vehículo + financiamiento)
 * - Q2 (seguros + garantías + accesorios 10% + bonos)
 * - Resumen (totales del mes)
 * - Detalle (todas las columnas juntas por fila)
 */
export function exportXLSX() {
  if (!window.XLSX) {
    alert('Librería XLSX no disponible.');
    return;
  }
  const ventas = store.resumen?.ventas || [];
  const tramo = store.resumen?.tramo || '1-4';
  const mes = store.mesActivo || '';

  // Build data
  const sheetQ1 = ventas.map(v => ({
    Fecha: mes,
    Modelo: v.modeloReal,
    Version: v.version,
    TipoPago: v.pago,
    Banco: v.banco || '',
    Tramo: tramo,
    ComVehiculo: qVeh(v, tramo),
    ComFinanciamiento: qFin(v),
    SubtotalQ1: v.q1
  }));

  const sheetQ2 = ventas.map(v => ({
    Fecha: mes,
    Modelo: v.modeloReal,
    Version: v.version,
    SeguroAnios: v.seguroAnios,
    Seguro$: segVal(v),
    GarantiaAnios: v.garantiaAnios,
    Garantia$: garVal(v),
    Accesorios$: v.accesoriosMonto || 0,
    Accesorios10: Math.round((v.accesoriosMonto || 0) * 0.10),
    BonoAdicional$: v.bonoAdicional || 0,
    BonoDemo$: v.bonoDemo || 0,
    SubtotalQ2: v.q2
  }));

  const sheetResumen = [{
    Mes: mes,
    Unidades: store.resumen?.totalUnidades || 0,
    Tramo: tramo,
    TotalQ1: store.resumen?.q1 || 0,
    TotalQ2: store.resumen?.q2 || 0,
    Total: store.resumen?.total || 0
  }];

  const sheetDetalle = ventas.map(v => ({
    Fecha: mes,
    Modelo: v.modeloReal,
    Version: v.version,
    TipoPago: v.pago,
    Banco: v.banco || '',
    Tramo: tramo,
    ComVehiculo: qVeh(v, tramo),
    ComFinanciamiento: qFin(v),
    SeguroAnios: v.seguroAnios,
    Seguro$: segVal(v),
    GarantiaAnios: v.garantiaAnios,
    Garantia$: garVal(v),
    Accesorios$: v.accesoriosMonto || 0,
    Accesorios10: Math.round((v.accesoriosMonto || 0) * 0.10),
    BonoAdicional$: v.bonoAdicional || 0,
    BonoDemo$: v.bonoDemo || 0,
    SubtotalQ1: v.q1,
    SubtotalQ2: v.q2,
    Total: v.total,
    Nota: v.nota || ''
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();
  const wsQ1 = XLSX.utils.json_to_sheet(sheetQ1);
  const wsQ2 = XLSX.utils.json_to_sheet(sheetQ2);
  const wsRes = XLSX.utils.json_to_sheet(sheetResumen);
  const wsDet = XLSX.utils.json_to_sheet(sheetDetalle);

  XLSX.utils.book_append_sheet(wb, wsQ1, 'Q1');
  XLSX.utils.book_append_sheet(wb, wsQ2, 'Q2');
  XLSX.utils.book_append_sheet(wb, wsRes, 'Resumen');
  XLSX.utils.book_append_sheet(wb, wsDet, 'Detalle');

  XLSX.writeFile(wb, `ComisionesGO_${mes.replace(/\s+/g,'_')}.xlsx`);
}

function qVeh(v, tramo) {
  const ventaTab = (tablas.tabuladores?.venta || {})[normalize(v.modeloReal)];
  return (ventaTab && ventaTab[tramo]) || 0;
}
function qFin(v) {
  if (v.pago !== 'CREDITO') return 0;
  if (v.banco === 'OTRO') return 0;
  const finTab = tablas.financiamiento?.financiamiento || {};
  return finTab[normalize(v.modeloReal)] || 0;
}
function segVal(v) {
  const segTab = tablas.seguros?.seguros?.[normalize(v.modeloReal)] 
              || tablas.seguros?.seguros?.[normalize(v.modeloReal).replace(' HEV','')] || {};
  return segTab[String(v.seguroAnios)] || 0;
}
function garVal(v) {
  const garTab = tablas.garantias?.garantias?.[normalize(v.modeloReal)] 
              || tablas.garantias?.garantias?.[normalize(v.modeloReal).replace(' HEV','')] || {};
  return garTab[String(v.garantiaAnios)] || 0;
}
function normalize(modelo) {
  const m = (modelo || '').toUpperCase();
  if (m.startsWith('BR-')) return 'BRV';
  if (m.startsWith('HR-')) return 'HRV';
  if (m.startsWith('CR-')) return m.includes('HEV') ? 'CRV HEV' : 'CRV';
  if (m.includes('CIVIC') && m.includes('HEV')) return 'CIVIC HEV';
  if (m.includes('ACCORD') && m.includes('HEV')) return 'ACCORD HEV';
  return m;
}
