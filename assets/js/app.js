import { setData, setAddons, setMonth, bindDialogs, render, normalize } from './ui.js';

function ensureAboutDialog(){
  // Create dialog if missing
  let dlg = document.getElementById('aboutDialog');
  if (!dlg){
    dlg = document.createElement('dialog');
    dlg.id = 'aboutDialog';
    dlg.innerHTML = `
      <article style="max-width:560px">
        <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3 style="margin:0">Acerca de</h3>
          <button id="aboutCloseBtn" class="btn" type="button">Cerrar</button>
        </header>
        <div style="color:#cbd5e1;line-height:1.5">
          <p><strong>HondaGo · Comisiones</strong></p>
          <p>Desarrollador: <strong>Israel Ortiz (IO)</strong></p>
          <p>Versión: <span id="aboutVersion">v1.0</span></p>
          <p>Contacto: <a href="mailto:io@example.com">io@example.com</a></p>
        </div>
      </article>
    `;
    document.body.appendChild(dlg);
  }
  // Wire close
  const closeBtn = dlg.querySelector('#aboutCloseBtn');
  if (closeBtn && !closeBtn.dataset.bound){
    closeBtn.dataset.bound = '1';
    closeBtn.addEventListener('click', ()=> dlg.close());
  }
  // Close on cancel (Esc)
  dlg.addEventListener('cancel', (e)=>{ e.preventDefault(); dlg.close(); });
  return dlg;
}

function wireAbout(){
  const dlg = ensureAboutDialog();
  const btn = document.getElementById('aboutBtn');
  if (btn && !btn.dataset.bound){
    btn.dataset.bound = '1';
    btn.addEventListener('click', ()=> dlg.showModal());
  }
}

(async()=>{
  const [catalog, addons] = await Promise.all([
    fetch('assets/data/commissions.json').then(r=>r.json()),
    fetch('assets/data/addons.json').then(r=>r.json())
  ]);
  setData(catalog); setAddons(addons);

  const now = new Date();
  const yyyyMM = now.toISOString().slice(0,7);
  setMonth(yyyyMM);
  const el = document.getElementById('currentMonth');
  if (el) el.textContent = new Intl.DateTimeFormat('es-MX',{month:'long',year:'numeric'}).format(now);

  bindDialogs();
  wireAbout();        // asegura que el botón Acerca de funcione
  await render();
  await normalize?.();

  document.getElementById('shareBtn')?.addEventListener('click', async ()=>{
    const sales=window.SALES_FOR_EXPORT||[]; let totalQ1=0,totalQ2=0;
    sales.forEach(s=>{ totalQ1+=(s.q1VentaMonto||0)+(s.q1FinancMonto||0); totalQ2+=(s.q2SeguroMonto||0)+(s.q2GarantiaMonto||0)+(s.q2AccesorioMonto||0)+(s.q2IncentivosMonto||0); });
    const grandTotal=totalQ1+totalQ2;
    const { shareXlsxOrDownload } = await import('./export.js');
    await shareXlsxOrDownload(sales,{ totalQ1,totalQ2,grandTotal },`comisiones_${yyyyMM}.xlsx`);
  });

  document.getElementById('clearAllBtn')?.addEventListener('click', async ()=>{
    const { clearAll } = await import('./store.js');
    if (confirm('¿Borrar TODAS las ventas del mes?')){
      await clearAll(); await render();
    }
  });

  if ('serviceWorker' in navigator){
    try{ navigator.serviceWorker.register('service-worker.js'); }catch(e){}
  }
})();