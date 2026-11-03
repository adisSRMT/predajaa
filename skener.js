// Skener QR kode s kamero telefona (deluje v aplikaciji, brez zunanje aplikacije).
// Knjižnica za branje kode: jsqr.js (jsQR, licenca Apache 2.0). Naloži se šele, ko skener odpreš.
function loadJsQR() {
  if (window.jsQR) return Promise.resolve();
  return new Promise(function (res, rej) {
    var s = document.createElement('script'); s.src = 'jsqr.js'; s.onload = res; s.onerror = function () { rej(new Error('jsqr')); };
    document.head.appendChild(s);
  });
}

/* Odpre kamero čez cel zaslon. Vrne besedilo QR kode ali null, če uporabnik prekliče. */
export function odpriSkener() {
  return new Promise(function (resolve) {
    var wrap = document.createElement('div');
    wrap.className = 'scan'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-label', 'Skener QR kode');
    wrap.innerHTML = '<video playsinline muted autoplay></video><div class="scan-frame" aria-hidden="true"></div>' +
      '<p class="scan-msg" role="status">Usmeri kamero v QR kodo na vozilu.</p><button type="button" class="btn secondary scan-x">Prekliči</button>';
    document.body.appendChild(wrap);
    var video = wrap.querySelector('video'), msg = wrap.querySelector('.scan-msg'), stream = null, stopped = false;
    var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
    function onKey(e) { if (e.key === 'Escape') finish(null); }
    function finish(val) {
      if (stopped) return; stopped = true;
      document.removeEventListener('keydown', onKey);
      try { if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { }
      wrap.remove(); resolve(val);
    }
    document.addEventListener('keydown', onKey);
    wrap.querySelector('.scan-x').addEventListener('click', function () { finish(null); });
    wrap.querySelector('.scan-x').focus();
    function tick() {
      if (stopped) return;
      if (video.readyState >= 2 && video.videoWidth) {
        var w = Math.min(640, video.videoWidth), h = Math.round(video.videoHeight * w / video.videoWidth);
        canvas.width = w; canvas.height = h; ctx.drawImage(video, 0, 0, w, h);
        var img = ctx.getImageData(0, 0, w, h), r = window.jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
        if (r && r.data) { finish(r.data); return; }
      }
      setTimeout(function () { requestAnimationFrame(tick); }, 80);
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      msg.textContent = 'Ta brskalnik ne omogoča kamere v aplikaciji. Skeniraj QR kodo s kamero telefona.'; return;
    }
    loadJsQR().then(function () {
      return navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
    }).then(function (s) {
      if (stopped) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
      stream = s; video.srcObject = s; return video.play();
    }).then(function () { tick(); }).catch(function (e) {
      var n = e && e.name;
      msg.textContent = n === 'NotAllowedError' || n === 'SecurityError' ? 'Dostop do kamere ni dovoljen. Dovoli kamero za to stran v nastavitvah brskalnika.'
        : n === 'NotFoundError' || n === 'OverconstrainedError' ? 'Kamere ni mogoče najti.'
        : e && e.message === 'jsqr' ? 'Skenerja ni bilo mogoče naložiti. Preveri internet.' : 'Kamere ni mogoče odpreti.';
    });
  });
}
