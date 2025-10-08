import { SaleCard } from '../components/SaleCard.js';
export function Home({store,helpers}){
  const ventas = store.resumen?.ventas || [];
  if(!ventas.length){
    return `<div class="empty-state text-center py-5"><div class="emoji-display mb-2">🧮</div><p class="text-secondary mb-1">Aún no hay ventas este mes.</p><p class="text-secondary">Toca <strong>+</strong> para registrar la primera.</p></div>`;
  }
  return ventas.map((v,i)=>SaleCard(v,i,helpers)).join('');
}