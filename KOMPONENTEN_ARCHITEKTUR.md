# Architekturanalyse & Best Practices: Komponenten-Laden in Vanilla HTML/JavaScript

Dieses Dokument analysiert die bestehende Implementierung in `index.html`, bewertet das Laden von Unterseiten via `<iframe>`, beleuchtet architektonische Kernaspekte für Webanwendungen und zeigt moderne, native Alternativen in Plain HTML & Vanilla JavaScript ohne Frameworks auf.

---

## 1. Überprüfung der aktuellen `index.html`

### 1.1 Aktuelle Implementierung
In der `index.html` wird die Navigation über Inline-Click-Handler gelöst, die eine Funktion `LoadPage(url)` aufrufen:
```javascript
function LoadPage(url) {
    document.getElementById("custom-body").innerHTML = `
        <div>
            <iframe style="width: 100%; height: 50vh" src="${url}"></iframe>
        </div>
    `;
}
```

### 1.2 Bewertung: Ist die Vorgehensweise gut?
**Kurzes Fazit:** Für eine professionelle, responsive und erweiterbare Webanwendung ist das Laden von Hauptkomponenten/Seitenbereichen über `<iframe>` **nicht empfehlenswert**.

#### Vorteile des aktuellen Ansatzes (oberflächlich)
* **Vollständige Kapselung:** Jede Unterseite (`dashboard.html`, `forms.html`, `settings.html`) ist ein eigenständiges HTML-Dokument mit eigener CSS- und Script-Isolation.
* **Einfache Implementierung:** Kein Parsing oder Routing-Code notwendig; der Browser übernimmt das Laden und Rendern der Ziel-URL.

#### Nachteile und Risiken von iframes
1. **Performance & Ressourcen-Overhead:**
   * Jeder `<iframe>` erzeugt einen vollständig isolierten Browserkontext (`window`, `document`, DOM-Baum, Rendering-Kontext).
   * Gemeinsame Bibliotheken (z. B. Tailwind CSS, Chart.js) werden bei jedem Wechsel neu angefordert, geparst und ausgeführt.
2. **Layout & Responsivität:**
   * Durch feste Angaben wie `height: 50vh` entstehen Darstellungsfehler oder unschöne doppelte Scrollbalken (*Scroll-in-Scroll*), wenn der Inhalt höher oder dynamisch ist.
3. **Kommunikation & State Sharing (Zustandsteilung):**
   * Daten (z. B. eingegebenes Gewicht, Berechnungen, Benutzereinstellungen) können nicht einfach über JavaScript-Variablen oder State-Stores geteilt werden. Man müsste auf fehleranfällige Mechanismen wie `window.postMessage` oder `window.parent` zurückgreifen.
4. **Browser-Historie, URLs & Deep Linking:**
   * Die URL in der Adressleiste ändert sich nicht (`/index/index.html`). Vor-/Zurück-Navigation im Browser führt oft zu unerwartetem Verhalten. Unterseiten können nicht direkt verlinkt oder als Lesezeichen gespeichert werden.
5. **Barrierefreiheit (Accessibility / A11y):**
   * Screenreader und Tastaturnavigation werden durch Framing-Hierarchien fragmentiert.
6. **Code-Qualität & Semantik im Markup:**
   * Das Tag `<custom-body>` ist kein valides HTML5-Element und nicht als Web Component registriert.
   * `href="#" onclick="...; return false;"` ist semantisch ungünstig für Screenreader und Suchmaschinen.

---

## 2. Architektonische Best Practices für Vanilla JS

Wenn eine Anwendung modular und ohne schwere Frameworks (wie React, Vue, Angular) entwickelt werden soll, sollten folgende Architektur-Konzepte beachtet werden:

### 2.1 Single Page Application (SPA) Routing & History API
* **Hash-Routing (`#/dashboard`, `#/forms`)** oder **History API (`history.pushState`)**:
  * Ermöglicht saubere URLs, Vor-/Zurück-Navigation im Browser und direktes Bookmarken/Neu-Laden einer Unterseite.
* Synchronisiert die Navigationsleiste (aktiver Menüpunkt) mit der aktuellen Ansicht.

### 2.2 Lifecycle Management (Mounten & Unmounten)
* Komponenten müssen kontrolliert initialisiert (`mount` / `init`) und wieder aufgeräumt werden (`unmount` / `destroy`).
* **Wichtig zur Vermeidung von Memory Leaks:**
  * Event-Listener entfernen (`removeEventListener`).
  * Laufende Intervalle/Timer stoppen (`clearInterval`).
  * Chart-Instanzen freigeben (z. B. `chart.destroy()` in Chart.js).

### 2.3 Zentraler State & Event-Kommunikation
* Daten wie der aktuelle BMI-Wert, das Gewicht oder Einstellungen (z. B. metrische vs. imperiale Einheiten) sollten in einem zentralen Store oder State-Objekt gehalten werden.
* Komponenten kommunizieren über Events (z. B. native `CustomEvent` auf `window` oder ein einfaches Pub/Sub-Pattern).

### 2.4 CSS & Style Scoping
* Da ohne iframe alle Styles im selben Dokument liegen:
  * Einheitliche CSS-Klassen (z. B. über Tailwind CSS oder BEM-Methodik).
  * Oder Kapselung mittels **Shadow DOM** in Web Components.

---

## 3. Umsetzungsstrategien in Plain HTML & JavaScript (ohne iframe)

Es gibt drei bewährte Architekturen für Vanilla HTML/JS:

---

### Ansatz A: ES6 Modules & View Controllers (Empfohlener Standard)
Jede Seite/Komponente wird als JavaScript-Modul (`.js`) abgebildet, das HTML per Template-Literal zurückgibt und Lifecycle-Methoden bereitstellt.

#### 1. Komponente (z. B. `src/dashboard/dashboard.view.js`):
```javascript
export function renderDashboard() {
    return `
        <section class="p-6">
            <h1 class="text-2xl font-bold mb-4">Dashboard</h1>
            <div class="bg-white p-4 rounded shadow">
                <canvas id="myChart" width="400" height="200"></canvas>
            </div>
        </section>
    `;
}

let chartInstance = null;

export function initDashboard() {
    const ctx = document.getElementById('myChart');
    if (!ctx) return;

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai'],
            datasets: [{ label: 'BMI Verlauf', data: [24.5, 24.2, 23.9, 23.8, 23.5] }]
        }
    });
}

export function destroyDashboard() {
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
}
```

#### 2. Zentraler Router in `index.html` / `app.js`:
```javascript
const routes = {
    '/dashboard': () => import('../dashboard/dashboard.view.js'),
    '/forms': () => import('../forms/forms.view.js'),
    '/settings': () => import('../settings/settings.view.js')
};

let currentComponent = null;

async function navigate(path) {
    if (currentComponent && currentComponent.destroy) {
        currentComponent.destroy();
    }

    const loadRoute = routes[path] || routes['/dashboard'];
    const module = await loadRoute();

    const appContainer = document.getElementById('custom-body');
    appContainer.innerHTML = module.render();

    if (module.init) {
        module.init();
    }

    currentComponent = module;
    window.location.hash = path;
}

window.addEventListener('hashchange', () => {
    const path = window.location.hash.replace('#', '') || '/dashboard';
    navigate(path);
});

window.addEventListener('DOMContentLoaded', () => {
    const initialPath = window.location.hash.replace('#', '') || '/dashboard';
    navigate(initialPath);
});
```

---

### Ansatz B: Web Components / Custom Elements (Nativer Webstandard)
Der offizielle W3C-Standard für wiederverwendbare, gekapselte Komponenten im Browser.

#### 1. Definition der Komponente (`src/dashboard/bmi-dashboard.js`):
```javascript
class BmiDashboard extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <section class="p-4">
                <h2 class="text-xl font-bold">BMI Übersicht</h2>
                <canvas id="dashboardChart"></canvas>
            </section>
        `;
        this.initChart();
    }

    initChart() {
        const ctx = this.querySelector('#dashboardChart');
        this.chart = new Chart(ctx, { /* Config */ });
    }

    disconnectedCallback() {
        // Lifecycle-Aufräumarbeiten
        if (this.chart) {
            this.chart.destroy();
        }
    }
}

customElements.define('bmi-dashboard', BmiDashboard);
```

#### 2. Laden in `index.html`:
```html
<!-- Navigation -->
<button onclick="loadComponent('bmi-dashboard')">Dashboard</button>
<button onclick="loadComponent('bmi-forms')">Forms</button>

<div id="content-container"></div>

<script>
function loadComponent(tagName) {
    const container = document.getElementById('content-container');
    container.innerHTML = `<${tagName}></${tagName}>`;
}
</script>
```

---

### Ansatz C: Asynchrones HTML-Partial Fetching (Fetch API + DOM Injection)
HTML-Fragmente werden per `fetch()` nachgeladen und in einen Container gerendert.

```javascript
async function loadHtmlPartial(url, containerId) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const html = await response.text();
        const container = document.getElementById(containerId);
        container.innerHTML = html;

        // Scripte aus dem Fragment manuell ausführen (da innerHTML Scripts nicht automatisch ausführt)
        container.querySelectorAll("script").forEach(oldScript => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.textContent = oldScript.textContent;
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    } catch (error) {
        console.error("Fehler beim Laden:", error);
    }
}
```

---

## 4. Vergleich der Ansätze

| Kriterium | `<iframe>` (Aktuell) | HTML Fetching | ES6 Modules | Web Components |
| :--- | :--- | :--- | :--- | :--- |
| **Performance** | 🔴 Schlecht (Mehrfache DOMs & Runtimes) | 🟡 Mittel (Netzwerkanfragen) | 🟢 Sehr schnell (ESM Bundling / Cache) | 🟢 Sehr schnell |
| **State Sharing** | 🔴 Umständlich (`postMessage`) | 🟢 Sehr einfach (gleicher JS-Scope) | 🟢 Sehr einfach (Shared Stores) | 🟢 Sehr einfach (Events & Properties) |
| **Responsivität / Layout**| 🔴 Schwierig (feste Höhen / Scrollbars)| 🟢 Optimal (fließt im Hauptlayout) | 🟢 Optimal | 🟢 Optimal |
| **Lifecycle-Kontrolle** | 🔴 Nur über Document-Reload | 🟡 Begrenzt (Scripte müssen neu gebunden werden) | 🟢 Vollständig (`init` / `destroy`) | 🟢 Nativ (`connectedCallback` / `disconnectedCallback`) |
| **Code-Kapselung** | 🟢 Vollständig isoliert | 🔴 Keine Kapselung | 🟡 Modul-Scope | 🟢 Shadow DOM / Custom Elements |
| **Komplexität** | 🟢 Sehr gering | 🟡 Gering | 🟢 Gering bis Mittel | 🟡 Mittel |

---

## 5. Konkrete Empfehlung für die BMI Web App

1. **iframes entfernen:** Ersetzen Sie die `<iframe>`-Logik in `index.html` durch **ES6 Modules mit Router** (Ansatz A) oder **Web Components** (Ansatz B).
2. **HTML Semantik bereinigen:**
   * Ersetzen Sie `<custom-body>` durch ein valides semantisches `<main id="app-content">`.
   * Verwenden Sie standardkonforme Buttons oder echte Links mit Hash-Navigation (`<a href="#/dashboard">Dashboard</a>`).
3. **Zentrales Styling & Libraries:**
   * Binden Sie Tailwind CSS und Chart.js einmalig in der `index.html` (bzw. dem Bundle) ein, anstatt sie in jedem Unter-HTML redundant zu laden.
4. **Zustand zentralisieren:**
   * Halten Sie Messwerte und Einstellungen in einer zentralen Datei (z. B. `src/state/bmiState.js`), sodass Dashboard, Tabellen und Formulare auf denselben Datenbestand zugreifen können.
