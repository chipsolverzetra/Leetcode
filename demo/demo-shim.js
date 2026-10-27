// Runs the real frontend with no server: the API and account store are replaced
// by in-page versions that use the same transform code over bundled sample data.
import { normalizeAlerts, lineStatuses, normalizeOutages, arrivalsAtStop } from '../server/transform.js';
import { sampleAlerts, sampleOutages, sampleTripFeed } from '../server/sample-data.js';
import stations from '../public/data/stations.json';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
window.__TRANSIT_API__ = {
  async status() { await wait(120); const alerts = normalizeAlerts(sampleAlerts()); return { source: 'demo', updatedAt: Date.now(), lines: lineStatuses(alerts), alerts }; },
  async accessibility() { await wait(120); return { source: 'demo', updatedAt: Date.now(), outages: normalizeOutages(sampleOutages()) }; },
  async arrivals(stop, routes) { await wait(200); const now = Date.now(); return { source: 'demo', stop, arrivals: arrivalsAtStop(sampleTripFeed(routes, stop, now), stop, { now }) }; },
  async stations() { return stations; },
};

const KEY = 'nyc-transit-hub:demo-favorites';
let user = null; const subs = new Set();
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
let favs = read() || { lines: ['A', 'G', '7'], stations: ['Times Sq-42 St', 'Jay St-MetroTech'], notify: false };
const emit = () => subs.forEach((cb) => cb(user));
window.__TRANSIT_STORE__ = {
  accountsEnabled: () => true,
  currentUser: () => user,
  onAuthChange: (cb) => { subs.add(cb); cb(user); return () => subs.delete(cb); },
  async loadFavorites() { return { ...favs }; },
  async saveFavorites(f) { favs = { ...f }; try { localStorage.setItem(KEY, JSON.stringify(favs)); } catch { /* storage blocked */ } },
  async signIn(email) { await wait(300); user = { uid: 'demo', email: `${email} (demo account)` }; emit(); },
  async signUp(email) { return this.signIn(email); },
  async signInWithGoogle() { await wait(300); user = { uid: 'demo', email: 'Google account (demo)' }; emit(); },
  async signOut() { user = null; emit(); },
};
