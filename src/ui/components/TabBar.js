export function TabBar(){return `
<nav class="app-tabbar border-top">
  <div class="container-fluid d-flex align-items-center justify-content-between py-2">
    <button class="tab-action" id="btnExport" aria-label="Exportar">
      <span class="material-symbols-rounded">ios_share</span><span>Exportar</span>
    </button>
    <button class="btn btn-primary btn-fab btn-fab--pill" id="btnAdd" data-bs-toggle="modal" data-bs-target="#modalSale" aria-label="Agregar venta">
      <span class="material-symbols-rounded">add</span>
    </button>
    <button class="tab-action tab-action--danger" id="btnClearAll" aria-label="Limpiar todo">
      <span class="material-symbols-rounded">delete_sweep</span><span>Limpiar</span>
    </button>
  </div>
</nav>`;}