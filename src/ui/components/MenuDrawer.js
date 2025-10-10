export function MenuDrawer(){return `
<div class="offcanvas offcanvas-end app-drawer" tabindex="-1" id="menuDrawer">
  <div class="offcanvas-header">
    <h5 class="offcanvas-title">Menú</h5>
    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
  </div>
  <div class="offcanvas-body">
    <div class="list-group list-group-flush">
      <button class="list-group-item list-group-item-action bg-transparent" data-view="settings"><span class="material-symbols-rounded me-2">tune</span>Ajustes de comisiones</button>
      <button class="list-group-item list-group-item-action bg-transparent" data-view="export"><span class="material-symbols-rounded me-2">list_alt</span>Exportación</button>
      <button class="list-group-item list-group-item-action bg-transparent" data-bs-toggle="modal" data-bs-target="#aboutModal"><span class="material-symbols-rounded me-2">info</span>Acerca de</button>
    </div>
  </div>
</div>`;}