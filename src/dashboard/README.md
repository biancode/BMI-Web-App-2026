# BMI Dashboard

## Überblick

Das **BMI Dashboard** dient als zentrale visuelle Übersicht für die BMI-Webanwendung. Es stellt wichtige Gesundheitsmetriken auf einen Blick dar, visualisiert den bisherigen BMI-Verlauf über interaktive Diagramme und listet die letzten Tracking-Einträge in einer übersichtlichen, responsiven Tabelle auf.

Das Dashboard fungiert sowohl als Standard-Startansicht innerhalb des Hauptanwendungs-Shells (`src/index/index.html`) als auch als eigenständige Seite für die Entwicklung.

---

## Funktionen

- **Wichtige Metriken & Statistik-Übersicht**:
  - **Aktueller BMI & Kategorie**: Hebt den aktuellen BMI-Wert zusammen mit einem automatischen Klassifizierungs-Badge (*Untergewicht*, *Normalgewicht*, *Übergewicht* oder *Adipositas*) hervor.
  - **Letztes Tracking-Datum & Anzahl**: Zeigt den Zeitstempel des neuesten Eintrags sowie die Gesamtzahl aller erfassten Tracking-Einträge an.
  - **Trendanalyse**: Zeigt an, ob der BMI *steigt* (*Increasing*), *sinkt* (*Decreasing*) oder *stabil* (*Stable*) ist, zusammen mit der Differenz zum vorherigen Datensatz.
- **Interaktives Verlaufsdiagramm**: Visualisiert den BMI-Verlauf über die Zeit mittels [Chart.js](https://www.chartjs.org/) mit responsiver Skalierung, anpassbaren Tooltips und dynamischen Achsenbegrenzungen.
- **Tabelle der letzten Messungen**: Chronologische Tabelle, welche die bisherigen Einträge absteigend nach Datum sortiert darstellt (mit Datum, berechnetem BMI, Kategorie und Gewicht).
- **Responsives Design**: Mobile-optimiertes Layout, ausgelegt für Desktop-Bildschirme und mobile Endgeräte.

---

## Dateistruktur

```
src/dashboard/
├── dashboard.html    # Layout- und DOM-Struktur für Statistiken, Diagramm und Tabelle
├── dashboard.js      # Datenmodelle, Stub-Services und DOM-Rendering-Logik
├── dashboard.css     # Komponenten-Styling, Grid-Layout, Cards und Kategorie-Badges
└── README.md         # Dokumentation der Komponente (diese Datei)
```

### Dateidetails & Zuständigkeiten

| Datei | Zweck |
| :--- | :--- |
| `dashboard.html` | Definiert die semantische HTML-Struktur: Header-Leiste, Statistik-Übersichts-Grid (`.stats-grid`), Container für das Diagramm (`#myChart`) und Tabelle für die letzten Einträge (`#recent-trackings-body`). Lädt `Chart.js` über CDN und bindet `dashboard.js` ein. |
| `dashboard.js` | Enthält die zentrale Client-Logik:<ul><li>`BmiTracking`: Datenklasse zur Kapselung einzelner Tracking-Einträge mit formatierten Daten, BMI-Rundung und Kategorieberechnung.</li><li>`BmiTrackingStubService`: Stellt Mock-/Beispieldaten für Tracking-Einträge bereit.</li><li>`renderOverviewStats(trackings)`: Berechnet und zeigt aktuelle Werte, Trends und die Anzahl der Einträge an.</li><li>`renderTrackingsTable(trackings)`: Erzeugt dynamische Tabellenzeilen für den Tracking-Verlauf.</li><li>`renderChart(trackings)`: Initialisiert und rendert das Chart.js-Liniendiagramm.</li><li>`initDashboard()`: Koordiniert die Initialisierung des Dashboards nach dem Laden des DOM und exportiert Funktionen für modulare/Testumgebungen.</li></ul> |
| `dashboard.css` | Implementiert das Scoped CSS für den Dashboard-Container, die Statistik-Karten, das Tabellen-Styling mit Zeilen-Hover-Effekten, farbcodierte Badges und responsive Media Queries (`max-width: 640px`). |

---

## Integration in die Hauptanwendung

Das Dashboard ist in das Anwendungsgerüst unter `src/index/index.html` integriert:
- Beim ersten Laden der Seite oder beim Klick auf den Navigationspunkt „Übersicht“ ruft `src/index/index.html` dynamisch `src/dashboard/dashboard.html` ab und fügt das Markup in `<div id="custom-body">` ein.
- Stylesheets (`dashboard.css`) und Skripte (`dashboard.js`, Chart.js CDN) werden dynamisch im Hauptcontainer geparst und ausgeführt.

---

## Entwicklung & Verwendung

### Voraussetzungen

Stelle sicher, dass die Projektabhängigkeiten im Root-Verzeichnis installiert sind:

```sh
npm ci
```

### Entwicklungsserver starten

Starte den Vite-Entwicklungsserver und den Tailwind-Watcher parallel:

```sh
npm run dev
```

- **Hauptanwendung**: Rufe [http://localhost:5173/src/index/index.html](http://localhost:5173/src/index/index.html) auf, um das Dashboard eingebettet in der Hauptanwendung zu sehen.
- **Eigenständiges Dashboard**: Rufe [http://localhost:5173/src/dashboard/dashboard.html](http://localhost:5173/src/dashboard/dashboard.html) auf, um Dashboard-Komponenten isoliert zu entwickeln und zu testen.

### Assets bauen (Build)

Zum Kompilieren und Minifizieren globaler Stylesheets:

```sh
npm run build
```

---

## Hinweise für Mitwirkende (Contributors)

Beachte bei der Erweiterung oder Wartung der Dashboard-Komponente folgende Richtlinien:

1. **Ersetzen von Stub-Daten durch reale Daten**:
   - `BmiTrackingStubService` wird aktuell als Platzhalter-Datenquelle verwendet.
   - Bei der Anbindung von Backend-APIs, LocalStorage oder Datenbankdiensten sollte `BmiTrackingStubService.getRecentTrackings()` durch den geteilten State/API-Dienst ersetzt werden, während das `BmiTracking`-Modell beibehalten oder angepasst wird.
2. **Chart-Verwaltung & Lifecycle**:
   - Achte darauf, dass Chart.js-Instanzen ordnungsgemäß verwaltet oder vor einem erneuten Rendern zerstört werden (`destroy()`), um Canvas-Wiederverwendungsfehler und Speicherlecks zu vermeiden.
3. **Styling & Theme-Konsistenz**:
   - Benutzerdefinierte Stile für das Dashboard befinden sich in `dashboard.css`. Achte bei Änderungen an Badge-Farben, Metrik-Karten oder Layout-Grids auf die Kompatibilität mit dem Light Mode und zukünftigen Dark-Mode-Anforderungen.
4. **Codequalität**:
   - Pflege JSDoc-Kommentare für Datenklassen und Rendering-Funktionen in `dashboard.js`.
   - Behalte Modul-Export-Guards (`if (typeof module !== 'undefined' && module.exports)`) bei, um Unit- und End-to-End-Tests (z. B. Playwright) zu unterstützen.