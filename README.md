# Parametric Box Generator

Statische, vollständig clientseitige Webanwendung zum Erzeugen einer parametrischen Box mit separatem Schiebedeckel. Länge, Breite und Höhe werden im Browser geändert; OpenCascade erzeugt daraus echte BRep-Solids für BOX und LID. Three.js zeigt ausschließlich die triangulierte Vorschau.

## Funktionen

- Umschaltbare Innen- oder Außenmaßeingabe über Regler und direkte Zahlenfelder
- Stufenloser Deckelpositions-Regler von vollständig offen bis geschlossen
- Referenznahe Deckeldetails mit Endanschlag, Schrägführung und konischer Schraubsenkung
- Zwei getrennte, geschlossene Solids: `BOX` und `LID`
- Optionale, 0,20 mm tiefe Heisel-Logo-Gravur auf dem inneren Boxboden
- Native STEP-Exporte für BOX, LID und das komplette Set
- Binäre STL-Exporte für BOX und LID
- OpenCascade-Berechnung in einem Web Worker
- Interaktive Three.js-Vorschau mit Orbit, Zoom und Pan
- Responsive Oberfläche sowie Light und Dark Mode
- Keine Anmeldung, kein Backend und kein Upload von Geometriedaten

3MF ist bewusst nicht implementiert: Es ist ein optionales Format, während STEP und STL die geforderten CAD- und Druck-Workflows vollständig abdecken.

## Lokale Entwicklung

Voraussetzung ist Node.js 22 oder neuer.

```bash
npm ci
npm run dev
```

Vite zeigt anschließend die lokale Adresse im Terminal an. Der erste Modellaufbau lädt das rund 23 MB große OpenCascade-WASM-Modul und kann daher länger dauern als spätere Parameteränderungen.

## Prüfung und Produktions-Build

```bash
npm run check
npm test
npm run build
npm run preview
```

Der Build liegt in `dist/`. Alle Browser-Pfade sind relativ, sodass dasselbe Verzeichnis auf einer GitHub-Pages-Projektseite unter einem Unterpfad funktioniert.

Die automatischen CAD-Tests prüfen die geforderten Maße `200 × 100 × 80`, `80 × 60 × 30` und `300 × 150 × 120 mm`. Zusätzlich kontrollieren sie BRep-Gültigkeit, geschlossene Vorschaumeshes und die Struktur der STEP- und STL-Exporte.

## GitHub Pages

Der Workflow [pages.yml](.github/workflows/pages.yml) prüft Typen und CAD-Geometrie, baut die Seite und veröffentlicht `dist/` über GitHub Pages. Im Repository muss unter **Settings → Pages → Build and deployment** die Quelle **GitHub Actions** gewählt sein. Danach genügt ein Push auf `main`; der Workflow kann außerdem manuell gestartet werden.

## Aufbau

```text
src/
  model/       Parametrik und Solid-Features
  cad/         OpenCascade-Initialisierung, Worker und Exporte
  viewer/      Three.js-Darstellung
  main.ts      Oberfläche und Zustandsfluss
cad/reference/ unveränderte CAD-Referenzdateien
docs/MODEL.md  technische Modellbeschreibung
test/          Geometrie- und Exporttests
```

Alle Maße und Toleranzen sind in [parameters.ts](src/model/parameters.ts) zentralisiert. Die ausführliche Feature-Reihenfolge, Herleitungen und bekannten Abweichungen von der Referenz stehen in [MODEL.md](docs/MODEL.md).
