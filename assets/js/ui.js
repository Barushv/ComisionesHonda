import { db, addSale, updateSale, deleteSale, listByMonth, countByMonth, clearAll } from "./store.js";
import { setCatalog as _setCatalog, setAddons as _setAddons, calcMontos } from "./calc.js";

let CURRENT_MONTH = null;
let CATALOG = null;

export function setData(c){ CATALOG = c; _setCatalog(c); }
export function setAddons(a){ _setAddons(a); }
export function setMonth(m){ CURRENT_MONTH = m; }

function pesos(n){ return n.toLocaleString('es-MX', { style:'currency', currency:'MXN', maximumFractionDigits:0 }); }
function setText(id, val){ const el=document.getElementById(id); if(el) el.textContent=val; }
export function toast(msg){ const el=document.createElement('div'); el.textContent=msg; el.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:16px;background:#111827;color:#fff;border:1px solid #334155;padding:8px 12px;border-radius:10px;z-index:9999'; document.body.appendChild(el); setTimeout(()=>el.remove(),2000); }

export async function refreshList(){
  const sales = await listByMonth(CURRENT_MONTH);
  const units = sales.length;
  const tier = units >= 11 ? "11+" : units >= 8 ? "8-10" : units >= 5 ? "5-7" : "1-4";
  let q1Venta=0,q1Fin=0,seg=0,gar=0,acc=0,inc=0;
  for(const s of sales){ q1Venta+=s.q1VentaMonto||0; q1Fin+=s.q1FinancMonto||0; seg+=s.q2SeguroMonto||0; gar+=s.q2GarantiaMonto||0; acc+=s.q2AccesorioMonto||0; inc+=s.q2IncentivosMonto||0; }
  const totalQ1=q1Venta+q1Fin, totalQ2=seg+gar+acc+inc, grandTotal=totalQ1+totalQ2;
  setText("units", String(units)); setText("tier", tier); setText("baseTotal", pesos(q1Venta)); setText("bonusTotal", pesos(q1Fin));
  setText("segurosTotal", pesos(seg)); setText("garantiasTotal", pesos(gar)); setText("accesoriosTotal", pesos(acc)); setText("bonosExtraTotal", pesos(inc)); setText("grandTotal", pesos(grandTotal));
  const list=document.getElementById("salesList"); list.innerHTML="";
  sales.forEach((s,i)=>{ const card=document.createElement("div"); card.className="card"; card.style.cssText=i%2===0?"background:var(--card);":"background:var(--card-2);";
    const title=document.createElement("div");
    title.innerHTML=`<strong>${s.version}</strong><div class="meta">${s.fecha} · ${s.esCredito?"Crédito":"Contado"}</div>
    <div class="badges"><span class="badge">Q1 · Venta ${pesos(s.q1VentaMonto)} · Financ. ${pesos(s.q1FinancMonto)}</span>
    <span class="badge">Q2 · Seg ${pesos(s.q2SeguroMonto)} · Gar ${pesos(s.q2GarantiaMonto)} · Acc 10% ${pesos(s.q2AccesorioMonto)} · Inc ${pesos(s.q2IncentivosMonto)}</span>
    <span class="badge">Tramo ${s.tramo}</span></div>`;
    const amount=document.createElement("div"); amount.className="amount"; amount.textContent=pesos(s.total);
    const actions=document.createElement("div"); actions.innerHTML=`<button class="btn small" data-edit="${s.id}">Editar</button><button class="btn small" data-del="${s.id}">Borrar</button>`;
    card.appendChild(title); card.appendChild(amount); card.appendChild(actions); list.appendChild(card);
    actions.querySelector(`[data-edit="${s.id}"]`).onclick=()=>openDialogForEdit(s);
    actions.querySelector(`[data-del="${s.id}"]`).onclick=async()=>{ if(confirm("¿Borrar esta venta?")){ await deleteSale(s.id); await recalcMonth(); toast("Venta eliminada"); } };
  });
  window.SALES_FOR_EXPORT=sales; return {units,tier,totalQ1,totalQ2,grandTotal};
}

async function recalcMonth(){
  const sales=await listByMonth(CURRENT_MONTH); const unidades=sales.length; const recalc=[];
  for(const s of sales){ const m = calcMontos({ version:s.version, unidadesMes:unidades, esCredito:s.esCredito, seguroAnios:s.seguroAnios, garantiaAnios:s.garantiaAnios, accesorios:s.accesoriosCaptura, bonoAsesor:s.bonoAsesor, bonoDemo:s.bonoDemo });
    recalc.push({...s, tramo:m.t, q1VentaMonto:m.venta, q1FinancMonto:m.financ, q2SeguroMonto:m.seg, q2GarantiaMonto:m.gar, q2AccesorioMonto:m.acc, q2IncentivosMonto:m.inc, totalQ1:m.totalQ1, totalQ2:m.totalQ2, total:m.totalQ1+m.totalQ2, updatedAt:Date.now()}); }
  await db.sales.bulkPut(recalc); await refreshList();
}

const dlg=document.getElementById("saleDialog"); const form=document.getElementById("saleForm");
export function bindDialogs(){
  const addBtn=document.getElementById("addSaleBtn"); if(addBtn) addBtn.onclick=()=>openDialogForCreate();
  const select=document.getElementById("versionSelect");
  const versiones = (CATALOG && Array.isArray(CATALOG.versiones)) ? CATALOG.versiones : [];
  if(select) select.innerHTML = versiones.map(v=>`<option value="${v}">${v}</option>`).join("");
  const search=document.getElementById("searchInput");
  if(search && select){ search.addEventListener("input", ()=>{ const q=search.value.toUpperCase(); const opts=versiones.filter(v=>v.toUpperCase().includes(q));
    select.innerHTML=opts.map(v=>`<option value="${v}">${v}</option>`).join(""); }); }
  const save=document.getElementById("saveSaleBtn"); if(save) save.onclick=onSave;
}

function openDialogForCreate(){ form.dataset.mode="create"; form.dataset.id=""; form.reset();
  document.getElementById("seguroSwitch").checked=false; document.getElementById("garantiaSwitch").checked=false;
  document.getElementById("seguroYears").value="0"; document.getElementById("garantiaYears").value="0";
  document.getElementById("accesoriosVenta").value=""; document.getElementById("bonoExtra").value="";
  document.getElementById("demoSwitch").checked=false; document.getElementById("bonoDemo").value=""; dlg.showModal(); }

function openDialogForEdit(s){ form.dataset.mode="edit"; form.dataset.id=s.id;
  document.getElementById("versionSelect").value=s.version; (s.esCredito?document.getElementById("tipoCredito"):document.getElementById("tipoContado")).checked=true;
  document.getElementById("seguroSwitch").checked=s.seguroAnios>0; document.getElementById("seguroYears").value=String(s.seguroAnios||0);
  document.getElementById("garantiaSwitch").checked=s.garantiaAnios>0; document.getElementById("garantiaYears").value=String(s.garantiaAnios||0);
  document.getElementById("accesoriosVenta").value=s.accesoriosCaptura||0; document.getElementById("bonoExtra").value=s.bonoAsesor||0;
  document.getElementById("demoSwitch").checked=!!s.bonoDemo; document.getElementById("bonoDemo").value=s.bonoDemo||0; dlg.showModal(); }

async function onSave(ev){ ev.preventDefault();
  const version=document.getElementById("versionSelect").value; const esCredito=document.getElementById("tipoCredito").checked;
  const seguroAnios=document.getElementById("seguroSwitch").checked?parseInt(document.getElementById("seguroYears").value||"0",10):0;
  const garantiaAnios=document.getElementById("garantiaSwitch").checked?parseInt(document.getElementById("garantiaYears").value||"0",10):0;
  const accesorios=parseInt(document.getElementById("accesoriosVenta").value||"0",10); const bonoAsesor=parseInt(document.getElementById("bonoExtra").value||"0",10);
  const bonoDemo=document.getElementById("demoSwitch").checked?parseInt(document.getElementById("bonoDemo").value||"0",10):0;
  const fecha=new Date(); const mesClave=fecha.toISOString().slice(0,7);
  const isEdit=form.dataset.mode==="edit"; const unidades=await countByMonth(mesClave)+(isEdit?0:1);
  const m=calcMontos({ version, unidadesMes:unidades, esCredito, seguroAnios, garantiaAnios, accesorios, bonoAsesor, bonoDemo });
  const doc={ id:isEdit?form.dataset.id:crypto.randomUUID(), fecha:fecha.toLocaleDateString('es-MX'), mesClave, version, esCredito, seguroAnios, garantiaAnios, accesoriosCaptura:accesorios, bonoAsesor, bonoDemo, tramo:m.t, q1VentaMonto:m.venta, q1FinancMonto:m.financ, q2SeguroMonto:m.seg, q2GarantiaMonto:m.gar, q2AccesorioMonto:m.acc, q2IncentivosMonto:m.inc, totalQ1:m.totalQ1, totalQ2:m.totalQ2, total:m.total, createdAt:Date.now(), updatedAt:Date.now() };
  if(isEdit) await updateSale(doc.id, doc); else await addSale(doc); dlg.close(); await recalcMonth(); toast(isEdit?"Venta actualizada":"Venta registrada"); }

// Exports
export { refreshList as render, recalcMonth as normalize };
