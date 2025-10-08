// src/core/router.js
export function formatMonth(date = new Date()) {
  // Devuelve 'Octubre 2025' en ES-MX
  return new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(date)
    .replace(/^\w/, c => c.toUpperCase());
}
