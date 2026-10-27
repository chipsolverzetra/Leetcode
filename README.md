# NYC Transit Hub

A web app for real-time New York City subway status, train arrivals, station accessibility and personal alerts, built on the MTA's open data feeds (api.mta.info).

## Features

| Feature | How it works |
|---|---|
| **Service status dashboard** | Pulls the MTA subway alerts feed, keeps only active alerts, and rolls them up into one status per line (Good service / Service change / Delays / Suspended). Refreshes every 60 s. |
| **Interactive map** | Leaflet + OpenStreetMap with stations and trunk lines. Click or search a station to see its lines, step-free status, elevator outages and the next trains in each direction. Falls back to a schematic SVG map when Leaflet is unavailable. |
| **Real-time arrivals** | The server decodes the MTA's GTFS-realtime protobuf feeds (one per line group) and returns the next trains at a station, split uptown / downtown. |
| **Accessibility** | Current and planned elevator/escalator outages from the MTA E&E feeds, with an "accessible routes only" filter. Outage stations are flagged on the map. |
| **Favorites and alerts** | Star lines or stations. Turn on alerts to get a browser notification (or in-page toast) when a saved line's status changes. |
| **Multilingual** | English, Spanish, Chinese, Russian, Bengali and Korean UI. The language is sent to the server so MTA alert text is returned in that language where the feed provides it. |
| **User accounts** | Firebase Authentication (email/password and Google). Favorites sync to Firestore at `users/{uid}`; without Firebase config they are stored in the browser. |
| **Bus arrivals (API)** | `/api/bus/arrivals` wraps MTA Bus Time SIRI StopMonitoring. Needs a free key. |

## Architecture

```
Browser (public/)                Node server (server/)                 MTA
─────────────────               ──────────────────────                ─────
index.html, app.js  ── /api ──▶  Express + 30 s cache  ── HTTPS ──▶   GTFS-RT subway feeds (protobuf)
i18n.js, map.js                  transform.js (pure)                  camsys subway-alerts.json
store.js ──────────▶ Firebase    sample-data.js (fallback)            nyct_ene*.json (elevators)
                     Auth + Firestore                                  bustime SIRI (key)
```

The server exists because the MTA feeds are protobuf and don't send CORS headers, so a browser can't read them directly. It also caches responses so many users share one upstream call per feed per 30 seconds. If an upstream call fails, the API returns bundled sample data and marks the response `"source": "sample"` so the UI can label it.

## Quick start

```bash
npm install
cp .env.example .env        # optional: add MTA_BUS_API_KEY
npm run build:stations      # downloads MTA static GTFS → full public/data/stations.json
npm start                   # http://localhost:3000
```

- `npm run sample` runs fully offline on sample data.
- `npm test` runs the unit tests for the feed transforms.
- `npm run demo` builds `dist/nyc-transit-hub-demo.html`, a single offline file with the real frontend and sample data.

The repo ships with a 46-station sample `stations.json` (major complexes, approximate coordinates). Run `npm run build:stations` for all ~490 stations.

### Firebase setup

1. Create a Firebase project, add a Web app, enable **Email/Password** and **Google** sign-in.
2. Create a Firestore database and deploy `firestore.rules` (each user can only read/write their own document).
3. Paste the web config into `public/firebase-config.js`.

## API

| Route | Returns |
|---|---|
| `GET /api/status?lang=en` | `{ lines: [{ id, color, status, alertCount }], alerts: [...] }` |
| `GET /api/accessibility?station=jay` | `{ outages: [{ station, lines, type, serving, ada, upcoming, estimatedReturn }] }` |
| `GET /api/arrivals?stop=127&routes=1,2,3` | `{ arrivals: { N: [...], S: [...] } }` with `route`, `minutes`, `arrival` |
| `GET /api/bus/arrivals?stop=308209&line=MTA%20NYCT_B63` | Bus arrivals (needs `MTA_BUS_API_KEY`) |
| `GET /api/health` | Server and key status |

Every response includes `source: "live" | "sample"` and `updatedAt`.

## MTA data sources

- Subway GTFS-realtime (no key): `api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs[-ace|-bdfm|-g|-jz|-l|-nqrw|-si]`
- Subway alerts (no key): `.../camsys%2Fsubway-alerts.json`
- Elevators & escalators (no key): `.../nyct%2Fnyct_ene.json`, `nyct_ene_upcoming.json`, `nyct_ene_equipments.json`
- Bus Time SIRI (free key): `bustime.mta.info/api/siri/stop-monitoring.json` — register at register.developer.obanyc.com
- Static subway GTFS: `web.mta.info/developers/data/nyct/subway/google_transit.zip`

Use of MTA data is subject to the MTA Data Feed Agreement; MTA logos and route symbols need a separate license for public release.

## Roadmap

- Push alerts while the app is closed (Firebase Cloud Messaging + a scheduled Cloud Function that diffs line status).
- Live bus positions on the map (SIRI VehicleMonitoring) and LIRR / Metro-North feeds.
- Real track geometry from GTFS `shapes.txt` instead of trunk-line sketches.
- Trip planner that avoids stations with active elevator outages.
- PWA install and offline caching of the last known status.

## Project layout

```
server/      index.js (Express API), feeds.js (URLs, line colours), transform.js (pure parsers), sample-data.js
public/      index.html, app.js, api.js, map.js, store.js (Firebase), i18n.js, styles.css, data/stations.json
scripts/     build-stations.js (static GTFS → stations.json)
demo/        demo-shim.js + build script for the offline single-file demo
test/        node:test unit tests
```
