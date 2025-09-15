import {
  computePreview,
  computeTotalsForMonth,
  money,
  buildVehicleMap,
  pickTier,
} from "./calc.js";
import { addSale, getSalesByMonth, deleteSale } from "./store.js";

let DATA = null,
  VEHICLES = null,
  TIERS = null;
let CURRENT_MONTH = null,
  SALES_CACHE = [];

// ============================
// Setup de datos/mes
// ============================
export function setData(json) {
  DATA = json;
  VEHICLES = buildVehicleMap(json);
  TIERS = json.tiers;
}
export function setMonth(month) {
  CURRENT_MONTH = month;
}

// ============================
// Render + Totales
// ============================
export async function refreshList() {
  SALES_CACHE = await getSalesByMonth(CURRENT_MONTH);
  window.SALES_CACHE = SALES_CACHE; // <- para previews/otros usos

  const totals = computeTotalsForMonth(SALES_CACHE, TIERS, VEHICLES, true);

  byId("units").textContent = totals.count;
  byId("tier").textContent = totals.tier;
  byId("baseTotal").textContent = money(totals.base);
  byId("bonusTotal").textContent = money(totals.bonus);
  byId("grandTotal").textContent = money(totals.total);

  const list = byId("salesList");
  list.innerHTML = "";
  SALES_CACHE.forEach((s) => {
    const card = document.createElement("div");
    card.className = "card";
    const left = document.createElement("div");
    left.innerHTML = `<div><strong>${s.versionKey}</strong> · ${
      s.type === "credito" ? "Crédito" : "Contado"
    } ${s.bank ? "· " + s.bank.toUpperCase() : ""}</div>
                      <div class="meta">${new Date(
                        s.createdAt
                      ).toLocaleDateString()} · Tramo ${s.tierApplied}</div>`;
    const right = document.createElement("div");
    right.innerHTML = `<div class="amount">${money(s.subtotal)}</div>`;
    const del = document.createElement("button");
    del.className = "btn small";
    del.textContent = "Borrar";
    del.onclick = async () => {
      await deleteSale(s.id);
      await refreshList();
      toast("Venta eliminada");
    };
    right.appendChild(del);
    card.appendChild(left);
    card.appendChild(right);
    list.appendChild(card);
  });

  return totals;
}

// Rellena el <select id="versionSelect"> filtrando por texto
function renderSelectOptions(query, select) {
  if (!select) return;
  const q = (query || "").toLowerCase();

  // Si aún no cargan los datos, evita romper
  const keys =
    VEHICLES && typeof VEHICLES.keys === "function"
      ? Array.from(VEHICLES.keys())
      : [];

  const filtered = keys
    .filter((k) => {
      const v = VEHICLES.get(k);
      const modelo = (v?.modelo || "").toLowerCase();
      return k.toLowerCase().includes(q) || modelo.includes(q);
    })
    .sort((a, b) => a.localeCompare(b, "es"));

  if (filtered.length) {
    select.innerHTML = filtered
      .map(
        (k) => `<option value="${k}">${k} — ${VEHICLES.get(k).modelo}</option>`
      )
      .join("");
  } else {
    select.innerHTML = `<option value="" disabled>No hay coincidencias</option>`;
  }
}

// ============================
// UI / Diálogos
// ============================
export function bindDialogs() {
  const dlg = $("#saleDialog");
  const emailDlg = $("#emailDialog");

  // Abrir modal de nueva venta
  on("#addSaleBtn", "click", () => {
    dlg.showModal();
    const select = $("#versionSelect");
    renderSelectOptions("", select);
    if (select && select.options.length > 0) select.selectedIndex = 0;

    const tipoContado = $("#tipoContado");
    if (tipoContado) tipoContado.checked = true;
    const bankRow = $("#bankRow");
    if (bankRow) bankRow.classList.add("hidden");

    updatePreview();
  });

  // Abrir modal de email
  on("#sendEmailBtn", "click", () => emailDlg.showModal());

  // Alternar banco según tipo
  on("#tipoCredito", "change", () => {
    const r = $("#bankRow");
    if (r) r.classList.remove("hidden");
    updatePreview();
  });
  on("#tipoContado", "change", () => {
    const r = $("#bankRow");
    if (r) r.classList.add("hidden");
    updatePreview();
  });

  // Buscador / Select de versión
  on("#searchInput", "input", (e) => {
    const select = $("#versionSelect");
    renderSelectOptions((e.target.value || "").trim(), select);
    if (select && select.options.length > 0) select.selectedIndex = 0;
    updatePreview();
  });
  ["change", "input"].forEach((ev) => {
    on("#versionSelect", ev, updatePreview);
    on("#bankSelect", ev, updatePreview);
  });

  // Guardar venta
  on("#saveSaleBtn", "click", async (e) => {
    e.preventDefault();

    const select = $("#versionSelect");
    if (!select || !select.value) {
      toast("Selecciona una versión");
      return;
    }

    const checked = document.querySelector('input[name="tipo"]:checked');
    const type = checked ? checked.value : "contado";
    const bankEl = $("#bankSelect");
    const bank =
      type === "credito" && bankEl && bankEl.value ? bankEl.value : null;

    const v = VEHICLES.get(select.value);
    if (!v) {
      toast("Versión no válida");
      return;
    }

    const nextCount = (window.SALES_CACHE ? window.SALES_CACHE.length : 0) + 1;
    const tier = pickTier(TIERS, nextCount);
    const base = v.commissions[tier.id] ?? 0;
    const bonus = type === "credito" ? v.finance_bonus[bank || "hf"] ?? 0 : 0;

    await addSale({
      month: CURRENT_MONTH,
      model: v.modelo,
      versionKey: select.value,
      type,
      bank,
      createdAt: Date.now(),
      tierApplied: tier.id,
      base,
      bonus,
      subtotal: base + bonus,
    });

    dlg.close();
    await refreshList();
    toast("Venta registrada");
  });
}

// ============================
// Preview seguro
// ============================
function updatePreview() {
  const select = $("#versionSelect");
  if (!select || !select.value) {
    setPreview("Selecciona una versión");
    return;
  }

  const checked = document.querySelector('input[name="tipo"]:checked');
  const type = checked ? checked.value : "contado";
  const bankEl = $("#bankSelect");
  const bank =
    type === "credito" && bankEl && bankEl.value ? bankEl.value : "hf";

  const nextCount = (window.SALES_CACHE ? window.SALES_CACHE.length : 0) + 1;
  const tier = pickTier(TIERS, nextCount);
  const pv = computePreview(select.value, type, bank, tier.id, VEHICLES);

  setPreview(
    `Tramo ${tier.id}: Base ${money(pv.base)} ${
      type === "credito" ? `+ Bono ${money(pv.bonus)}` : ""
    } → Subtotal ${money(pv.subtotal)}`
  );
}

function setPreview(text) {
  const box = $("#salePreview");
  if (box) box.textContent = text;
}

// ============================
// Helpers (ÚNICA definición)
// ============================
function $(idOrSelector) {
  return idOrSelector && idOrSelector[0] === "#"
    ? document.querySelector(idOrSelector)
    : document.getElementById(idOrSelector);
}
function byId(id) {
  return document.getElementById(id);
}
function on(sel, ev, fn) {
  const el = $(sel);
  if (el) el.addEventListener(ev, fn);
}

// ============================
export function toast(msg) {
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.position = "fixed";
  el.style.left = "50%";
  el.style.transform = "translateX(-50%)";
  el.style.bottom = "90px";
  el.style.background = "#111827";
  el.style.border = "1px solid #374151";
  el.style.padding = "10px 14px";
  el.style.borderRadius = "12px";
  el.style.zIndex = "9999";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}
