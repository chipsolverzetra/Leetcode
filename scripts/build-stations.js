// Builds public/data/stations.json from the MTA's static subway GTFS (no key needed).
// Usage: npm run build:stations
// Output: [{ id, name, lat, lon, routes: [...], ada }] for every parent station.

import AdmZip from 'adm-zip';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUBWAY_STATIC_GTFS_URL } from '../server/feeds.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'data', 'stations.json');

function parseCsv(text) {
  const [head, ...lines] = text.replace(/\r/g, '').split('\n').filter(Boolean);
  const cols = head.split(',');
  return lines.map((line) => {
    const cells = []; let cur = ''; let q = false;
    for (const ch of line) {
      if (ch === '"') q = !q; else if (ch === ',' && !q) { cells.push(cur); cur = ''; } else cur += ch;
    }
    cells.push(cur);
    return Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
  });
}

const res = await fetch(SUBWAY_STATIC_GTFS_URL);
if (!res.ok) throw new Error(`Static GTFS download failed: HTTP ${res.status}`);
const zip = new AdmZip(Buffer.from(await res.arrayBuffer()));
const read = (f) => parseCsv(zip.readAsText(f));

const stops = read('stops.txt');
const trips = new Map(read('trips.txt').map((t) => [t.trip_id, t.route_id]));
const routesByStop = new Map();
for (const st of read('stop_times.txt')) {
  const parent = st.stop_id.replace(/[NS]$/, '');
  const route = trips.get(st.trip_id);
  if (!route) continue;
  if (!routesByStop.has(parent)) routesByStop.set(parent, new Set());
  routesByStop.get(parent).add(route);
}

const stations = stops
  .filter((s) => s.location_type === '1')
  .map((s) => ({
    id: s.stop_id,
    name: s.stop_name,
    lat: Number(s.stop_lat),
    lon: Number(s.stop_lon),
    routes: [...(routesByStop.get(s.stop_id) || [])].sort(),
    ada: s.wheelchair_boarding === '1',
  }));

await writeFile(OUT, JSON.stringify(stations));
console.log(`Wrote ${stations.length} stations to ${OUT}`);
