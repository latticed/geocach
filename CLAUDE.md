# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Layout

- This repository (remote `latticed/geocach`) holds **both** the web app and the Geocaching event-planning material.
- `Planung/` — event-planning documents (each as `.md` source + generated `.odt` + `.pdf`): `Geocaching-Aktion-Plan`, `Betreuer-Ablaufplan`, `Regenplan-Stationen`, `Ideen-und-Anregungen`, plus the fillable forms `Cache-Steckbrief` and `Raetsel-Vordrucke`.
- The web app lives at the repo root (`index.html`, `js/`, `css/`, `data/`, `assets/`).
- The `Planung/` `.odt`/`.pdf` files are generated from the `.md` sources via LibreOffice (`soffice --headless --convert-to pdf|odt`); pandoc is not installed.

## Project: GeoCachePlaner (`geocach/`)

A fully static, offline German-language web app for assembling a custom Geocaching course from a library of ~30 puzzle/task suggestions. Pure HTML/CSS/JS — no build step, no dependencies, no `package.json`, no tests or linters.

### Running

- Open `geocach/index.html` directly in a browser (works via `file://`).
- Or serve it: `python3 -m http.server 8080` from inside `geocach/`, then visit http://localhost:8080.

### Language convention

UI, code identifiers, and comments are all German (e.g. `aufgaben`, `kurs`, `schwierigkeit`, `zeitaufwand`). Match this when editing.

### Data flow — important

`data/aufgaben.json` is the source of truth, but `js/aufgaben-data.js` is a **generated embedded copy** that `loadAufgaben()` ([js/app.js](geocach/js/app.js)) reads *first* (via `window.AUFGABEN_DATA`) so the page works under `file://` where `fetch()` is blocked; the JSON fetch is only a fallback.

Consequence: editing `data/aufgaben.json` alone has **no visible effect**. After changing it, regenerate the JS:

```bash
node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync("data/aufgaben.json","utf8"));fs.writeFileSync("js/aufgaben-data.js","window.AUFGABEN_DATA = "+JSON.stringify(o,null,2)+";\n")'
```

Each task object: `id`, `titel`, `beschreibung`, `kategorie`, `schwierigkeit` (1–5), `zeitaufwand` (minutes), `hinweis`, `beispiel`.

### Architecture (`js/app.js`)

- Single `state` object (loaded tasks, the course as an ordered array of task IDs, active category filters, max-difficulty filter, course name/description). Mutations call render functions that rebuild the DOM from `state` — there is no framework or virtual DOM.
- Two tabs (`bibliothek` library + `kurs-builder` course builder) toggled by `switchTab()`. Library renders filterable cards; the builder lists chosen tasks with reorder/remove and live stats.
- Persistence: only the course (IDs + name + description, not filters) is saved to `localStorage` under key `geocach_kurs`. On load, stale IDs no longer present in the data are dropped.
- Print/PDF export (`printKurs()`) builds a dedicated `#print-view` and calls `window.print()`; print styling lives in `css/print.css`.
- All dynamic values are passed through `escapeHtml()` before insertion into template-string HTML.
