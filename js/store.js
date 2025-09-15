// IndexedDB con Dexie
const db = new Dexie("commissions_db");
db.version(1).stores({
  sales: "++id, month, versionKey, type, bank, createdAt",
});

export async function addSale(sale) {
  return db.sales.add(sale);
}
export async function getSalesByMonth(month) {
  return db.sales.where("month").equals(month).toArray();
}
export async function deleteSale(id) {
  return db.sales.delete(id);
}
export async function allMonths() {
  return db.sales.orderBy("month").uniqueKeys();
}
