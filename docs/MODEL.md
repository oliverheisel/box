# Modellbeschreibung

## Ziel und Referenzstand

Das Modell erzeugt eine rechteckige Box mit abgerundeten Ecken, offenem Innenraum, U-förmiger Führung für einen einschiebbaren Deckel und einer Schraubsicherung. BOX und LID bleiben vom ersten Feature bis zum Export getrennte OpenCascade-`Shape3D`-Solids.

Als Referenz dienen die drei Dateien unter `cad/reference/`. Die STEP- und 3MF-Referenz wurden strukturell und geometrisch geprüft; die Fusion-Datei wurde nicht editiert. Das Standardmodell der Referenz besitzt die Außenhülle `200 × 100 × 80 mm`.

## Koordinatensystem und Einheiten

- Einheit: Millimeter
- X: Länge der Box
- Y: Breite der Box
- Z: Höhe der Box
- Ursprung: Mittelpunkt der Grundfläche bei `Z = 0`
- BOX: von `Z = 0` bis zur eingegebenen Höhe
- LID: in Referenzlage von `Z = Höhe − Deckelhöhe` bis zur BOX-Gesamthöhe

Der Vorschauversatz gehört nicht zum CAD-Modell und beeinflusst keinen Export.

## Stückliste

| Teil | Anzahl | Geometrietyp | Export |
| --- | ---: | --- | --- |
| BOX | 1 | geschlossener OpenCascade-BRep-Solid | STEP, STL |
| LID | 1 | geschlossener OpenCascade-BRep-Solid | STEP, STL |
| Komplettes Set | 1 | STEP-Assembly aus BOX und LID | STEP |

## Parameterübersicht

Die vollständige Quelle ist `src/model/parameters.ts`. In der Oberfläche werden Innenlänge, Innenbreite und Innenhöhe per Slider vorgegeben. `withInnerSpaceDimension()` leitet daraus die drei äußeren Modellparameter ab; die übrigen Werte beschreiben Konstruktion und Spiel.

| Parameter | Standard | Bedeutung |
| --- | ---: | --- |
| `boxLength` | 200 mm | Außenlänge der BOX |
| `boxWidth` | 100 mm | Außenbreite der BOX |
| `boxHeight` | 80 mm | Außenhöhe der BOX |
| `wallThickness` | 2,5 mm | Wandstärke der Hülle |
| `bottomThickness` | 3 mm | Bodenstärke |
| `cornerRadius` | 5 mm | äußerer Eckenradius |
| `boxEdgeChamfer` | 0,2 mm | Fase an den ausgewählten BOX-Kanten |
| `lidWallHeight` | 2,5 mm | Höhe des geführten Deckelbereichs |
| `lidWallTopHeight` | 1,5 mm | zusätzliche Deckeloberseite |
| `lidTongueStraightHeight` | 1 mm | gerade Höhe der unteren Deckelzunge vor der Schrägführung |
| `lidCutout` | 7 mm | Öffnung der Führung an der Einschubseite |
| `lidWallThickness` | 1,5 mm | Stärke der U-Führung beziehungsweise Längenabzug des Deckels |
| `lidOffset` | 0,15 mm | konstruktives Deckelspiel |
| `lidRetentionLipWidth` | 1 mm | seitlicher Einzug der schrägen Haltekante |
| `lidOuterChamfer` | 0,2 mm | obere Fase am breiten Deckelendanschlag |
| `holeThread` | 4 mm | Durchmesser der Bohrung im BOX-Schraubdom |
| `minSideWithHole` | 1,6 mm | Radius der Deckel-Durchgangsbohrung |
| `threadDepth` | 6,7 mm | Tiefe der Bohrung und Höhe des Schraubdoms |
| `screwDiameter` | 3 mm | Nenn-Schraubendurchmesser der Konstruktion |
| `screwCenterInset` | 8,88 mm | Abstand der Schraubenachse von der linken Außenkante |
| `screwBossNarrowHalfWidth` | 4,4 mm | halbe Breite des inneren Domendes |
| `screwBossWallHalfWidth` | 14,7 mm | halbe Breite des Domansatzes an der Wand |
| `screwBossSupportDepth` | 25,4 mm | vertikale Ausdehnung der schrägen Domabstützung an der Innenwand |
| `lidCounterboreDepth` | 2 mm | Tiefe der konischen Schraubsenkung im Deckel |
| `floorLogoEnabled` | `true` | schaltet die Gravur des Favicon-Signets im Innenboden ein oder aus |
| `floorLogoDepth` | 0,2 mm | Tiefe der Gravur in der oberen Bodenfläche |

Die UI kann per Umschalter wahlweise nutzbare Innenmaße oder vollständige Außenmaße bearbeiten. Slider und numerisches Eingabefeld bleiben synchron. Die Grenzen für den Innenraum sind `35–395 mm` Länge, `25–295 mm` Breite und `13–243 mm` Höhe; im Außenmodus gelten `40–400`, `30–300` und `20–250 mm`. Diese Grenzen vermeiden Selbstüberschneidungen bei den festen Featuremaßen.

## Abgeleitete Maße

Die Funktion `deriveModelDimensions()` berechnet alle abhängigen Werte an einer Stelle. Wesentliche Beziehungen sind:

```text
Innenlänge       = Länge - 2 × Wandstärke
Innenbreite      = Breite - 2 × Wandstärke
Innenradius      = Außenradius - Wandstärke
Außenlänge       = Innenlänge + 2 × Wandstärke
Außenbreite      = Innenbreite + 2 × Wandstärke
Außenhöhe        = Innenhöhe + Boden + Deckelhöhe
Deckelhöhe       = Deckelwandhöhe + Deckeloberseite
Deckellänge      = Länge - Deckelwandstärke - Deckelspiel
Deckelbasis Z    = Höhe - Deckelhöhe
Schraubenachse X = -Länge / 2 + Schraubenachsen-Abstand
```

Beim Standardmodell ergibt sich ein Innenraum von `195 × 95 × 73 mm`. Der Deckel besitzt insgesamt das Referenz-Hüllmaß `198,35 × 100 × 4 mm`: Die geführte Zunge ist `96,7 mm` breit, verjüngt sich nach `1 mm` gerader Höhe über eine `1,5 mm` hohe Schräge auf `94,7 mm` und endet in einer `1,5 mm` hohen Oberstufe. Der breite, `6,85 mm` lange Endanschlag stellt die volle Deckelbreite her.

## Feature-Reihenfolge BOX

1. Ein abgerundetes Rechteck mit Außenmaßen und Außenradius wird bis zur Basis der Deckelführung extrudiert. Seine äußere Unterkante erhält die `0,2-mm`-Referenzfase.
2. Ein kleineres, konzentrisches abgerundetes Rechteck wird ab Oberkante des Bodens subtrahiert. Dadurch entstehen Boden und umlaufende Wand; die obere Innenkante erhält ebenfalls die `0,2-mm`-Referenzfase.
3. Ein trapezförmiger Schraubdom wird an der linken Innenwand ergänzt. Seine Unterseite steigt von der tiefen Wandabstützung schräg bis zur Unterkante des Schraubbereichs an; bei sehr niedrigen Boxen endet die Abstützung sicher auf Höhe des Bodens.
4. Die zylindrische Schraubbohrung wird aus dem Dom subtrahiert.
5. Ein Ring aus zwei abgerundeten Rechtecken wird an der linken Seite geöffnet und für `1 mm` als U-förmige untere Gleitführung ergänzt.
6. Ein `1,5 mm` hoher Loft verengt die Öffnung an drei Seiten um jeweils `1 mm`. Diese Schrägfläche führt die passende Deckelschulter und verhindert das Abheben.
7. Darüber setzt sich die obere Haltekante mit konstantem Querschnitt über weitere `1,5 mm` fort. Nur ihre äußere Oberkante wird mit `0,2 mm` gefast; die innere Haltekante bleibt scharfkantig.
8. OpenCascade vereinfacht zusammenfallende Flächen und Kanten.
9. Wenn aktiviert, wird das Favicon-Signet aus „H“ und Unterstrich mittig und `0,2 mm` tief in die obere Innenfläche des Bodens graviert. Bei kleinen Boxen wird es mit Sicherheitsabstand proportional verkleinert.

## Feature-Reihenfolge LID

1. Eine breite, `1 mm` hohe Deckelzunge wird mit dem definierten Seitenspiel innerhalb der unteren Führung erzeugt.
2. Ein `1,5 mm` hoher Loft verjüngt die Zunge auf die schmalere obere Deckelstufe und bildet die zur BOX passende Schrägschulter.
3. Die obere Stufe wird weitere `1,5 mm` gerade fortgeführt.
4. Am offenen Ende wird der breite Anschlag aus der äußeren Referenzkontur ergänzt und an der Oberkante mit `0,2 mm` gefast.
5. Eine zylindrische Durchgangsbohrung wird auf der Schraubenachse subtrahiert.
6. Von der Oberseite wird die aus der 3MF-Referenz ablesbare, `2 mm` tiefe konische Schraubsenkung subtrahiert.
7. OpenCascade vereinfacht zusammenfallende Flächen und Kanten.

Die Vorschau startet mit vollständig herausgezogenem Deckel, sodass Deckel und Schraubloch frei sichtbar sind. Ein stufenloser Positionsregler bewegt ausschließlich seine Three.js-Darstellung entlang der X-Achse zwischen vollständig offen und geschlossen; die Bewegung berücksichtigt die Systemeinstellung für reduzierte Bewegung. Im Einzelteil-STEP und -STL bleibt die CAD-Referenzlage unverändert. Der Set-STEP enthält beide getrennten BRep-Solids in ihren Modellkoordinaten.

## Modulare Features

- `features/roundedCorners.ts` erzeugt abgerundete Profile, Solids und Profilringe.
- `features/lidInterface.ts` konstruiert die U-förmige Deckelführung.
- `features/screwHoles.ts` ergänzt Schraubdom und Bohrungen für BOX und LID.
- `features/floorLogo.ts` erzeugt die optionale Gravur im Innenboden.
- `box.ts` und `lid.ts` legen ausschließlich die Reihenfolge dieser Features fest.
- `model.ts` erzeugt das Teilepaar, prüft es und tesselliert es für die Vorschau.

Dadurch kann ein Feature geändert oder ausgetauscht werden, ohne Viewer, Worker, Export oder UI anzupassen.

## STEP- und Mesh-Export

`src/cad/export.ts` arbeitet direkt mit den im Worker gehaltenen OpenCascade-Solids:

- BOX und LID verwenden jeweils `Shape3D.blobSTEP()`. Der Weg ist somit **BRep → STEP**; es findet keine Mesh-Rückkonvertierung statt.
- Das komplette Set verwendet Replicads `exportSTEP()` mit zwei benannten Shapes `BOX` und `LID` in Millimetern.
- STL wird separat mit `Shape3D.blobSTL()` aus der tessellierten Solid-Oberfläche erzeugt. Die Qualitätswerte stehen zentral in `CAD_TOLERANCES`.
- 3MF ist derzeit nicht implementiert. Es war optional und wird nicht als Zwischenformat oder Quelle für STEP verwendet.

Die Worker-Antwort überträgt den fertigen Datei-Buffer an den Main Thread. Dort erzeugt die UI kurzzeitig eine Objekt-URL für den Browserdownload und gibt sie unmittelbar wieder frei.

## Einen Parameter ergänzen

1. Den Wert in `ModelParameters` und `DEFAULT_MODEL_PARAMETERS` ergänzen.
2. Falls er als Innenmaß editierbar sein soll, `InnerSpaceKey`, `INNER_SPACE_LIMITS`, die Umrechnungsfunktion, das UI-Feld und die Validierung erweitern.
3. Abhängige Größen in `deriveModelDimensions()` berechnen; keine Herleitungen in UI oder Featuredateien duplizieren.
4. Da `parameterKey()` alle Modellparameter berücksichtigt, invalidiert der Worker-Cache den alten Solid automatisch.
5. Standard-, Grenz- und Fehlerfälle in `test/model.test.ts` ergänzen und die Modellversion erhöhen.

## Eine neue Fusion-Version übernehmen

Fusion 360 bleibt das Mastermodell. Für ein kontrolliertes Update gilt:

1. Die neue F3D-, STEP- und 3MF-Version außerhalb der Anwendung exportieren.
2. Die vorhandenen Referenzen in `cad/reference/` erst nach einem Vergleich ersetzen und neue SHA-256-Werte in `cad/README.md` eintragen.
3. Namen, Zahl und Hüllmaße der Bodies sowie Wand, Boden, Radien, Führung, Bohrungen und weitere Features in STEP/3MF vergleichen.
4. Nur die betroffenen Parameter-, Ableitungs- oder Featurefunktionen ändern. UI, Viewer und Export bleiben unverändert, sofern keine neuen Benutzerparameter nötig sind.
5. Unklare Details nicht schätzen, sondern mit dem vorgeschriebenen TODO markieren.
6. Referenzfälle und Tests aktualisieren, alle drei Größen erneut prüfen und `MODEL_INFO.modelVersion` sowie `referenceCadVersion` erhöhen.
7. STEP-Dateien in Fusion oder einem zweiten BRep-fähigen CAD-System öffnen und als bearbeitbare Solid Bodies kontrollieren.

## Numerische Toleranzen

`CAD_TOLERANCES` enthält die absichtlich kleinen Überlappungen für robuste Boolesche Operationen sowie getrennte Tessellierungswerte für Vorschau und STL. Diese Werte ändern nicht die analytische STEP-Geometrie.

- Boolean-Überlappung: `0,05 mm`
- Vorschau-Tessellierung: linear `0,12 mm`, angular `0,12`
- STL-Tessellierung: linear `0,08 mm`, angular `0,10`

## Validierung

Vor der Berechnung prüft `validation.ts` Eingabebereich und geometrische Mindestmaße. Nach der Berechnung validiert `BRepCheck_Analyzer` beide Solids im Worker. Die Test-Suite prüft für Standard-, Klein- und Großmodell zusätzlich:

- erwartete Außenabmessungen,
- positives Volumen,
- endliche Meshdaten,
- genau zwei anliegende Dreiecksseiten pro geometrischer Meshkante,
- STEP-Kopf und BRep-Repräsentation,
- korrekte binäre STL-Länge.

## Bewusste Abweichungen von der Referenz

Die tragenden Abmessungen, Wand- und Bodenstärken, Radien, Führung, Deckelspiel und Schraubenlage wurden umgesetzt. Die Web-Modellversion `1.2.0` ergänzt auf Nutzerwunsch die aus der 3MF-Referenz nachvollziehbaren Deckeldetails: breiter Endanschlag, obere `0,2-mm`-Fase, aufeinander abgestimmte Schrägflächen an Deckel und Haltekante sowie die konische Schraubsenkung. Die Deckelzunge läuft mit `0,15 mm` Spiel in der Führung und kann unter der oberen Kante nicht nach oben entweichen. Version `1.3.0` ergänzt die in der Referenz erkennbare schräge Abstützung unter dem BOX-Schraubloch. Version `1.4.0` ergänzt die zuvor fehlenden `0,2-mm`-Fasen an BOX-Unterkante, oberer Innenkante und äußerer Oberkante der U-Führung. Außerdem liegen die geraden, schrägen und zylindrischen Übergänge nun auf denselben Z-Ebenen wie in der STEP-Referenz. Die analytischen Kegel- und Zylinderflächen stimmen damit in Anzahl und Begrenzung mit der Referenz überein; abweichende planare Unterteilungen können weiterhin aus der anderen Feature- und Boolean-Reihenfolge entstehen. Version `1.5.0` ergänzt optionale erhabene und gravierte Deckelbeschriftungen als echte BRep-Geometrie. Bei leerem Text bleibt das Referenzmodell unverändert.

## Ein Feature ergänzen

1. Neue unveränderliche Maße in `ModelParameters` und `DEFAULT_MODEL_PARAMETERS` aufnehmen. Abgeleitete Größen gehören in `deriveModelDimensions()`.
2. Das Feature als kleine Funktion unter `src/model/features/` implementieren. Die Funktion soll einen Solid entgegennehmen oder erzeugen und einen `Shape3D` zurückgeben.
3. Das Feature in `createBox()` oder `createLid()` an der richtigen Stelle der Feature-Reihenfolge verknüpfen.
4. Für neue boolesche Operationen die zentralen CAD-Toleranzen verwenden und keine verdeckten Geometriekonstanten einführen.
5. Validierungsregeln für jede neue Mindestgröße oder Abhängigkeit ergänzen.
6. Einen normalen und mindestens einen Grenzfall in `test/model.test.ts` ergänzen. BRep-Gültigkeit und Wasserdichtheit müssen erhalten bleiben.
7. Diese Dokumentation, die Modellversion und bei sichtbaren Änderungen die UI-Hinweise aktualisieren.
