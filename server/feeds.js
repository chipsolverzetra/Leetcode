// MTA feed catalogue. Subway, alerts and elevator/escalator feeds are open (no key).
// Bus Time SIRI needs MTA_BUS_API_KEY.

const BASE = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds';

export const SUBWAY_FEEDS = {
  '123456S': `${BASE}/nyct%2Fgtfs`,
  ACE: `${BASE}/nyct%2Fgtfs-ace`,
  BDFM: `${BASE}/nyct%2Fgtfs-bdfm`,
  G: `${BASE}/nyct%2Fgtfs-g`,
  JZ: `${BASE}/nyct%2Fgtfs-jz`,
  L: `${BASE}/nyct%2Fgtfs-l`,
  NQRW: `${BASE}/nyct%2Fgtfs-nqrw`,
  SI: `${BASE}/nyct%2Fgtfs-si`,
};

export const ALERTS_URL = `${BASE}/camsys%2Fsubway-alerts.json`;
export const ALL_ALERTS_URL = `${BASE}/camsys%2Fall-alerts.json`;
export const ELEVATOR_CURRENT_URL = `${BASE}/nyct%2Fnyct_ene.json`;
export const ELEVATOR_UPCOMING_URL = `${BASE}/nyct%2Fnyct_ene_upcoming.json`;
export const ELEVATOR_EQUIPMENT_URL = `${BASE}/nyct%2Fnyct_ene_equipments.json`;
export const BUS_STOP_MONITORING_URL = 'https://bustime.mta.info/api/siri/stop-monitoring.json';
export const BUS_VEHICLE_MONITORING_URL = 'https://bustime.mta.info/api/siri/vehicle-monitoring.json';
export const SUBWAY_STATIC_GTFS_URL = 'https://web.mta.info/developers/data/nyct/subway/google_transit.zip';

// Every subway service the dashboard tracks, with its official trunk colour.
export const SUBWAY_LINES = [
  { id: '1', color: '#EE352E' }, { id: '2', color: '#EE352E' }, { id: '3', color: '#EE352E' },
  { id: '4', color: '#00933C' }, { id: '5', color: '#00933C' }, { id: '6', color: '#00933C' },
  { id: '7', color: '#B933AD' },
  { id: 'A', color: '#0039A6' }, { id: 'C', color: '#0039A6' }, { id: 'E', color: '#0039A6' },
  { id: 'B', color: '#FF6319' }, { id: 'D', color: '#FF6319' }, { id: 'F', color: '#FF6319' }, { id: 'M', color: '#FF6319' },
  { id: 'G', color: '#6CBE45' },
  { id: 'J', color: '#996633' }, { id: 'Z', color: '#996633' },
  { id: 'L', color: '#A7A9AC' },
  { id: 'N', color: '#FCCC0A', dark: true }, { id: 'Q', color: '#FCCC0A', dark: true },
  { id: 'R', color: '#FCCC0A', dark: true }, { id: 'W', color: '#FCCC0A', dark: true },
  { id: 'S', color: '#808183' },
  { id: 'SIR', color: '#0039A6' },
];

// Which realtime feed carries a given route_id.
export function feedForRoute(routeId) {
  const r = String(routeId).toUpperCase();
  if (/^(1|2|3|4|5|6|6X|7|7X|GS|S)$/.test(r)) return '123456S';
  if (/^(A|C|E|H|FS|SF|SR)$/.test(r)) return 'ACE';
  if (/^(B|D|F|FX|M)$/.test(r)) return 'BDFM';
  if (r === 'G') return 'G';
  if (/^(J|Z)$/.test(r)) return 'JZ';
  if (r === 'L') return 'L';
  if (/^(N|Q|R|W)$/.test(r)) return 'NQRW';
  if (/^(SI|SIR)$/.test(r)) return 'SI';
  return null;
}
