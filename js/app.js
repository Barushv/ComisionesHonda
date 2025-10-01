// /js/app.js
import { setData, setAddons, setMonth, refreshList, bindDialogs, toast } from "./ui.js";
import { shareXlsxOrDownload } from "./export.js";

(async function init() {
  // === Mes por defecto ===
  const monthInput = document.getElementById("monthPicker");
  const today = new Date();
  const m = today.toISOString().slice(0, 7);
  if (monthInput) {
    monthInput.value = m;
    setMonth(m);
    monthInput.addEventListener("change", async () => {
      setMonth(monthInput.value);
      await refreshList();
    });
  }

  // === Cargar commissions.json (BASE + bonos por banco) ===
  let data;
  try {
    const resp = await fetch("data/commissions.json", { cache: "no-store" });
    if (!resp.ok) throw new Error("No se encontró data/commissions.json");
    data = await resp.json();
  } catch (e) {
    alert("No se pudo cargar data/commissions.json.\nVerifica la ruta y el archivo.");
    throw e;
  }
  setData(data);

  // === PASO 3.B: Cargar addons.json (seguros, garantías, accesorios %) ===
  let addons;
  try {
    const resp2 = await fetch("data/addons.json", { cache: "no-store" });
    if (!resp2.ok) throw new Error("No se encontró data/addons.json");
    addons = await resp2.json();
  } catch (e) {
    alert("No se pudo cargar data/addons.json.\nVerifica la ruta y el archivo.");
    throw e;
  }
  setAddons(addons);

  // UI
  bindDialogs();
  await refreshList();

  // Un solo handler para COMPARTIR (con fallback a descarga)
  async function handleShare() {
    const totals = await refreshList(); // asegurar totales al día
    const sales = window.SALES_FOR_EXPORT || window.SALES_CACHE || [];
    // ventas del mes actual
    const month = monthInput ? monthInput.value : new Date().toISOString().slice(0, 7);
    const filename = `Comisiones_${month}.xlsx`;

    try {
      const res = await shareXlsxOrDownload(sales, totals, filename);
      if (res.shared) toast("Compartido 👍");
      else toast("Descargado 📥");
    } catch (e) {
      toast("No se pudo compartir. Intentando descarga…");
    }
  }

  // Botones (ambos apuntan al mismo flujo de compartir)
  const shareBtn = document.getElementById("shareBtn");
  const exportBtn = document.getElementById("exportXlsxBtn");
  if (shareBtn) shareBtn.onclick = handleShare;
  if (exportBtn) exportBtn.onclick = handleShare;

  // Opción 1: SIN backend de correo → ocultamos botón "Enviar correo" si existe
  const sendEmailBtn = document.getElementById("sendEmailBtn");
  if (sendEmailBtn) sendEmailBtn.style.display = "none";

  // Service Worker (ruta relativa para Live Server o subcarpeta)
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
      navigator.serviceWorker.addEventListener("message", (ev) => {
        if (ev.data === "UPDATE_AVAILABLE") {
          const banner = document.getElementById("updateBanner");
          if (banner) banner.classList.remove("hidden");
        }
      });
      const reloadBtn = document.getElementById("reloadBtn");
      if (reloadBtn) reloadBtn.onclick = () => location.reload();
    } catch (e) {
      // si falla el SW, no bloquea la app
    }
  }
})();
