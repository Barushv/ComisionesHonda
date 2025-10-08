import {
  init,
  addVenta,
  updateVenta,
  deleteVenta,
  clearAll,
  store,
  tablas,
  recalc,
} from "./src/core/state.js";
import {
  getTramo,
  calcSaleTotals,
  getVehiculoComision,
  getFinanciamientoComision,
} from "./src/core/calc.js";
import { exportXLSX } from "./src/services/export-xlsx.js";
import { formatMonth } from "./src/core/router.js";

// ===== Service Worker =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
    } catch {}
  });
}

const $ = (sel) => document.querySelector(sel);
const el = (id) => document.getElementById(id);

// ===== Helpers =====
const money = (n) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n || 0);

// Modelos -> versiones (incluye CR-V HEV Sport Touring HEV)
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
  const sel = el("selVersion");
  sel.innerHTML =
    '<option value="" selected disabled>Selecciona versión</option>';
  (VERSIONES[modelo] || []).forEach((v) => {
    const opt = document.createElement("option");
    opt.textContent = v;
    opt.value = v;
    sel.appendChild(opt);
  });
}

// ===== UI init =====
async function boot() {
  // Mes activo
  el("activeMonth").textContent = formatMonth(new Date());

  // Cargar tablas y estado
  await init(el("activeMonth").textContent);

  // Eventos básicos
  el("prevMonth").addEventListener("click", () =>
    toast("Navegación de mes estará en una iteración posterior.")
  );
  el("nextMonth").addEventListener("click", () =>
    toast("Navegación de mes estará en una iteración posterior.")
  );
  el("btnExport").addEventListener("click", () => exportXLSX());
  el("btnClearAll").addEventListener("click", onClearAll);

  // Modal logic: pago/bancos
  const pagoContado = el("pagoContado");
  const pagoCredito = el("pagoCredito");
  const bancosWrap = el("bancosWrap");
  const selBanco = el("selBanco");
  const otroBancoWrap = el("otroBancoWrap");

  [pagoContado, pagoCredito].forEach((r) =>
    r.addEventListener("change", () => {
      const isCredito = pagoCredito.checked;
      bancosWrap.hidden = !isCredito;
      otroBancoWrap.hidden = !(isCredito && selBanco.value === "OTRO");
    })
  );
  selBanco.addEventListener("change", () => {
    otroBancoWrap.hidden = !(selBanco.value === "OTRO");
  });

  // Modelo -> versiones
  el("selModelo").addEventListener("change", (e) => {
    fillVersiones(e.target.value);
    refreshDynamicPrices(); // actualiza seguro/garantía según modelo
  });

  // Dinámicos: seguro/garantía/accesorios
  el("selSeguroAnios").addEventListener("change", refreshDynamicPrices);
  el("selGarantiaAnios").addEventListener("change", refreshDynamicPrices);
  el("montoAccesorios").addEventListener("input", () => {
    const v = Number(el("montoAccesorios").value || 0);
    el("accesoriosComision").textContent = `10% = ${money(
      Math.round(v * 0.1)
    )}`;
  });

  el("btnGuardarVenta").addEventListener("click", onGuardarVenta);

  // Primer render
  render();
}

function onClearAll() {
  const ok = prompt("Para limpiar todo, escribe: LIMPIAR");
  if (ok && ok.trim().toUpperCase() === "LIMPIAR") {
    clearAll();
    render();
    toast("Datos limpiados.");
  } else if (ok !== null) {
    toast("Operación cancelada.");
  }
}

function refreshDynamicPrices() {
  const modelo = el("selModelo").value || "";
  const segA = Number(el("selSeguroAnios").value || 0);
  const garA = Number(el("selGarantiaAnios").value || 0);

  // Usamos tablas cargadas en state
  const { seguros, garantias } = tablas;
  // Calcular con utilidades simples (duplicadas mínimas para no importar aquí)
  const isHEV = modelo.toUpperCase().includes("HEV");
  const key = (function normalize(m) {
    if (m.startsWith("BR-")) return "BRV";
    if (m.startsWith("HR-")) return "HRV";
    if (m.startsWith("CR-")) return isHEV ? "CRV HEV" : "CRV";
    if (m.includes("HEV")) {
      if (m.includes("CIVIC")) return "CIVIC HEV";
      if (m.includes("ACCORD")) return "ACCORD HEV";
    }
    return m;
  })(modelo.toUpperCase());

  const sTbl =
    seguros?.seguros?.[key] ||
    seguros?.seguros?.[key?.replace(" HEV", "")] ||
    {};
  const gTbl =
    garantias?.garantias?.[key] ||
    garantias?.garantias?.[key?.replace(" HEV", "")] ||
    {};

  const sVal = sTbl[String(segA)] || 0;
  const gVal = gTbl[String(garA)] || 0;
  el("seguroMonto").textContent = money(sVal);
  el("garantiaMonto").textContent = money(gVal);
}

function collectVentaFromForm(editIndex = null) {
  const modelo = el("selModelo").value;
  const version = el("selVersion").value;
  if (!modelo || !version) {
    toast("Selecciona modelo y versión.");
    return null;
  }
  const pago = el("pagoCredito").checked ? "CREDITO" : "CONTADO";
  let banco = null,
    otroBancoNombre = null;
  if (pago === "CREDITO") {
    banco = el("selBanco").value;
    if (banco === "OTRO")
      otroBancoNombre = (el("otroBancoNombre").value || "").trim();
  }
  const seguroAnios = Number(el("selSeguroAnios").value || 0);
  const garantiaAnios = Number(el("selGarantiaAnios").value || 0);
  const accesoriosMonto = Number(el("montoAccesorios").value || 0);
  const bonoAdicional = Number(el("montoBono").value || 0);
  const bonoDemo = Number(el("montoDemo").value || 0);
  const nota = (el("notaVenta").value || "").slice(0, 140);

  return {
    modeloVisual: `${modelo} ${version}`,
    modeloReal: modelo, // se usa para tablas
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

function resetForm() {
  el("saleForm").reset();
  el("bancosWrap").hidden = true;
  el("otroBancoWrap").hidden = true;
  el("seguroMonto").textContent = money(0);
  el("garantiaMonto").textContent = money(0);
  el("accesoriosComision").textContent = "10% = $0";
  el("selVersion").innerHTML =
    '<option value="" selected disabled>Selecciona versión</option>';
}

function onGuardarVenta() {
  const venta = collectVentaFromForm(currentEditIndex);
  if (!venta) return;
  if (venta.editIndex != null) {
    updateVenta(venta.editIndex, venta);
  } else {
    addVenta(venta);
  }
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
  render();
  toast(venta.editIndex != null ? "Cambios aplicados" : "Venta guardada");
}

function renderChips() {
  const chips = $("#summaryChips");
  const total = store.resumen?.total ?? 0;
  const q1 = store.resumen?.q1 ?? 0;
  const q2 = store.resumen?.q2 ?? 0;
  const tramo = store.resumen?.tramo ?? "1-4";
  const u = store.resumen?.totalUnidades ?? 0;
  chips.innerHTML = `
    <div class="col-auto"><div class="chip chip-primary">Q1: ${u} u · ${tramo} · ${money(
    q1
  )}</div></div>
    <div class="col-auto"><div class="chip chip-accent">Q2: ${money(
      q2
    )}</div></div>
    <div class="col-auto"><div class="chip chip-success">Total: ${money(
      total
    )}</div></div>
  `;
}

function renderList() {
  const list = $("#salesList");
  const ventas = store.resumen?.ventas || [];
  if (!ventas.length) {
    list.innerHTML = `
      <div class="empty-state text-center py-5" id="emptyState">
        <div class="emoji-display mb-2">🧮</div>
        <p class="text-secondary mb-1">Aún no hay ventas este mes.</p>
        <p class="text-secondary">Toca <strong>+</strong> para registrar la primera.</p>
      </div>`;
    return;
  }
  list.innerHTML = ventas
    .map((v, i) => {
      // Recalcular por visibilidad (ya viene calculado en resumen)
      const q1 = v.q1,
        q2 = v.q2,
        total = v.total;
      const bancoTxt =
        v.pago === "CREDITO"
          ? ` — Crédito (${
              v.banco === "OTRO" ? v.otroBancoNombre || "Otro banco" : v.banco
            })`
          : " — Contado";
      const segTxt = `${v.seguroAnios} años ${money(getSeguroValInline(v))}`;
      const garTxt = `${v.garantiaAnios} años ${money(
        getGarantiaValInline(v)
      )}`;
      const acc10 = Math.round((v.accesoriosMonto || 0) * 0.1);

      return `
      <div class="card-sale">
        <div class="d-flex justify-content-between align-items-start">
          <div class="title">${v.modeloVisual}${bancoTxt}</div>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-primary" data-action="edit" data-index="${i}">✎</button>
            <button class="btn btn-danger" data-action="del" data-index="${i}">🗑</button>
          </div>
        </div>
        <div class="meta mt-2">
          Seguro: ${segTxt} &nbsp; | &nbsp; Garantía: ${garTxt}
        </div>
        <div class="meta">
          Accesorios: ${money(v.accesoriosMonto || 0)} → 10% ${money(
        acc10
      )} &nbsp; | &nbsp; Bonos: ${money(
        (v.bonoAdicional || 0) + (v.bonoDemo || 0)
      )}
        </div>
        ${(() => {
          const tramo = store.resumen?.tramo || "1-4";
          const veh = getVehiculoComision(v.modeloReal, tramo, tablas);
          const fin = getFinanciamientoComision(
            v.modeloReal,
            v.pago,
            v.banco,
            tablas
          );
          return `<div class=\"meta\">Q1: Vehículo: ${money(
            veh
          )} &nbsp; | &nbsp; Financiamiento: ${money(fin)}</div>`;
        })()}
        ${v.nota ? `<div class="meta">Nota: ${v.nota}</div>` : ""}
        <div class="mt-1 fw-semibold">Q1 ${money(
          q1
        )} &nbsp; | &nbsp; Q2 ${money(q2)} &nbsp; | &nbsp; Total ${money(
        total
      )}</div>
      </div>
    `;
    })
    .join("");

  // Bind actions
  list.querySelectorAll('[data-action="del"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-index"));
      deleteVenta(idx);
      render();
      toast("Venta eliminada");
    });
  });
  list.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-index"));
      openEdit(idx);
    });
  });
}

function getSeguroValInline(v) {
  const key = v.modeloReal.toUpperCase();
  const isHEV = key.includes("HEV");
  const norm = (function normalize(m) {
    if (m.startsWith("BR-")) return "BRV";
    if (m.startsWith("HR-")) return "HRV";
    if (m.startsWith("CR-")) return isHEV ? "CRV HEV" : "CRV";
    if (m.includes("HEV")) {
      if (m.includes("CIVIC")) return "CIVIC HEV";
      if (m.includes("ACCORD")) return "ACCORD HEV";
    }
    return m;
  })(key);
  const tbl =
    tablas.seguros?.seguros?.[norm] ||
    tablas.seguros?.seguros?.[norm.replace(" HEV", "")] ||
    {};
  return tbl[String(v.seguroAnios)] || 0;
}
function getGarantiaValInline(v) {
  const key = v.modeloReal.toUpperCase();
  const isHEV = key.includes("HEV");
  const norm = (function normalize(m) {
    if (m.startsWith("BR-")) return "BRV";
    if (m.startsWith("HR-")) return "HRV";
    if (m.startsWith("CR-")) return isHEV ? "CRV HEV" : "CRV";
    if (m.includes("HEV")) {
      if (m.includes("CIVIC")) return "CIVIC HEV";
      if (m.includes("ACCORD")) return "ACCORD HEV";
    }
    return m;
  })(key);
  const tbl =
    tablas.garantias?.garantias?.[norm] ||
    tablas.garantias?.garantias?.[norm.replace(" HEV", "")] ||
    {};
  return tbl[String(v.garantiaAnios)] || 0;
}

function render() {
  // Recalcular resumen por si cambió el número de ventas/tramo
  recalc();
  renderChips();
  renderList();
}

// ===== Editar =====
let currentEditIndex = null;
function openEdit(index) {
  currentEditIndex = index;
  const v = store.ventas[index];
  const modalEl = document.getElementById("modalSale");
  const bsModal = new bootstrap.Modal(modalEl);

  // Fill form
  el("selModelo").value = v.modeloReal;
  fillVersiones(v.modeloReal);
  el("selVersion").value = v.version;
  if (v.pago === "CREDITO") {
    el("pagoCredito").checked = true;
    el("pagoContado").checked = false;
    el("bancosWrap").hidden = false;
    el("selBanco").value = v.banco || "HONDA FINANCE";
    el("otroBancoWrap").hidden = !(v.banco === "OTRO");
    el("otroBancoNombre").value = v.otroBancoNombre || "";
  } else {
    el("pagoCredito").checked = false;
    el("pagoContado").checked = true;
    el("bancosWrap").hidden = true;
    el("otroBancoWrap").hidden = true;
  }
  el("selSeguroAnios").value = String(v.seguroAnios || 0);
  el("selGarantiaAnios").value = String(v.garantiaAnios || 0);
  el("montoAccesorios").value = String(v.accesoriosMonto || 0);
  el("montoBono").value = String(v.bonoAdicional || 0);
  el("montoDemo").value = String(v.bonoDemo || 0);
  el("notaVenta").value = v.nota || "";
  refreshDynamicPrices();
  el("accesoriosComision").textContent = `10% = ${money(
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

// Abrir modal en modo "nuevo"
document.getElementById("btnAdd").addEventListener("click", () => {
  currentEditIndex = null;
  resetForm();
});

// ===== Boot =====
boot();
