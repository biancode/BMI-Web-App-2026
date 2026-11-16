const tableBody = document.querySelector("#bmi-table-body");
const message = document.querySelector("#message");
const display = (value) => value === undefined || value === null || value === '' ? '–' : value;
function addCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = display(value);
  row.appendChild(cell);
}
async function render() {
  tableBody.replaceChildren();
  message.textContent = 'Daten werden geladen …';
  try {
    const entries = await BmiStorage.getEntries();
    message.textContent = entries.length ? '' : 'Noch keine Einträge vorhanden.';
    entries.forEach((entry) => {
      const row = document.createElement('tr');
      const date = new Date(entry.createdAt);
      [entry.id, entry.name || entry.username,
        entry.heightCm ? `${entry.heightCm} cm` : '–', `${entry.weightKg} kg`,
        entry.bmi != null && Number.isFinite(Number(entry.bmi)) ? Number(entry.bmi).toFixed(2) : '–',
        entry.category, Number.isNaN(date.getTime()) ? '–' : date.toLocaleString('de-DE')]
        .forEach((value) => addCell(row, value));
      tableBody.appendChild(row);
    });
  } catch (error) {
    message.textContent = `Laden fehlgeschlagen: ${error.message}`;
  }
}
window.addEventListener('storage', render);
render();
