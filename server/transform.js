// Pure functions that turn raw MTA payloads into the app's JSON shapes.
// Kept free of I/O so they can be unit tested against sample data.

import { SUBWAY_LINES } from './feeds.js';

const SEVERITY = { suspended: 3, delays: 2, changes: 1, good: 0 };

const pickText = (t, lang = 'en') => {
  const list = t?.translation || [];
  return (list.find((x) => x.language === lang) || list.find((x) => !x.language || x.language === 'en') || list[0])?.text || '';
};

// Classify an MTA "Mercury" alert_type (e.g. "Delays", "Part Suspended", "Planned - Reroute").
export function classifyAlertType(type = '', header = '') {
  const s = `${type} ${header}`.toLowerCase();
  if (/suspend|no .* service|not running/.test(s)) return 'suspended';
  if (/delay|slow speeds|running with/.test(s)) return 'delays';
  return 'changes';
}

function isActive(periods, nowSec) {
  if (!periods || periods.length === 0) return true;
  return periods.some((p) => (!p.start || p.start <= nowSec) && (!p.end || p.end >= nowSec));
}

// GTFS-RT JSON alerts (camsys feeds) -> flat list of active alerts.
export function normalizeAlerts(feedJson, { now = Date.now(), lang = 'en' } = {}) {
  const nowSec = Math.floor(now / 1000);
  const out = [];
  for (const e of feedJson?.entity || []) {
    const a = e.alert;
    if (!a || !isActive(a.active_period, nowSec)) continue;
    const mercury = a['transit_realtime.mercury_alert'] || {};
    const header = pickText(a.header_text, lang);
    const routes = [...new Set((a.informed_entity || []).map((ie) => ie.route_id).filter(Boolean))];
    const stops = [...new Set((a.informed_entity || []).map((ie) => ie.stop_id).filter(Boolean))];
    out.push({
      id: e.id,
      type: mercury.alert_type || '',
      category: classifyAlertType(mercury.alert_type, header),
      header,
      description: pickText(a.description_text, lang),
      routes,
      stops,
      updatedAt: mercury.updated_at ? mercury.updated_at * 1000 : null,
    });
  }
  return out;
}

// Roll alerts up to one status per subway line for the dashboard.
export function lineStatuses(alerts) {
  return SUBWAY_LINES.map((line) => {
    const mine = alerts.filter((a) => a.routes.some((r) => r === line.id || (line.id === 'S' && /^(GS|FS|H)$/.test(r)) || (line.id === 'SIR' && r === 'SI')));
    const worst = mine.reduce((acc, a) => (SEVERITY[a.category] > SEVERITY[acc] ? a.category : acc), 'good');
    return { ...line, status: worst, alertCount: mine.length, alerts: mine.map((a) => a.id) };
  });
}

// nyct_ene.json -> elevator / escalator outages.
export function normalizeOutages(rows = []) {
  const list = Array.isArray(rows) ? rows : rows?.outages || [];
  return list.map((r) => ({
    station: r.station,
    borough: r.borough,
    lines: String(r.trainno || '').split('/').filter(Boolean),
    equipment: r.equipment,
    type: r.equipmenttype === 'EL' ? 'elevator' : r.equipmenttype === 'ES' ? 'escalator' : (r.equipmenttype || 'other'),
    serving: r.serving,
    ada: r.ADA === 'Y',
    reason: r.reason,
    since: r.outagedate,
    estimatedReturn: r.estimatedreturntoservice,
    upcoming: r.isupcomingoutage === 'Y',
    maintenance: r.ismaintenanceoutage === 'Y',
  }));
}

// Decoded GTFS-RT FeedMessage -> upcoming arrivals at a parent stop (e.g. "127" for Times Sq 1/2/3).
export function arrivalsAtStop(feed, parentStopId, { now = Date.now(), limit = 8 } = {}) {
  const nowSec = Math.floor(now / 1000);
  const rows = [];
  for (const e of feed?.entity || []) {
    const tu = e.tripUpdate;
    if (!tu) continue;
    for (const stu of tu.stopTimeUpdate || []) {
      const sid = String(stu.stopId || '');
      if (sid.slice(0, -1) !== parentStopId && sid !== parentStopId) continue;
      const t = Number(stu.arrival?.time ?? stu.departure?.time ?? 0);
      if (!t || t < nowSec - 30) continue;
      rows.push({
        route: tu.trip?.routeId,
        direction: sid.endsWith('N') ? 'N' : sid.endsWith('S') ? 'S' : '',
        stopId: sid,
        arrival: t * 1000,
        minutes: Math.max(0, Math.round((t - nowSec) / 60)),
        tripId: tu.trip?.tripId,
      });
    }
  }
  rows.sort((a, b) => a.arrival - b.arrival);
  const byDir = { N: rows.filter((r) => r.direction === 'N').slice(0, limit), S: rows.filter((r) => r.direction === 'S').slice(0, limit) };
  return byDir;
}

// SIRI StopMonitoring JSON -> bus arrivals.
export function busArrivals(siri) {
  const visits = siri?.Siri?.ServiceDelivery?.StopMonitoringDelivery?.[0]?.MonitoredStopVisit || [];
  return visits.map((v) => {
    const j = v.MonitoredVehicleJourney || {};
    const call = j.MonitoredCall || {};
    return {
      route: [].concat(j.PublishedLineName || [])[0],
      destination: [].concat(j.DestinationName || [])[0],
      expected: call.ExpectedArrivalTime || call.AimedArrivalTime || null,
      distance: call.Extensions?.Distances?.PresentableDistance || null,
      stopsAway: call.Extensions?.Distances?.StopsFromCall ?? null,
      vehicle: j.VehicleRef,
      location: j.VehicleLocation ? { lat: j.VehicleLocation.Latitude, lon: j.VehicleLocation.Longitude } : null,
    };
  });
}
