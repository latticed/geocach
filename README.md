# GeoCachePlaner 🧭

Eine kleine, deutschsprachige Website, mit der du **deinen eigenen Geocaching-Kurs** zusammenstellst.
Stöbere durch über 30 Aufgaben- und Rätselvorschläge, filtere nach Kategorie und Schwierigkeit,
füge Aufgaben zu deinem Kurs hinzu, sortiere sie und drucke den fertigen Kurs aus.

Die Seite ist komplett **statisch** (nur HTML, CSS, JavaScript) – sie braucht **kein Internet,
keinen Server und keine Installation**.

## 🌐 Live ansehen

**👉 https://latticed.github.io/geocach/**

Funktioniert auf Handy, Laptop und jedem Gerät mit dem Link – einfach öffnen.

---

## 💻 Auf dem Laptop öffnen

### Schritt 1 – Dateien auf den Laptop holen

**Variante A: Ohne Git (am einfachsten)**
1. Öffne das Projekt auf GitHub: <https://github.com/latticed/geocach>
2. Wähle oben rechts den Branch **`claude/geocache-tasks-puzzles-site-l6l95s`** aus.
3. Klicke auf den grünen Button **`Code`** → **`Download ZIP`**.
4. Entpacke die heruntergeladene ZIP-Datei in einen beliebigen Ordner.

**Variante B: Mit Git**
```bash
git clone https://github.com/latticed/geocach.git
cd geocach
git checkout claude/geocache-tasks-puzzles-site-l6l95s
```

### Schritt 2 – Seite öffnen

Im entpackten Ordner einfach **Doppelklick auf `index.html`** – die Seite öffnet sich
direkt in deinem Standardbrowser. Fertig. ✅

> 💡 **Optional:** Wenn du es genau wie eine echte Website laufen lassen möchtest, kannst du
> einen kleinen lokalen Server starten (z. B. mit Python):
> ```bash
> python3 -m http.server 8080
> ```
> Danach im Browser <http://localhost:8080> aufrufen.

---

## 📱 Auf dem Handy?

Die Seite ist über **GitHub Pages** live: **https://latticed.github.io/geocach/**
Einfach den Link am Handy öffnen. Tipp: Über das Browser-Menü „Zum Startbildschirm
hinzufügen" bekommst du ein App-Icon für den GeoCachePlaner.

Die Seite wird **automatisch aktualisiert**, sobald etwas auf den Projekt-Branch gepusht
wird (siehe `.github/workflows/deploy.yml`).

---

## ✨ Funktionen

- **Bibliothek:** Alle Aufgaben als Karten, filterbar nach Kategorie und Schwierigkeit.
- **Kurs-Builder:** Aufgaben hinzufügen, Reihenfolge ändern, entfernen – mit Live-Statistik
  (Anzahl, Gesamtzeit, Durchschnitts-Schwierigkeit).
- **Drucken / PDF:** Über `Strg+P` (bzw. `Cmd+P` am Mac) den fertigen Kurs sauber ausdrucken
  oder als PDF speichern.
- **Automatisches Speichern:** Dein zusammengestellter Kurs bleibt im Browser gespeichert
  (LocalStorage) – auch nach dem Schließen und erneuten Öffnen.
- **Aufgabenblatt zum Ausschneiden:** Druckfertige LaTeX-Vorlage mit Aufgabenkarten
  zum Ausschneiden, Anpassen und Einkleben – siehe [`vorlagen/`](vorlagen/README.md)
  (fertiges PDF: [`vorlagen/aufgabenkarten.pdf`](vorlagen/aufgabenkarten.pdf)).

---

## 📂 Aufbau

```
geocach/
├── index.html              # Startseite
├── css/
│   ├── style.css           # Design
│   └── print.css           # Druck-Layout
├── js/
│   ├── app.js              # Logik (Filter, Kurs-Builder, Speichern, Drucken)
│   └── aufgaben-data.js    # Eingebettete Aufgaben (damit file:// funktioniert)
├── data/
│   └── aufgaben.json       # Aufgaben als Datenquelle
├── vorlagen/               # Druckvorlage zum Ausschneiden (LaTeX/PDF)
│   ├── aufgabenkarten.tex  # Vorlage mit Karten-Layout & Anleitung
│   ├── build-aufgaben-tex.js # Generator JSON -> LaTeX-Daten
│   ├── build.sh            # baut das PDF in einem Schritt
│   └── aufgabenkarten.pdf  # fertige, druckfertige Vorlage
└── assets/
    └── compass.svg         # Logo
```

> ℹ️ `js/aufgaben-data.js` wird aus `data/aufgaben.json` erzeugt. Wenn du Aufgaben in der
> JSON-Datei änderst, regeneriere die JS-Datei mit:
> ```bash
> node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync("data/aufgaben.json","utf8"));fs.writeFileSync("js/aufgaben-data.js","window.AUFGABEN_DATA = "+JSON.stringify(o,null,2)+";\n")'
> ```
