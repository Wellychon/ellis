#!/usr/bin/env bash
# Folha de contato dos stills: scripts/folha.sh saida.png 20 60 110 ...
out=$1; shift
files=(); for f in "$@"; do files+=("out/stills/f$(printf %04d "$f").png"); done
montage "${files[@]}" -tile x1 -geometry 360x640+4+4 -background '#333' "$out"
