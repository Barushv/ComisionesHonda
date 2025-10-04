export const db = new Dexie("hondago-commissions");
db.version(1).stores({
  sales: "id, mesClave, createdAt",
  meta: "&key"
});

export async function addSale(sale){ await db.sales.put(sale); }
export async function updateSale(id, doc){ await db.sales.put(doc); }
export async function deleteSale(id){ await db.sales.delete(id); }
export async function clearAll(){ await db.sales.clear(); }

export async function listByMonth(yyyyMM){ return db.sales.where('mesClave').equals(yyyyMM).sortBy('createdAt'); }
export async function countByMonth(yyyyMM){ return db.sales.where('mesClave').equals(yyyyMM).count(); }
