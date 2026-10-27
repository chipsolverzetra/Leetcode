// Interactive map. Uses Leaflet + OpenStreetMap tiles when Leaflet is loaded;
// otherwise draws a schematic SVG from the same station coordinates (used by the offline demo).

export const LINE_COLORS = {
  1: '#EE352E', 2: '#EE352E', 3: '#EE352E', 4: '#00933C', 5: '#00933C', 6: '#00933C', 7: '#B933AD',
  A: '#0039A6', C: '#0039A6', E: '#0039A6', B: '#FF6319', D: '#FF6319', F: '#FF6319', M: '#FF6319',
  G: '#6CBE45', J: '#996633', Z: '#996633', L: '#A7A9AC', N: '#FCCC0A', Q: '#FCCC0A', R: '#FCCC0A', W: '#FCCC0A',
  S: '#808183', SIR: '#0039A6', GS: '#808183', FS: '#808183', H: '#808183',
};
export const DARK_TEXT = new Set(['N', 'Q', 'R', 'W']);

// Simplified trunk paths through the bundled stations (schematic, not exact track geometry).
// With the full stations.json from `npm run build:stations`, swap these for GTFS shapes.txt.
const PATHS = [
  { color: LINE_COLORS[1], stops: ['101', '112', '120', '125', '127', '128', '137', '142'] },
  { color: LINE_COLORS[2], stops: ['201', '120', '127', '128', '137', '229', '235', '247'] },
  { color: LINE_COLORS[4], stops: ['621', '626', '631', '635', '640', '418'] },
  { color: LINE_COLORS[7], stops: ['701', 'G14', '719', '723', '725', '726'] },
  { color: LINE_COLORS.A, stops: ['A09', 'A24', 'A27', 'A28', 'A32', 'A38', 'A40', 'A41'] },
  { color: LINE_COLORS.E, stops: ['G05', 'G14', 'F12', 'A27'] },
  { color: LINE_COLORS.F, stops: ['G14', 'B04', 'D17', 'D20', 'A41', 'D43'] },
  { color: LINE_COLORS.B, stops: ['A24', 'D17', 'D20'] },
  { color: LINE_COLORS.N, stops: ['R01', 'R16', 'R17', 'R20', 'D43'] },
  { color: LINE_COLORS.Q, stops: ['Q03', 'R16'] },
  { color: LINE_COLORS.L, stops: ['L03', 'L08'] },
  { color: LINE_COLORS.G, stops: ['G22', 'L08'] },
  { color: LINE_COLORS.J, stops: ['G05', 'A38'] },
];

export function createMap(el, stations, { onSelect, isFlagged = () => false }) {
  const byId = new Map(stations.map((s) => [s.id, s]));
  if (window.L) return leafletMap(el, stations, byId, onSelect, isFlagged);
  return schematicMap(el, stations, byId, onSelect, isFlagged);
}

function leafletMap(el, stations, byId, onSelect, isFlagged) {
  const L = window.L;
  const map = L.map(el, { zoomControl: true }).setView([40.735, -73.95], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18, attribution: '&copy; OpenStreetMap contributors · Transit data: MTA',
  }).addTo(map);
  for (const p of PATHS) {
    const pts = p.stops.map((id) => byId.get(id)).filter(Boolean).map((s) => [s.lat, s.lon]);
    L.polyline(pts, { color: p.color, weight: 4, opacity: 0.85 }).addTo(map);
  }
  const markers = new Map();
  for (const s of stations) {
    const m = L.circleMarker([s.lat, s.lon], { radius: 5, color: isFlagged(s) ? '#c0262d' : '#15171a', weight: 2, fillColor: '#fff', fillOpacity: 1 })
      .bindTooltip(s.name).on('click', () => onSelect(s)).addTo(map);
    markers.set(s.id, m);
  }
  return {
    select(s) { map.setView([s.lat, s.lon], Math.max(map.getZoom(), 14)); markers.forEach((m, id) => m.setStyle({ fillColor: id === s.id ? '#15171a' : '#fff' })); },
    refresh() { stations.forEach((s) => markers.get(s.id)?.setStyle({ color: isFlagged(s) ? '#c0262d' : '#15171a' })); },
  };
}

function schematicMap(el, stations, byId, onSelect, isFlagged) {
  // Schematic: stretch each axis independently so the dense Manhattan core gets room.
  const W = 720; const H = 640; const pad = 30;
  const lats = stations.map((s) => s.lat); const lons = stations.map((s) => s.lon);
  const [minLat, maxLat, minLon, maxLon] = [Math.min(...lats), Math.max(...lats), Math.min(...lons), Math.max(...lons)];
  const x = (lon) => pad + ((lon - minLon) / (maxLon - minLon)) * (W - pad * 2 - 90);
  const y = (lat) => pad + ((maxLat - lat) / (maxLat - minLat)) * (H - pad * 2);
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'schematic'); svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Schematic subway map');
  const bg = document.createElementNS(NS, 'rect'); bg.setAttribute('class', 'water');
  bg.setAttribute('width', W); bg.setAttribute('height', H); svg.appendChild(bg);

  const shown = new Set();
  for (const p of PATHS) {
    const pts = p.stops.map((id) => byId.get(id)).filter(Boolean);
    const pl = document.createElementNS(NS, 'polyline');
    pl.setAttribute('points', pts.map((s) => `${x(s.lon).toFixed(1)},${y(s.lat).toFixed(1)}`).join(' '));
    pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', p.color); pl.setAttribute('stroke-width', '5');
    pl.setAttribute('stroke-linejoin', 'round'); pl.setAttribute('stroke-linecap', 'round'); pl.setAttribute('opacity', '0.9');
    svg.appendChild(pl);
  }
  const groups = new Map();
  for (const s of stations) {
    const key = `${s.name}`; // merge station complexes that share a name at one dot
    if (shown.has(key) && groups.get(key)) { groups.get(key).ids.push(s.id); continue; }
    shown.add(key);
    const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'stn'); g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button'); g.setAttribute('aria-label', s.name);
    const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', x(s.lon)); c.setAttribute('cy', y(s.lat)); c.setAttribute('r', '5.5');
    g.appendChild(c);
    const label = document.createElementNS(NS, 'text'); label.setAttribute('x', x(s.lon) + 8); label.setAttribute('y', y(s.lat) + 3.5);
    label.textContent = s.name.replace(/-.*$/, '').replace(/ St$/, ' St');
    g.appendChild(label);
    const pick = () => onSelect(s);
    g.addEventListener('click', pick);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    svg.appendChild(g);
    groups.set(key, { g, ids: [s.id], s });
  }
  // Hide labels that would collide, keeping the first drawn.
  const boxes = [];
  groups.forEach(({ g }) => {
    const t = g.querySelector('text'); const tx = +t.getAttribute('x'); const ty = +t.getAttribute('y');
    const w = t.textContent.length * 5.6; const box = [tx, ty - 9, tx + w, ty + 2];
    if (boxes.some((b) => !(box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3])) || box[2] > W) t.style.display = 'none';
    else boxes.push(box);
  });
  el.replaceChildren(svg);
  const refresh = () => groups.forEach(({ g, s }) => g.classList.toggle('out', isFlagged(s)));
  refresh();
  return {
    select(s) { groups.forEach(({ g, s: gs }) => g.classList.toggle('sel', gs.name === s.name)); },
    refresh,
  };
}
