// Datos de comisiones
const comisiones = {
  CITY: { "1-4": 2350, "5-7": 2700, "8-10": 2800, "11+": 2900 },
  BRV: { "1-4": 2500, "5-7": 3000, "8-10": 3100, "11+": 3200 },
  HRV: { "1-4": 2600, "5-7": 3200, "8-10": 3300, "11+": 3350 },
  CIVIC: { "1-4": 3100, "5-7": 3800, "8-10": 3900, "11+": 3950 },
  CRV: { "1-4": 3600, "5-7": 4500, "8-10": 4600, "11+": 4650 },
  ACCORD: { "1-4": 3600, "5-7": 4500, "8-10": 4600, "11+": 4650 },
  PILOT: { "1-4": 5600, "5-7": 6500, "8-10": 7000, "11+": 7450 },
  ODYSSEY: { "1-4": 5600, "5-7": 6500, "8-10": 7000, "11+": 7450 },
  "CRV HEV": { "1-4": 4500, "5-7": 5000, "8-10": 5100, "11+": 5200 },
  "ACCORD HEV": { "1-4": 4500, "5-7": 5000, "8-10": 5100, "11+": 5200 },
};

// Variable para llevar el total de comisiones
let totalComision = 0;

// Función para calcular la comisión
function calcularComision(nivelUnidades, tipoAuto) {
  return comisiones[tipoAuto][nivelUnidades];
}

// Función para agregar una fila a la tabla
function agregarFilaATabla(auto, nivel, comision) {
  const tableBody = document
    .getElementById("resultTable")
    .querySelector("tbody");
  const nuevaFila = document.createElement("tr");

  const celdaAuto = document.createElement("td");
  celdaAuto.textContent = auto;
  nuevaFila.appendChild(celdaAuto);

  const celdaNivel = document.createElement("td");
  celdaNivel.textContent = nivel;
  nuevaFila.appendChild(celdaNivel);

  const celdaComision = document.createElement("td");
  celdaComision.textContent = `$${comision.toFixed(2)}`;
  nuevaFila.appendChild(celdaComision);

  const celdaAccion = document.createElement("td");
  const botonEliminar = document.createElement("button");
  botonEliminar.textContent = "Eliminar";
  botonEliminar.className = "btn btn-danger";
  botonEliminar.addEventListener("click", () =>
    eliminarFila(nuevaFila, comision)
  );
  celdaAccion.appendChild(botonEliminar);
  nuevaFila.appendChild(celdaAccion);

  tableBody.appendChild(nuevaFila);

  // Actualizar el total de comisiones
  totalComision += comision;
  document.getElementById(
    "totalComision"
  ).textContent = `Total Comisión: $${totalComision.toFixed(2)}`;
}

// Función para eliminar una fila de la tabla
function eliminarFila(fila, comision) {
  fila.remove();
  totalComision -= comision;
  document.getElementById(
    "totalComision"
  ).textContent = `Total Comisión: $${totalComision.toFixed(2)}`;
}

// Función para exportar la tabla a PDF
function exportarTablaPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Calculadora de Comisiones", 10, 10);

  const table = document.getElementById("resultTable");
  const rows = table.querySelectorAll("tbody tr");

  let yPosition = 20;

  rows.forEach((row, index) => {
    const cells = row.querySelectorAll("td");
    const rowData = [];
    cells.forEach((cell) => {
      rowData.push(cell.textContent);
    });
    doc.text(rowData.join(" "), 10, yPosition + index * 10);
  });

  doc.text(
    `Total Comisión: $${totalComision.toFixed(2)}`,
    10,
    yPosition + rows.length * 10 + 10
  );

  doc.save("comisiones.pdf");
}

// Evento para el botón de cálculo
document.getElementById("calculateButton").addEventListener("click", () => {
  const tipoAuto = document.getElementById("carSelect").value;
  const nivelUnidades = document.getElementById("unitsSoldLevel").value;
  const comision = calcularComision(nivelUnidades, tipoAuto);

  agregarFilaATabla(tipoAuto, nivelUnidades, comision);
});

// Evento para el botón de exportar
document
  .getElementById("exportButton")
  .addEventListener("click", exportarTablaPDF);
