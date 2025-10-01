// /js/ui.js
import { computePreview, buildVehicleMap, pickTier } from "./calc.js";
import { addSale, getSalesByMonth, deleteSale } from "./store.js";

let DATA = null,
  VEHICLES = null,
  TIERS = null;
let CURRENT_MONTH = null,
  SALES_CACHE = [];

// ---- EXTRAS (Addons) ----
let ADDONS = null; // catálogo de seguros, garantías y % accesorios
export function setAddons(json) {
  ADDONS = json;
}

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
/* Render + Totales */
// ============================
export async function refreshList() {
  SALES_CACHE = await getSalesByMonth(CURRENT_MONTH);
  window.SALES_CACHE = SALES_CACHE;

  // Recalcular Q1 (base+fin) por el TIER ACTUAL del mes (retroactivo)
  const tierNow = pickTier(TIERS, SALES_CACHE.length);
  const salesForExport = SALES_CACHE.map((s) => {
    const v = VEHICLES.get(s.versionKey);
    const baseNow = v ? v.commissions[tierNow.id] ?? (s.base || 0) : s.base || 0;
    const bonusNow = s.type === "credito" ? (v ? v.finance_bonus[s.bank] ?? (s.bonus || 0) : s.bonus || 0) : 0;
    const q1Now = baseNow + bonusNow;

    const q2Now = (s.seguro || 0) + (s.garantia || 0) + (s.accesoriosComision || 0) + (s.bonoExtra || 0) + (s.bonoDemo || 0);

    const subtotalNow = q1Now + q2Now;

    return { ...s, tierNow: tierNow.id, baseNow, bonusNow, q1Now, q2Now, subtotalNow };
  });
  window.SALES_FOR_EXPORT = salesForExport;

  // Totales para header (desglosados)
  const baseTotal = salesForExport.reduce((a, s) => a + (s.baseNow || 0), 0);
  const bonusTotal = salesForExport.reduce((a, s) => a + (s.bonusNow || 0), 0);

  const segurosTotal = salesForExport.reduce((a, s) => a + (s.seguro || 0), 0);
  const garantiasTotal = salesForExport.reduce((a, s) => a + (s.garantia || 0), 0);
  const accesoriosTotal = salesForExport.reduce((a, s) => a + (s.accesoriosComision || 0), 0);
  const bonosExtraTotal = salesForExport.reduce((a, s) => a + (s.bonoExtra || 0), 0);
  const bonosDemoTotal = salesForExport.reduce((a, s) => a + (s.bonoDemo || 0), 0);

  const q2Total = segurosTotal + garantiasTotal + accesoriosTotal + bonosExtraTotal + bonosDemoTotal;
  const grandTotal = baseTotal + bonusTotal + q2Total;

  // Render stats (KPI cards)
  byId("units").textContent = SALES_CACHE.length;
  byId("tier").textContent = tierNow.id;

  byId("baseTotal").textContent = money(baseTotal); // Base (autos)
  byId("bonusTotal").textContent = money(bonusTotal); // Financiamiento

  // Nuevos KPIs
  const st = byId("segurosTotal");
  if (st) st.textContent = money(segurosTotal);
  const gt = byId("garantiasTotal");
  if (gt) gt.textContent = money(garantiasTotal);
  const at = byId("accesoriosTotal");
  if (at) at.textContent = money(accesoriosTotal);
  const be = byId("bonosExtraTotal");
  if (be) be.textContent = money(bonosExtraTotal);
  const bd = byId("bonosDemoTotal");
  if (bd) bd.textContent = money(bonosDemoTotal);

  byId("grandTotal").textContent = money(grandTotal); // Total mes

  // Render list (usando valores recalculados)
  const list = byId("salesList");
  list.innerHTML = "";
  salesForExport.forEach((s) => {
    const card = document.createElement("div");
    card.className = "card";

    const left = document.createElement("div");
    left.innerHTML = `
      <div><strong>${s.versionKey}</strong> · ${s.type === "credito" ? "Crédito" : "Contado"} ${s.bank ? "· " + s.bank.toUpperCase() : ""}</div>
      <div class="meta">${new Date(s.createdAt).toLocaleDateString()} · Tramo ${s.tierNow}</div>
      <div class="meta">Q1 ${money(s.q1Now)} · Q2 ${money(s.q2Now)}</div>
    `;

    const right = document.createElement("div");
    right.innerHTML = `<div class="amount">${money(s.subtotalNow)}</div>`;

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

  return {
    baseTotal,
    bonusTotal,
    segurosTotal,
    garantiasTotal,
    accesoriosTotal,
    bonosExtraTotal,
    bonosDemoTotal,
    q2Total,
    grandTotal,
    tier: tierNow.id,
    count: SALES_CACHE.length,
  };
}

// ============================
// Buscador de versiones
// ============================
function renderSelectOptions(query, select) {
  if (!select) return;
  const q = (query || "").toLowerCase();

  const keys = VEHICLES && typeof VEHICLES.keys === "function" ? Array.from(VEHICLES.keys()) : [];

  const filtered = keys
    .filter((k) => {
      const v = VEHICLES.get(k);
      const modelo = (v?.modelo || "").toLowerCase();
      return k.toLowerCase().includes(q) || modelo.includes(q);
    })
    .sort((a, b) => a.localeCompare(b, "es"));

  if (filtered.length) {
    select.innerHTML = filtered.map((k) => `<option value="${k}">${k} — ${VEHICLES.get(k).modelo}</option>`).join("");
  } else {
    select.innerHTML = `<option value="" disabled>No hay coincidencias</option>`;
  }
}

// ============================
// Helpers de EXTRAS
// ============================
function getSeguroMonto(modelo, years) {
  if (!ADDONS?.seguros || !modelo || !years) return 0;
  const tabla = ADDONS.seguros[modelo.toUpperCase()];
  return tabla ? tabla[String(years)] || 0 : 0;
}
function getGarantiaMonto(modelo, years) {
  if (!ADDONS?.garantias || !modelo || !years) return 0;
  const tabla = ADDONS.garantias[modelo.toUpperCase()];
  return tabla ? tabla[String(years)] || 0 : 0;
}
function accComision(venta) {
  const pct = ADDONS?.accessories_pct ?? 0;
  const v = Number(venta || 0);
  return Math.round(v * pct);
}
function int(v) {
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}
function num(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
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

    // Defaults unidad
    const select = $("#versionSelect");
    renderSelectOptions("", select);
    if (select && select.options.length > 0) select.selectedIndex = 0;

    const tipoContado = $("#tipoContado");
    if (tipoContado) tipoContado.checked = true;
    const bankRow = $("#bankRow");
    if (bankRow) bankRow.classList.add("hidden");

    // Defaults EXTRAS
    const seguroSwitch = $("#seguroSwitch");
    const seguroYears = $("#seguroYears");
    const garantiaSwitch = $("#garantiaSwitch");
    const garantiaYears = $("#garantiaYears");
    const accesoriosVenta = $("#accesoriosVenta");
    const bonoExtra = $("#bonoExtra");
    const demoSwitch = $("#demoSwitch");
    const bonoDemo = $("#bonoDemo");

    if (seguroSwitch) seguroSwitch.checked = false;
    if (seguroYears) {
      seguroYears.value = "3";
      seguroYears.disabled = true;
    }

    if (garantiaSwitch) garantiaSwitch.checked = false;
    if (garantiaYears) {
      garantiaYears.value = "3";
      garantiaYears.disabled = true;
    }

    if (accesoriosVenta) accesoriosVenta.value = "";
    if (bonoExtra) bonoExtra.value = "";

    if (demoSwitch) demoSwitch.checked = false;
    if (bonoDemo) {
      bonoDemo.value = "";
      bonoDemo.disabled = true;
    }

    updatePreview();
  });

  // Abrir modal de email (si existiera)
  on("#sendEmailBtn", "click", () => emailDlg?.showModal?.());

  // Alternar banco según tipo
  on("#tipoCredito", "change", () => {
    $("#bankRow")?.classList?.remove("hidden");
    updatePreview();
  });
  on("#tipoContado", "change", () => {
    $("#bankRow")?.classList?.add("hidden");
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

  // ===== Listeners de EXTRAS (una sola vez, fuera del forEach) =====
  on("#seguroSwitch", "change", () => {
    const y = $("#seguroYears");
    if (y) y.disabled = !$("#seguroSwitch").checked;
    updatePreview();
  });
  on("#seguroYears", "change", updatePreview);

  on("#garantiaSwitch", "change", () => {
    const y = $("#garantiaYears");
    if (y) y.disabled = !$("#garantiaSwitch").checked;
    updatePreview();
  });
  on("#garantiaYears", "change", updatePreview);

  on("#accesoriosVenta", "input", updatePreview);
  on("#bonoExtra", "input", updatePreview);

  on("#demoSwitch", "change", () => {
    const b = $("#bonoDemo");
    if (b) b.disabled = !$("#demoSwitch").checked;
    updatePreview();
  });
  on("#bonoDemo", "input", updatePreview);

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
    const bank = type === "credito" && bankEl && bankEl.value ? bankEl.value : null;

    const v = VEHICLES.get(select.value);
    if (!v) {
      toast("Versión no válida");
      return;
    }

    // Tier retroactivo (preview con +1)
    const nextCount = (window.SALES_CACHE ? window.SALES_CACHE.length : 0) + 1;
    const tier = pickTier(TIERS, nextCount);
    const base = v.commissions[tier.id] ?? 0;
    const fin = type === "credito" ? v.finance_bonus[bank || "hf"] ?? 0 : 0;
    const q1 = base + fin;

    // EXTRAS
    const modelo = v.modelo || "";

    const seguroOn = $("#seguroSwitch")?.checked;
    const seguroYears = int($("#seguroYears")?.value);
    const seguro = seguroOn ? getSeguroMonto(modelo, seguroYears) : 0;

    const garOn = $("#garantiaSwitch")?.checked;
    const garYears = int($("#garantiaYears")?.value);
    const garantia = garOn ? getGarantiaMonto(modelo, garYears) : 0;

    const accVenta = num($("#accesoriosVenta")?.value);
    const accCom = accComision(accVenta);

    const bonoExtra = num($("#bonoExtra")?.value);
    const demoOn = $("#demoSwitch")?.checked;
    const bonoDemo = demoOn ? num($("#bonoDemo")?.value) : 0;

    const q2 = seguro + garantia + accCom + bonoExtra + bonoDemo;

    await addSale({
      month: CURRENT_MONTH,
      model: v.modelo,
      versionKey: select.value,
      type,
      bank,
      createdAt: Date.now(),
      // Q1
      tierApplied: tier.id,
      base,
      bonus: fin,
      // Q2
      seguroYears: seguroOn ? seguroYears : 0,
      seguro,
      garantiaYears: garOn ? garYears : 0,
      garantia,
      accesoriosVenta: accVenta,
      accesoriosComision: accCom,
      bonoExtra,
      bonoDemo,
      // Totales
      q1,
      q2,
      subtotal: q1 + q2,
    });

    dlg.close();
    await refreshList();
    toast("Venta registrada");
  });
}

// ============================
// Preview (Q1 + Q2)
// ============================
function updatePreview() {
  const select = $("#versionSelect");
  if (!select || !select.value) {
    setPreview("Selecciona una versión");
    return;
  }

  // Q1
  const checked = document.querySelector('input[name="tipo"]:checked');
  const type = checked ? checked.value : "contado";
  const bankEl = $("#bankSelect");
  const bank = type === "credito" && bankEl && bankEl.value ? bankEl.value : "hf";

  const nextCount = (window.SALES_CACHE ? window.SALES_CACHE.length : 0) + 1;
  const tier = pickTier(TIERS, nextCount);
  const pv = computePreview(select.value, type, bank, tier.id, VEHICLES);
  const q1 = pv.base + (type === "credito" ? pv.bonus : 0);

  // Q2
  const v = VEHICLES.get(select.value);
  const modelo = v?.modelo || "";

  const seguroOn = $("#seguroSwitch")?.checked;
  const seguroYears = int($("#seguroYears")?.value);
  const seguro = seguroOn ? getSeguroMonto(modelo, seguroYears) : 0;

  const garOn = $("#garantiaSwitch")?.checked;
  const garYears = int($("#garantiaYears")?.value);
  const garantia = garOn ? getGarantiaMonto(modelo, garYears) : 0;

  const accVenta = num($("#accesoriosVenta")?.value);
  const accCom = accComision(accVenta);

  const bonoExtra = num($("#bonoExtra")?.value);
  const demoOn = $("#demoSwitch")?.checked;
  const bonoDemo = demoOn ? num($("#bonoDemo")?.value) : 0;

  const q2 = seguro + garantia + accCom + bonoExtra + bonoDemo;

  setPreview(`Q1 ${money(q1)} + Q2 ${money(q2)} → Subtotal ${money(q1 + q2)} (Tramo ${tier.id})`);
}

function setPreview(text) {
  const box = $("#salePreview");
  if (box) box.textContent = text;
}

// ============================
// Helpers (ÚNICA definición)
// ============================
function $(idOrSelector) {
  return idOrSelector && idOrSelector[0] === "#" ? document.querySelector(idOrSelector) : document.getElementById(idOrSelector);
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

// Money helper (usado arriba) — si ya lo tienes global, puedes quitar esto.
function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}
