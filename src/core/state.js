// src/core/state.js
import { summarize } from './calc.js';

import { loadState, saveState } from '../services/db.js';
const STORAGE_KEY = 'comisionesgo-v1';

export const tablas = {
  tabuladores: null,
  financiamiento: null,
  seguros: null,
  garantias: null
};

export const store = {
  ventas: [],          // array de ventas
  resumen: null,       // {tramo, totalUnidades, q1, q2, total, ventas:[]}
  mesActivo: null,     // string 'Octubre 2025' (placeholder)
};

async function loadLS() {
  const st = await loadState();
  if (st) return st;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function saveLS() {
  const payload = {
    ventas: store.ventas,
    mesActivo: store.mesActivo
  };
  await saveState(payload);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function loadTablas() {
  const [tab, fin, seg, gar] = await Promise.all([
    fetch('/data/tabuladores.json').then(r => r.json()),
    fetch('/data/financiamiento.json').then(r => r.json()),
    fetch('/data/seguros.json').then(r => r.json()),
    fetch('/data/garantias.json').then(r => r.json()),
  ]);
  tablas.tabuladores = tab;
  tablas.financiamiento = fin;
  tablas.seguros = seg;
  tablas.garantias = gar;
}

export function recalc() {
  store.resumen = summarize(store.ventas, tablas);
  saveLS();
}

export async function init(defaultMes) {
  const saved = await loadLS();
  if (saved) {
    store.ventas = saved.ventas || [];
    store.mesActivo = saved.mesActivo || defaultMes;
  } else {
    store.ventas = [];
    store.mesActivo = defaultMes;
  }
  await loadTablas();
  recalc();
}

export function addVenta(v) {
  store.ventas.push(v);
  recalc();
}

export function updateVenta(index, v) {
  store.ventas[index] = v;
  recalc();
}

export function deleteVenta(index) {
  store.ventas.splice(index, 1);
  recalc();
}

export function clearAll() {
  store.ventas = [];
  recalc();
}
