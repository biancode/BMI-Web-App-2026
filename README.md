# BMI Web App


## Nach dem Klonen oder bei geänderten Abhängigkeiten

```sh
npm ci
```

## Entwicklung

```sh
npm run dev
```

Startet den lokalen Webserver unter http://localhost:5173 und öffnet die App unter
http://localhost:5173/src/index/index.html
automatisch im Browser. Änderungen an HTML, JavaScript und CSS werden automatisch
übernommen. Tailwind läuft parallel im Watch-Modus. Mit `Strg+C` beendest du beide
Prozesse. Ist Port 5173 bereits belegt, beende zuerst den dort laufenden Server.

Falls PowerShell `npm.ps1` blockiert, verwende `npm.cmd run dev` (bzw. `npm.cmd ci`).

## Build und Veröffentlichung

```sh
npm run build
```

Erzeugt `public/css/styles.min.css`. Entwicklung und Build verwenden denselben
CSS-Pfad. Vor dem Veröffentlichen ausführen und die Ordner `src` und `public`
mit ihrer Verzeichnisstruktur bereitstellen. Die Startseite ist `src/index/index.html`.



# Projektstruktur

John - Front Page, Graphen

Jonas - Formulare, Berechnung BMI

Malte - Einstellungen (Dark Mode, Email Adresse, User, PW, PW ändern, Geschlecht, Wunsch BMI)

Jan - Gemini, lokale KI -> Auswertung von den Daten (Handlungsempfehlung, Motivation)

Alex - Datenbanken, Tabelle, API

Zilke - Hardware besorgen (Raspberry PI 5 4gb, 32gb SD )
