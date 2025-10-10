export function Header(){return `
<header class="app-header border-bottom sticky-top">
  <div class="container-fluid d-flex align-items-center justify-content-between py-2">
    <div class="d-flex align-items-center gap-2">
      <div class="logo-io">IO</div>
      <h1 class="h6 mb-0 fw-bold">ComisionesGO</h1>
    </div>
    <div class="d-flex align-items-center gap-2">
      <button class="btn btn-ghost p-1" id="prevMonth" aria-label="Mes anterior"><span class="material-symbols-rounded">chevron_left</span></button>
      <div id="activeMonth" class="text-secondary small"></div>
      <button class="btn btn-ghost p-1" id="nextMonth" aria-label="Mes siguiente"><span class="material-symbols-rounded">chevron_right</span></button>
      <button class="btn btn-ghost p-1" data-bs-toggle="offcanvas" data-bs-target="#menuDrawer" aria-label="Menú"><span class="material-symbols-rounded">menu</span></button>
    </div>
  </div>
</header>`;}