export function SaleCard(v,i,helpers){const {money,veh,fin,seg,gar,acc10}=helpers;return `
<div class="card-sale">
  <div class="d-flex justify-content-between align-items-start">
    <div class="title">${v.modeloVisual}${v.pago==='CREDITO' ? ` — Crédito (${v.banco==='OTRO'?(v.otroBancoNombre||'Otro banco'):v.banco})` : ' — Contado'}</div>
    <div class="actions">
      <button class="icon-btn" data-action="edit" data-index="${i}" aria-label="Editar"><span class="material-symbols-rounded">edit</span></button>
      <button class="icon-btn icon-btn--danger" data-action="del" data-index="${i}" aria-label="Eliminar"><span class="material-symbols-rounded">delete</span></button>
    </div>
  </div>
  <div class="meta mt-2">Seguro: ${v.seguroAnios} años ${money(seg(v))} &nbsp; | &nbsp; Garantía: ${v.garantiaAnios} años ${money(gar(v))}</div>
  <div class="meta">Accesorios: ${money(v.accesoriosMonto||0)} → 10% ${money(acc10(v))} &nbsp; | &nbsp; Bonos: ${money((v.bonoAdicional||0)+(v.bonoDemo||0))}</div>
  <div class="meta">Q1: Vehículo: ${money(veh(v))} &nbsp; | &nbsp; Financiamiento: ${money(fin(v))}</div>
  ${v.nota ? `<div class="meta">Nota: ${v.nota}</div>` : ''}
  <div class="mt-1 fw-semibold">Q1 ${money(v.q1)} &nbsp; | &nbsp; Q2 ${money(v.q2)} &nbsp; | &nbsp; Total ${money(v.total)}</div>
</div>`;}