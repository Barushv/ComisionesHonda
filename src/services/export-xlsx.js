import { store, tablas } from '../core/state.js';
import { getVehiculoComision, getFinanciamientoComision, getSeguroMonto, getGarantiaMonto } from '../core/calc.js';
export function exportXLSX(){
  if(!window.XLSX){ alert('Librería XLSX no disponible.'); return; }
  const ventas = store.resumen?.ventas || []; const tramo = store.resumen?.tramo || '1-4'; const mes = store.mesActivo || '';
  const sheetQ1 = ventas.map(v => ({ Fecha: mes, Modelo: v.modeloReal, Version: v.version, TipoPago: v.pago, Banco: v.banco || '', Tramo: tramo, ComVehiculo: getVehiculoComision(v.modeloReal, tramo, tablas), ComFinanciamiento: getFinanciamientoComision(v.modeloReal, v.pago, v.banco, tablas), SubtotalQ1: v.q1 }));
  const sheetQ2 = ventas.map(v => ({ Fecha: mes, Modelo: v.modeloReal, Version: v.version, SeguroAnios: v.seguroAnios, Seguro$: getSeguroMonto(v.modeloReal, v.seguroAnios, tablas), GarantiaAnios: v.garantiaAnios, Garantia$: getGarantiaMonto(v.modeloReal, v.garantiaAnios, tablas), Accesorios$: v.accesoriosMonto||0, Accesorios10: Math.round((v.accesoriosMonto||0)*0.10), BonoAdicional$: v.bonoAdicional||0, BonoDemo$: v.bonoDemo||0, SubtotalQ2: v.q2 }));
  const sheetResumen = [{ Mes: mes, Unidades: store.resumen?.totalUnidades||0, Tramo: tramo, TotalQ1: store.resumen?.q1||0, TotalQ2: store.resumen?.q2||0, Total: store.resumen?.total||0 }];
  const sheetDetalle = ventas.map(v => ({ Fecha: mes, Modelo: v.modeloReal, Version: v.version, TipoPago: v.pago, Banco: v.banco||'', Tramo: tramo, ComVehiculo: getVehiculoComision(v.modeloReal, tramo, tablas), ComFinanciamiento: getFinanciamientoComision(v.modeloReal, v.pago, v.banco, tablas), SeguroAnios: v.seguroAnios, Seguro$: getSeguroMonto(v.modeloReal, v.seguroAnios, tablas), GarantiaAnios: v.garantiaAnios, Garantia$: getGarantiaMonto(v.modeloReal, v.garantiaAnios, tablas), Accesorios$: v.accesoriosMonto||0, Accesorios10: Math.round((v.accesoriosMonto||0)*0.10), BonoAdicional$: v.bonoAdicional||0, BonoDemo$: v.bonoDemo||0, SubtotalQ1: v.q1, SubtotalQ2: v.q2, Total: v.total, Nota: v.nota||'' }));
  const wb = XLSX.utils.book_new(); const wsQ1=XLSX.utils.json_to_sheet(sheetQ1); const wsQ2=XLSX.utils.json_to_sheet(sheetQ2); const wsRes=XLSX.utils.json_to_sheet(sheetResumen); const wsDet=XLSX.utils.json_to_sheet(sheetDetalle);
  XLSX.utils.book_append_sheet(wb, wsQ1, 'Q1'); XLSX.utils.book_append_sheet(wb, wsQ2, 'Q2'); XLSX.utils.book_append_sheet(wb, wsRes, 'Resumen'); XLSX.utils.book_append_sheet(wb, wsDet, 'Detalle');
  XLSX.writeFile(wb, `ComisionesGO_${mes.replace(/\s+/g,'_')}.xlsx`);
}
