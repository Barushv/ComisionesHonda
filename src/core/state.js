import { summarize } from './calc.js'; import { loadState, saveState } from '../services/db.js';
export const store={ventas:[],resumen:null,mesActivo:null};
export async function init(defaultMes){ const saved=await loadState(); if(saved){ store.ventas=saved.ventas||[]; store.mesActivo=saved.mesActivo||defaultMes; } else { store.ventas=[]; store.mesActivo=defaultMes; } recalc(); }
export function recalc(){ store.resumen=summarize(store.ventas); saveState({ventas:store.ventas,mesActivo:store.mesActivo}); }
export function addVenta(v){ store.ventas.push(v); recalc(); } export function updateVenta(i,v){ store.ventas[i]=v; recalc(); } export function deleteVenta(i){ store.ventas.splice(i,1); recalc(); } export function clearAll(){ store.ventas=[]; recalc(); }