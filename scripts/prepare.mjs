// Pripravi nastavitve za Android aplikacijo (zažene ga GitHub Actions, ne ti).
// Aplikacija odpre spletno aplikacijo s tvojega naslova (GitHub Pages), zato je vedno enaka spletni različici.
import { mkdirSync, writeFileSync } from 'node:fs';

function javniNaslov() {
  let u = (process.env.PUBLIC_URL || '').trim();
  if (!u) {
    const repo = (process.env.GITHUB_REPOSITORY || '').trim(); // npr. "janez/predaja-vozil"
    const m = repo.match(/^([^/]+)\/(.+)$/);
    if (!m) throw new Error('Ni mogoče ugotoviti naslova aplikacije. Nastavi PUBLIC_URL.');
    const owner = m[1].toLowerCase(), name = m[2];
    u = name.toLowerCase() === owner + '.github.io' ? `https://${owner}.github.io/` : `https://${owner}.github.io/${name}/`;
  }
  if (!/^https:\/\//.test(u)) throw new Error('PUBLIC_URL mora začeti z https://');
  return u.endsWith('/') ? u : u + '/';
}

const url = javniNaslov();
const config = {
  appId: 'si.predajavozil.app',
  appName: 'Predaja vozil',
  webDir: 'www',
  backgroundColor: '#EDF0F3',
  server: { url, errorPath: 'offline.html', cleartext: false },
  android: { allowMixedContent: false, appendUserAgent: 'PredajaVozilApp' },
  plugins: { SystemBars: { insetsHandling: 'css' } }
};
writeFileSync('capacitor.config.json', JSON.stringify(config, null, 2) + '\n');

// Lokalna stran, ki se pokaže samo, če se aplikacija prvič odpre brez interneta.
mkdirSync('www', { recursive: true });
writeFileSync('www/offline.html', `<!doctype html>
<html lang="sl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Predaja vozil</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#EDF0F3;color:#16202A;font:16px/1.5 system-ui,sans-serif;text-align:center;padding:24px;box-sizing:border-box}
main{max-width:360px}h1{font-size:22px;margin:0 0 8px}p{margin:0 0 20px;color:#4a5662}
button{font:inherit;font-weight:600;background:#1D5FBF;color:#fff;border:0;border-radius:12px;padding:14px 22px}
</style></head><body><main>
<h1>Ni povezave z internetom</h1>
<p>Aplikacijo je treba prvič odpreti z internetom. Potem deluje tudi brez signala.</p>
<button type="button" onclick="location.href='${url}'">Poskusi znova</button>
</main></body></html>
`);
console.log('Naslov aplikacije:', url);
