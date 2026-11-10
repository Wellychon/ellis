// Gera src/data/land-dots.json: grade de pontos (lon, lat) que caem em terra.
// Fonte: Natural Earth 110m (domínio público) via world-atlas.
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import { geoContains } from "d3-geo";

const topo = JSON.parse(
  readFileSync(new URL("../node_modules/world-atlas/land-110m.json", import.meta.url)),
);
const land = feature(topo, topo.objects.land);
const PASSO = 2;
const dots = [];
for (let lat = 76; lat >= -56; lat -= PASSO) {
  for (let lon = -180; lon < 180; lon += PASSO) {
    if (geoContains(land, [lon, lat])) dots.push([lon, lat]);
  }
}
writeFileSync(new URL("../src/data/land-dots.json", import.meta.url), JSON.stringify(dots));
console.log(`${dots.length} pontos de terra`);
