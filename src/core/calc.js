export function normalizeModelKey(model,isHEV=false){
  const m=(model||'').toUpperCase().trim();
  if(m.startsWith('BR-')) return 'BRV';
  if(m.startsWith('HR-')) return 'HRV';
  if(m.startsWith('CR-')) return (isHEV || m.includes('HEV')) ? 'CRV HEV' : 'CRV';
  if(m.includes('HEV')){
    if(m.includes('CIVIC')) return 'CIVIC HEV';
    if(m.includes('ACCORD')) return 'ACCORD HEV';
  }
  return m.replace('  ',' ');
}
export function getTramo(n){ if(n>=11) return '11+'; if(n>=8) return '8-10'; if(n>=5) return '5-7'; return '1-4'; }
export function getVehiculoComision(model,tramo,tablas){
  const isHEV = !!(model && model.toUpperCase().includes('HEV'));
  const key = normalizeModelKey(model,isHEV);
  const byModel = (tablas.tabuladores?.venta||{})[key];
  return byModel ? (byModel[tramo]||0) : 0;
}
export function getFinanciamientoComision(model,pago,banco,tablas){
  if(pago!=='CREDITO') return 0;
  if(!banco || banco==='OTRO') return 0;
  const isHEV = !!(model && model.toUpperCase().includes('HEV'));
  const key = normalizeModelKey(model,isHEV);
  return (tablas.financiamiento?.financiamiento||{})[key]||0;
}
export function getSeguroMonto(model,anios,tablas){
  if(!anios) return 0;
  const isHEV = !!(model && model.toUpperCase().includes('HEV'));
  const key = normalizeModelKey(model,isHEV);
  const tbl = tablas.seguros?.seguros||{};
  const by = tbl[key] || tbl[key.replace(' HEV','')] || {};
  return by[String(anios)]||0;
}
export function getGarantiaMonto(model,anios,tablas){
  if(!anios) return 0;
  const isHEV = !!(model && model.toUpperCase().includes('HEV'));
  const key = normalizeModelKey(model,isHEV);
  const tbl = tablas.garantias?.garantias||{};
  const by = tbl[key] || tbl[key.replace(' HEV','')] || {};
  return by[String(anios)]||0;
}
export function calcQ1(v,tramo,tablas){
  return getVehiculoComision(v.modeloReal,tramo,tablas) + getFinanciamientoComision(v.modeloReal,v.pago,v.banco,tablas);
}
export function calcQ2(v,tablas){
  const seg = getSeguroMonto(v.modeloReal,v.seguroAnios,tablas);
  const gar = getGarantiaMonto(v.modeloReal,v.garantiaAnios,tablas);
  const acc = Math.round((v.accesoriosMonto||0)*0.10);
  const bonos = (v.bonoAdicional||0)+(v.bonoDemo||0);
  return seg+gar+acc+bonos;
}
export function calcSaleTotals(v,tramo,tablas){ const q1=calcQ1(v,tramo,tablas); const q2=calcQ2(v,tablas); return {q1,q2,total:q1+q2}; }
export function summarize(ventas,tablas){
  const u = ventas.length; const tramo=getTramo(u);
  let q1=0,q2=0; const det = ventas.map(v=>{const t=calcSaleTotals(v,tramo,tablas); q1+=t.q1; q2+=t.q2; return {...v,...t};});
  return { tramo, totalUnidades:u, q1, q2, total:q1+q2, ventas:det };
}
