export async function shareXlsxOrDownload(sales, totals, filename){
  return buildAndShareXlsx(sales, totals, filename);
}

export async function buildAndShareXlsx(sales, totals, filename){
  const rows = [
    ["Fecha","Versión","Tipo","Tramo","Q1 Venta","Q1 Financ.","Q2 Seg","Q2 Gar","Q2 Acc 10%","Q2 Incentivos","Total"]
  ];
  for(const s of sales){
    rows.push([s.fecha, s.version, s.esCredito?"Crédito":"Contado", s.tramo,
      s.q1VentaMonto, s.q1FinancMonto, s.q2SeguroMonto, s.q2GarantiaMonto, s.q2AccesorioMonto, s.q2IncentivosMonto, s.total
    ]);
  }
  rows.push([]);
  rows.push(["Totales","","","", totals.totalQ1, "", "", "", "", totals.totalQ2, totals.grandTotal]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Comisiones");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

  const blob = new Blob([wbout], {type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});

  const file = new File([blob], filename);
  if(navigator.canShare && navigator.canShare({ files: [file] })){
    try{ await navigator.share({ files: [file] }); return { shared: true }; }catch(e){}
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 3000);
  return { shared: false };
}
