import { setData, setAddons, setMonth, bindDialogs, render } from "./ui.js";

(async () => {
  // === Config básica / carga de catálogos ===
  const [catalog, addons] = await Promise.all([
    fetch("assets/data/commissions.json").then((r) => r.json()),
    fetch("assets/data/addons.json").then((r) => r.json()),
  ]);

  setData(catalog);
  setAddons(addons);

  const now = new Date();
  const yyyyMM = now.toISOString().slice(0, 7);
  setMonth(yyyyMM);
  document.getElementById("currentMonth").textContent = new Intl.DateTimeFormat(
    "es-MX",
    { month: "long", year: "numeric" }
  ).format(now);

  bindDialogs();
  await render();

  // === Exportar XLSX ===
  document.getElementById("shareBtn").addEventListener("click", async () => {
    const sales = window.SALES_FOR_EXPORT || [];
    let totalQ1 = 0,
      totalQ2 = 0,
      grandTotal = 0;
    sales.forEach((s) => {
      totalQ1 += (s.q1VentaMonto || 0) + (s.q1FinancMonto || 0);
      totalQ2 +=
        (s.q2SeguroMonto || 0) +
        (s.q2GarantiaMonto || 0) +
        (s.q2AccesorioMonto || 0) +
        (s.q2IncentivosMonto || 0);
    });
    grandTotal = totalQ1 + totalQ2;
    const { shareXlsxOrDownload } = await import("./export.js");
    await shareXlsxOrDownload(
      sales,
      { totalQ1, totalQ2, grandTotal },
      `comisiones_${yyyyMM}.xlsx`
    );
  });

  // === Abrir diálogo Registrar venta ===
  document.getElementById("addSaleBtn").addEventListener("click", () => {
    document.getElementById("saleDialog").showModal();
  });

  // === Limpiar todo ===
  document.getElementById("clearAllBtn").addEventListener("click", async () => {
    const { clearAll } = await import("./store.js");
    if (confirm("¿Borrar TODAS las ventas del mes?")) {
      await clearAll();
      await render();
    }
  });

  // === Service Worker ===
  if ("serviceWorker" in navigator) {
    try {
      navigator.serviceWorker.register("service-worker.js");
    } catch (e) {}
  }

  // ===========================================================
  //                  SECCIÓN "ACERCA DE"
  //  Soporta dos variantes sin romper:
  //  - Opción A/B: Modal/Bottom Sheet   -> #aboutBtn + #aboutDialog
  //  - Opción C:   Sección colapsable   -> #aboutToggleBtn + #aboutSection
  // ===========================================================

  // Versión centralizada (cámbiala cuando subas release)
  const APP_VERSION = "1.0.0";

  // Helper para setear versión si existe el span correspondiente
  function setAboutVersion(selector = "#aboutVersion") {
    const el = document.querySelector(selector);
    if (el) el.textContent = APP_VERSION;
  }

  // ---- Opción A/B: diálogo modal/bottom sheet ----
  const aboutBtn = document.getElementById("aboutBtn");
  const aboutDialog = document.getElementById("aboutDialog");
  const aboutCloseBtn = document.getElementById("aboutCloseBtn");

  if (aboutBtn && aboutDialog) {
    aboutBtn.addEventListener("click", () => {
      setAboutVersion(); // si existe #aboutVersion dentro del diálogo
      aboutDialog.showModal();
    });
  }
  if (aboutCloseBtn && aboutDialog) {
    aboutCloseBtn.addEventListener("click", () => aboutDialog.close());
  }

  // Cerrar con tecla ESC si el navegador no lo hace por defecto
  if (aboutDialog) {
    aboutDialog.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") aboutDialog.close();
    });
  }

  // ---- Opción C: sección colapsable en la misma página ----
  const aboutTglBtn = document.getElementById("aboutToggleBtn");
  const aboutSection = document.getElementById("aboutSection");

  if (aboutTglBtn && aboutSection) {
    // Inicializa versión si existe el span en la sección
    setAboutVersion();
    aboutTglBtn.addEventListener("click", () => {
      const hidden = aboutSection.classList.toggle("hidden");
      if (!hidden)
        aboutSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
})();
