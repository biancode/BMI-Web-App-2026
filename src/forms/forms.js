const weightForm = document.querySelector('#weight-form');
const weightInput = document.querySelector('#weight');
const weightResult = document.querySelector('#weight-result');

weightForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!weightForm.reportValidity()) return;

  try {
    await BmiStorage.saveWeight(weightInput.valueAsNumber);
    weightResult.textContent = 'Gewicht gespeichert – du findest es in der Tabelle.';
  } catch (error) {
    weightResult.textContent = `Speichern fehlgeschlagen: ${error.message}`;
  }
});

weightInput.addEventListener('input', () => {
  weightResult.textContent = '';
});
