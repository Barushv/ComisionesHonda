// /js/app.js
import { setData, setMonth, refreshList, bindDialogs, toast } from "./ui.js";
import { shareXlsxOrDownload } from "./export.js";

(async function init() {
  // Mes por defecto
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

  // Cargar data de comisiones (con alerta si falta el JSON)
  let data;
  try {
    const resp = await fetch("data/commissions.json", { cache: "no-store" });
    if (!resp.ok) throw new Error("No se encontró data/commissions.json");
    data = await resp.json();
  } catch (e) {
    alert(
      "No se pudo cargar data/commissions.json.\nVerifica la ruta y el archivo."
    );
    throw e;
  }
  setData(data);

  // UI
  bindDialogs();
  await refreshList();

  // Un solo handler para COMPARTIR (con fallback a descarga)
  async function handleShare() {
    const totals = await refreshList(); // asegura totales al día
    const sales = window.SALES_CACHE || []; // lista actual del mes
    const month = monthInput
      ? monthInput.value
      : new Date().toISOString().slice(0, 7);
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
      // si no se puede registrar, no interrumpe la app
    }
  }
})();
