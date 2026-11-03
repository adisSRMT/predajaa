// Predaja vozil – aplikacija. Podatki: Firebase (Firestore + prijava). Seznam opreme in zdravil: oprema.js.
import { firebaseConfig } from './config.js';
import { SKUPINE as SKUPINE_RAW, ZDRAVILA as ZDRAVILA_RAW, IZMENE } from './oprema.js';

/* ---------- Podatki o obrazcu ---------- */
var SKUPINE = SKUPINE_RAW.map(function (g) {
  return { id: g.id, naziv: g.naziv, postavke: g.postavke.map(function (p) { return { id: p[0], naziv: p[1] }; }) };
});
var ITEMS = {}, TOTAL = 0;
SKUPINE.forEach(function (g) { g.postavke.forEach(function (p) { ITEMS[g.id + '.' + p.id] = { g: g, p: p }; TOTAL++; }); });
/* Zdravila: ključ zdravila je skupina_zdravilo. Narkotiki (narkotik: true) so vedno prvi in obvezni. */
var ZDR = ZDRAVILA_RAW.map(function (g) {
  return { id: g.id, naziv: g.naziv, narkotik: !!g.narkotik, kolicina: !!g.kolicina, postavke: g.postavke.map(function (p) { return { id: p[0], naziv: p[1], kolicina: !!(p[2] && p[2].kolicina) }; }) };
});
ZDR.sort(function (a, b) { return (b.narkotik ? 1 : 0) - (a.narkotik ? 1 : 0); });
var MEDS = {}, MED_TOTAL = 0;
ZDR.forEach(function (g) { g.postavke.forEach(function (p) { MEDS[g.id + '_' + p.id] = { g: g, p: p, nar: g.narkotik, kol: g.narkotik || g.kolicina || p.kolicina }; MED_TOTAL++; }); });
var GORIVO = [{ v: 'rezerva', l: 'Rezerva' }, { v: '1/4', l: '¼' }, { v: '1/2', l: '½' }, { v: '3/4', l: '¾' }, { v: 'polno', l: 'Polno' }];
var STANJA = [{ v: 'ok', l: 'V redu' }, { v: 'manjka', l: 'Manjka' }, { v: 'pokvarjeno', l: 'Pokvarjeno' }];
var STANJA_Z = [{ v: 'ok', l: 'V redu' }, { v: 'manjka', l: 'Manjka' }];

/* ---------- Pomočniki ---------- */
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function nf(n) { var x = Number(n); return isNaN(x) ? '' : x.toLocaleString('sl-SI'); }
function slug(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function pad2(n) { return String(n).padStart(2, '0'); }
function toLocalInput(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + 'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
function fmtDT(iso) {
  var d = new Date(iso); if (isNaN(d)) return '';
  var now = new Date(), t = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  var day = function (x) { return new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(); };
  var diff = Math.round((day(now) - day(d)) / 86400000);
  if (diff === 0) return 'danes ' + t;
  if (diff === 1) return 'včeraj ' + t;
  return d.getDate() + '. ' + (d.getMonth() + 1) + '.' + (d.getFullYear() !== now.getFullYear() ? ' ' + d.getFullYear() : '') + ', ' + t;
}
function fmtLong(iso) {
  var d = new Date(iso); if (isNaN(d)) return '';
  return d.toLocaleDateString('sl-SI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}
function gorivoL(v) { var g = GORIVO.filter(function (x) { return x.v === v; })[0]; return g ? g.l : '—'; }
function stanjeL(v) { var s = STANJA.filter(function (x) { return x.v === v; })[0]; return s ? s.l : ''; }
function napakeTxt(n) { var m = n % 100, k = n % 10; if (m === 1 || (k === 1 && m > 20)) return 'odprta napaka'; if (m === 2 || (k === 2 && m > 20)) return 'odprti napaki'; if (m === 3 || m === 4 || ((k === 3 || k === 4) && m > 20)) return 'odprte napake'; return 'odprtih napak'; }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { } }
var toastT;
function toast(m, ms) { var t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, ms || 3400); }
function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
function reduceMotion() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

var ICON_QR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1"/></svg>';
var ICON_MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>';
/* QR koda vsebuje naslov aplikacije in #n-oznaka vozila. */
function idFromQr(text) {
  text = String(text || '').trim();
  var m = text.match(/#n-([^\s&#]+)$/); if (!m) return null;
  var base = text.slice(0, text.length - m[0].length);
  if (base && base !== appBase() && base !== appBase() + 'index.html') return null;
  try { return decodeURIComponent(m[1]); } catch (e) { return null; }
}
function doScan() {
  import('./skener.js').then(function (m) { return m.odpriSkener(); }).then(function (text) {
    if (text == null) return;
    var id = idFromQr(text);
    if (!id) { toast('Ta QR koda ni iz te aplikacije.', 4500); return; }
    location.hash = '#n-' + id;
    if (!S.user) showLogin('email', 'QR koda prebrana. Prijavi se, da odpreš predajo vozila.');
  }).catch(function () { toast('Skenerja ni bilo mogoče naložiti. Preveri internet.', 4500); });
}

/* ---------- Rok uporabe (mesec in leto, velja do konca meseca) ---------- */
function curIdx() { var d = new Date(); return d.getFullYear() * 12 + d.getMonth(); }
function parseRok(s) {
  s = String(s == null ? '' : s).trim(); var y, m, r;
  if ((r = s.match(/^(\d{4})-(\d{1,2})$/))) { y = +r[1]; m = +r[2]; }
  else if ((r = s.match(/^(\d{1,2})[\/.\-\s]+(\d{4}|\d{2})$/))) { m = +r[1]; y = r[2].length === 2 ? 2000 + (+r[2]) : +r[2]; }
  else return null;
  if (m < 1 || m > 12 || y < 2000 || y > 2100) return null;
  return y + '-' + pad2(m);
}
function rokIdx(r) { var a = r.split('-'); return (+a[0]) * 12 + (+a[1]) - 1; }
function rokFmt(r) { var a = r.split('-'); return a[1] + '/' + a[0]; }
function rokStat(r) { if (!r) return 'none'; var d = rokIdx(r) - curIdx(); return d < 0 ? 'poteklo' : d === 0 ? 'mesec' : 'ok'; }
function rokChip(r) {
  if (!r) return '<span class="chip">Rok ni vpisan</span>';
  var s = rokStat(r);
  return s === 'poteklo' ? '<span class="chip bad">Poteklo · ' + rokFmt(r) + '</span>' : s === 'mesec' ? '<span class="chip warn">Poteče ta mesec · ' + rokFmt(r) + '</span>' : '<span class="chip ok">V roku · do ' + rokFmt(r) + '</span>';
}
function medSummary(v) {
  var z = v.zdravila || {}, r = { mesec: [], poteklo: [] };
  Object.keys(MEDS).forEach(function (k) {
    var e = z[k]; if (!e || !e.rok) return;
    var st = rokStat(e.rok); if (st === 'mesec') r.mesec.push(k); else if (st === 'poteklo') r.poteklo.push(k);
  });
  return r;
}
function medAlertsHTML(v) {
  var ms = medSummary(v); if (!ms.mesec.length && !ms.poteklo.length) return '';
  var nm = function (k) { return esc(MEDS[k].p.naziv) + ' (' + rokFmt(v.zdravila[k].rok) + ')'; };
  var h = '<section class="stack">';
  if (ms.poteklo.length) h += '<div class="banner bad">Poteklo: ' + ms.poteklo.map(nm).join(', ') + '. Zamenjaj in vpiši nov rok.</div>';
  if (ms.mesec.length) h += '<div class="banner warn">Opozorilo! Ta mesec poteče: ' + ms.mesec.map(nm).join(', ') + '.</div>';
  return h + '</section>';
}

/* ---------- Stanje ---------- */
var S = { db: null, auth: null, user: null, admin: false, roleReady: false, last: null, online: navigator.onLine !== false, pending: 0, vozila: [], odprte: [], zaprte: [], predaje: [], ready: {}, detail: {}, detailSig: {}, detailFoto: {}, loading: {}, closing: null, closingText: '', filterV: '', err: '', subs: [], subKeys: {} };
var A = $('#app'), route = null, draft = null, formBuilt = false, touched = false, formSig = '';
var views = {};
function voziloById(id) { return S.vozila.filter(function (v) { return v.id === id; })[0]; }
function docs(snap) { return snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }); }
/* Odprte napake so shranjene kar na vozilu (polje odprte), da jih lahko vidi tudi predaja brez skrbniških pravic. */
function odprteFromVozila() {
  var out = [];
  S.vozila.forEach(function (v) {
    var o = v.odprte || {};
    Object.keys(o).forEach(function (id) { out.push(Object.assign({ id: id, vozilo: v.id, voziloOznaka: v.oznaka, odprta: true }, o[id])); });
  });
  return out;
}
function setVozila(list) { S.vozila = list; S.odprte = odprteFromVozila(); }

function configured() { var c = firebaseConfig || {}; return !!c.apiKey && String(c.apiKey).indexOf('VSTAVI') !== 0 && !!c.projectId && String(c.projectId).indexOf('VSTAVI') !== 0; }
function parseRoute() {
  var h = ''; try { h = decodeURIComponent((location.hash || '').slice(1)); } catch (e) { h = ''; }
  var r;
  if (!h || h === 'vozila') r = { name: 'vozila' };
  else if (h === 'napake' || h === 'zgodovina' || h === 'qr' || h === 'hvala') r = { name: h };
  else { var m = h.match(/^(v|n|p)-(.+)$/); r = m ? { name: m[1], id: m[2] } : { name: 'vozila' }; }
  if (S.admin) { if (r.name === 'hvala') r = { name: 'vozila' }; }
  else if (r.name === 'hvala') { if (!S.last) r = { name: 'dom' }; }
  else if (r.name !== 'n') r = { name: 'dom' };
  return r;
}
function tabOf(n) { return n === 'v' || n === 'n' ? 'vozila' : n === 'p' ? 'zgodovina' : n; }
function updateNav() {
  var tab = route ? tabOf(route.name) : '';
  $$('#nav a').forEach(function (a) { if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  var c = $('#cnt'), n = S.admin ? S.odprte.length : 0; c.hidden = !n; c.textContent = n;
}
function updateStatus() {
  var s = $('#sync');
  if (!S.online) { s.hidden = false; s.className = 'chip warn'; s.textContent = 'Brez povezave'; }
  else if (S.pending > 0) { s.hidden = false; s.className = 'chip'; s.textContent = 'Pošiljam …'; }
  else s.hidden = true;
}
var lastNotice = '';
function updateNotice() {
  var h = '';
  if (S.err === 'rules') h = '<div class="notice warn">Baza ne dovoli dostopa. Skrbnik naj preveri pravila baze (BERI-ME.md, korak 4) in vlogo uporabnika (korak 6b).</div>';
  else if (S.err === 'quota') h = '<div class="notice warn">Dnevna omejitev brezplačne baze je dosežena. Nadaljuj jutri ali obvesti skrbnika.</div>';
  if (h !== lastNotice) { lastNotice = h; $('#notice').innerHTML = h; }
}
function setChrome(loggedIn) {
  $('#nav').hidden = !(loggedIn && S.admin); $('#logout').hidden = !loggedIn;
  $('#who').textContent = loggedIn && S.user ? (S.user.email || '') + (S.admin ? ' · skrbnik' : '') : '';
}
function onRoute() {
  if (!S.user || !S.roleReady) return;
  route = parseRoute();
  updateNav();
  var v = views[route.name]; v.mount(); if (v.update) v.update();
  window.scrollTo(0, 0);
}
function onData() {
  if (!S.user || !S.roleReady || !route) return;
  updateNotice(); updateNav();
  var v = views[route.name]; if (v && v.update) v.update();
}
function handleWriteError(e, late) {
  var c = e && e.code || '';
  if (c === 'permission-denied') toast('Zapis ni dovoljen. Preveri prijavo in pravila baze.', 6000);
  else if (c === 'resource-exhausted') { S.err = 'quota'; updateNotice(); toast('Dnevna omejitev brezplačne baze je dosežena.', 6000); }
  else if (c === 'unavailable') toast('Ni povezave. Zapis se pošlje, ko bo povezava nazaj.');
  else toast('Zapis ni uspel' + (late ? ' na strežniku' : '') + '. Poskusi znova.');
}

/* ---------- Naročnine na bazo ---------- */
function sub(key, q, map) {
  if (S.subKeys[key]) return;
  S.subKeys[key] = true;
  var un = q.onSnapshot(function (snap) { map(snap); S.ready[key] = true; onData(); },
    function (e) { S.ready[key] = true; if (e && e.code === 'permission-denied') S.err = 'rules'; onData(); });
  S.subs.push(un);
}
function subVozila() { sub('vozila', S.db.collection('vozila'), function (s) { setVozila(docs(s).sort(function (a, b) { return String(a.oznaka).localeCompare(String(b.oznaka), 'sl', { numeric: true }); })); }); }
/* Navadni uporabnik prebere samo vozilo iz QR kode. */
function subVozilo(id) {
  sub('v:' + id, S.db.doc('vozila/' + id), function (d) {
    var rest = S.vozila.filter(function (x) { return x.id !== id; });
    if (d.exists) rest.push(Object.assign({ id: id }, d.data()));
    setVozila(rest);
  });
}
function subPredaje() { sub('predaje', S.db.collection('predaje').orderBy('cas', 'desc').limit(40), function (s) { S.predaje = docs(s); }); }
function subZaprte() { sub('zaprte', S.db.collection('napake').orderBy('zaprto', 'desc').limit(15), function (s) { S.zaprte = docs(s); }); }
function stopSubs() { S.subs.forEach(function (u) { try { u(); } catch (e) { } }); S.subs = []; S.subKeys = {}; S.ready = {}; S.vozila = []; S.odprte = []; S.zaprte = []; S.predaje = []; S.detail = {}; S.detailSig = {}; S.detailFoto = {}; S.loading = {}; S.err = ''; S.admin = false; S.roleReady = false; S.last = null; }

/* ---------- Vozila (skrbnik) ---------- */
function vehCard(v) {
  var z = v.zadnja, n = Object.keys(v.odprte || {}).length, ms = medSummary(v);
  var sub = [v.registrska, v.enota].filter(Boolean).map(esc).join(' · ');
  var last = z ? '<div class="meta"><span>Zadnja predaja ' + esc(fmtDT(z.cas)) + '</span><span>' + esc(z.oddajnik) + ' → ' + esc(z.prevzemnik) + '</span></div>' : '<div class="meta"><span>Še brez predaje</span></div>';
  var chips = (z ? '<span class="chip num">' + nf(z.km) + ' km</span><span class="chip">Gorivo ' + esc(gorivoL(z.gorivo)) + '</span>' : '') + (n ? '<span class="chip bad">' + n + ' ' + napakeTxt(n) + '</span>' : '<span class="chip ok">Brez odprtih napak</span>') +
    (ms.poteklo.length ? '<span class="chip bad">Zdravila poteklo: ' + ms.poteklo.length + '</span>' : '') + (ms.mesec.length ? '<span class="chip warn">Poteče ta mesec: ' + ms.mesec.length + '</span>' : '');
  return '<article class="card stack veh"><div class="veh-head"><a class="oznaka" href="#v-' + esc(v.id) + '">' + esc(v.oznaka) + '</a><span class="reg">' + sub + '</span></div>' + last + '<div class="chips">' + chips + '</div><div class="actions"><a class="btn primary" href="#n-' + esc(v.id) + '">Predaja vozila</a><a class="btn secondary" href="#v-' + esc(v.id) + '">Podrobnosti</a></div></article>';
}
views.vozila = {
  mount: function () {
    A.innerHTML = '<div class="stack"><h1>Vozila</h1><button type="button" class="btn secondary" data-act="scan">' + ICON_QR + 'Skeniraj QR kodo</button><div id="vlist" class="stack"></div>' +
      '<details class="card" id="addbox"><summary class="sum">Dodaj vozilo</summary>' +
      '<form id="addform" class="stack" novalidate autocomplete="off" style="margin-top:14px">' +
      '<div class="field"><label for="a-oz">Oznaka vozila</label><input id="a-oz" type="text" maxlength="24" placeholder="npr. NM-12" required></div>' +
      '<div class="field"><label for="a-reg">Registrska številka</label><input id="a-reg" type="text" maxlength="16"></div>' +
      '<div class="field"><label for="a-en">Enota ali postaja</label><input id="a-en" type="text" maxlength="40"></div>' +
      '<p class="err" id="a-err" role="alert"></p><button class="btn primary" type="submit">Dodaj vozilo</button></form></details>' +
      '<div id="vhidden"></div></div>';
  },
  update: function () {
    var l = $('#vlist'); if (!l) return;
    var act = S.vozila.filter(function (v) { return v.aktivno !== false; }), hid = S.vozila.filter(function (v) { return v.aktivno === false; });
    if (!S.ready.vozila) l.innerHTML = '<p class="hint">Nalagam vozila …</p>';
    else if (!act.length) l.innerHTML = '<div class="card empty"><h2>Še ni vozil</h2><p>Dodaj prvo vozilo spodaj. Vsako vozilo dobi svojo QR kodo, ki odpre predajo tega vozila.</p></div>';
    else l.innerHTML = act.map(vehCard).join('');
    $('#vhidden').innerHTML = hid.length ? '<details class="card"><summary class="sum">Skrita vozila (' + hid.length + ')</summary><div class="stack" style="margin-top:12px">' + hid.map(function (v) { return '<div class="row"><span>' + esc(v.oznaka) + '</span><button type="button" class="btn small secondary" data-act="unhide" data-id="' + esc(v.id) + '">Prikaži</button></div>'; }).join('') + '</div></details>' : '';
  }
};
function addVehicle() {
  var oz = $('#a-oz').value.trim(), id = slug(oz), err = $('#a-err');
  err.textContent = '';
  if (!id) { err.textContent = 'Vpiši oznako vozila.'; return; }
  if (voziloById(id)) { err.textContent = 'Vozilo s to oznako že obstaja.'; return; }
  S.db.doc('vozila/' + id).set({ oznaka: oz, registrska: $('#a-reg').value.trim(), enota: $('#a-en').value.trim(), aktivno: true, ustvarjeno: new Date().toISOString() }).catch(function (e) { handleWriteError(e, true); });
  $('#addform').reset(); $('#addbox').open = false; toast('Vozilo dodano. QR kodo najdeš pod »QR kode«.');
}

/* ---------- Vozilo (skrbnik) ---------- */
function defectRow(n) {
  return '<li class="defect"><div class="row"><strong>' + esc(n.naziv) + '</strong><span class="chip ' + (n.stanje === 'pokvarjeno' ? 'bad' : 'warn') + '">' + esc(stanjeL(n.stanje) || 'Manjka') + '</span></div><div>' + esc(n.opis) + '</div><div class="hint">Od ' + esc(fmtDT(n.ustvarjeno)) + '</div></li>';
}
function medsCard(v) {
  var z = v.zdravila || {}, h = '<section class="card stack"><h2>Zdravila in roki uporabe</h2>';
  ZDR.forEach(function (g) {
    h += '<div class="stack" style="gap:6px"><span class="lbl">' + esc(g.naziv) + (g.narkotik ? ' · NUJNO' : '') + '</span>';
    g.postavke.forEach(function (p) {
      var e = z[g.id + '_' + p.id] || {};
      h += '<div class="row"><span>' + esc(p.naziv) + (e.kol != null ? '<br><span class="hint">Količina ' + nf(e.kol) + (g.narkotik ? ' · serija ' + esc(e.serija || '—') : '') + '</span>' : '') + '</span>' + rokChip(e.rok) + '</div>';
    });
    h += '</div>';
  });
  return h + '</section>';
}
views.v = {
  mount: function () { A.innerHTML = '<div id="vv" class="stack"></div>'; },
  update: function () {
    var el = $('#vv'); if (!el) return;
    if (!S.ready.vozila) { el.innerHTML = '<p class="hint">Nalagam …</p>'; return; }
    var v = voziloById(route.id);
    if (!v) { el.innerHTML = '<a class="back" href="#vozila">← Vozila</a><div class="card"><h2>Vozilo ni najdeno</h2></div>'; return; }
    var z = v.zadnja, open = S.odprte.filter(function (n) { return n.vozilo === v.id; });
    var recent = v.zadnje || [];
    var sub = [v.registrska, v.enota].filter(Boolean).map(esc).join(' · ');
    var h = '<a class="back" href="#vozila">← Vozila</a><div><h1>' + esc(v.oznaka) + '</h1><p class="hint">' + sub + '</p></div>';
    h += '<a class="btn primary" href="#n-' + esc(v.id) + '">Začni predajo</a>';
    h += medAlertsHTML(v);
    h += '<section class="card stack"><h2>Odprte napake</h2>' + (open.length ? '<ul class="defects">' + open.map(defectRow).join('') + '</ul>' : '<p class="hint">Na vozilu ni odprtih napak.</p>') + '</section>';
    h += medsCard(v);
    if (z) {
      h += '<section class="card stack"><h2>Zadnja predaja</h2><dl class="kv"><dt>Čas</dt><dd>' + esc(fmtDT(z.cas)) + '</dd><dt>Izmena</dt><dd>' + esc(z.izmena) + '</dd><dt>Predal</dt><dd>' + esc(z.oddajnik) + '</dd><dt>Prevzel</dt><dd>' + esc(z.prevzemnik) + '</dd><dt>Kilometrina</dt><dd>' + nf(z.km) + ' km</dd><dt>Gorivo</dt><dd>' + esc(gorivoL(z.gorivo)) + '</dd></dl><a class="btn secondary small" href="#p-' + esc(z.id) + '">Odpri predajo</a></section>';
    }
    if (recent.length) {
      h += '<section class="card"><h2 style="margin-bottom:6px">Zadnje predaje</h2>' + recent.map(function (p) { return '<a class="row link" href="#p-' + esc(p.id) + '"><span>' + esc(fmtDT(p.cas)) + '</span><span class="hint">' + esc(p.oddajnik) + ' → ' + esc(p.prevzemnik) + '</span>' + (p.stNapak ? '<span class="chip bad">Težave: ' + p.stNapak + '</span>' : '<span class="chip ok">V redu</span>') + '</a>'; }).join('') + '</section>';
    }
    h += '<div class="actions"><a class="btn secondary small" href="#qr">QR koda vozila</a><button type="button" class="btn secondary small" data-act="hide" data-id="' + esc(v.id) + '">Skrij vozilo</button></div>';
    el.innerHTML = h;
  }
};

/* ---------- Obrazec za predajo ---------- */
function newDraft(v) {
  var z = v.zadnja || {};
  var d = {
    hid: 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    oddajnik: z.prevzemnik || '', prevzemnik: lsGet('predaja-ime') || '', izmena: '', cas: toLocalInput(new Date()), km: '', gorivo: '',
    kisik: { stac: '', prenosna: '', rezerva: '' }, defi: '', stanja: {}, komentarji: {}, zd: {}, foto: [], poskodbe: '', opombe: '', podpis1: '', podpis2: ''
  };
  Object.keys(MEDS).forEach(function (k) { d.zd[k] = { st: '', nov: false, rok: '', kol: '', serija: '', razlog: '' }; });
  return d;
}
function loadDraft(v) {
  var raw = lsGet('predaja-osnutek-' + v.id); if (!raw) return null;
  try {
    var o = JSON.parse(raw); if (!o || !o.d || Date.now() - o.t > 12 * 3600 * 1000) return null;
    var d = Object.assign(newDraft(v), o.d); d.kisik = Object.assign({ stac: '', prenosna: '', rezerva: '' }, o.d.kisik || {}); d.stanja = o.d.stanja || {}; d.komentarji = o.d.komentarji || {};
    d.foto = Array.isArray(o.d.foto) ? o.d.foto.filter(function (x) { return typeof x === 'string'; }) : [];
    var base = newDraft(v).zd, sv = o.d.zd || {}; d.zd = {};
    Object.keys(base).forEach(function (k) { d.zd[k] = Object.assign(base[k], sv[k] || {}); });
    return d;
  } catch (e) { return null; }
}
var saveSoon = debounce(function () {
  if (!draft || !route || route.name !== 'n') return;
  var key = 'predaja-osnutek-' + route.id;
  try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: draft })); }
  catch (e) { try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: Object.assign({}, draft, { foto: [] }) })); } catch (x) { } }
}, 500);
function setPath(o, p, val) { var a = p.split('.'), c = o; for (var i = 0; i < a.length - 1; i++) c = c[a[i]]; c[a[a.length - 1]] = val; }
function getPath(o, p) { return p.split('.').reduce(function (c, k) { return c == null ? c : c[k]; }, o); }
function vSig(v) { return JSON.stringify([v.zadnja && v.zadnja.id, v.zdravila || null, v.odprte || null]); }

/* --- fotografije poškodb: pomanjšane in shranjene v bazo (Firebase Storage je plačljiv) --- */
var MAX_FOTO = 3, MAX_FOTO_ZNAKOV = 230000;
function thumbsHTML() { return draft.foto.map(function (s, i) { return '<div class="thumb"><img src="' + esc(s) + '" alt="Fotografija ' + (i + 1) + '"><button type="button" data-act="foto-del" data-i="' + i + '" aria-label="Odstrani fotografijo ' + (i + 1) + '">×</button></div>'; }).join(''); }
function fotoHTML() {
  return '<div class="field" id="foto-box"' + (draft.poskodbe.trim() || draft.foto.length ? '' : ' hidden') + '><span class="lbl">Fotografije poškodb (neobvezno, do ' + MAX_FOTO + ')</span><div class="thumbs" id="thumbs">' + thumbsHTML() + '</div>' +
    '<button type="button" class="btn secondary small" id="foto-btn" data-act="foto-add" style="align-self:flex-start"' + (draft.foto.length >= MAX_FOTO ? ' hidden' : '') + '>Dodaj fotografijo</button><input id="foto-in" type="file" accept="image/*" multiple hidden>' +
    '<span class="hint">Fotografije se pomanjšajo in shranijo skupaj s predajo.</span></div>';
}
function showFotoBox() { var b = $('#foto-box'); if (b && draft) b.hidden = !(draft.poskodbe.trim() || draft.foto.length); }
function updateFotoBox() {
  if (!draft) return; showFotoBox();
  var btn = $('#foto-btn'); if (btn) btn.hidden = draft.foto.length >= MAX_FOTO;
  var t = $('#thumbs'); if (t) t.innerHTML = thumbsHTML();
}
function resizeImage(file) {
  return new Promise(function (res, rej) {
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      URL.revokeObjectURL(url);
      var sc = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight)), w = Math.max(1, Math.round(img.naturalWidth * sc)), h = Math.max(1, Math.round(img.naturalHeight * sc));
      var out = '', q = 0.7;
      for (var tries = 0; tries < 4; tries++) {
        var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h);
        q = 0.7; out = c.toDataURL('image/jpeg', q);
        while (out.length > MAX_FOTO_ZNAKOV && q > 0.35) { q -= 0.1; out = c.toDataURL('image/jpeg', q); }
        if (out.length <= MAX_FOTO_ZNAKOV) break;
        w = Math.round(w * 0.75); h = Math.round(h * 0.75);
      }
      if (out.length > MAX_FOTO_ZNAKOV) rej(new Error('velika')); else res(out);
    };
    img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('slika')); };
    img.src = url;
  });
}
function addPhotos(files) {
  var room = MAX_FOTO - draft.foto.length, list = Array.prototype.slice.call(files, 0, room);
  if (files.length > room) toast('Največ ' + MAX_FOTO + ' fotografije.', 3500);
  var chain = Promise.resolve();
  list.forEach(function (f) {
    chain = chain.then(function () { return resizeImage(f).then(function (url) { if (draft) { draft.foto.push(url); touched = true; } }, function () { toast('Fotografije ni bilo mogoče prebrati.'); }); });
  });
  chain.then(function () { updateFotoBox(); saveSoon(); });
}

function itemHTML(k) {
  var it = ITEMS[k], st = draft.stanja[k] || '', kom = draft.komentarji[k] || '', bad = st && st !== 'ok';
  return '<div class="item" data-k="' + k + '"><div class="item-name">' + esc(it.p.naziv) + '</div>' +
    '<div class="seg" role="radiogroup" aria-label="' + esc(it.p.naziv) + '">' + STANJA.map(function (s) { return '<button type="button" class="seg-b' + (st === s.v ? ' on ' + s.v : '') + '" role="radio" aria-checked="' + (st === s.v) + '" data-act="st" data-k="' + k + '" data-v="' + s.v + '">' + s.l + '</button>'; }).join('') + '</div>' +
    '<input class="kom" type="text" maxlength="200" placeholder="Kaj je narobe? (obvezno)" aria-label="Opis težave: ' + esc(it.p.naziv) + '" value="' + esc(kom) + '" data-kom="' + k + '"' + (bad ? '' : ' hidden') + '></div>';
}
function groupCount(g) { var d = 0; g.postavke.forEach(function (p) { if (draft.stanja[g.id + '.' + p.id]) d++; }); return d; }
function groupHTML(g) {
  var d = groupCount(g), t = g.postavke.length;
  return '<details class="grp" data-g="' + g.id + '" open><summary><span>' + esc(g.naziv) + '</span><span class="chip' + (d === t ? ' ok' : '') + '" data-count="' + g.id + '">' + d + '/' + t + '</span></summary><div class="grp-body">' +
    g.postavke.map(function (p) { return itemHTML(g.id + '.' + p.id); }).join('') +
    '<button type="button" class="btn secondary small" data-act="allok" data-g="' + g.id + '">Vse nepregledano v redu</button></div></details>';
}
function updateGroup(gid) {
  var g = SKUPINE.filter(function (x) { return x.id === gid; })[0], c = $('[data-count="' + gid + '"]'); if (!c || !g) return;
  var d = groupCount(g); c.textContent = d + '/' + g.postavke.length; c.classList.toggle('ok', d === g.postavke.length);
}

/* --- zdravila v obrazcu --- */
function storedMed(v, k) { return (v.zdravila || {})[k] || null; }
function medEff(v, k) {
  var z = draft.zd[k], st = storedMed(v, k), stored = st && st.rok ? st.rok : '';
  var needIn = !stored || rokStat(stored) === 'poteklo' || z.nov;
  var rok = needIn ? (parseRok(z.rok) || '') : stored;
  return { needIn: needIn, rok: rok, stored: stored };
}
function needRazlog(v, k) {
  var z = draft.zd[k], last = storedMed(v, k) || {}, kol = String(z.kol).trim();
  return kol !== '' && last.kol != null && Number(kol.replace(',', '.')) !== Number(last.kol);
}
function medDone(k) { var z = draft.zd[k]; if (MEDS[k].nar) return String(z.kol).trim() !== '' && z.serija.trim() !== ''; if (!z.st) return false; return z.st === 'manjka' || !MEDS[k].kol || String(z.kol).trim() !== ''; }
function medGroupCount(g) { var d = 0; g.postavke.forEach(function (p) { if (medDone(g.id + '_' + p.id)) d++; }); return d; }
function medHTML(v, k) {
  var m = MEDS[k], z = draft.zd[k], e = medEff(v, k), last = storedMed(v, k) || {};
  var h = '<div class="med" data-m="' + k + '"><div class="med-head"><span class="med-name">' + esc(m.p.naziv) + '</span>' + rokChip(e.rok || e.stored) + '</div>';
  if (m.nar) {
    h += '<div class="grid2"><div class="field"><label for="m-' + k + '-kol">Količina</label><input id="m-' + k + '-kol" type="number" inputmode="numeric" min="0" step="1" data-zd="' + k + '|kol" value="' + esc(z.kol) + '">' + (last.kol != null ? '<span class="hint">Zadnjič: ' + nf(last.kol) + '</span>' : '') + '</div>' +
      '<div class="field"><label for="m-' + k + '-ser">Številka serije</label><input id="m-' + k + '-ser" type="text" maxlength="40" autocapitalize="characters" data-zd="' + k + '|serija" value="' + esc(z.serija) + '">' + (last.serija ? '<span class="hint">Zadnjič: ' + esc(last.serija) + '</span>' : '') + '</div></div>' +
      '<div class="field med-razlog"' + (needRazlog(v, k) ? '' : ' hidden') + '><label for="m-' + k + '-raz">Razlog za razliko v količini (zadnjič ' + nf(last.kol) + ')</label><input id="m-' + k + '-raz" type="text" maxlength="200" data-zd="' + k + '|razlog" value="' + esc(z.razlog) + '"></div>';
  } else {
    h += '<div class="seg" role="radiogroup" aria-label="' + esc(m.p.naziv) + '">' + STANJA_Z.map(function (s) { return '<button type="button" class="seg-b' + (z.st === s.v ? ' on ' + s.v : '') + '" role="radio" aria-checked="' + (z.st === s.v) + '" data-act="mst" data-k="' + k + '" data-v="' + s.v + '">' + s.l + '</button>'; }).join('') + '</div>' +
      '<input class="kom" type="text" maxlength="200" placeholder="Kaj manjka? (obvezno)" aria-label="Opis: ' + esc(m.p.naziv) + '" value="' + esc(z.razlog) + '" data-zd="' + k + '|razlog"' + (z.st === 'manjka' ? '' : ' hidden') + '>';
    if (m.kol && z.st === 'ok') {
      h += '<div class="field"><label for="m-' + k + '-kol">Količina</label><input id="m-' + k + '-kol" type="number" inputmode="numeric" min="0" step="1" data-zd="' + k + '|kol" value="' + esc(z.kol) + '">' + (last.kol != null ? '<span class="hint">Zadnjič: ' + nf(last.kol) + '</span>' : '') + '</div>';
    }
  }
  var showRok = m.nar ? (String(z.kol).trim() === '' || Number(String(z.kol).replace(',', '.')) > 0) : z.st !== 'manjka';
  var stat = rokStat(e.rok), storedStat = rokStat(e.stored);
  if (showRok) {
    if (!e.needIn) {
      h += '<div class="row"><span class="hint">Rok uporabe: <b>' + rokFmt(e.stored) + '</b></span><button type="button" class="btn small secondary" data-act="nov" data-k="' + k + '">Zamenjano, nov rok</button></div>';
    } else {
      h += '<div class="field"><label for="m-' + k + '-rok">Rok uporabe (mesec in leto)</label><input id="m-' + k + '-rok" type="month" placeholder="LLLL-MM" data-zd="' + k + '|rok" value="' + esc(z.rok) + '">' +
        (e.stored && storedStat === 'poteklo' && !e.rok ? '' : !e.stored ? '<span class="hint">Rok še ni vpisan. Vpiši ga enkrat, aplikacija si ga zapomni.</span>' : '') +
        (z.nov && e.stored && storedStat !== 'poteklo' ? '<button type="button" class="btn small secondary" data-act="nov-ne" data-k="' + k + '" style="align-self:flex-start">Prekliči, rok ostane ' + rokFmt(e.stored) + '</button>' : '') + '</div>';
    }
    if (e.rok && stat === 'mesec') h += '<div class="banner warn">Opozorilo! Ta mesec poteče to zdravilo.</div>';
    if (e.rok && stat === 'poteklo') h += '<div class="banner bad">Vpisani rok je že potekel.</div>';
    if (!e.rok && e.stored && storedStat === 'poteklo') h += '<div class="banner bad">Zdravilo je poteklo (' + rokFmt(e.stored) + '). Zamenjaj ga in vpiši nov rok' + (m.nar ? '.' : ' ali izberi »Manjka«.') + '</div>';
  }
  return h + '</div>';
}
function medGroupHTML(v, g) {
  var d = medGroupCount(g), t = g.postavke.length;
  return '<details class="grp' + (g.narkotik ? ' nujno' : '') + '" data-mg="' + g.id + '" open><summary><span>' + esc(g.naziv) + (g.narkotik ? ' <span class="chip bad">NUJNO</span>' : '') + '</span><span class="chip' + (d === t ? ' ok' : '') + '" data-mcount="' + g.id + '">' + d + '/' + t + '</span></summary><div class="grp-body">' +
    (g.narkotik ? '<p class="nujno-note">Preveri in vpiši količino in številko serije za vsako zdravilo.</p>' : '') +
    g.postavke.map(function (p) { return medHTML(v, g.id + '_' + p.id); }).join('') +
    (g.narkotik ? '' : '<button type="button" class="btn secondary small" data-act="mallok" data-g="' + g.id + '">Vse nepregledano v redu</button>') + '</div></details>';
}
function updateMedGroup(gid) {
  var g = ZDR.filter(function (x) { return x.id === gid; })[0], c = $('[data-mcount="' + gid + '"]'); if (!c || !g) return;
  var d = medGroupCount(g); c.textContent = d + '/' + g.postavke.length; c.classList.toggle('ok', d === g.postavke.length);
}
function refreshMed(k) {
  var el = $('.med[data-m="' + k + '"]'), v = voziloById(route.id); if (!el || !v) return;
  el.outerHTML = medHTML(v, k); updateMedGroup(MEDS[k].g.id); updateProgress(); saveSoon();
}
function updateProgress() {
  var d = 0; Object.keys(ITEMS).forEach(function (k) { if (draft.stanja[k]) d++; });
  Object.keys(MEDS).forEach(function (k) { if (medDone(k)) d++; });
  var el = $('#prog'); if (el) el.textContent = 'Pregledano ' + d + ' od ' + (TOTAL + MED_TOTAL);
}
function refreshItem(k) {
  var el = $('.item[data-k="' + k + '"]'); if (!el) return;
  el.outerHTML = itemHTML(k); updateGroup(k.split('.')[0]); updateProgress(); saveSoon();
}
function segHTML(field, opts, cur) {
  return '<div class="seg" role="radiogroup">' + opts.map(function (o) { return '<button type="button" class="seg-b' + (cur === o.v ? ' on' : '') + '" role="radio" aria-checked="' + (cur === o.v) + '" data-act="' + field + '" data-v="' + esc(o.v) + '">' + esc(o.l) + '</button>'; }).join('') + '</div>';
}
function setSeg(field, val) {
  $$('[data-field="' + field + '"] .seg-b').forEach(function (b) { var on = b.dataset.v === val; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
}
function peopleList() {
  var set = {};
  S.vozila.forEach(function (v) { if (v.zadnja) { if (v.zadnja.oddajnik) set[v.zadnja.oddajnik] = 1; if (v.zadnja.prevzemnik) set[v.zadnja.prevzemnik] = 1; } });
  try { (JSON.parse(lsGet('predaja-imena') || '[]') || []).forEach(function (n) { set[n] = 1; }); } catch (e) { }
  return Object.keys(set).slice(0, 80).map(function (n) { return '<option value="' + esc(n) + '">'; }).join('');
}
function numField(key, label, unit, extra) {
  var v = getPath(draft, key);
  return '<div class="field" data-field="' + key + '"><label for="f-' + key + '">' + label + '</label><div class="unit"><input id="f-' + key + '" type="number" inputmode="numeric" min="0" step="1" data-f="' + key + '" value="' + esc(v) + '"><span>' + unit + '</span></div>' + (extra || '') + '</div>';
}
function buildForm(v) {
  var z = v.zadnja || {}, zk = z.kisik || {};
  var saved = loadDraft(v); draft = saved || newDraft(v); touched = !!saved; formSig = vSig(v);
  lsSet('predaja-zadnje', JSON.stringify({ id: v.id, oznaka: v.oznaka }));
  var open = S.odprte.filter(function (n) { return n.vozilo === v.id; });
  var prefilled = !saved && z.prevzemnik;
  var h = '<form id="hf" class="stack" novalidate autocomplete="off">' + (S.admin ? '<a class="back" href="#v-' + esc(v.id) + '">← ' + esc(v.oznaka) + '</a>' : '<a class="back" href="#vozila">← Izbira vozila</a>') +
    '<div><h1>Predaja vozila ' + esc(v.oznaka) + '</h1>' + (saved ? '<p class="hint">Nadaljuješ nedokončano predajo.</p>' : '') + '</div>';
  h += medAlertsHTML(v);
  if (open.length) h += '<section class="card stack"><h2>Odprte napake na vozilu (' + open.length + ')</h2><ul class="defects">' + open.map(defectRow).join('') + '</ul></section>';
  h += '<datalist id="ljudje">' + peopleList() + '</datalist>';
  h += '<section class="card stack"><h2>Osnovno</h2>' +
    '<div class="field" data-field="oddajnik"><label for="f-oddajnik">Predaja (kdo oddaja)</label><input id="f-oddajnik" type="text" list="ljudje" maxlength="60" data-f="oddajnik" value="' + esc(draft.oddajnik) + '">' + (prefilled ? '<span class="hint">Prepisano iz zadnje predaje.</span>' : '') + '</div>' +
    '<div class="field" data-field="prevzemnik"><label for="f-prevzemnik">Prevzem (kdo prevzema)</label><input id="f-prevzemnik" type="text" list="ljudje" maxlength="60" data-f="prevzemnik" value="' + esc(draft.prevzemnik) + '"></div>' +
    '<div class="field" data-field="izmena"><span class="lbl">Izmena</span>' + segHTML('izmena', IZMENE.map(function (x) { return { v: x, l: x }; }), draft.izmena) + '</div>' +
    '<div class="field" data-field="cas"><label for="f-cas">Datum in ura predaje</label><input id="f-cas" type="datetime-local" data-f="cas" value="' + esc(draft.cas) + '"></div></section>';
  h += '<section class="card stack"><h2>Kilometrina in gorivo</h2>' +
    numField('km', 'Kilometrina', 'km', z.km != null ? '<span class="hint" id="kmhint">Ob zadnji predaji: ' + nf(z.km) + ' km</span>' : '') +
    '<div class="field" data-field="gorivo"><span class="lbl">Gorivo</span>' + segHTML('gorivo', GORIVO, draft.gorivo) + (z.gorivo ? '<span class="hint">Ob zadnji predaji: ' + esc(gorivoL(z.gorivo)) + '</span>' : '') + '</div></section>';
  h += '<section class="card stack"><h2>Kisik in baterija</h2><div class="grid2">' +
    numField('kisik.stac', 'Stacionarna jeklenka', 'bar', zk.stac != null ? '<span class="hint">Zadnjič: ' + nf(zk.stac) + ' bar</span>' : '') +
    numField('kisik.prenosna', 'Prenosna jeklenka', 'bar', zk.prenosna != null ? '<span class="hint">Zadnjič: ' + nf(zk.prenosna) + ' bar</span>' : '') +
    numField('kisik.rezerva', 'Rezervna jeklenka (neobvezno)', 'bar') +
    numField('defi', 'Baterija defibrilatorja', '%') + '</div></section>';
  var nar = ZDR.filter(function (g) { return g.narkotik; }), zdr = ZDR.filter(function (g) { return !g.narkotik; });
  if (nar.length) h += '<div class="stack">' + nar.map(function (g) { return medGroupHTML(v, g); }).join('') + '</div>';
  h += '<div class="stack"><h2>Pregled vozila in opreme</h2><p class="hint">Za vsako postavko izberi stanje. Pri »Manjka« in »Pokvarjeno« napiši, kaj je narobe; napaka se zabeleži na vozilo.</p>' + SKUPINE.map(groupHTML).join('') + '</div>';
  if (zdr.length) h += '<div class="stack"><h2>Zdravila</h2><p class="hint">Rok uporabe se vpiše enkrat, potem se samo preveri. Ta mesec in po izteku roka te aplikacija opozori.</p>' + zdr.map(function (g) { return medGroupHTML(v, g); }).join('') + '</div>';
  h += '<section class="card stack"><h2>Poškodbe in opombe</h2>' +
    '<div class="field" data-field="poskodbe"><label for="f-poskodbe">Poškodbe karoserije (neobvezno)</label><textarea id="f-poskodbe" maxlength="600" data-f="poskodbe">' + esc(draft.poskodbe) + '</textarea></div>' + fotoHTML() +
    '<div class="field"><label for="f-opombe">Ostale posebnosti (neobvezno)</label><textarea id="f-opombe" maxlength="600" data-f="opombe">' + esc(draft.opombe) + '</textarea></div></section>';
  h += '<section class="card stack"><h2>Podpisa</h2>' +
    '<div class="field" data-field="podpis1"><span class="lbl">Podpis oddajnika</span><div class="pad"><canvas width="480" height="160" id="pad1" aria-label="Polje za podpis oddajnika"></canvas></div><button type="button" class="btn secondary small" data-act="clrpad" data-p="1" style="align-self:flex-start">Počisti</button></div>' +
    '<div class="field" data-field="podpis2"><span class="lbl">Podpis prevzemnika</span><div class="pad"><canvas width="480" height="160" id="pad2" aria-label="Polje za podpis prevzemnika"></canvas></div><button type="button" class="btn secondary small" data-act="clrpad" data-p="2" style="align-self:flex-start">Počisti</button></div></section>';
  h += '<div id="issues"></div><div class="submitbar"><span class="hint" id="prog"></span><button type="submit" class="btn primary" id="sbtn">Oddaj predajo</button></div></form>';
  A.innerHTML = h;
  updateProgress();
  setupPad($('#pad1'), 'podpis1'); setupPad($('#pad2'), 'podpis2');
}
function setupPad(canvas, key) {
  var ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height, drawing = false, last = null, dirty = false;
  /* Podpisno polje je vedno bel list s črnim peresom, da je shranjen podpis berljiv v obeh temah. */
  function blank() { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
  blank();
  if (draft[key]) { var img = new Image(); img.onload = function () { ctx.drawImage(img, 0, 0, W, H); }; img.src = draft[key]; }
  function pos(e) { var r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
  canvas.addEventListener('pointerdown', function (e) { drawing = true; dirty = false; last = pos(e); try { canvas.setPointerCapture(e.pointerId); } catch (x) { } e.preventDefault(); });
  canvas.addEventListener('pointermove', function (e) { if (!drawing) return; var p = pos(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; dirty = true; e.preventDefault(); });
  function end() { if (!drawing) return; drawing = false; if (dirty) { touched = true; draft[key] = canvas.toDataURL('image/png'); var f = canvas.closest('.field'); if (f) f.classList.remove('invalid'); saveSoon(); } }
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.clearPad = function () { blank(); draft[key] = ''; touched = true; saveSoon(); };
}
function validate() {
  var iss = [], d = draft, v = voziloById(route.id) || {}, z = v.zadnja || {};
  function add(keys, msg) { iss.push({ keys: [].concat(keys), msg: msg }); }
  function num(key, label, min, max, req) {
    var raw = String(getPath(d, key) == null ? '' : getPath(d, key)).replace(',', '.').trim();
    if (raw === '') { if (req) add(key, 'Vpiši: ' + label); return; }
    var x = Number(raw); if (isNaN(x) || x < min || x > max) add(key, label + ': vpiši število od ' + min + ' do ' + max);
  }
  if (!d.oddajnik.trim()) add('oddajnik', 'Vpiši, kdo oddaja');
  if (!d.prevzemnik.trim()) add('prevzemnik', 'Vpiši, kdo prevzema');
  else if (d.oddajnik.trim().toLowerCase() === d.prevzemnik.trim().toLowerCase()) add('prevzemnik', 'Oddajnik in prevzemnik sta ista oseba');
  if (!d.izmena) add('izmena', 'Izberi izmeno');
  if (!d.cas || isNaN(new Date(d.cas))) add('cas', 'Vpiši datum in uro');
  var km = Number(String(d.km).replace(',', '.'));
  if (String(d.km).trim() === '' || isNaN(km) || km < 0) add('km', 'Vpiši kilometrino');
  else if (z.km != null && km < z.km) add('km', 'Kilometrina je manjša kot ob zadnji predaji (' + nf(z.km) + ' km)');
  if (!d.gorivo) add('gorivo', 'Izberi nivo goriva');
  num('kisik.stac', 'tlak stacionarne jeklenke', 0, 400, true);
  num('kisik.prenosna', 'tlak prenosne jeklenke', 0, 400, true);
  num('kisik.rezerva', 'tlak rezervne jeklenke', 0, 400, false);
  num('defi', 'baterija defibrilatorja', 0, 100, true);
  /* rok uporabe: vrne sporočilo ali '' */
  function rokProblem(k) {
    var e = medEff(v, k), zz = d.zd[k];
    if (!e.needIn) return '';
    if (!zz.rok.trim()) return 'miss';
    var p = parseRok(zz.rok); if (!p) return 'bad';
    return rokStat(p) === 'poteklo' ? 'bad' : '';
  }
  /* narkotiki: vsak posebej, ker so obvezni */
  Object.keys(MEDS).forEach(function (k) {
    var m = MEDS[k]; if (!m.nar) return;
    var zz = d.zd[k], nm = m.p.naziv, kolS = String(zz.kol).trim().replace(',', '.'), kol = Number(kolS), lastK = (storedMed(v, k) || {}).kol;
    if (kolS === '' || isNaN(kol) || kol < 0 || Math.floor(kol) !== kol) add('zd.' + k, 'Narkotik ' + nm + ': vpiši količino (celo število)');
    else if (!zz.serija.trim()) add('zd.' + k, 'Narkotik ' + nm + ': vpiši številko serije');
    else if (lastK != null && kol !== Number(lastK) && !zz.razlog.trim()) add('zd.' + k, 'Narkotik ' + nm + ': količina se razlikuje od zadnje predaje (' + lastK + '), vpiši razlog');
    else if (kol > 0) {
      var rp = rokProblem(k);
      if (rp === 'miss') add('zd.' + k, 'Narkotik ' + nm + ': vpiši rok uporabe');
      else if (rp === 'bad') add('zd.' + k, 'Narkotik ' + nm + ': neveljaven ali potekel rok uporabe');
    }
  });
  var unrated = Object.keys(ITEMS).filter(function (k) { return !d.stanja[k]; });
  if (unrated.length) add(unrated.map(function (k) { return 'st.' + k; }), 'Postavke brez ocene: ' + unrated.length);
  var nocom = Object.keys(ITEMS).filter(function (k) { return d.stanja[k] && d.stanja[k] !== 'ok' && !(d.komentarji[k] || '').trim(); });
  if (nocom.length) add(nocom.map(function (k) { return 'kom.' + k; }), 'Pri težavah manjka opis: ' + nocom.length);
  /* ostala zdravila */
  var mUnr = [], mMan = [], mMiss = [], mBad = [], mKol = [];
  Object.keys(MEDS).forEach(function (k) {
    if (MEDS[k].nar) return;
    var zz = d.zd[k];
    if (!zz.st) { mUnr.push(k); return; }
    if (zz.st === 'manjka') { if (!zz.razlog.trim()) mMan.push(k); return; }
    if (MEDS[k].kol) { var kk = String(zz.kol).trim().replace(',', '.'), kn = Number(kk); if (kk === '' || isNaN(kn) || kn < 0 || Math.floor(kn) !== kn) mKol.push(k); }
    var rp = rokProblem(k); if (rp === 'miss') mMiss.push(k); else if (rp === 'bad') mBad.push(k);
  });
  function zk(a) { return a.map(function (k) { return 'zd.' + k; }); }
  if (mUnr.length) add(zk(mUnr), 'Zdravila brez ocene: ' + mUnr.length);
  if (mMan.length) add(zk(mMan), 'Pri zdravilih, ki manjkajo, manjka opis: ' + mMan.length);
  if (mKol.length) add(zk(mKol), 'Manjka količina pri zdravilih: ' + mKol.length);
  if (mMiss.length) add(zk(mMiss), 'Manjka rok uporabe pri zdravilih: ' + mMiss.length);
  if (mBad.length) add(zk(mBad), 'Neveljaven ali potekel rok uporabe pri zdravilih: ' + mBad.length);
  if (d.foto.length && !d.poskodbe.trim()) add('poskodbe', 'Pri fotografijah opiši poškodbo');
  if (!d.podpis1) add('podpis1', 'Manjka podpis oddajnika');
  if (!d.podpis2) add('podpis2', 'Manjka podpis prevzemnika');
  return iss;
}
function showIssues(iss) {
  $$('.invalid').forEach(function (e) { e.classList.remove('invalid'); });
  var first = null;
  iss.forEach(function (i) {
    i.keys.forEach(function (key) {
      var el = null;
      if (key.indexOf('st.') === 0) el = $('.item[data-k="' + key.slice(3) + '"]');
      else if (key.indexOf('kom.') === 0) el = $('.item[data-k="' + key.slice(4) + '"] .kom');
      else if (key.indexOf('zd.') === 0) el = $('.med[data-m="' + key.slice(3) + '"]');
      else el = $('[data-field="' + key + '"]');
      if (el) { el.classList.add('invalid'); if (!first) first = el; }
    });
  });
  var shown = iss.slice(0, 8);
  $('#issues').innerHTML = '<div class="issues" role="alert"><strong>Predaje še ni mogoče oddati</strong><ul>' + shown.map(function (i) { return '<li>' + esc(i.msg) + '</li>'; }).join('') + (iss.length > 8 ? '<li>in še ' + (iss.length - 8) + ' drugo</li>' : '') + '</ul></div>';
  if (first) { var dt = first.closest('details'); if (dt) dt.open = true; first.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' }); }
}
function submitForm() {
  var iss = validate(); if (iss.length) { showIssues(iss); return; }
  var v = voziloById(route.id); if (!v) return;
  var btn = $('#sbtn'); btn.disabled = true; btn.textContent = 'Shranjujem …';
  var d = draft, hid = d.hid, nowIso = new Date().toISOString(), casIso = new Date(d.cas).toISOString();
  var kisik = { stac: Number(String(d.kisik.stac).replace(',', '.')), prenosna: Number(String(d.kisik.prenosna).replace(',', '.')) };
  if (String(d.kisik.rezerva).trim() !== '') kisik.rezerva = Number(String(d.kisik.rezerva).replace(',', '.'));
  var problems = Object.keys(ITEMS).filter(function (k) { return d.stanja[k] !== 'ok'; });
  var imena = {}; problems.forEach(function (k) { imena[k] = ITEMS[k].g.naziv + ' · ' + ITEMS[k].p.naziv; });
  /* zdravila: zapis v predajo, nova shranjena stanja na vozilu, opozorila */
  var zdOut = {}, opoz = [], zUpd = {}, medMiss = [];
  Object.keys(MEDS).forEach(function (k) {
    var m = MEDS[k], zz = d.zd[k], e = medEff(v, k), last = storedMed(v, k) || {};
    var rec = { naziv: m.p.naziv, skupina: m.g.naziv }, inStock;
    if (m.nar) {
      rec.nar = true; rec.kol = Number(String(zz.kol).replace(',', '.')); rec.serija = zz.serija.trim();
      inStock = rec.kol > 0; rec.st = inStock ? 'ok' : 'manjka';
      if (last.kol != null && rec.kol !== Number(last.kol)) {
        rec.prej = Number(last.kol); rec.razlog = zz.razlog.trim();
        opoz.push({ k: k, naziv: m.p.naziv, tip: 'razlika', prej: rec.prej, kol: rec.kol, razlog: rec.razlog });
      }
    } else {
      rec.st = zz.st; inStock = zz.st === 'ok';
      if (zz.st === 'manjka') rec.razlog = zz.razlog.trim();
      if (m.kol && inStock) rec.kol = Number(String(zz.kol).replace(',', '.'));
    }
    if (inStock) {
      rec.rok = e.rok;
      if (rokStat(e.rok) === 'mesec') opoz.push({ k: k, naziv: m.p.naziv, tip: 'mesec', rok: e.rok });
    }
    zdOut[k] = rec;
    if (m.nar) { var ent = { kol: rec.kol, serija: rec.serija, pos: nowIso }; if (inStock) ent.rok = e.rok; zUpd['zdravila.' + k] = ent; }
    else if (rec.st === 'manjka') zUpd['zdravila.' + k] = S.db.DEL;
    else if (m.kol && inStock) { var ent2 = { kol: rec.kol, pos: nowIso }; if (e.rok) ent2.rok = e.rok; zUpd['zdravila.' + k] = ent2; }
    else if (e.needIn) zUpd['zdravila.' + k] = { rok: e.rok, pos: nowIso };
    if (rec.st === 'manjka') medMiss.push(k);
  });
  var doc = {
    vozilo: v.id, voziloOznaka: v.oznaka, oddajnik: d.oddajnik.trim(), prevzemnik: d.prevzemnik.trim(), izmena: d.izmena, cas: casIso,
    km: Number(String(d.km).replace(',', '.')), gorivo: d.gorivo, kisik: kisik, defi: Number(String(d.defi).replace(',', '.')),
    stanja: d.stanja, komentarji: d.komentarji, imena: imena, zdravila: zdOut, opozorila: opoz, stOpozoril: opoz.length, poskodbe: d.poskodbe.trim(), opombe: d.opombe.trim(),
    stNapak: problems.length + medMiss.length, stFoto: d.foto.length, ustvarjeno: nowIso
  };
  var sig = { vozilo: v.id, podpis1: d.podpis1, podpis2: d.podpis2 };
  var zadnja = { id: hid, cas: casIso, oddajnik: doc.oddajnik, prevzemnik: doc.prevzemnik, izmena: doc.izmena, km: doc.km, gorivo: doc.gorivo, kisik: { stac: kisik.stac, prenosna: kisik.prenosna }, stNapak: doc.stNapak };
  var zadnje = [{ id: hid, cas: casIso, oddajnik: doc.oddajnik, prevzemnik: doc.prevzemnik, stNapak: doc.stNapak }].concat((v.zadnje || []).filter(function (x) { return x.id !== hid; })).slice(0, 6);
  /* napake: nova napaka samo, če ista postavka še nima odprte napake */
  var oUpd = {}, idx = 0, openNow = v.odprte || {};
  function hasOpen(post) { return Object.keys(openNow).some(function (id) { return openNow[id].postavka === post; }); }
  function addDefect(post, naziv, stanje, opis) {
    if (hasOpen(post)) return;
    oUpd['odprte.' + hid + '-' + (idx++)] = { predaja: hid, postavka: post, naziv: naziv, stanje: stanje, opis: opis, ustvarjeno: nowIso };
  }
  problems.forEach(function (k) { addDefect(k, imena[k], d.stanja[k], (d.komentarji[k] || '').trim()); });
  medMiss.forEach(function (k) { var r = zdOut[k]; addDefect('zdr:' + k, 'Zdravila · ' + MEDS[k].p.naziv, 'manjka', r.razlog || (r.nar ? 'Količina 0' : '')); });
  var b = S.db.batch();
  b.set('predaje/' + hid, doc);
  b.set('podpisi/' + hid, sig);
  if (d.foto.length) b.set('fotke/' + hid, { vozilo: v.id, slike: d.foto.slice(), ustvarjeno: nowIso });
  b.update('vozila/' + v.id, Object.assign({ zadnja: zadnja, zadnje: zadnje }, zUpd, oUpd));
  /* Zapis se najprej shrani v telefon in se sam pošlje, ko je povezava. Ne čakamo na strežnik. */
  S.pending++; updateStatus();
  b.commit().then(function () { S.pending = Math.max(0, S.pending - 1); updateStatus(); }).catch(function (e) {
    S.pending = Math.max(0, S.pending - 1); updateStatus();
    lsSet('predaja-zavrnjeno-' + hid, JSON.stringify({ doc: doc, napak: doc.stNapak }));
    handleWriteError(e, true);
  });
  lsDel('predaja-osnutek-' + v.id); lsSet('predaja-ime', doc.prevzemnik);
  try {
    var names = JSON.parse(lsGet('predaja-imena') || '[]') || [];
    [doc.oddajnik, doc.prevzemnik].forEach(function (n) { if (names.indexOf(n) < 0) names.unshift(n); });
    lsSet('predaja-imena', JSON.stringify(names.slice(0, 40)));
  } catch (e) { }
  draft = null; formBuilt = false; touched = false;
  S.last = { id: v.id, oznaka: v.oznaka, hid: hid, opoz: opoz, stNapak: doc.stNapak, brezPovezave: !S.online };
  if (S.admin) { S.detail[hid] = Object.assign({ id: hid }, doc); S.detailSig[hid] = sig; if (d.foto.length) S.detailFoto[hid] = { slike: d.foto.slice() }; }
  toast(S.online ? 'Predaja shranjena.' : 'Predaja shranjena v telefon. Pošlje se, ko bo povezava.', 4500);
  location.hash = S.admin ? '#p-' + hid : '#hvala';
}
views.n = {
  mount: function () {
    formBuilt = false; touched = false; draft = null; A.innerHTML = '<p class="hint">Nalagam …</p>';
    if (!S.admin) subVozilo(route.id);
  },
  update: function () {
    if (!(S.admin ? S.ready.vozila : (S.ready['v:' + route.id] || S.ready.vozila))) return;
    var v = voziloById(route.id);
    if (!v) { if (!formBuilt) A.innerHTML = '<a class="back" href="#vozila">← ' + (S.admin ? 'Vozila' : 'Izbira vozila') + '</a>' + '<div class="card"><h2>Vozilo ni najdeno</h2><p>Oznaka vozila iz QR kode ne obstaja v aplikaciji.</p></div>'; return; }
    if (formBuilt) { if (!touched && vSig(v) !== formSig) buildForm(v); return; }
    buildForm(v); formBuilt = true;
  }
};

/* ---------- Domov in potrditev (navadni uporabnik) ---------- */
views.dom = {
  mount: function () {
    subVozila();
    A.innerHTML = '<div class="stack"><div class="card stack"><h1>Predaja vozila</h1><p class="hint">Skeniraj QR kodo na vozilu ali izberi vozilo s seznama.</p>' +
      '<button type="button" class="btn primary big" data-act="scan">' + ICON_QR + '<span>Skeniraj QR kodo</span></button></div>' +
      '<h2>Vozila</h2><div id="dlist" class="stack"></div></div>';
  },
  update: function () {
    var l = $('#dlist'); if (!l) return;
    if (!S.ready.vozila) { l.innerHTML = '<p class="hint">Nalagam vozila …</p>'; return; }
    var act = S.vozila.filter(function (v) { return v.aktivno !== false; });
    l.innerHTML = act.length ? act.map(function (v) {
      var sub = [v.registrska, v.enota].filter(Boolean).map(esc).join(' · ');
      return '<a class="vlistbtn" href="#n-' + esc(v.id) + '"><b>' + esc(v.oznaka) + '</b><span class="hint">' + sub + '</span></a>';
    }).join('') : '<p class="hint">Na seznamu še ni vozil. Obrni se na skrbnika.</p>';
  }
};
views.hvala = {
  mount: function () {
    var l = S.last; if (!l) { A.innerHTML = ''; return; }
    var h = '<div class="card stack"><div class="okmark" aria-hidden="true">✓</div><h1>Predaja shranjena</h1><p>Vozilo <b>' + esc(l.oznaka) + '</b>' + (l.brezPovezave ? ' (shranjeno v telefon, pošlje se, ko bo povezava)' : '') + '.</p>';
    if (l.stNapak) h += '<p class="hint">Zabeleženih težav: ' + l.stNapak + '.</p>';
    (l.opoz || []).forEach(function (o) {
      h += o.tip === 'mesec' ? '<div class="banner warn">Opozorilo! Ta mesec poteče zdravilo ' + esc(o.naziv) + ' (' + rokFmt(o.rok) + ').</div>' : '<div class="banner warn">Razlika v količini: ' + esc(o.naziv) + ' (prej ' + o.prej + ', zdaj ' + o.kol + ').</div>';
    });
    h += '<div class="choice"><button type="button" class="btn primary" data-act="scan">' + ICON_QR + '<span>Skeniraj QR kodo</span></button><a class="btn secondary" href="#vozila">Izbira vozila</a></div></div>';
    A.innerHTML = h;
  }
};

/* ---------- Podrobnosti predaje (skrbnik) ---------- */
function opozHTML(p) {
  var o = p.opozorila || []; if (!o.length) return '';
  return '<section class="stack">' + o.map(function (x) {
    return x.tip === 'mesec' ? '<div class="banner warn">Opozorilo! Ta mesec poteče zdravilo ' + esc(x.naziv) + ' (' + rokFmt(x.rok) + ').</div>' : '<div class="banner warn">Razlika v količini: ' + esc(x.naziv) + ', prej ' + nf(x.prej) + ', zdaj ' + nf(x.kol) + '. Razlog: ' + esc(x.razlog) + '</div>';
  }).join('') + '</section>';
}
function medDetailHTML(p) {
  var z = p.zdravila; if (!z) return '';
  var keys = Object.keys(z).sort(function (a, b) {
    var x = Object.keys(MEDS).indexOf(a), y = Object.keys(MEDS).indexOf(b); return (x < 0 ? 999 : x) - (y < 0 ? 999 : y);
  });
  var groups = [], by = {};
  keys.forEach(function (k) { var r = z[k], g = r.skupina || 'Zdravila'; if (!by[g]) { by[g] = { naziv: g, nar: !!r.nar, rows: [] }; groups.push(by[g]); } by[g].rows.push(r); });
  groups.sort(function (a, b) { return (b.nar ? 1 : 0) - (a.nar ? 1 : 0); });
  return groups.map(function (g) {
    return '<section class="card stack"><h2>' + esc(g.naziv) + (g.nar ? ' <span class="chip bad">NUJNO</span>' : '') + '</h2>' + g.rows.map(function (r) {
      var line = g.nar ? 'Količina ' + nf(r.kol) + ' · serija ' + esc(r.serija || '—') : (r.st === 'ok' ? (r.kol != null ? 'Količina ' + nf(r.kol) : '') : esc(r.razlog || ''));
      var extra = r.razlog && g.nar ? '<div class="hint">Razlika: prej ' + nf(r.prej) + ', zdaj ' + nf(r.kol) + '. Razlog: ' + esc(r.razlog) + '</div>' : '';
      return '<div class="stack" style="gap:2px"><div class="row"><b>' + esc(r.naziv) + '</b>' + (r.rok ? rokChip(r.rok) : '<span class="chip ' + (r.st === 'ok' ? 'ok' : 'warn') + '">' + (r.st === 'ok' ? 'V redu' : 'Manjka') + '</span>') + '</div>' + (line ? '<div class="hint">' + line + '</div>' : '') + extra + '</div>';
    }).join('') + '</section>';
  }).join('');
}
views.p = {
  mount: function () { A.innerHTML = '<div id="pd" class="stack"></div>'; },
  update: function () {
    var el = $('#pd'); if (!el) return;
    var id = route.id, p = S.predaje.filter(function (x) { return x.id === id; })[0] || S.detail[id];
    if (!p) {
      if (S.detail[id] === null) { el.innerHTML = '<a class="back" href="#zgodovina">← Zgodovina</a><div class="card"><h2>Predaja ni najdena</h2><p class="hint">Če si brez povezave, jo poskusi odpreti, ko je povezava nazaj.</p></div>'; return; }
      el.innerHTML = '<p class="hint">Nalagam …</p>';
      if (S.db && S.detail[id] === undefined && !S.loading['p' + id]) {
        S.loading['p' + id] = true;
        S.db.doc('predaje/' + id).get().then(function (s) { S.detail[id] = s.exists ? Object.assign({ id: id }, s.data()) : null; if (route && route.name === 'p' && route.id === id) views.p.update(); }).catch(function () { S.detail[id] = null; if (route && route.name === 'p' && route.id === id) views.p.update(); });
      }
      return;
    }
    if (S.detailSig[id] === undefined && S.db) {
      S.detailSig[id] = 'nalagam';
      S.db.doc('podpisi/' + id).get().then(function (s) { S.detailSig[id] = s.exists ? s.data() : null; if (route && route.name === 'p' && route.id === id) views.p.update(); }).catch(function () { S.detailSig[id] = null; if (route && route.name === 'p' && route.id === id) views.p.update(); });
    }
    var k = p.kisik || {}, probs = Object.keys(p.stanja || {}).filter(function (x) { return p.stanja[x] !== 'ok'; });
    var h = '<a class="back" href="#v-' + esc(p.vozilo) + '">← ' + esc(p.voziloOznaka || p.vozilo) + '</a><div><h1>Predaja ' + esc(p.voziloOznaka || p.vozilo) + '</h1><p class="hint">' + esc(fmtLong(p.cas)) + ' · ' + esc(p.izmena) + ' izmena</p></div>';
    h += opozHTML(p);
    h += '<section class="card stack"><dl class="kv"><dt>Predal</dt><dd>' + esc(p.oddajnik) + '</dd><dt>Prevzel</dt><dd>' + esc(p.prevzemnik) + '</dd><dt>Kilometrina</dt><dd>' + nf(p.km) + ' km</dd><dt>Gorivo</dt><dd>' + esc(gorivoL(p.gorivo)) + '</dd><dt>Kisik, stacionarna</dt><dd>' + nf(k.stac) + ' bar</dd><dt>Kisik, prenosna</dt><dd>' + nf(k.prenosna) + ' bar</dd>' + (k.rezerva != null ? '<dt>Kisik, rezervna</dt><dd>' + nf(k.rezerva) + ' bar</dd>' : '') + '<dt>Baterija defibrilatorja</dt><dd>' + nf(p.defi) + ' %</dd></dl></section>';
    h += medDetailHTML(p);
    h += '<section class="card stack"><h2>Težave pri predaji (' + probs.length + ')</h2>' + (probs.length ? '<ul class="defects">' + probs.map(function (x) { var nm = (p.imena && p.imena[x]) || (ITEMS[x] ? ITEMS[x].g.naziv + ' · ' + ITEMS[x].p.naziv : x); return '<li class="defect"><div class="row"><strong>' + esc(nm) + '</strong><span class="chip ' + (p.stanja[x] === 'pokvarjeno' ? 'bad' : 'warn') + '">' + esc(stanjeL(p.stanja[x])) + '</span></div><div>' + esc((p.komentarji || {})[x]) + '</div></li>'; }).join('') + '</ul>' : '<p class="hint">Vsa oprema je v redu.</p>') + '</section>';
    if (p.poskodbe || p.opombe) h += '<section class="card stack">' + (p.poskodbe ? '<div><span class="lbl">Poškodbe karoserije</span><p>' + esc(p.poskodbe) + '</p></div>' : '') + (p.opombe ? '<div><span class="lbl">Ostale posebnosti</span><p>' + esc(p.opombe) + '</p></div>' : '') + '</section>';
    if (p.stFoto) {
      if (S.detailFoto[id] === undefined && S.db) {
        S.detailFoto[id] = 'nalagam';
        S.db.doc('fotke/' + id).get().then(function (s) { S.detailFoto[id] = s.exists ? s.data() : null; if (route && route.name === 'p' && route.id === id) views.p.update(); }).catch(function () { S.detailFoto[id] = null; if (route && route.name === 'p' && route.id === id) views.p.update(); });
      }
      var fo = S.detailFoto[id];
      h += '<section class="card stack"><h2>Fotografije poškodb (' + p.stFoto + ')</h2>' + (fo === 'nalagam' || fo === undefined ? '<p class="hint">Nalagam fotografije …</p>' : fo && fo.slike ? '<div class="gal stack">' + fo.slike.map(function (sl, i) { return /^data:image\/jpeg;base64,/.test(sl) ? '<img data-act="foto-big" data-id="' + esc(id) + '" data-i="' + i + '" alt="Fotografija ' + (i + 1) + '" src="' + esc(sl) + '">' : ''; }).join('') + '</div><p class="hint">Klikni na fotografijo za povečavo.</p>' : '<p class="hint">Fotografije niso na voljo (morda si brez povezave).</p>') + '</section>';
    }
    var sg = S.detailSig[id];
    var one = function (s, l) { return /^data:image\/png;base64,/.test(s || '') ? '<div class="field"><span class="lbl">' + l + '</span><img class="sig" alt="' + l + '" src="' + esc(s) + '"></div>' : ''; };
    h += '<section class="card stack"><h2>Podpisa</h2>' + (sg === 'nalagam' || sg === undefined ? '<p class="hint">Nalagam podpise …</p>' : sg ? one(sg.podpis1, 'Oddajnik') + one(sg.podpis2, 'Prevzemnik') : '<p class="hint">Podpisi niso na voljo (morda si brez povezave).</p>') + '</section>';
    el.innerHTML = h;
  }
};

/* ---------- Napake (skrbnik) ---------- */
function openRow(n) {
  var closing = S.closing === n.id;
  return '<li class="defect"><div class="row"><strong>' + esc(n.naziv) + '</strong><span class="chip ' + (n.stanje === 'pokvarjeno' ? 'bad' : 'warn') + '">' + esc(stanjeL(n.stanje) || 'Manjka') + '</span></div>' +
    '<div><a href="#v-' + esc(n.vozilo) + '"><b>' + esc(n.voziloOznaka) + '</b></a> · ' + esc(n.opis) + '</div><div class="hint">Od ' + esc(fmtDT(n.ustvarjeno)) + ' · <a href="#p-' + esc(n.predaja) + '">predaja</a></div>' +
    (closing ? '<div class="stack" style="margin-top:8px"><div class="field"><label for="close-text">Kako je odpravljeno (neobvezno)</label><input id="close-text" type="text" maxlength="200" value="' + esc(S.closingText) + '"></div><div class="actions"><button type="button" class="btn primary small" data-act="zapri-ok" data-id="' + esc(n.id) + '">Potrdi zaprtje</button><button type="button" class="btn secondary small" data-act="zapri-no">Prekliči</button></div></div>'
      : '<div style="margin-top:6px"><button type="button" class="btn secondary small" data-act="zapri" data-id="' + esc(n.id) + '">Označi kot odpravljeno</button></div>') + '</li>';
}
views.napake = {
  mount: function () {
    subZaprte();
    A.innerHTML = '<div class="stack"><h1>Napake</h1><section class="card" id="nopen"></section><h2>Nedavno odpravljene</h2><section class="card" id="nclosed"></section></div>';
  },
  update: function () {
    var o = $('#nopen'); if (!o) return;
    var ae = document.activeElement; if (ae && ae.id === 'close-text') return;
    var open = S.odprte.slice().sort(function (a, b) { return String(b.ustvarjeno).localeCompare(String(a.ustvarjeno)); });
    o.innerHTML = !S.ready.vozila ? '<p class="hint">Nalagam …</p>' : open.length ? '<ul class="defects">' + open.map(openRow).join('') + '</ul>' : '<h2 style="margin-bottom:6px">Ni odprtih napak</h2><p class="hint">Napake se zapišejo samodejno, ko pri predaji označiš »Manjka« ali »Pokvarjeno«.</p>';
    var closed = S.zaprte.filter(function (n) { return n.odprta === false; });
    $('#nclosed').innerHTML = !S.ready.zaprte ? '<p class="hint">Nalagam …</p>' : closed.length ? '<ul class="defects">' + closed.map(function (n) { return '<li class="defect"><div class="row"><strong>' + esc(n.naziv) + '</strong><span class="hint">' + esc(n.voziloOznaka) + '</span></div><div class="hint">Odpravljeno ' + esc(fmtDT(n.zaprto)) + (n.zaprtoOpomba ? ' · ' + esc(n.zaprtoOpomba) : '') + '</div></li>'; }).join('') + '</ul>' : '<p class="hint">Še ni odpravljenih napak.</p>';
  }
};
function closeDefect(id) {
  var n = S.odprte.filter(function (x) { return x.id === id; })[0]; if (!n) return;
  var upd = {}; upd['odprte.' + id] = S.db.DEL;
  var b = S.db.batch();
  b.set('napake/' + id, { vozilo: n.vozilo, voziloOznaka: n.voziloOznaka, predaja: n.predaja || '', postavka: n.postavka || '', naziv: n.naziv, stanje: n.stanje || '', opis: n.opis || '', ustvarjeno: n.ustvarjeno || '', odprta: false, zaprto: new Date().toISOString(), zaprtoOpomba: S.closingText.trim() });
  b.update('vozila/' + n.vozilo, upd);
  b.commit().catch(function (x) { handleWriteError(x, true); });
}

/* ---------- Zgodovina (skrbnik) ---------- */
views.zgodovina = {
  mount: function () {
    subPredaje();
    A.innerHTML = '<div class="stack"><h1>Zgodovina predaj</h1><div class="field"><label for="fv">Vozilo</label><select id="fv"></select></div><section class="card" id="hlist"></section><p class="hint">Prikazanih je zadnjih 40 predaj.</p></div>';
  },
  update: function () {
    var sel = $('#fv'); if (!sel) return;
    if (document.activeElement !== sel) {
      sel.innerHTML = '<option value="">Vsa vozila</option>' + S.vozila.map(function (v) { return '<option value="' + esc(v.id) + '"' + (S.filterV === v.id ? ' selected' : '') + '>' + esc(v.oznaka) + '</option>'; }).join('');
    }
    var list = S.predaje.filter(function (p) { return !S.filterV || p.vozilo === S.filterV; });
    $('#hlist').innerHTML = !S.ready.predaje ? '<p class="hint">Nalagam …</p>' : list.length ? list.map(function (p) { return '<a class="row link" href="#p-' + esc(p.id) + '"><span><b>' + esc(p.voziloOznaka || p.vozilo) + '</b> · ' + esc(fmtDT(p.cas)) + '<br><span class="hint">' + esc(p.oddajnik) + ' → ' + esc(p.prevzemnik) + '</span></span><span class="chips">' + (p.stNapak ? '<span class="chip bad">Težave: ' + p.stNapak + '</span>' : '<span class="chip ok">V redu</span>') + (p.stOpozoril ? '<span class="chip warn">Opozorila: ' + p.stOpozoril + '</span>' : '') + '</span></a>'; }).join('') : '<p class="hint">Še ni zabeleženih predaj.</p>';
  }
};

/* ---------- QR kode (skrbnik) ---------- */
function qrModules(text) {
  if (typeof qrcode !== 'function') return null;
  try { var q = qrcode(0, 'M'); q.addData(text); q.make(); var n = q.getModuleCount(), d = ''; for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + 4) + ' ' + (r + 4) + 'h1v1h-1z'; return { n: n, d: d }; } catch (e) { return null; }
}
function qrSvg(text) {
  var m = qrModules(text); if (!m) return '';
  var s = m.n + 8;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + ' ' + s + '" shape-rendering="crispEdges" role="img" aria-label="QR koda"><rect width="' + s + '" height="' + s + '" fill="#fff"/><path d="' + m.d + '" fill="#000"/></svg>';
}
function stickerSvg(v, text) {
  var m = qrModules(text); if (!m) return '';
  var s = m.n + 8;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 770" width="600" height="770"><rect width="600" height="770" fill="#fff"/>' +
    '<text x="300" y="96" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="70" font-weight="700" fill="#000">' + esc(v.oznaka) + '</text>' +
    '<svg x="50" y="130" width="500" height="500" viewBox="0 0 ' + s + ' ' + s + '" shape-rendering="crispEdges"><rect width="' + s + '" height="' + s + '" fill="#fff"/><path d="' + m.d + '" fill="#000"/></svg>' +
    '<text x="300" y="690" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="700" fill="#000">Predaja vozila</text>' +
    '<text x="300" y="734" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="26" fill="#333">Skeniraj s kamero telefona</text></svg>';
}
function appBase() { return location.origin + location.pathname.replace(/[^\/]*$/, ''); }
function vehLink(v) { return appBase() + '#n-' + v.id; }
function downloadSvg(name, svg) {
  var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
}
views.qr = {
  mount: function () {
    A.innerHTML = '<div class="stack"><h1 class="noprint">QR kode</h1><p class="hint noprint">Vsako vozilo ima svojo QR kodo. Natisni jo in jo prilepi v kabino; telefon jo prebere s kamero in odpre predajo tega vozila.</p>' +
      '<div class="actions noprint"><button type="button" class="btn primary" data-act="print">Natisni vse QR kode</button></div><div id="qgrid" class="qrgrid"></div></div>';
  },
  update: function () {
    var g = $('#qgrid'); if (!g) return;
    if (!S.ready.vozila) { g.innerHTML = '<p class="hint">Nalagam …</p>'; return; }
    var act = S.vozila.filter(function (v) { return v.aktivno !== false; });
    if (!act.length) { g.innerHTML = '<div class="card empty" style="grid-column:1/-1"><h2>Še ni vozil</h2><p>Najprej dodaj vozilo pod »Vozila«.</p></div>'; return; }
    g.innerHTML = act.map(function (v) {
      var link = vehLink(v), svg = qrSvg(link);
      return '<article class="card qrcard"><b class="oznaka" style="font-size:26px;text-align:center">' + esc(v.oznaka) + '</b>' + (svg || '<p class="hint">QR koda se ni ustvarila. Uporabi povezavo spodaj.</p>') + '<div class="qrcap">Predaja vozila</div><div class="qrlink">' + esc(link) + '</div><div class="actions noprint">' + (svg ? '<button type="button" class="btn secondary small" data-act="qr-save" data-id="' + esc(v.id) + '">Prenesi nalepko</button>' : '') + '<button type="button" class="btn secondary small" data-act="qr-copy" data-id="' + esc(v.id) + '">Kopiraj povezavo</button></div></article>';
    }).join('');
  }
};

/* ---------- Dogodki ---------- */
A.addEventListener('input', function (e) {
  var t = e.target;
  if (draft && t.closest && t.closest('#hf')) touched = true;
  if (t.dataset && t.dataset.f && draft) {
    setPath(draft, t.dataset.f, t.value); t.classList.remove('invalid'); var f = t.closest('.field'); if (f) f.classList.remove('invalid'); if (t.dataset.f === 'poskodbe') showFotoBox(); saveSoon();
  } else if (t.dataset && t.dataset.kom && draft) {
    draft.komentarji[t.dataset.kom] = t.value; t.classList.remove('invalid'); saveSoon();
  } else if (t.dataset && t.dataset.zd && draft) {
    var p = t.dataset.zd.split('|'), k = p[0], fld = p[1];
    draft.zd[k][fld] = t.value;
    var med = t.closest('.med'); if (med) med.classList.remove('invalid');
    t.classList.remove('invalid');
    if (fld === 'kol' || fld === 'serija') {
      var rz = med && $('.med-razlog', med), v = voziloById(route.id);
      if (rz && v) rz.hidden = !needRazlog(v, k);
      updateMedGroup(MEDS[k].g.id); updateProgress();
    }
    saveSoon();
  } else if (t.id === 'close-text') { S.closingText = t.value; }
});
A.addEventListener('change', function (e) {
  var t = e.target;
  if (t.id === 'fv') { S.filterV = t.value; views.zgodovina.update(); }
  else if (t.id === 'foto-in' && draft) { var fs = Array.prototype.slice.call(t.files || []); t.value = ''; if (fs.length) { touched = true; addPhotos(fs); } }
  else if (t.dataset && t.dataset.zd && draft && t.dataset.zd.split('|')[1] === 'rok') {
    var k = t.dataset.zd.split('|')[0]; draft.zd[k].rok = t.value; refreshMed(k);
  }
});
function authMsg(e) {
  var c = (e && e.code) || '';
  if (/invalid-credential|wrong-password|user-not-found|invalid-email|missing-password/.test(c)) return 'Napačen e-poštni naslov ali geslo.';
  if (/too-many-requests/.test(c)) return 'Preveč poskusov. Počakaj nekaj minut.';
  if (/network/.test(c)) return 'Ni povezave z internetom.';
  if (/user-disabled/.test(c)) return 'Ta račun je onemogočen. Obrni se na skrbnika.';
  return 'Prijava ni uspela' + (c ? ' (' + c + ')' : '') + '.';
}
A.addEventListener('submit', function (e) {
  e.preventDefault();
  var id = e.target.id;
  if (id === 'hf') submitForm();
  else if (id === 'addform') addVehicle();
  else if (id === 'loginform') {
    var err = $('#l-err'), btn = $('#l-btn'); err.textContent = '';
    var em = $('#l-email').value.trim(), pw = $('#l-pass').value;
    if (!em || !pw) { err.textContent = 'Vpiši e-poštni naslov in geslo.'; return; }
    btn.disabled = true; btn.textContent = 'Prijavljam …';
    S.auth.signIn(em, pw).catch(function (x) { err.textContent = authMsg(x); btn.disabled = false; btn.textContent = 'Prijava'; });
  }
});
A.addEventListener('click', function (e) {
  var b = e.target.closest('[data-act]'); if (!b) return;
  var a = b.dataset.act, k = b.dataset.k, v = b.dataset.v, id = b.dataset.id;
  if (draft && b.closest('#hf')) touched = true;
  if (a === 'st' && draft) {
    draft.stanja[k] = v; var it = $('.item[data-k="' + k + '"]'); if (it) it.classList.remove('invalid'); refreshItem(k);
  } else if (a === 'allok' && draft) {
    var g = SKUPINE.filter(function (x) { return x.id === b.dataset.g; })[0];
    g.postavke.forEach(function (p) { var kk = g.id + '.' + p.id; if (!draft.stanja[kk]) { draft.stanja[kk] = 'ok'; var el = $('.item[data-k="' + kk + '"]'); if (el) el.outerHTML = itemHTML(kk); } });
    updateGroup(g.id); updateProgress(); saveSoon();
  } else if (a === 'mst' && draft) { draft.zd[k].st = v; refreshMed(k); }
  else if (a === 'mallok' && draft) {
    var zg = ZDR.filter(function (x) { return x.id === b.dataset.g; })[0];
    zg.postavke.forEach(function (p) { var kk = zg.id + '_' + p.id; if (!draft.zd[kk].st) { draft.zd[kk].st = 'ok'; refreshMed(kk); } });
  } else if (a === 'nov' && draft) { draft.zd[k].nov = true; draft.zd[k].rok = ''; refreshMed(k); var ri = $('#m-' + k + '-rok'); if (ri) ri.focus(); }
  else if (a === 'nov-ne' && draft) { draft.zd[k].nov = false; draft.zd[k].rok = ''; refreshMed(k); }
  else if (a === 'izmena' && draft) { draft.izmena = v; setSeg('izmena', v); var f1 = $('[data-field="izmena"]'); if (f1) f1.classList.remove('invalid'); saveSoon(); }
  else if (a === 'gorivo' && draft) { draft.gorivo = v; setSeg('gorivo', v); var f2 = $('[data-field="gorivo"]'); if (f2) f2.classList.remove('invalid'); saveSoon(); }
  else if (a === 'clrpad') { var c = $('#pad' + b.dataset.p); if (c && c.clearPad) c.clearPad(); }
  else if (a === 'scan') { doScan(); }
  else if (a === 'login-email') { showLogin('email'); }
  else if (a === 'login-back') { try { history.replaceState(null, '', location.pathname + location.search); } catch (x) { } showLogin('choice'); }
  else if (a === 'foto-add') { var fi = $('#foto-in'); if (fi) fi.click(); }
  else if (a === 'foto-del' && draft) { draft.foto.splice(Number(b.dataset.i), 1); updateFotoBox(); saveSoon(); }
  else if (a === 'foto-big') { var fl = S.detailFoto[b.dataset.id]; if (fl && fl.slike && fl.slike[Number(b.dataset.i)]) openLightbox(fl.slike[Number(b.dataset.i)]); }
  else if (a === 'hide' || a === 'unhide') {
    S.db.doc('vozila/' + id).update({ aktivno: a === 'unhide' }).catch(function (x) { handleWriteError(x, true); });
    if (a === 'hide') { location.hash = '#vozila'; toast('Vozilo je skrito.'); }
  } else if (a === 'zapri') { S.closing = id; S.closingText = ''; views.napake.update(); var ct = $('#close-text'); if (ct) ct.focus(); }
  else if (a === 'zapri-no') { S.closing = null; views.napake.update(); }
  else if (a === 'zapri-ok') {
    closeDefect(id);
    S.closing = null; S.closingText = ''; toast('Napaka je zaprta.');
  } else if (a === 'print') { window.print(); }
  else if (a === 'qr-save') {
    var veh = voziloById(id); if (!veh) return;
    downloadSvg('qr-' + id + '.svg', stickerSvg(veh, vehLink(veh)));
  } else if (a === 'qr-copy') {
    var veh2 = voziloById(id); if (!veh2) return;
    var link = vehLink(veh2);
    try { navigator.clipboard.writeText(link).then(function () { toast('Povezava kopirana.'); }, function () { toast('Kopiranje ni uspelo. Označi povezavo in jo kopiraj ročno.'); }); }
    catch (x) { toast('Kopiranje ni uspelo. Označi povezavo in jo kopiraj ročno.'); }
  }
});
function openLightbox(src) {
  var old = $('.lightbox'); if (old) old.remove();
  var lb = document.createElement('div'); lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', 'Fotografija, klikni za zaprtje');
  var im = document.createElement('img'); im.src = src; im.alt = 'Fotografija poškodbe'; lb.appendChild(im);
  function close() { lb.remove(); document.removeEventListener('keydown', esc2); }
  function esc2(ev) { if (ev.key === 'Escape') close(); }
  lb.addEventListener('click', close); document.addEventListener('keydown', esc2); document.body.appendChild(lb);
}
window.addEventListener('hashchange', function () {
  /* Odjavljen: če se odpre povezava vozila (QR s kamero telefona), pokaži prijavo z e-pošto. */
  if (!S.user) { if (loginShown && /^#n-/.test(location.hash || '') && !$('#loginform')) showLogin(); return; }
  onRoute();
});
window.addEventListener('online', function () { S.online = true; updateStatus(); });
window.addEventListener('offline', function () { S.online = false; updateStatus(); });
$('#logout').addEventListener('click', function () {
  if (!S.online) { toast('Brez povezave se ne moreš odjaviti, ker se potem ne bi mogel več prijaviti.', 5000); return; }
  S.auth.signOut();
});

/* ---------- Zagon ---------- */
var loginShown = false;
function showLogin(mode, note) {
  loginShown = true; stopSubs(); S.user = null; route = null; draft = null; formBuilt = false; touched = false; setChrome(false); updateNotice();
  var withCar = /^#n-/.test(location.hash || '');
  var explicit = !!mode;
  if (!mode) mode = withCar ? 'email' : 'choice';
  if (mode === 'email' && !note && withCar) note = 'Prijavi se, da odpreš predajo vozila.';
  var h = '<div class="login card stack"><img class="logo" src="icon-192.png" alt="">';
  if (mode === 'choice') {
    h += '<h1>Predaja vozila</h1><p class="hint">Izberi, kako želiš nadaljevati.</p><div class="choice">' +
      '<button type="button" class="btn primary big" data-act="scan">' + ICON_QR + '<span>Skeniraj QR kodo</span></button>' +
      '<button type="button" class="btn secondary big" data-act="login-email">' + ICON_MAIL + '<span>Prijava z e-pošto</span></button></div>' +
      '<p class="hint">QR koda izbere vozilo, nato se prijaviš z e-pošto. Na istem telefonu se prijaviš samo enkrat.</p>';
  } else {
    h += '<h1>Prijava</h1>' + (note ? '<p class="notice ok" role="status">' + esc(note) + '</p>' : '<p class="hint">Vpiši podatke, ki ti jih je dal skrbnik aplikacije.</p>') +
      '<form id="loginform" class="stack" novalidate><div class="field"><label for="l-email">E-poštni naslov</label><input id="l-email" type="email" autocomplete="username" inputmode="email" autocapitalize="none" spellcheck="false"></div>' +
      '<div class="field"><label for="l-pass">Geslo</label><input id="l-pass" type="password" autocomplete="current-password"></div>' +
      '<p class="err" id="l-err" role="alert"></p><button class="btn primary" type="submit" id="l-btn">Prijava</button></form>' +
      '<button type="button" class="btn secondary small" data-act="login-back" style="align-self:flex-start">← Nazaj</button>';
  }
  A.innerHTML = h + '</div>';
  if (mode === 'email' && (explicit || note)) setTimeout(function () { var e = $('#l-email'); if (e && !S.user) e.focus(); }, 0);
}
function fatal(title, text) { setChrome(false); A.innerHTML = '<div class="card stack"><h2>' + esc(title) + '</h2><p>' + text + '</p></div>'; }
function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  var go = function () { navigator.serviceWorker.register('sw.js').catch(function () { }); };
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
}
/* Vloga: skrbnik je tisti, ki mu pravila baze dovolijo prebrati zgodovino predaj (pravila: e-poštni naslov
   skrbnika ali dokument v zbirki "uporabniki"). Aplikacija to samo preveri pri strežniku. Brez povezave velja
   zadnja znana vloga. Prava zaščita podatkov so pravila baze, ne to preverjanje. */
function loadRole(user) {
  var key = 'predaja-vloga-' + user.uid, cached = lsGet(key);
  if (!S.online) return Promise.resolve(cached === 'admin');
  var probe = S.db.collection('predaje').limit(1).getServer().then(function () { lsSet(key, 'admin'); return true; }, function (e) {
    if (e && e.code === 'permission-denied') { lsSet(key, 'user'); return false; }
    return cached === 'admin';
  });
  var timeout = new Promise(function (res) { setTimeout(function () { res(cached === 'admin'); }, 8000); });
  return Promise.race([probe, timeout]);
}
function startSession(user) {
  loginShown = false; S.user = user; S.admin = false; S.roleReady = false; S.last = null;
  setChrome(true); A.innerHTML = '<p class="hint">Nalagam …</p>';
  loadRole(user).then(function (a) {
    if (S.user !== user) return;
    S.admin = a; S.roleReady = true; setChrome(true); updateNotice();
    if (a) subVozila();
    onRoute();
  });
}
function init() {
  registerSW();
  updateStatus();
  if (!configured()) {
    fatal('Aplikacija še ni povezana z bazo', 'Odpri datoteko <b>config.js</b> na GitHubu in vanjo prilepi nastavitve iz Firebase (navodila v datoteki BERI-ME.md, korak 5).');
    return;
  }
  import('./store.js').then(function (m) {
    var st = m.connect(firebaseConfig); S.db = st.db; S.auth = st.auth;
    st.auth.onChange(function (user) {
      if (user) { if (S.user && S.user.uid === user.uid) return; startSession(user); }
      else showLogin();
    });
  }).catch(function () {
    fatal('Ni povezave', 'Aplikacije ni bilo mogoče naložiti. Če jo odpiraš prvič, potrebuješ internet. Po prvem odprtju deluje tudi brez povezave.');
  });
}
init();}
init();
