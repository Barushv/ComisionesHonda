export function ModalSale(){return `
<div class="modal fade" id="modalSale" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Nueva venta</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>
      <div class="modal-body">
        <form id="saleForm" class="vstack gap-3"></form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline-light" data-bs-dismiss="modal">Cancelar</button>
        <button class="btn btn-primary" id="btnGuardarVenta">Guardar</button>
      </div>
    </div>
  </div>
</div>`;}