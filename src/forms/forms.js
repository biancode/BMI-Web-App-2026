const weightForm = document.querySelector('#weight-form');
const weightInput = document.querySelector('#weight');
const weightResult = document.querySelector('#weight-result');

async function postWeight(weight) {
  const request = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weight }),
  };

  // Stub: Später durch fetch('/api/weights', request) ersetzen.
  console.log('POST /api/weights (Stub)', request);
  return { ok: true };
}

weightForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!weightForm.reportValidity()) return;

  try {
    const response = await postWeight(weightInput.valueAsNumber);
    if (!response.ok) throw new Error('POST fehlgeschlagen');
    weightResult.textContent = 'POST simuliert – Gewicht noch nicht gespeichert.';
  } catch {
    weightResult.textContent = 'Gewicht konnte nicht gesendet werden.';
  }
});

weightInput.addEventListener('input', () => {
  weightResult.textContent = '';
});
