import { init, store, clearAll } from './src/core/state.js';
import { formatMonth } from './src/core/router.js';
import { Header } from './src/ui/components/Header.js';
import { TabBar } from './src/ui/components/TabBar.js';
import { MenuDrawer } from './src/ui/components/MenuDrawer.js';
import { AboutModal } from './src/ui/components/AboutModal.js';
import { Home } from './src/ui/views/Home.js';
import { toast } from './src/ui/components/Toast.js';
import { exportXLSX } from './src/services/export-xlsx.js';

if('serviceWorker' in navigator){window.addEventListener('load',async()=>{try{await navigator.serviceWorker.register('./service-worker.js');}catch(e){}})}

const $=(s)=>document.querySelector(s);

function renderShell(){
  document.body.innerHTML = `
    ${Header()}
    <main class="container-fluid py-3 app-main">
      <div class="row g-2 mb-3" id="summaryChips"></div>
      <div id="viewRoot"></div>
    </main>
    ${TabBar()}
    ${MenuDrawer()}
    ${AboutModal()}
    <div class="toast-container position-fixed bottom-0 end-0 p-3" id="toastArea"></div>
  `;
}

function renderHome(){
  $('#activeMonth').textContent = formatMonth(new Date());
  $('#viewRoot').innerHTML = Home({store,helpers:{money:(n)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n||0),veh:()=>0,fin:()=>0,seg:()=>0,gar:()=>0,acc10:()=>0}});
}

async function boot(){
  renderShell();
  await init(formatMonth(new Date()));
  renderHome();

  $('#btnExport').addEventListener('click',()=>exportXLSX());
  $('#btnClearAll').addEventListener('click',()=>{const ok=prompt('Para limpiar todo, escribe: LIMPIAR'); if(ok && ok.trim().toUpperCase()==='LIMPIAR'){clearAll(); renderHome(); toast('Datos limpiados.');}});
  document.getElementById('btnAdd').addEventListener('click',()=>toast('Abrir modal de venta (no incluido en este paquete estructural)'));
}

boot();
