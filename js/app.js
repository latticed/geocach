/* ============================================================
   GeoCachePlaner — Anwendungslogik
   ============================================================ */

// === EINGEBETTETE FALLBACK-DATEN (für file://-Protokoll) ===
// Wird genutzt, falls fetch() blockiert wird
const FALLBACK_DATEN = null; // wird dynamisch befüllt, falls fetch scheitert

// === STATE ===
const state = {
  aufgaben: [],
  kurs: [],                      // Array von Aufgaben-IDs in Reihenfolge
  aktiverTab: 'bibliothek',
  aktiveKategorien: new Set(),   // leer = alle Kategorien sichtbar
  maxSchwierigkeit: 5,
  kursName: '',
  kursBeschreibung: ''
};

// === HILFSFUNKTIONEN ===

function sterne(n, max = 5) {
  let html = '';
  for (let i = 1; i <= max; i++) {
    html += i <= n
      ? '<span class="stern-voll" aria-hidden="true">★</span>'
      : '<span class="stern-leer" aria-hidden="true">☆</span>';
  }
  return `<span aria-label="${n} von ${max} Sternen">${html}</span>`;
}

function findAufgabe(id) {
  return state.aufgaben.find(a => a.id === id) || null;
}

function istImKurs(id) {
  return state.kurs.includes(id);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// === DATEN LADEN ===

async function loadAufgaben() {
  // 1. Eingebettete Daten bevorzugen (js/aufgaben-data.js).
  //    Dadurch funktioniert die Seite auch per Doppelklick (file://),
  //    wo Browser fetch() blockieren.
  if (window.AUFGABEN_DATA && Array.isArray(window.AUFGABEN_DATA.aufgaben)) {
    state.aufgaben = window.AUFGABEN_DATA.aufgaben;
    return true;
  }

  // 2. Fallback: über HTTP-Server geladene JSON-Datei.
  try {
    const res = await fetch('data/aufgaben.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.aufgaben = data.aufgaben || [];
  } catch (err) {
    console.warn('Daten konnten nicht geladen werden:', err.message);
    const grid = document.getElementById('aufgaben-grid');
    grid.innerHTML = `
      <div class="keine-ergebnisse">
        <p>Aufgaben konnten nicht geladen werden.</p>
        <small>Stelle sicher, dass die Datei <code>js/aufgaben-data.js</code> vorhanden ist,<br>
        oder öffne die Seite über einen lokalen Webserver:<br>
        <code>python3 -m http.server 8080</code></small>
      </div>`;
    return false;
  }
  return true;
}

// === LOKALER SPEICHER ===

function saveToLocalStorage() {
  try {
    localStorage.setItem('geocach_kurs', JSON.stringify({
      kurs: state.kurs,
      kursName: state.kursName,
      kursBeschreibung: state.kursBeschreibung
    }));
  } catch (e) {
    // LocalStorage nicht verfügbar (z.B. Privat-Modus)
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem('geocach_kurs');
    if (!raw) return;
    const data = JSON.parse(raw);
    // Nur IDs übernehmen, die noch in den Aufgaben existieren
    const gueltigeIds = new Set(state.aufgaben.map(a => a.id));
    state.kurs = (data.kurs || []).filter(id => gueltigeIds.has(id));
    state.kursName = data.kursName || '';
    state.kursBeschreibung = data.kursBeschreibung || '';
  } catch (e) {
    // Ungültige Daten → ignorieren
  }
}

// === RENDER: KATEGORIE-CHIPS ===

function renderKategorieChips() {
  const kategorien = [...new Set(state.aufgaben.map(a => a.kategorie))].sort();
  const container = document.getElementById('kategorie-chips');
  container.innerHTML = kategorien.map(kat => `
    <button
      class="chip${state.aktiveKategorien.has(kat) ? ' aktiv' : ''}"
      data-kat="${escapeHtml(kat)}"
      aria-pressed="${state.aktiveKategorien.has(kat)}"
    >${escapeHtml(kat)}</button>
  `).join('');
}

// === RENDER: BIBLIOTHEK ===

function gefilterteAufgaben() {
  return state.aufgaben.filter(a => {
    const katOk = state.aktiveKategorien.size === 0 || state.aktiveKategorien.has(a.kategorie);
    const schwOk = a.schwierigkeit <= state.maxSchwierigkeit;
    return katOk && schwOk;
  });
}

function aufgabeCardHTML(a) {
  const imKurs = istImKurs(a.id);
  return `
    <article class="aufgabe-card" data-id="${escapeHtml(a.id)}" data-kat="${escapeHtml(a.kategorie)}" role="listitem">
      <div class="card-header">
        <span class="kategorie-badge">${escapeHtml(a.kategorie)}</span>
        <span class="schwierigkeit-sterne">${sterne(a.schwierigkeit)}</span>
      </div>
      <div class="card-body">
        <h3>${escapeHtml(a.titel)}</h3>
        <p class="card-beschreibung">${escapeHtml(a.beschreibung)}</p>
      </div>
      <div class="card-meta">
        <span>⏱ ${escapeHtml(String(a.zeitaufwand))} Min.</span>
        <span>Schwierigkeit: ${a.schwierigkeit}/5</span>
      </div>
      <details class="card-hinweis">
        <summary>Hinweis &amp; Beispiel anzeigen</summary>
        <div class="hinweis-inhalt">
          <p>${escapeHtml(a.hinweis)}</p>
          <p class="beispiel"><strong>Beispiel:</strong> ${escapeHtml(a.beispiel)}</p>
        </div>
      </details>
      <div class="card-actions">
        <button
          class="btn-kurs-add${imKurs ? ' im-kurs' : ''}"
          data-id="${escapeHtml(a.id)}"
          ${imKurs ? 'disabled aria-disabled="true"' : ''}
        >${imKurs ? 'Im Kurs' : '+ Zum Kurs hinzufügen'}</button>
      </div>
    </article>`;
}

function renderBibliothek() {
  const grid = document.getElementById('aufgaben-grid');
  const gefiltert = gefilterteAufgaben();

  document.getElementById('aufgaben-anzahl').textContent =
    `${gefiltert.length} Aufgabe${gefiltert.length !== 1 ? 'n' : ''}`;

  if (gefiltert.length === 0) {
    grid.innerHTML = `
      <div class="keine-ergebnisse">
        <p>Keine Aufgaben gefunden.</p>
        <small>Passe die Filter an oder setze die Kategorieauswahl zurück.</small>
      </div>`;
    return;
  }

  grid.innerHTML = gefiltert.map(aufgabeCardHTML).join('');
}

// === RENDER: KURS-BUILDER ===

function kursItemHTML(a, index, gesamt) {
  return `
    <li class="kurs-item" data-id="${escapeHtml(a.id)}" data-kat="${escapeHtml(a.kategorie)}">
      <span class="kurs-item-nr">${index + 1}.</span>
      <div class="kurs-item-info">
        <div class="kurs-item-titel">${escapeHtml(a.titel)}</div>
        <div class="kurs-item-meta">${escapeHtml(a.kategorie)} · ${a.schwierigkeit}/5 · ${a.zeitaufwand} Min.</div>
      </div>
      <div class="kurs-item-actions">
        <button class="btn-icon" data-action="up" aria-label="Aufgabe nach oben"
          ${index === 0 ? 'disabled' : ''}>▲</button>
        <button class="btn-icon" data-action="down" aria-label="Aufgabe nach unten"
          ${index === gesamt - 1 ? 'disabled' : ''}>▼</button>
        <button class="btn-icon remove" data-action="remove" aria-label="Aufgabe entfernen">✕</button>
      </div>
    </li>`;
}

function renderKursBuilder() {
  const liste = document.getElementById('kurs-liste');
  const hint = document.getElementById('kurs-leer-hint');
  const btnDrucken = document.getElementById('btn-drucken');
  const btnLatex = document.getElementById('btn-latex');
  const btnLeeren = document.getElementById('btn-leeren');
  const hatAufgaben = state.kurs.length > 0;

  hint.style.display = hatAufgaben ? 'none' : '';
  btnDrucken.disabled = !hatAufgaben;
  if (btnLatex) btnLatex.disabled = !hatAufgaben;
  btnLeeren.disabled = !hatAufgaben;

  if (!hatAufgaben) {
    liste.innerHTML = '';
    return;
  }

  const aufgaben = state.kurs.map(findAufgabe).filter(Boolean);
  liste.innerHTML = aufgaben.map((a, i) => kursItemHTML(a, i, aufgaben.length)).join('');
}

// === RENDER: STATS ===

function renderKursStats() {
  const aufgaben = state.kurs.map(findAufgabe).filter(Boolean);
  const anzahl = aufgaben.length;
  const gesamtZeit = aufgaben.reduce((s, a) => s + a.zeitaufwand, 0);
  const avgSch = anzahl > 0
    ? (aufgaben.reduce((s, a) => s + a.schwierigkeit, 0) / anzahl).toFixed(1)
    : '—';

  document.getElementById('stat-anzahl').textContent = anzahl;
  document.getElementById('stat-zeit').textContent =
    gesamtZeit >= 60
      ? `${Math.floor(gesamtZeit / 60)}h ${gesamtZeit % 60}m`
      : `${gesamtZeit} Min.`;
  document.getElementById('stat-schwierigkeit').textContent = avgSch;

  // Badge aktualisieren
  const badge = document.getElementById('kurs-count');
  badge.textContent = anzahl;
  badge.classList.add('bump');
  setTimeout(() => badge.classList.remove('bump'), 300);
}

function renderAll() {
  renderBibliothek();
  renderKursBuilder();
  renderKursStats();
}

// === KURS-MANIPULATION ===

function addToKurs(id) {
  if (!istImKurs(id)) {
    state.kurs.push(id);
    saveToLocalStorage();
    renderAll();
  }
}

function removeFromKurs(id) {
  state.kurs = state.kurs.filter(k => k !== id);
  saveToLocalStorage();
  renderAll();
}

function moveInKurs(id, richtung) {
  const idx = state.kurs.indexOf(id);
  if (idx === -1) return;
  const neuIdx = idx + richtung;
  if (neuIdx < 0 || neuIdx >= state.kurs.length) return;
  [state.kurs[idx], state.kurs[neuIdx]] = [state.kurs[neuIdx], state.kurs[idx]];
  saveToLocalStorage();
  renderKursBuilder();
}

function clearKurs() {
  if (state.kurs.length === 0) return;
  if (!confirm('Möchtest du wirklich alle Aufgaben aus dem Kurs entfernen?')) return;
  state.kurs = [];
  saveToLocalStorage();
  renderAll();
}

// === TAB-WECHSEL ===

function switchTab(tabName) {
  state.aktiverTab = tabName;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  document.getElementById('tab-bibliothek').hidden = tabName !== 'bibliothek';
  document.getElementById('tab-kurs-builder').hidden = tabName !== 'kurs-builder';

  if (tabName === 'kurs-builder') {
    renderKursBuilder();
    renderKursStats();
    // Kurs-Name und -Beschreibung wiederherstellen
    document.getElementById('kurs-name').value = state.kursName;
    document.getElementById('kurs-beschreibung').value = state.kursBeschreibung;
  }
}

// === DRUCK-EXPORT ===

function schwierigkeitText(n) {
  const texte = ['', 'Sehr leicht', 'Leicht', 'Mittel', 'Schwer', 'Sehr schwer'];
  return texte[n] || `${n}/5`;
}

// Leeres Koordinaten-Template (Kästchen zum Ausfüllen).
// stellen = Anzahl Grad-Stellen (2 für Breite N, 3 für Länge E).
function koordZeile(richtung, stellen) {
  const box = '<span class="kbox"></span>';
  const grad = box.repeat(stellen);
  return `
    <div class="print-koord-zeile">
      <span class="print-koord-himmel">${richtung}</span>
      ${grad}<span class="print-koord-zeichen">°</span>
      ${box.repeat(2)}<span class="print-koord-zeichen">.</span>${box.repeat(3)}
      <span class="print-koord-zeichen">′</span>
    </div>`;
}

function printKurs() {
  const aufgaben = state.kurs.map(findAufgabe).filter(Boolean);
  if (aufgaben.length === 0) return;

  // Optionen aus der UI lesen (mit sicheren Standardwerten)
  const zeigeLoesung = document.getElementById('opt-loesungsfelder')?.checked ?? true;
  const zeigeTipps   = document.getElementById('opt-tipps')?.checked ?? true;
  const eigeneSeite  = document.getElementById('opt-eigene-seite')?.checked ?? false;

  const name = state.kursName || 'Mein Geocaching-Kurs';
  const beschreibung = state.kursBeschreibung;
  const gesamtZeit = aufgaben.reduce((s, a) => s + a.zeitaufwand, 0);
  const avgSch = (aufgaben.reduce((s, a) => s + a.schwierigkeit, 0) / aufgaben.length).toFixed(1);
  const datum = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

  const loesungsBlock = `
    <div class="print-loesung">
      <div class="print-loesung-titel">Lösung &amp; Rechenweg</div>
      <div class="print-linie"></div>
      <div class="print-linie"></div>
      <div class="print-linie"></div>
      <div class="print-koordinaten">
        <span class="print-koord-label">Ergebnis-Koordinaten</span>
        ${koordZeile('N', 2)}
        ${koordZeile('E', 3)}
      </div>
    </div>`;

  const aufgabenHTML = aufgaben.map((a, i) => `
    <div class="print-aufgabe${eigeneSeite ? ' print-eigene-seite' : ''}">
      <div class="print-aufgabe-header">
        <span class="print-checkbox" aria-hidden="true"></span>
        <span class="print-aufgabe-nr">Aufgabe ${i + 1} / ${aufgaben.length}</span>
        <span class="print-aufgabe-titel">${escapeHtml(a.titel)}</span>
        <span class="print-aufgabe-sterne">${'★'.repeat(a.schwierigkeit)}${'☆'.repeat(5 - a.schwierigkeit)}</span>
      </div>
      <div class="print-kategorie">${escapeHtml(a.kategorie)} · ${schwierigkeitText(a.schwierigkeit)} · ca. ${a.zeitaufwand} Minuten</div>
      <p class="print-beschreibung">${escapeHtml(a.beschreibung)}</p>
      <div class="print-beispiel"><strong>Beispiel:</strong> ${escapeHtml(a.beispiel)}</div>
      ${zeigeTipps ? `<div class="print-hinweis"><strong>Tipp für Cache-Owner:</strong> ${escapeHtml(a.hinweis)}</div>` : ''}
      ${zeigeLoesung ? loesungsBlock : ''}
    </div>
  `).join('');

  const printView = document.getElementById('print-view');
  printView.innerHTML = `
    <div class="print-header">
      <div class="print-logo-row">
        <span class="print-logo-text">GeoCachePlaner — Arbeitsblatt</span>
      </div>
      <div class="print-kurs-titel">${escapeHtml(name)}</div>
      ${beschreibung ? `<p class="print-kurs-beschreibung">${escapeHtml(beschreibung)}</p>` : ''}
      <div class="print-meta-row">
        <span><strong>Aufgaben:</strong> ${aufgaben.length}</span>
        <span><strong>Gesamtzeit:</strong> ca. ${gesamtZeit} Min.</span>
        <span><strong>Ø Schwierigkeit:</strong> ${avgSch}/5</span>
        <span><strong>Erstellt:</strong> ${datum}</span>
      </div>
      <div class="print-teilnehmer">
        <span>Name: <span class="print-feld-linie"></span></span>
        <span>Datum: <span class="print-feld-linie kurz"></span></span>
      </div>
    </div>

    <div class="print-aufgaben-titel">Aufgaben &amp; Rätsel</div>
    ${aufgabenHTML}

    <div class="print-footer">
      <span>GeoCachePlaner · Erstellt am ${datum}</span>
      <span>geocach</span>
    </div>
  `;

  window.print();
}

// === LATEX-EXPORT ===

// Sonderzeichen für LaTeX maskieren (Umlaute bleiben dank utf8 erhalten).
function latexEscape(s) {
  return String(s)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

// Schwierigkeit als pifont-Sterne (gefüllt/offen) – kompiliert mit pdflatex.
function latexSterne(n) {
  return '\\ding{72}'.repeat(n) + '\\ding{73}'.repeat(5 - n);
}

// Eine Koordinatenzeile mit sauberen Ausfülllinien statt offener Kästchen.
function latexKoordZeile(richtung, gradStellen) {
  const fill = (w) => `\\rule[-2pt]{${w}}{0.4pt}`;
  const grad = Array(gradStellen).fill(fill('0.5cm')).join('\\,');
  return `\\textbf{${richtung}}\\; ${grad}\\,$^\\circ$\\; ${fill('0.5cm')}\\,${fill('0.5cm')}` +
         `\\,$.$\\,${fill('1.4cm')}\\,$'$`;
}

function buildLatex() {
  const aufgaben = state.kurs.map(findAufgabe).filter(Boolean);
  if (aufgaben.length === 0) return '';

  const zeigeLoesung = document.getElementById('opt-loesungsfelder')?.checked ?? true;
  const zeigeTipps   = document.getElementById('opt-tipps')?.checked ?? true;
  const eigeneSeite  = document.getElementById('opt-eigene-seite')?.checked ?? false;

  const name = latexEscape(state.kursName || 'Mein Geocaching-Kurs');
  const beschreibung = state.kursBeschreibung ? latexEscape(state.kursBeschreibung) : '';
  const gesamtZeit = aufgaben.reduce((s, a) => s + a.zeitaufwand, 0);
  const avgSch = (aufgaben.reduce((s, a) => s + a.schwierigkeit, 0) / aufgaben.length).toFixed(1);
  const datum = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

  const loesung = `
\\vspace{8pt}
{\\small\\bfseries\\color{cachegruen}LÖSUNG \\& RECHENWEG}
\\loesungslinie
\\loesungslinie
\\loesungslinie
\\vspace{8pt}

\\textbf{Ergebnis-Koordinaten:}\\\\[4pt]
${latexKoordZeile('N', 2)}\\\\[8pt]
${latexKoordZeile('E', 3)}`;

  const aufgabenTex = aufgaben.map((a, i) => `
\\aufgabe{${i + 1}}{${aufgaben.length}}{${latexEscape(a.titel)}}{${latexSterne(a.schwierigkeit)}}
{\\itshape ${latexEscape(a.kategorie)} \\textperiodcentered{} ${schwierigkeitText(a.schwierigkeit)} \\textperiodcentered{} ca. ${a.zeitaufwand} Minuten\\par}
\\vspace{4pt}
${latexEscape(a.beschreibung)}\\par
\\vspace{4pt}
\\textbf{Beispiel:} ${latexEscape(a.beispiel)}\\par
${zeigeTipps ? `\\vspace{4pt}\\tippbox{${latexEscape(a.hinweis)}}` : ''}
${zeigeLoesung ? loesung : ''}
\\end{aufgabenbox}
${eigeneSeite && i < aufgaben.length - 1 ? '\\newpage' : '\\vspace{12pt}'}
`).join('\n');

  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[a4paper,margin=2.2cm]{geometry}
\\usepackage{xcolor}
\\usepackage{amssymb}
\\usepackage{pifont}
\\usepackage{mdframed}
\\usepackage{parskip}
\\usepackage{fancyhdr}

\\definecolor{cachegruen}{RGB}{45,90,39}
\\definecolor{cachegold}{RGB}{122,92,16}
\\definecolor{tippbg}{RGB}{244,244,244}

% Eine leere Lösungslinie zum Ausfüllen
\\newcommand{\\loesungslinie}{\\par\\vspace{14pt}\\noindent\\rule{\\linewidth}{0.3pt}}

% Tipp-Kasten für Cache-Owner
\\newcommand{\\tippbox}[1]{%
  \\begin{mdframed}[backgroundcolor=tippbg,linewidth=0pt,leftline=true,
    linecolor=cachegruen,innerleftmargin=8pt,innertopmargin=5pt,innerbottommargin=5pt]
    {\\small\\textbf{\\color{cachegruen}Tipp für Cache-Owner:} #1}
  \\end{mdframed}}

% Aufgaben-Rahmen
\\newenvironment{aufgabenbox}{%
  \\begin{mdframed}[linecolor=cachegruen!40,linewidth=0.5pt,
    innermargin=8pt,innertopmargin=8pt,innerbottommargin=8pt]}%
  {\\end{mdframed}}

% Aufgaben-Kopf: \\aufgabe{nr}{gesamt}{titel}{sterne}
\\newcommand{\\aufgabe}[4]{%
  \\begin{aufgabenbox}
  {\\footnotesize\\color{cachegruen}$\\square$\\; Aufgabe #1 / #2}\\hfill{\\color{cachegold}#4}\\par
  \\vspace{2pt}{\\large\\bfseries #3}\\par\\vspace{4pt}}

\\pagestyle{fancy}\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\fancyfoot[L]{\\footnotesize\\color{gray}GeoCachePlaner \\textperiodcentered{} Erstellt am ${datum}}
\\fancyfoot[R]{\\footnotesize\\color{gray}Seite \\thepage}

\\begin{document}

\\begin{center}
  {\\LARGE\\bfseries\\color{cachegruen} ${name}}\\\\[4pt]
  ${beschreibung ? `{\\small ${beschreibung}}\\\\[6pt]` : ''}
  {\\footnotesize Aufgaben: ${aufgaben.length} \\quad Gesamtzeit: ca. ${gesamtZeit} Min. \\quad Ø Schwierigkeit: ${avgSch}/5}
\\end{center}
\\vspace{6pt}
\\noindent Name: \\rule[-2pt]{5cm}{0.4pt}\\hfill Datum: \\rule[-2pt]{3cm}{0.4pt}
\\vspace{6pt}
\\hrule
\\vspace{14pt}

${aufgabenTex}

\\end{document}
`;
}

// Datei im Browser herunterladen
function downloadDatei(dateiname, inhalt, mime) {
  const blob = new Blob([inhalt], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = dateiname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportLatex() {
  const tex = buildLatex();
  if (!tex) return;
  const slug = (state.kursName || 'cachekurs')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'cachekurs';
  downloadDatei(`${slug}.tex`, tex, 'application/x-tex;charset=utf-8');
}

// === EVENT-LISTENER ===

function attachStaticListeners() {
  // Tab-Wechsel
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Kategorie-Chips (Event-Delegation)
  document.getElementById('kategorie-chips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const kat = chip.dataset.kat;
    if (state.aktiveKategorien.has(kat)) {
      state.aktiveKategorien.delete(kat);
      chip.classList.remove('aktiv');
      chip.setAttribute('aria-pressed', 'false');
    } else {
      state.aktiveKategorien.add(kat);
      chip.classList.add('aktiv');
      chip.setAttribute('aria-pressed', 'true');
    }
    renderBibliothek();
  });

  // Schwierigkeits-Slider
  const slider = document.getElementById('schwierigkeit-slider');
  const sliderLabel = document.getElementById('schwierigkeit-wert');
  slider.addEventListener('input', () => {
    state.maxSchwierigkeit = Number(slider.value);
    sliderLabel.textContent = `1–${slider.value}`;
    slider.setAttribute('aria-valuenow', slider.value);
    renderBibliothek();
  });

  // Aufgaben-Grid: Karte hinzufügen (Event-Delegation)
  document.getElementById('aufgaben-grid').addEventListener('click', e => {
    const btn = e.target.closest('.btn-kurs-add');
    if (btn && !btn.disabled) addToKurs(btn.dataset.id);
  });

  // Kurs-Liste: Aktionen (Event-Delegation)
  document.getElementById('kurs-liste').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const item = btn.closest('[data-id]');
    if (!item) return;
    const id = item.dataset.id;
    const action = btn.dataset.action;
    if (action === 'remove') removeFromKurs(id);
    else if (action === 'up')   moveInKurs(id, -1);
    else if (action === 'down') moveInKurs(id, +1);
  });

  // Drucken-Button
  document.getElementById('btn-drucken').addEventListener('click', printKurs);

  // LaTeX-Export
  document.getElementById('btn-latex').addEventListener('click', exportLatex);

  // Kurs leeren
  document.getElementById('btn-leeren').addEventListener('click', clearKurs);

  // Kursname
  document.getElementById('kurs-name').addEventListener('input', e => {
    state.kursName = e.target.value;
    saveToLocalStorage();
  });

  // Kursbeschreibung
  document.getElementById('kurs-beschreibung').addEventListener('input', e => {
    state.kursBeschreibung = e.target.value;
    saveToLocalStorage();
  });

  // Link-Button im leeren Kurs ("Gehe zur Bibliothek")
  document.querySelector('.kurs-leer-hint')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-tab-link]');
    if (btn) switchTab(btn.dataset.tabLink);
  });
}

// === INIT ===

document.addEventListener('DOMContentLoaded', async () => {
  const geladen = await loadAufgaben();
  if (!geladen) return;

  loadFromLocalStorage();
  renderKategorieChips();
  renderBibliothek();
  renderKursStats();

  // Kurs-Builder initial befüllen (auch wenn Tab versteckt)
  if (state.kursName) document.getElementById('kurs-name').value = state.kursName;
  if (state.kursBeschreibung) document.getElementById('kurs-beschreibung').value = state.kursBeschreibung;

  // Lade-Indikator entfernen
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) loadingIndicator.remove();

  attachStaticListeners();
});
