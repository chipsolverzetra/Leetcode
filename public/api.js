// Thin client for the server's /api routes.
// The standalone demo swaps this out by defining window.__TRANSIT_API__ before the app loads.

async function get(path) {
  const res = await fetch(path, { headers: { Accept: 'application/json' } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

const httpApi = {
  status: (lang) => get(`/api/status?lang=${encodeURIComponent(lang)}`),
  accessibility: () => get('/api/accessibility'),
  arrivals: (stop, routes) => get(`/api/arrivals?stop=${encodeURIComponent(stop)}&routes=${encodeURIComponent(routes.join(','))}`),
  stations: () => get('/data/stations.json'),
};

export const api = (typeof window !== 'undefined' && window.__TRANSIT_API__) || httpApi;
