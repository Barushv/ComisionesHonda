import { summarize } from './calc.js';
import { loadState, saveState } from '../services/db.js';
export const tablas = { tabuladores:null, financiamiento:null, seguros:null, garantias:null };
export const store = { ventas:[], resumen:null, mesActivo:null };
async function loadLS(){ const st=await loadState(); if(st) return st; const raw=localStorage.getItem('comisionesgo-v1'); return raw?JSON.parse(raw):null; }
async function saveLS(){ const payload={ ventas:store.ventas, mesActivo:store.mesActivo }; await saveState(payload); localStorage.setItem('comisionesgo-v1', JSON.stringify(payload)); }
export async function loadTablas(){
  const [tab,fin,seg,gar] = await Promise.all([
    fetch('./data/tabuladores.json').then(r=>r.json()),
    fetch('./data/financiamiento.json').then(r=>r.json()),
    fetch('./data/seguros.json').then(r=>r.json()),
    fetch('./data/garantias.json').then(r=>r.json())
  ]);
  tablas.tabuladores = tab; tablas.financiamiento = fin; tablas.seguros = seg; tablas.garantias = gar;
}
export function recalc(){ store.resumen = summarize(store.ventas,tablas); saveLS(); }
export async function init(defaultMes){
  const saved = await loadLS();
  if(saved){ store.ventas=saved.ventas||[]; store.mesActivo=saved.mesActivo||defaultMes; } else { store.ventas=[]; store.mesActivo=defaultMes; }
  await loadTablas(); recalc();
}
export function addVenta(v){ store.ventas.push(v); recalc(); }
export function updateVenta(i,v){ store.ventas[i]=v; recalc(); }
export function deleteVenta(i){ store.ventas.splice(i,1); recalc(); }
export function clearAll(){ store.ventas=[]; recalc(); }
