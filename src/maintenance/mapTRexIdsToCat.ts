import pkg from 'fs-jetpack';

const { read, path, write } = pkg;

const ids = read(path('./src/maintenance/trexid_catid_mapping.csv'), 'utf8');

const lines = ids!.split('\n');
lines.shift();

const demap = new Map();
const frmap = new Map();
const gbmap = new Map();
const esmap = new Map();

lines.forEach((line) => {
  const [catId, dem, fr, gb, es] = line.split(',');
  demap.set(Number(catId), dem.trim());
  frmap.set(Number(catId), fr.trim());
  gbmap.set(Number(catId), gb.trim());
  esmap.set(Number(catId), es.trim());
});

[
  { nm: 'de', map: demap },
  { nm: 'fr', map: frmap },
  { nm: 'gb', map: gbmap },
  { nm: 'es', map: esmap },
].map((country) => {
  write(
    path(`./src/maintenance/scCategory${country.nm}Mapping.json`),
    JSON.stringify(Array.from(country.map.entries()))
  );
});
