# Aufgabenblatt · Vordruck zum Ausschneiden 📄✂️

Druckvorlage für **Aufgabenkarten**, die du ausschneidest, mit deinen eigenen
Final-Koordinaten **anpasst** und in dein Kursheft, Logbuch oder die Cache-Dose
**einklebst**.

Das fertige PDF liegt schon gebaut bereit: **[`aufgabenkarten.pdf`](aufgabenkarten.pdf)**
– einfach öffnen und ausdrucken.

## Inhalt der Vorlage

1. **Anleitung** – Drucken → Ausschneiden → Anpassen → Einkleben.
2. **Blanko-Vordruck** – leere Karten zum Ausfüllen von Hand.
3. **Vorbereitete Aufgabenkarten** – alle Aufgaben aus `data/aufgaben.json`,
   automatisch erzeugt, mit Schwierigkeit, Zeit, Beschreibung, Tipp und Beispiel
   sowie einer Zeile für die eigene Lösung.
4. **Rollzettel** – schmale Streifen zum Einrollen in Petling / Micro-Dosen.

Jede Karte hat eine **gestrichelte Schnittkante** (✂) und unten eine
**Klebefläche** zum Einkleben.

## Selbst neu bauen

Nur nötig, wenn du Aufgaben in `data/aufgaben.json` geändert hast.

```bash
bash vorlagen/build.sh
```

Das Skript erzeugt zuerst `aufgaben-data.tex` aus der JSON-Datenquelle und
kompiliert dann das PDF – Website und Druckvorlage bleiben so auf demselben Stand.

**Voraussetzungen:** `node` und eine TeX-Installation mit `pdflatex`
(Pakete `tikz`, `tcolorbox`, `pifont`, `babel-german`, `lmodern`).
Unter Debian/Ubuntu z. B.:

```bash
sudo apt-get install texlive-latex-recommended texlive-latex-extra \
                     texlive-fonts-recommended texlive-lang-german lmodern
```

### Einzelschritte (ohne Skript)

```bash
node vorlagen/build-aufgaben-tex.js          # JSON -> aufgaben-data.tex
cd vorlagen && pdflatex aufgabenkarten.tex   # zweimal für korrektes Layout
```

## Dateien

| Datei | Zweck |
|-------|-------|
| `aufgabenkarten.tex`    | Haupt-Vorlage (Layout, Karten-Makros, Anleitung) |
| `build-aufgaben-tex.js` | Generator `data/aufgaben.json` → `aufgaben-data.tex` |
| `aufgaben-data.tex`     | erzeugte Kartendaten (nicht von Hand bearbeiten) |
| `build.sh`              | baut alles in einem Schritt |
| `aufgabenkarten.pdf`    | fertige, druckfertige Vorlage |

## Andere Formate (ODT / DOCX)

Brauchst du die Aufgaben als bearbeitbares Office-Dokument, öffne die Website
(`index.html`), stelle deinen Kurs zusammen und nutze **Drucken → Als PDF
speichern** (`Strg+P`). Aus dem PDF lässt sich bei Bedarf mit LibreOffice ein
ODT/DOCX erzeugen. Für das saubere Ausschneide-Layout ist jedoch diese
LaTeX-Vorlage gedacht.
