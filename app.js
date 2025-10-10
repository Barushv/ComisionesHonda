import {
  init,
  store,
  addVenta,
  updateVenta,
  deleteVenta,
  clearAll,
  recalc,
  tablas,
} from "./src/core/state.js";
import { formatMonth } from "./src/core/router.js";
import {
  getVehiculoComision,
  getFinanciamientoComision,
  getSeguroMonto,
  getGarantiaMonto,
} from "./src/core/calc.js";
import { Header } from "./src/ui/components/Header.js";
import { TabBar } from "./src/ui/components/TabBar.js";
import { MenuDrawer } from "./src/ui/components/MenuDrawer.js";
import { AboutModal } from "./src/ui/components/AboutModal.js";
import { ModalSale } from "./src/ui/components/ModalSale.js";
import { Home } from "./src/ui/views/Home.js";
import { toast } from "./src/ui/components/Toast.js";
import { exportXLSX } from "./src/services/export-xlsx.js";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
    } catch (e) {}
  });
}

const $ = (s) => document.querySelector(s);
const money = (n) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n || 0);

const VERSIONES = {
  CITY: ["Sport", "Prime", "Touring"],
  "BR-V": ["Uniq", "Touring"],
  "HR-V": ["Uniq", "Sport", "Touring"],
  CIVIC: ["iStyle", "Sport HEV", "Touring HEV"],
  ACCORD: ["Prime", "Touring HEV"],
  "CR-V": ["Turbo", "Turbo Plus", "Touring"],
  "CR-V HEV": ["Touring HEV", "Sport Touring HEV"],
  PILOT: ["Touring", "Black Edition"],
  ODYSSEY: ["Touring", "Black Edition"],
};

function fillVersiones(modelo) {
  const sel = $("#selVersion");
  if (!sel) return;
  sel.innerHTML =
    '<option value="" selected disabled>Selecciona versión</option>';
  (VERSIONES[modelo] || []).forEach((v) => {
    const o = document.createElement("option");
    o.textContent = v;
    o.value = v;
    sel.appendChild(o);
  });
}

function renderShell() {
  document.body.innerHTML = `${Header()}<main class="container-fluid py-3 app-main"><div class="row g-2 mb-3" id="summaryChips"></div><div id="viewRoot"></div></main>${TabBar()}${MenuDrawer()}${AboutModal()}${ModalSale()}<div class="toast-container position-fixed bottom-0 end-0 p-3" id="toastArea"></div>`;
}

function renderChips() {
  const chips = document.getElementById("summaryChips");
  const { resumen } = store;
  const total = resumen?.total ?? 0;
  const q1 = resumen?.q1 ?? 0;
  const q2 = resumen?.q2 ?? 0;
  const tramo = resumen?.tramo ?? "1-4";
  const u = resumen?.totalUnidades ?? 0;
  chips.innerHTML = `<div class="col-auto"><div class="chip chip-primary">Q1: ${u} u · ${tramo} · ${money(
    q1
  )}</div></div>
  <div class="col-auto"><div class="chip chip-accent">Q2: ${money(
    q2
  )}</div></div>
  <div class="col-auto"><div class="chip chip-success">Total: ${money(
    total
  )}</div></div>`;
}

function helpers() {
  return {
    money,
    veh: (v) =>
      getVehiculoComision(
        v.modeloReal,
        store.resumen?.tramo || "1-4",
        tablas,
        v.version
      ),
    fin: (v) =>
      getFinanciamientoComision(
        v.modeloReal,
        v.pago,
        v.banco,
        tablas,
        v.version
      ),
    seg: (v) => getSeguroMonto(v.modeloReal, v.seguroAnios, tablas, v.version),
    gar: (v) =>
      getGarantiaMonto(v.modeloReal, v.garantiaAnios, tablas, v.version),
    acc10: (v) => Math.round((v.accesoriosMonto || 0) * 0.1),
  };
}

function renderList() {
  document.getElementById("viewRoot").innerHTML = Home({
    store,
    helpers: helpers(),
  });
}
function renderAll() {
  recalc();
  renderChips();
  renderList();
}

function resetForm() {
  const f = $("#saleForm");
  if (!f) return;
  f.reset();
  $("#bancosWrap").hidden = true;
  $("#otroBancoWrap").hidden = true;
  $("#seguroMonto").textContent = money(0);
  $("#garantiaMonto").textContent = money(0);
  $("#accesoriosComision").textContent = "10% = $0";
  $("#selVersion").innerHTML =
    '<option value="" selected disabled>Selecciona versión</option>';
}

function refreshDynamicPrices() {
  const modelo = $("#selModelo")?.value || "";
  const segA = Number($("#selSeguroAnios")?.value || 0);
  const garA = Number($("#selGarantiaAnios")?.value || 0);
  $("#seguroMonto").textContent = money(getSeguroMonto(modelo, segA, tablas));
  $("#garantiaMonto").textContent = money(
    getGarantiaMonto(modelo, garA, tablas)
  );
}

let currentEditIndex = null;
function openEdit(index) {
  currentEditIndex = index;
  const v = store.ventas[index];
  const modalEl = document.getElementById("modalSale");
  const bsModal = new bootstrap.Modal(modalEl);
  $("#selModelo").value = v.modeloReal;
  fillVersiones(v.modeloReal);
  $("#selVersion").value = v.version;
  if (v.pago === "CREDITO") {
    $("#pagoCredito").checked = true;
    $("#pagoContado").checked = false;
    $("#bancosWrap").hidden = false;
    $("#selBanco").value = v.banco || "HONDA FINANCE";
    $("#otroBancoWrap").hidden = !(v.banco === "OTRO");
    $("#otroBancoNombre").value = v.otroBancoNombre || "";
  } else {
    $("#pagoCredito").checked = false;
    $("#pagoContado").checked = true;
    $("#bancosWrap").hidden = true;
    $("#otroBancoWrap").hidden = true;
  }
  $("#selSeguroAnios").value = String(v.seguroAnios || 0);
  $("#selGarantiaAnios").value = String(v.garantiaAnios || 0);
  $("#montoAccesorios").value = String(v.accesoriosMonto || 0);
  $("#montoBono").value = String(v.bonoAdicional || 0);
  $("#montoDemo").value = String(v.bonoDemo || 0);
  $("#notaVenta").value = v.nota || "";
  refreshDynamicPrices();
  $("#accesoriosComision").textContent = `10% = ${money(
    Math.round((v.accesoriosMonto || 0) * 0.1)
  )}`;
  bsModal.show();
  modalEl.addEventListener(
    "hidden.bs.modal",
    () => {
      currentEditIndex = null;
      resetForm();
      const nextFocus = document.getElementById("btnAdd");
      nextFocus?.focus();
    },
    { once: true }
  );
}

function collectVentaFromForm(editIndex = null) {
  const modelo = $("#selModelo").value;
  const version = $("#selVersion").value;
  if (!modelo || !version) {
    toast("Selecciona modelo y versión.");
    return null;
  }
  const pago = $("#pagoCredito").checked ? "CREDITO" : "CONTADO";
  let banco = null,
    otroBancoNombre = null;
  if (pago === "CREDITO") {
    banco = $("#selBanco").value;
    if (banco === "OTRO")
      otroBancoNombre = ($("#otroBancoNombre").value || "").trim();
  }
  const seguroAnios = Number($("#selSeguroAnios").value || 0);
  const garantiaAnios = Number($("#selGarantiaAnios").value || 0);
  const accesoriosMonto = Number($("#montoAccesorios").value || 0);
  const bonoAdicional = Number($("#montoBono").value || 0);
  const bonoDemo = Number($("#montoDemo").value || 0);
  const nota = ($("#notaVenta").value || "").slice(0, 140);
  return {
    modeloVisual: `${modelo} ${version}`,
    modeloReal: modelo,
    version,
    pago,
    banco,
    otroBancoNombre,
    seguroAnios,
    garantiaAnios,
    accesoriosMonto,
    bonoAdicional,
    bonoDemo,
    nota,
    editIndex,
  };
}

function onGuardarVenta() {
  const venta = collectVentaFromForm(currentEditIndex);
  if (!venta) return;
  if (venta.editIndex != null) updateVenta(venta.editIndex, venta);
  else addVenta(venta);
  const modalEl = document.getElementById("modalSale");
  const modal = bootstrap.Modal.getInstance(modalEl);
  const nextFocus = document.getElementById("btnAdd");
  modalEl.addEventListener(
    "hidden.bs.modal",
    () => {
      nextFocus?.focus();
    },
    { once: true }
  );
  if (modal) modal.hide();
  resetForm();
  renderAll();
  toast(venta.editIndex != null ? "Cambios aplicados" : "Venta guardada");
}

function attachUIEvents() {
  $("#prevMonth").addEventListener("click", () =>
    toast("Navegación de mes — pendiente")
  );
  $("#nextMonth").addEventListener("click", () =>
    toast("Navegación de mes — pendiente")
  );
  $("#btnExport").addEventListener("click", () => exportXLSX());
  $("#btnClearAll").addEventListener("click", () => {
    const ok = prompt("Para limpiar todo, escribe: LIMPIAR");
    if (ok && ok.trim().toUpperCase() === "LIMPIAR") {
      clearAll();
      renderAll();
      toast("Datos limpiados.");
    }
  });
  document.getElementById("btnAdd").addEventListener("click", () => {
    currentEditIndex = null;
    resetForm();
  });
  document
    .getElementById("btnGuardarVenta")
    .addEventListener("click", onGuardarVenta);
  $("#selModelo").addEventListener("change", (e) => {
    fillVersiones(e.target.value);
    refreshDynamicPrices();
  });
  $("#selSeguroAnios").addEventListener("change", refreshDynamicPrices);
  $("#selGarantiaAnios").addEventListener("change", refreshDynamicPrices);
  $("#montoAccesorios").addEventListener("input", () => {
    const v = Number($("#montoAccesorios").value || 0);
    $("#accesoriosComision").textContent = `10% = ${money(
      Math.round(v * 0.1)
    )}`;
  });
  const pagoContado = $("#pagoContado");
  const pagoCredito = $("#pagoCredito");
  const bancosWrap = $("#bancosWrap");
  const selBanco = $("#selBanco");
  const otroBancoWrap = $("#otroBancoWrap");
  [pagoContado, pagoCredito].forEach((r) =>
    r.addEventListener("change", () => {
      const isCred = pagoCredito.checked;
      bancosWrap.hidden = !isCred;
      otroBancoWrap.hidden = !(isCred && selBanco.value === "OTRO");
    })
  );
  selBanco.addEventListener("change", () => {
    otroBancoWrap.hidden = !(selBanco.value === "OTRO");
  });
  // Delegated actions edit/delete
  document.getElementById("viewRoot").addEventListener("click", (ev) => {
    const t = ev.target.closest("[data-action]");
    if (!t) return;
    const i = Number(t.getAttribute("data-index"));
    if (t.dataset.action === "del") {
      deleteVenta(i);
      renderAll();
      toast("Venta eliminada");
    }
    if (t.dataset.action === "edit") {
      openEdit(i);
    }
  });
}

async function boot() {
  renderShell();
  document.getElementById("activeMonth").textContent = formatMonth(new Date());
  await init(formatMonth(new Date()));
  renderAll();
  attachUIEvents();
}
boot();
