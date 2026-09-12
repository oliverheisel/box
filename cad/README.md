# CAD-Referenzdateien

Die Originaldateien wurden unverändert in `cad/reference/` organisiert. Sie dienen ausschließlich als geometrische Referenz; die Webanwendung lädt sie nicht und erzeugt ihre Geometrie vollständig aus Code.

Aktuelle Master-Referenz: `Box v2 v1` (Web-Modell `1.3.0`).

| Datei | Format | Verwendung | SHA-256 |
| --- | --- | --- | --- |
| `box-generator.f3d` | Autodesk Fusion-Archiv | native Konstruktionsreferenz | `2d76c2e0181ba60875210952164db8aded37166a8172657e15ffde1eb6dd2012` |
| `box-generator.step` | STEP | BRep-Struktur und Solid-Hüllmaße | `8b7a3e6a932d3a0251f595f08f6c755f5f77c505a411158ad34824a511280d59` |
| `box-generator.3mf` | 3MF | Meshprüfung und visuelle Referenz | `9500bd19086b9420b728766145ea41b1c17336907b6473bd5a9d465e51f27d5f` |

## Verifizierter Referenzstand

- Zwei Teile: `BOX` und `LID`
- Standard-Außenmaß BOX: `200 × 100 × 80 mm`
- LID-Hüllmaß: `198,35 × 100 × 4 mm`
- STEP enthält zwei `MANIFOLD_SOLID_BREP`-Solids mit geschlossenen Schalen
- Beide 3MF-Objekte sind topologisch geschlossen

Die daraus abgeleiteten Modellmerkmale und nicht zweifelsfrei rekonstruierbaren Details stehen in [`docs/MODEL.md`](../docs/MODEL.md).
