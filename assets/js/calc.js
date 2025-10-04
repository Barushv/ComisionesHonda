let CATALOG = null;
let ADDONS = { accesoriosPct: 0.10 };

export function setCatalog(c){ CATALOG = c; }
export function setAddons(a){ ADDONS = { ...ADDONS, ...a }; }

export function familiaDe(version){
  if(!CATALOG) throw new Error("Catálogo no cargado");
  const v = version.toUpperCase();
  for(const [regex, fam] of CATALOG.mapFamilia){
    const r = new RegExp(regex, "i");
    if(r.test(v)) return fam;
  }
  if(/ODDYSEY|ODYSSEY/i.test(v)) return "ODYSSEY";
  if(/PILOT/i.test(v)) return "PILOT";
  if(/ACCORD/i.test(v)) return "ACCORD";
  if(/CRV/i.test(v)) return "CRV";
  if(/HRV/i.test(v)) return "HRV";
  if(/BRV/i.test(v)) return "BRV";
  if(/CIVIC/i.test(v)) return "CIVIC";
  return "CITY";
}

export function tramo(unidades){
  if(unidades >= 11) return "11+";
  if(unidades >= 8)  return "8-10";
  if(unidades >= 5)  return "5-7";
  return "1-4";
}

export function calcMontos({ version, unidadesMes, esCredito, seguroAnios, garantiaAnios, accesorios, bonoAsesor, bonoDemo }){
  const fam = familiaDe(version);
  const t = tramo(unidadesMes);

  const venta = (CATALOG.q1Venta[fam]?.[t]) || 0;

  let famFin = fam;
  if(!CATALOG.q1Financ[famFin]) {
    if(/CIVIC/i.test(fam)) famFin = "CIVIC";
    else if(/CRV/i.test(fam)) famFin = "CRV";
    else if(/ACCORD/i.test(fam)) famFin = "ACCORD";
    else if(/ODYSSEY/i.test(fam)) famFin = "ODYSSEY";
    else if(/PILOT/i.test(fam)) famFin = "PILOT";
  }
  const financ = esCredito ? ((CATALOG.q1Financ[famFin]?.[t]) || 0) : 0;

  const seg = (seguroAnios>0) ? ((CATALOG.q2Seguros[fam]?.[String(seguroAnios)]) || 0) : 0;
  const gar = (garantiaAnios>0) ? ((CATALOG.q2Garantias[fam]?.[String(garantiaAnios)]) || 0) : 0;

  const acc = Math.round((accesorios || 0) * (ADDONS.accesoriosPct || 0.10));
  const inc = (bonoAsesor||0) + (bonoDemo||0);

  const q1 = venta + financ;
  const q2 = seg + gar + acc + inc;
  return { fam, t, venta, financ, seg, gar, acc, inc, totalQ1: q1, totalQ2: q2, total: q1 + q2 };
}
