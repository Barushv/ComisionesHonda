export function ModalSale(){return `
<div class="modal fade" id="modalSale" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Nueva venta</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>
      <div class="modal-body">
        <form id="saleForm" class="vstack gap-3">
          <div>
            <label class="form-label">Vehículo</label>
            <div class="row g-2">
              <div class="col-md-6">
                <select id="selModelo" class="form-select" required>
                  <option value="" selected disabled>Selecciona modelo</option>
                  <option>CITY</option><option>BR-V</option><option>HR-V</option>
                  <option>CIVIC</option><option>ACCORD</option><option>CR-V</option><option>CR-V HEV</option>
                  <option>PILOT</option><option>ODYSSEY</option>
                </select>
              </div>
              <div class="col-md-6">
                <select id="selVersion" class="form-select" required>
                  <option value="" selected disabled>Selecciona versión</option>
                </select>
              </div>
            </div>
            <div class="form-text">La comisión base por vehículo no cambia por versión (salvo HEV en financiamiento).</div>
          </div>

          <div>
            <label class="form-label">Forma de pago</label>
            <div class="row g-2 align-items-center">
              <div class="col-auto">
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" name="pago" id="pagoContado" value="CONTADO" required>
                  <label class="form-check-label" for="pagoContado">Contado</label>
                </div>
              </div>
              <div class="col-auto">
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" name="pago" id="pagoCredito" value="CREDITO" required>
                  <label class="form-check-label" for="pagoCredito">Crédito</label>
                </div>
              </div>
              <div class="col-12 col-md-6" id="bancosWrap" hidden>
                <select id="selBanco" class="form-select mt-2 mt-md-0">
                  <option selected value="HONDA FINANCE">Honda Finance</option>
                  <option value="BANORTE">Banorte</option>
                  <option value="SANTANDER">Santander</option>
                  <option value="OTRO">Otro banco…</option>
                </select>
              </div>
              <div class="col-12" id="otroBancoWrap" hidden>
                <input id="otroBancoNombre" type="text" class="form-control" placeholder="Nombre del banco" />
                <div class="form-text">Si es “Otro banco”, financiamiento = $0 (solo paga vehículo).</div>
              </div>
            </div>
          </div>

          <div>
            <label class="form-label">Seguro</label>
            <div class="row g-2 align-items-center">
              <div class="col-auto">
                <select id="selSeguroAnios" class="form-select">
                  <option value="0">0 años (sin seguro)</option>
                  <option value="1">1 año</option><option value="2">2 años</option>
                  <option value="3">3 años</option><option value="4">4 años</option>
                  <option value="5">5 años</option><option value="6">6 años</option>
                </select>
              </div>
              <div class="col-auto text-secondary" id="seguroMonto">$0</div>
            </div>
          </div>

          <div>
            <label class="form-label">Garantía extendida</label>
            <div class="row g-2 align-items-center">
              <div class="col-auto">
                <select id="selGarantiaAnios" class="form-select">
                  <option value="0">0 años (sin garantía)</option>
                  <option value="1">1 año</option><option value="2">2 años</option>
                  <option value="3">3 años</option><option value="4">4 años</option>
                </select>
              </div>
              <div class="col-auto text-secondary" id="garantiaMonto">$0</div>
            </div>
          </div>

          <div>
            <label class="form-label">Accesorios</label>
            <div class="row g-2 align-items-center">
              <div class="col-md-6">
                <input id="montoAccesorios" type="number" min="0" step="1" class="form-control" placeholder="$ total accesorios" />
              </div>
              <div class="col-auto text-secondary" id="accesoriosComision">10% = $0</div>
            </div>
          </div>

          <div class="row g-2">
            <div class="col-md-6">
              <label class="form-label">Bono adicional</label>
              <input id="montoBono" type="number" min="0" step="1" class="form-control" placeholder="$" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Bono demo</label>
              <input id="montoDemo" type="number" min="0" step="1" class="form-control" placeholder="$" />
            </div>
          </div>

          <div>
            <label class="form-label">Nota</label>
            <input id="notaVenta" type="text" maxlength="140" class="form-control" placeholder="Hasta 140 caracteres" />
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline-light" data-bs-dismiss="modal">Cancelar</button>
        <button class="btn btn-primary" id="btnGuardarVenta">Guardar</button>
      </div>
    </div>
  </div>
</div>`;}