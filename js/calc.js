export function pickTier(tiers, count) {
  return (
    tiers.find((t) => count >= t.min && count <= t.max) ||
    tiers[tiers.length - 1]
  );
}

export function money(n) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export function buildVehicleMap(data) {
  const map = new Map();
  Object.entries(data.vehicles).forEach(([k, v]) => map.set(k, v));
  return map;
}

export function computePreview(versionKey, type, bank, tierId, vehicles) {
  const v = vehicles.get(versionKey);
  if (!v) return { base: 0, bonus: 0, subtotal: 0 };
  const base = v.commissions[tierId] ?? 0;
  const bonus = type === "credito" ? v.finance_bonus[bank] ?? 0 : 0;
  return { base, bonus, subtotal: base + bonus };
}

export function computeTotalsForMonth(
  sales,
  tiers,
  vehicles,
  retroactive = true
) {
  const count = sales.length;
  const tier = pickTier(tiers, count);
  let base = 0,
    bonus = 0;
  for (const s of sales) {
    const v = vehicles.get(s.versionKey);
    if (!v) continue;
    const b = v.commissions[tier.id] ?? 0; // retroactivo: usa tier global
    const f = s.type === "credito" ? v.finance_bonus[s.bank] ?? 0 : 0;
    base += b;
    bonus += f;
  }
  return { count, tier: tier.id, base, bonus, total: base + bonus };
}
