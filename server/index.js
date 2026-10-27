// NYC Transit Hub API server.
// Proxies MTA feeds (which send protobuf and don't allow browser CORS), caches them,
// converts them to small JSON payloads, and serves the static frontend.

import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import {
  SUBWAY_FEEDS, ALERTS_URL, ELEVATOR_CURRENT_URL, ELEVATOR_UPCOMING_URL,
  BUS_STOP_MONITORING_URL, feedForRoute,
} from './feeds.js';
import { normalizeAlerts, lineStatuses, normalizeOutages, arrivalsAtStop, busArrivals } from './transform.js';
import { sampleAlerts, sampleOutages, sampleTripFeed } from './sample-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const TTL = Number(process.env.CACHE_TTL_SECONDS || 30) * 1000;
const USE_SAMPLE = process.env.USE_SAMPLE_DATA === '1';
const BUS_KEY = process.env.MTA_BUS_API_KEY || '';

const { transit_realtime: rt } = GtfsRealtimeBindings;

// ---- tiny TTL cache with in-flight de-duplication ----
const cache = new Map();
async function cached(key, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  if (hit?.pending) return hit.pending;
  const pending = loader()
    .then((value) => { cache.set(key, { at: Date.now(), value }); return value; })
    .catch((err) => { cache.delete(key); throw err; });
  cache.set(key, { ...(hit || {}), pending });
  return pending;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    // Never leak query strings (the bus URL carries the API key) into errors:
    // bus errors are returned to the client, and all errors land in server logs.
    const u = new URL(url);
    throw new Error(`${u.origin}${u.pathname} -> HTTP ${res.status}`);
  }
  return res.json();
}

async function fetchGtfsRt(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const u = new URL(url);
    throw new Error(`${u.origin}${u.pathname} -> HTTP ${res.status}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  return rt.FeedMessage.toObject(rt.FeedMessage.decode(buf), { longs: Number });
}

// Try live data; on failure fall back to sample data and say so in the payload.
async function withFallback(liveFn, sampleFn) {
  if (USE_SAMPLE) return { source: 'sample', data: await sampleFn() };
  try {
    return { source: 'live', data: await liveFn() };
  } catch (err) {
    console.warn('[mta] upstream failed, serving sample data:', err.message);
    return { source: 'sample', data: await sampleFn(), warning: 'MTA feed unreachable; showing sample data.' };
  }
}

const app = express();
app.use(compression());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, sample: USE_SAMPLE, busKey: Boolean(BUS_KEY) }));

// Service status dashboard: one status per line plus the alert list.
app.get('/api/status', async (req, res) => {
  const lang = String(req.query.lang || 'en');
  const r = await withFallback(
    () => cached('alerts', () => fetchJson(ALERTS_URL)),
    () => sampleAlerts(),
  );
  const alerts = normalizeAlerts(r.data, { lang });
  res.json({ source: r.source, warning: r.warning, updatedAt: Date.now(), lines: lineStatuses(alerts), alerts });
});

// Elevator and escalator outages (current + upcoming).
app.get('/api/accessibility', async (req, res) => {
  const r = await withFallback(
    async () => {
      const [cur, up] = await Promise.all([
        cached('ene', () => fetchJson(ELEVATOR_CURRENT_URL)),
        cached('ene-up', () => fetchJson(ELEVATOR_UPCOMING_URL)).catch(() => []),
      ]);
      return [...normalizeOutages(cur), ...normalizeOutages(up).map((o) => ({ ...o, upcoming: true }))];
    },
    () => normalizeOutages(sampleOutages()),
  );
  const station = String(req.query.station || '').toLowerCase();
  const outages = station ? r.data.filter((o) => o.station?.toLowerCase().includes(station)) : r.data;
  res.json({ source: r.source, warning: r.warning, updatedAt: Date.now(), outages });
});

// Subway arrivals at a parent stop: /api/arrivals?stop=127&routes=1,2,3
app.get('/api/arrivals', async (req, res) => {
  const stop = String(req.query.stop || '').toUpperCase();
  const routes = String(req.query.routes || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!/^[A-Z0-9]{3}$/.test(stop) || routes.length === 0) {
    return res.status(400).json({ error: 'Pass stop (3-character GTFS parent stop id, e.g. 127) and routes (e.g. 1,2,3).' });
  }
  const feedIds = [...new Set(routes.map(feedForRoute).filter(Boolean))];
  const r = await withFallback(
    async () => {
      const feeds = await Promise.all(feedIds.map((id) => cached(`rt:${id}`, () => fetchGtfsRt(SUBWAY_FEEDS[id]))));
      return { entity: feeds.flatMap((f) => f.entity || []) };
    },
    () => sampleTripFeed(routes, stop),
  );
  res.json({ source: r.source, warning: r.warning, updatedAt: Date.now(), stop, arrivals: arrivalsAtStop(r.data, stop) });
});

// Bus arrivals at a stop: /api/bus/arrivals?stop=308209&line=MTA%20NYCT_B63
app.get('/api/bus/arrivals', async (req, res) => {
  if (!BUS_KEY) return res.status(501).json({ error: 'Bus arrivals need MTA_BUS_API_KEY. Get a free key at https://register.developer.obanyc.com/' });
  const stop = String(req.query.stop || '');
  if (!/^\d{6}$/.test(stop)) return res.status(400).json({ error: 'Pass stop as a 6-digit MTA bus stop code.' });
  const qs = new URLSearchParams({ key: BUS_KEY, version: '2', OperatorRef: 'MTA', MonitoringRef: stop });
  if (req.query.line) qs.set('LineRef', String(req.query.line));
  try {
    const siri = await cached(`bus:${qs}`, () => fetchJson(`${BUS_STOP_MONITORING_URL}?${qs}`));
    res.json({ source: 'live', updatedAt: Date.now(), stop, arrivals: busArrivals(siri) });
  } catch (err) {
    res.status(502).json({ error: `Bus Time request failed: ${err.message}` });
  }
});

app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '5m' }));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => console.log(`NYC Transit Hub on http://localhost:${PORT}${USE_SAMPLE ? ' (sample data)' : ''}`));
}

export default app;
