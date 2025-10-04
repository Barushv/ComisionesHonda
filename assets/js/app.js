import { setData, setAddons, setMonth, bindDialogs, render } from './ui.js';

(async () => {
  const [catalog, addons] = await Promise.all([
    fetch('assets/data/commissions.json').then(r=>r.json()),
    fetch('assets/data/addons.json').then(r=>r.json())
  ]);

  setData(catalog);
  setAddons(addons);

  const now = new Date();
  const yyyyMM = now.toISOString().slice(0,7);
  setMonth(yyyyMM);
  document.getElementById('currentMonth').textContent = new Intl.DateTimeFormat('es-MX', { month:'long', year:'numeric' }).format(now);

  bindDialogs();
  await render();

  document.getElementById('shareBtn').addEventListener('click', async ()=>{
    const sales = window.SALES_FOR_EXPORT || [];
    let totalQ1=0,totalQ2=0,grandTotal=0;
    sales.forEach(s=>{ totalQ1 += (s.q1VentaMonto||0)+(s.q1FinancMonto||0); totalQ2 += (s.q2SeguroMonto||0)+(s.q2GarantiaMonto||0)+(s.q2AccesorioMonto||0)+(s.q2IncentivosMonto||0); });
    grandTotal = totalQ1 + totalQ2;
    const { shareXlsxOrDownload } = await import('./export.js');
    await shareXlsxOrDownload(sales, { totalQ1, totalQ2, grandTotal }, `comisiones_${yyyyMM}.xlsx`);
  });

  document.getElementById('addSaleBtn').addEventListener('click', ()=>{
    document.getElementById('saleDialog').showModal();
  });

  document.getElementById('clearAllBtn').addEventListener('click', async ()=>{
    const { clearAll } = await import('./store.js');
    if(confirm('¿Borrar TODAS las ventas del mes?')){
      await clearAll();
      await render();
    }
  });

  if ('serviceWorker' in navigator) {
    try { navigator.serviceWorker.register('service-worker.js'); } catch(e) {}
  }
})();
