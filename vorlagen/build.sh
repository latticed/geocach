#!/usr/bin/env bash
# ============================================================
#  Baut die Druckvorlage aufgabenkarten.pdf
#    1. erzeugt aufgaben-data.tex aus data/aufgaben.json
#    2. kompiliert das PDF mit pdflatex (zweimal wg. Layout)
#
#  Aufruf (aus dem Projektordner ODER aus vorlagen/):
#     bash vorlagen/build.sh
#
#  Voraussetzungen: node, pdflatex (TeX Live mit tikz/tcolorbox/pifont)
# ============================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"

echo "1/2  Daten erzeugen ..."
node "$HERE/build-aufgaben-tex.js"

echo "2/2  PDF kompilieren ..."
cd "$HERE"
pdflatex -interaction=nonstopmode -halt-on-error aufgabenkarten.tex >/dev/null
pdflatex -interaction=nonstopmode -halt-on-error aufgabenkarten.tex >/dev/null

# Hilfsdateien aufräumen
rm -f aufgabenkarten.aux aufgabenkarten.log aufgabenkarten.out

echo "Fertig: vorlagen/aufgabenkarten.pdf"
