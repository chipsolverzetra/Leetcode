import { api } from './api.js';
import { LANGUAGES, setLang, getLang, t, applyStatic, detectLang } from './i18n.js';
import { createMap, LINE_COLORS, DARK_TEXT } from './map.js';
import * as realStore from './store.js';

const store = window.__TRANSIT_STORE__ || realStore;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const state = {
  view: 'status', status: null, outages: [], stations: [], favs: { lines: [], stations: [], notify: false },
  selected: null, map: null, lastStatusByLine: new Map(),
};

// ---------- helpers ----------
function bullet(route, size = '') {
  const r = route === 'GS' || route === 'FS' || route === 'H' ? 'S' : route;
  const color = LINE_COLORS[r] || '#808183';
  const cls = ['bullet', size, DARK_TEXT.has(r) ? 'dark' : '', r.length > 1 ? 'sq' : ''].join(' ');
  return `<span class="${cls}" style="background:${color}" aria-label="${esc(r)} line">${esc(r)}</span>`;
}
// MTA alert text writes routes as [A]; render those as bullets.
const withBullets = (text) => esc(text).replace(/\[([A-Z0-9]{1,3})\]/g, (_, r) => bullet(r, 'sm'));
const timeFmt = (ms) => new Intl.DateTimeFormat(getLang(), { hour: 'numeric', minute: '2-digit' }).format(new Date(ms));

const sourcePill = (src) => (src && src !== 'live' ? ` <span class="pill sample">${t(src === 'demo' ? 'demoData' : 'sampleData')}</span>` : '');

function toast(msg) {
  const el = $('toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 4000);
}

function stationComplex(s) {
  // Merge all platforms that share a station name (e.g. Times Sq 1/2/3, 7, NQRW).
  const parts = state.stations.filter((x) => x.name === s.name);
  return { name: s.name, parts, routes: [...new Set(parts.flatMap((p) => p.routes))], ada: parts.some((p) => p.ada) };
}
const outagesAt = (name) => state.outages.filter((o) => o.station?.toLowerCase() === name.toLowerCase());

// ---------- favorites ----------
async function saveFavs() {
  try { await store.saveFavorites(state.favs); } catch (e) { toast(e.message); }
  renderStatus(); renderFavorites(); if (state.selected) renderStation(state.selected);
}
function toggleFav(kind, id) {
  const list = state.favs[kind];
  state.favs[kind] = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  saveFavs();
}
const starBtn = (kind, id, label) => {
  const on = state.favs[kind].includes(id);
  return `<button class="star" type="button" data-fav="${kind}" data-id="${esc(id)}" aria-pressed="${on}" aria-label="${on ? t('remove') : t('save')} ${esc(label)}">${on ? '★' : '☆'}</button>`;
};

// ---------- status ----------
async function loadStatus() {
  try {
    const s = await api.status(getLang());
    checkForChanges(s);
    state.status = s;
    renderStatus(); renderFavorites();
  } catch (e) {
    $('statusMeta').textContent = e.message;
  }
}

function checkForChanges(next) {
  const watched = new Set(state.favs.lines);
  for (const line of next.lines) {
    const prev = state.lastStatusByLine.get(line.id);
    if (prev && prev !== line.status && watched.has(line.id) && state.favs.notify) {
      const msg = `${line.id}: ${t(line.status)}`;
      if ('Notification' in window && Notification.permission === 'granted') {
        try { new Notification('NYC Transit Hub', { body: msg }); } catch { toast(msg); }
      } else toast(msg);
    }
    state.lastStatusByLine.set(line.id, line.status);
  }
}

function renderStatus() {
  const s = state.status; if (!s) return;
  const issues = s.lines.filter((l) => l.status !== 'good');
  $('issueCount').textContent = issues.length;
  $('issueLabel').textContent = issues.length ? t('linesAffected') : t('allGood');
  $('statusMeta').innerHTML = `${t('updated')} ${timeFmt(s.updatedAt)}${sourcePill(s.source)}`;
  const order = { suspended: 0, delays: 1, changes: 2, good: 3 };
  const lines = [...s.lines].sort((a, b) => order[a.status] - order[b.status]);
  $('lineGrid').innerHTML = lines.map((l) => `
    <div class="line-card" data-status="${l.status}">
      ${bullet(l.id)}<span class="pill ${l.status}">${t(l.status)}</span>${starBtn('lines', l.id, l.id)}
    </div>`).join('');
  $('alertList').innerHTML = s.alerts.map((a) => `
    <article class="alert">
      <div class="alert-top">${a.routes.map((r) => bullet(r, 'sm')).join('')}<span class="pill ${a.category}">${esc(a.type || t(a.category))}</span>
        ${a.updatedAt ? `<time datetime="${new Date(a.updatedAt).toISOString()}">${timeFmt(a.updatedAt)}</time>` : ''}</div>
      <p>${withBullets(a.header)}</p>
    </article>`).join('');
}

// ---------- map + stations ----------
function initMap() {
  if (state.map) return;
  state.map = createMap($('map'), state.stations, {
    onSelect: (s) => selectStation(s),
    isFlagged: (s) => outagesAt(s.name).some((o) => !o.upcoming),
  });
}

function selectStation(s) {
  state.selected = s; state.map?.select(s);
  renderStation(s);
}

async function renderStation(s) {
  const cx = stationComplex(s);
  const outs = outagesAt(s.name);
  const panel = $('stationPanel');
  panel.innerHTML = `
    <div class="station-card">
      <div class="section-head"><h3>${esc(cx.name)}</h3>${starBtn('stations', cx.name, cx.name)}</div>
      <div class="bullets">${cx.routes.map((r) => bullet(r, 'sm')).join('')}</div>
      <div class="note">${cx.ada ? `<span class="pill good">♿ ${t('stepFree')}</span>` : ''}
        ${outs.map((o) => `<span class="pill ${o.upcoming ? 'changes' : 'suspended'}">${o.upcoming ? `${t('upcoming')} · ` : ''}${t(o.type)} · ${esc(o.serving)}</span>`).join('')}</div>
      <div id="arrivals" class="note">…</div>
    </div>`;
  try {
    const results = await Promise.all(cx.parts.map((p) => api.arrivals(p.id, p.routes)));
    if (state.selected !== s) return;
    const merge = (dir) => results.flatMap((r) => r.arrivals[dir] || []).sort((a, b) => a.arrival - b.arrival).slice(0, 6);
    const col = (dir, label) => {
      const rows = merge(dir);
      return `<div class="dir"><h4>${label}</h4>${rows.length ? rows.map((r) => `
        <div class="arr">${bullet(r.route, 'sm')}<span class="mins">${r.minutes === 0 ? t('now') : `${r.minutes} ${t('min')}`}</span></div>`).join('') : `<div class="note">${t('noTrains')}</div>`}</div>`;
    };
    $('arrivals').outerHTML = `<div class="view"><h2>${t('arrivals')}</h2>${col('N', t('uptown'))}${col('S', t('downtown'))}${sourcePill(results[0]?.source)}</div>`;
  } catch (e) {
    const el = $('arrivals'); if (el) el.textContent = e.message;
  }
}

function renderSearch(q) {
  const query = q.trim().toLowerCase();
  const names = [...new Map(state.stations.map((s) => [s.name, s])).values()];
  const hits = query ? names.filter((s) => s.name.toLowerCase().includes(query)).slice(0, 8) : [];
  $('searchResults').innerHTML = hits.map((s) => `
    <button class="result" type="button" data-station="${esc(s.id)}">${esc(s.name)}
      <span class="bullets">${stationComplex(s).routes.map((r) => bullet(r, 'sm')).join('')}</span></button>`).join('');
}

// ---------- accessibility ----------
async function loadOutages() {
  try { const r = await api.accessibility(); state.outages = r.outages; state.outageSource = r.source; renderOutages(); state.map?.refresh(); } catch (e) { $('outageList').textContent = e.message; }
}
function renderOutages() {
  const onlyAda = $('elevOnly').checked;
  const list = state.outages.filter((o) => !onlyAda || o.ada).sort((a, b) => Number(a.upcoming) - Number(b.upcoming));
  $('outageList').innerHTML = sourcePill(state.outageSource) + list.map((o) => `
    <article class="outage">
      <span class="kind ${o.upcoming ? 'planned' : o.type}">${o.upcoming ? t('upcoming') : t(o.type)}</span>
      <div><h3>${esc(o.station)} <span class="bullets" style="display:inline-flex;vertical-align:middle">${o.lines.map((l) => bullet(l, 'sm')).join('')}</span></h3>
        <p>${esc(o.serving)} · ${esc(o.reason)}${o.ada ? ' · ♿ ADA' : ''}</p></div>
      <div class="when">${t('returnBy')}<br>${esc(o.estimatedReturn)}</div>
    </article>`).join('');
}

// ---------- favorites view ----------
function renderFavorites() {
  const { lines, stations } = state.favs;
  $('favMode').textContent = store.currentUser() ? `${store.currentUser().email}` : (store.accountsEnabled() ? t('localMode') : '');
  const btn = $('notifyBtn'); btn.setAttribute('aria-pressed', String(state.favs.notify)); btn.textContent = state.favs.notify ? `🔔 ${t('notifyOn')}` : t('notify');
  if (!lines.length && !stations.length) { $('favContent').innerHTML = `<div class="empty">${t('noFavorites')}</div>`; return; }
  const statusOf = (id) => state.status?.lines.find((l) => l.id === id);
  $('favContent').innerHTML = `
    ${lines.length ? `<div class="grid-lines">${lines.map((id) => { const l = statusOf(id) || { status: 'good' }; return `
      <div class="line-card" data-status="${l.status}">${bullet(id)}<span class="pill ${l.status}">${t(l.status)}</span>${starBtn('lines', id, id)}</div>`; }).join('')}</div>` : ''}
    ${stations.length ? `<div class="alerts">${stations.map((name) => { const outs = outagesAt(name).filter((o) => !o.upcoming); const s = state.stations.find((x) => x.name === name); return `
      <article class="alert"><div class="alert-top"><strong>${esc(name)}</strong>
        <span class="bullets">${s ? stationComplex(s).routes.map((r) => bullet(r, 'sm')).join('') : ''}</span>
        ${outs.length ? `<span class="pill suspended">${outs.length} ${t('elevator').toLowerCase()}/${t('escalator').toLowerCase()}</span>` : ''}
        <button class="btn" type="button" data-open="${esc(s?.id || '')}" style="margin-left:auto">${t('arrivals')}</button>${starBtn('stations', name, name)}</div></article>`; }).join('')}</div>` : ''}`;
}

// ---------- views, language, auth ----------
function show(view) {
  state.view = view;
  document.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === view)));
  ['status', 'map', 'access', 'favorites'].forEach((v) => { $(`view-${v}`).hidden = v !== view; });
  if (view === 'map') { initMap(); if (!state.selected) selectStation(state.stations.find((s) => s.id === '127') || state.stations[0]); }
}

function renderAll() { applyStatic(); renderStatus(); renderOutages(); renderFavorites(); if (state.selected) renderStation(state.selected); }

async function wireAuth() {
  if (!store.accountsEnabled()) return;
  const btn = $('authBtn'); btn.hidden = false;
  store.onAuthChange(async (u) => {
    btn.textContent = u ? t('signOut') : t('signIn');
    btn.dataset.i18n = u ? 'signOut' : 'signIn';
    state.favs = await store.loadFavorites(); renderAll();
  });
  btn.addEventListener('click', () => (store.currentUser() ? store.signOut() : $('authDialog').showModal()));
  const run = async (fn) => {
    $('authErr').textContent = '';
    try { await fn($('authEmail').value, $('authPassword').value); $('authDialog').close(); } catch (e) { $('authErr').textContent = e.message.replace(/^Firebase: /, ''); }
  };
  $('authForm').addEventListener('submit', (e) => { e.preventDefault(); run(store.signIn); });
  $('authCreate').addEventListener('click', () => { if ($('authForm').reportValidity()) run(store.signUp); });
  $('authGoogle').addEventListener('click', () => run(() => store.signInWithGoogle()));
}

async function main() {
  const langSel = $('lang');
  langSel.innerHTML = Object.entries(LANGUAGES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  let saved = null; try { saved = localStorage.getItem('nyc-transit-hub:lang'); } catch { /* blocked */ }
  setLang(saved || detectLang()); langSel.value = getLang();
  langSel.addEventListener('change', () => { setLang(langSel.value); try { localStorage.setItem('nyc-transit-hub:lang', langSel.value); } catch { /* blocked */ } renderAll(); loadStatus(); });
  applyStatic();

  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));
  document.addEventListener('click', (e) => {
    const fav = e.target.closest('[data-fav]'); if (fav) { toggleFav(fav.dataset.fav, fav.dataset.id); return; }
    const res = e.target.closest('[data-station]'); if (res) { const s = state.stations.find((x) => x.id === res.dataset.station); if (s) selectStation(s); return; }
    const open = e.target.closest('[data-open]'); if (open) { const s = state.stations.find((x) => x.id === open.dataset.open); show('map'); if (s) selectStation(s); }
  });
  $('stationSearch').addEventListener('input', (e) => renderSearch(e.target.value));
  $('elevOnly').addEventListener('change', renderOutages);
  $('notifyBtn').addEventListener('click', async () => {
    if (!state.favs.notify && 'Notification' in window && Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch { /* not allowed here; in-page toasts still work */ }
    }
    state.favs.notify = !state.favs.notify; saveFavs();
  });

  try {
    await store.initStore?.();
    state.favs = await store.loadFavorites();
    state.stations = await api.stations();
  } catch (e) {
    // A failed stations load or account SDK import used to kill the whole app
    // with a blank page; surface it instead so the failure is visible.
    $('statusMeta').textContent = `Could not load the app: ${e.message}`;
    return;
  }
  await wireAuth();
  await Promise.all([loadStatus(), loadOutages()]);
  renderFavorites();
  setInterval(loadStatus, 60_000);
  setInterval(loadOutages, 5 * 60_000);
}

main();
