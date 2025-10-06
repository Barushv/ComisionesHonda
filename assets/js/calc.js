let CATALOG = null;
let ADDONS = { accesoriosPct: 0.10 };

export function setCatalog(c){ CATALOG = c; }
export function setAddons(a){ ADDONS = { ...ADDONS, ...a }; }

export function familiaDe(version){
  if(!CATALOG) throw new Error("Catálogo no cargado");
  const v = (version || "").toUpperCase();

  // 1) Priorizar HEV
  if (/ACCORD.*HEV/.test(v)) return "ACCORD HEV";
  if (/CIVIC.*HEV/.test(v))  return "CIVIC HEV";
  if (/CRV.*HEV/.test(v))    return "CRV HEV";

  // 2) mapFamilia (si existe)
  if (Array.isArray(CATALOG.mapFamilia)) {
    for (const [regex, fam] of CATALOG.mapFamilia) {
      const r = new RegExp(regex, "i");
      if (r.test(v)) return fam;
    }
  }

  // 3) Casos especiales de ortografía
  if (/ODDYSEY|ODYSSEY/i.test(v)) return "ODYSSEY";

  // 4) Familias base
  if (/PILOT/i.test(v))   return "PILOT";
  if (/ACCORD/i.test(v))  return "ACCORD";
  if (/CRV/i.test(v))     return "CRV";
  if (/HRV/i.test(v))     return "HRV";
  if (/BRV/i.test(v))     return "BRV";
  if (/CIVIC/i.test(v))   return "CIVIC";
  return "CITY";
}

export function tramo(unidades){
  if(unidades >= 11) return "11+";
  if(unidades >= 8)  return "8-10";
  if(unidades >= 5)  return "5-7";
  return "1-4";
}

function calcFinanciamiento({ version, fam, tramoClave, esCredito }){
  if(!esCredito) return 0;
  const cfg = CATALOG || {};
  const vName = version || "";
  const byVersion = cfg.q1FinancVersion || {};
  if (vName && byVersion[vName] != null) return Number(byVersion[vName]) || 0;
  const byFamily = cfg.q1FinancFlat || {};
  if (fam && byFamily[fam] != null) return Number(byFamily[fam]) || 0;
  const legacy = (cfg.q1Financ && cfg.q1Financ[fam]) ? cfg.q1Financ[fam][tramoClave] : 0;
  return Number(legacy) || 0;
}

export function calcMontos({ version, unidadesMes, esCredito, seguroAnios, garantiaAnios, accesorios, bonoAsesor, bonoDemo }){
  const fam = familiaDe(version);
  const t = tramo(unidadesMes);
  const venta = (CATALOG.q1Venta?.[fam]?.[t]) || 0;
  const financ = calcFinanciamiento({ version, fam, tramoClave: t, esCredito });
  const seg = (seguroAnios>0) ? ((CATALOG.q2Seguros?.[fam]?.[String(seguroAnios)]) || 0) : 0;
  const gar = (garantiaAnios>0) ? ((CATALOG.q2Garantias?.[fam]?.[String(garantiaAnios)]) || 0) : 0;
  const acc = Math.round((accesorios || 0) * (ADDONS.accesoriosPct || 0.10));
  const inc = (bonoAsesor||0) + (bonoDemo||0);
  const q1 = venta + financ;
  const q2 = seg + gar + acc + inc;
  return { fam, t, venta, financ, seg, gar, acc, inc, totalQ1: q1, totalQ2: q2, total: q1 + q2 };
}
