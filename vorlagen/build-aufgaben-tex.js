#!/usr/bin/env node
/* ============================================================
 * GeoCachePlaner — Generator: data/aufgaben.json  ->  aufgaben-data.tex
 *
 * Erzeugt aus der zentralen Aufgaben-Datenquelle eine LaTeX-Datei,
 * die von aufgabenkarten.tex eingebunden wird. So bleiben Website
 * und Druckvorlage immer auf demselben Stand.
 *
 * Aufruf (aus dem Projektordner):
 *     node vorlagen/build-aufgaben-tex.js
 * ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'data', 'aufgaben.json');
const OUT = path.join(__dirname, 'aufgaben-data.tex');

/** LaTeX-Sonderzeichen maskieren und einige Unicode-Symbole ersetzen. */
function tex(str) {
  if (str == null) return '';
  let s = String(str);
  // Zuerst der Backslash, danach die restlichen Sonderzeichen.
  s = s.replace(/\\/g, '\\textbackslash{}');
  s = s.replace(/([&%$#_{}])/g, '\\$1');
  s = s.replace(/\^/g, '\\textasciicircum{}');
  s = s.replace(/~/g, '\\textasciitilde{}');
  // Mathematisch/typografische Symbole, die im Textmodus stören.
  s = s.replace(/×/g, '$\\times$');
  s = s.replace(/→/g, '$\\rightarrow$');
  s = s.replace(/…/g, '\\dots{}');
  return s;
}

/** Schwierigkeit (1-5) als gefüllte/leere Punkte. */
function sterne(n) {
  const v = Math.max(0, Math.min(5, parseInt(n, 10) || 0));
  return `\\schwierigkeit{${v}}`;
}

const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const aufgaben = data.aufgaben || [];

const lines = [];
lines.push('% =====================================================');
lines.push('% AUTOMATISCH ERZEUGT aus data/aufgaben.json');
lines.push('% Nicht von Hand bearbeiten – stattdessen:');
lines.push('%     node vorlagen/build-aufgaben-tex.js');
lines.push('% =====================================================');
lines.push('');

for (const a of aufgaben) {
  lines.push('\\aufgabenkarte{%');
  lines.push(`  ${tex(a.id)}% nr`);
  lines.push('}{%');
  lines.push(`  ${tex(a.titel)}% titel`);
  lines.push('}{%');
  lines.push(`  ${tex(a.kategorie)}% kategorie`);
  lines.push('}{%');
  lines.push(`  ${sterne(a.schwierigkeit)}% schwierigkeit`);
  lines.push('}{%');
  lines.push(`  ${tex(a.zeitaufwand)}% zeit (min)`);
  lines.push('}{%');
  lines.push(`  ${tex(a.beschreibung)}% beschreibung`);
  lines.push('}{%');
  lines.push(`  ${tex(a.hinweis)}% hinweis`);
  lines.push('}{%');
  lines.push(`  ${tex(a.beispiel)}% beispiel`);
  lines.push('}');
  lines.push('');
}

fs.writeFileSync(OUT, lines.join('\n'));
console.log(`OK: ${aufgaben.length} Aufgaben -> ${path.relative(ROOT, OUT)}`);
