window.BmiStorage = (() => {
  const key = 'bmi-tracker:';
  const mode = () => window.BmiAppSettings.storageMode === 'db' ? 'db' : 'local';
  const read = (name, fallback) => {
    const value = localStorage.getItem(key + name);
    return value === null ? fallback : JSON.parse(value);
  };
  const write = (name, value) => localStorage.setItem(key + name, JSON.stringify(value));
  async function request(path, method = 'GET', body) {
    const response = await fetch('/api' + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const error = new Error(`Datenbank-Anfrage fehlgeschlagen (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  async function getSettings() {
    return mode() === 'local' ? read('settings', {}) : (await request('/settings')) || {};
  }
  return {
    mode,
    getSettings,
    async saveSettings(settings) {
      if (mode() === 'local') write('settings', settings);
      else await request('/settings', 'PUT', settings);
    },
    async getEntries() {
      const entries = mode() === 'local' ? read('entries', []) : await request('/bmi');
      if (!Array.isArray(entries)) throw new Error('Ungültige Tabellendaten.');
      return entries;
    },
    async saveWeight(weight) {
      if (!Number.isFinite(weight) || weight <= 0) throw new Error('Bitte ein gültiges Gewicht eingeben.');
      if (mode() === 'db') return request('/weights', 'POST', { weight });
      const settings = await getSettings();
      const height = Number(settings.height);
      const bmi = height > 0 ? weight / ((height / 100) ** 2) : null;
      const entry = {
        ...settings,
        id: crypto.randomUUID(),
        name: settings.username || '',
        heightCm: height || null,
        weightKg: weight,
        bmi,
        category: bmi === null ? '–' : bmi < 18.5 ? 'Untergewicht' : bmi < 25 ? 'Normalgewicht' : bmi < 30 ? 'Übergewicht' : 'Adipositas',
        createdAt: new Date().toISOString(),
      };
      const entries = read('entries', []);
      entries.push(entry);
      write('entries', entries);
      return entry;
    },
    async changePassword(currentPassword, newPassword) {
      if (mode() === 'local') throw new Error('Passwortänderungen stehen nur im Datenbankmodus zur Verfügung.');
      return request('/password', 'POST', { currentPassword, newPassword });
    },
  };
})();
