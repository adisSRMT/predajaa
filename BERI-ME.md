# Predaja vozil – navodila za postavitev

Spletna aplikacija za predajo reševalnih vozil: vsako vozilo ima svojo QR kodo, ob skeniranju se odpre obrazec (kdo predaja, kdo prevzema, izmena, ura, kilometrina, gorivo, kisik, defibrilator, pregled opreme, poškodbe s fotografijami, podpisa). Posebej so obvezni **narkotiki** (količina in številka serije), za vsa zdravila pa aplikacija hrani **rok uporabe** in opozori, ko poteče. Napake na vozilih se zbirajo na seznamu. Deluje na telefonu kot aplikacija in tudi brez signala.

Sta dve vlogi: **skrbnik** vidi vse (Vozila, Napake, Zgodovina, QR kode), **navadni uporabnik** vidi samo predajo vozila: izbere vozilo s seznama ali skenira njegovo QR kodo.

**Prva stran** ima dve izbiri:

- **Skeniraj QR kodo**: odpre kamero v aplikaciji. Ko prebere kodo vozila, se prijaviš z e-pošto (na istem telefonu samo enkrat) in odpre se predaja tega vozila. Sama QR koda **ne spusti** nikogar noter, vedno je potrebna prijava.
- **Prijava z e-pošto**: po prijavi navadni uporabnik izbere vozilo s seznama ali skenira QR kodo, da neposredno odpre vozilo, za katero piše predajo.

- **Datoteke** živijo na GitHubu in se prikazujejo prek GitHub Pages (brezplačno).
- **Podatki in prijava** so v Firebase (brezplačni paket Spark, brez kartice).
- Nič ne potrebuje programiranja. Vse je klikanje in kopiranje.

Skupaj vzame približno 30 minut. Korake naredi po vrstnem redu.

> **Pomembno:** v aplikacijo ne vpisuj podatkov o pacientih. Namenjena je samo vozilom in opremi.

---

## Korak 1: GitHub račun in repozitorij

1. Odpri https://github.com in se registriraj (ali prijavi).
2. Zgoraj desno klikni **+** → **New repository**.
3. **Repository name:** `predaja-vozil` (brez šumnikov in presledkov).
4. Izberi **Public**. (Brezplačni GitHub Pages deluje samo z javnim repozitorijem. Javna je le koda aplikacije, podatki ostanejo v Firebase za prijavo.)
5. Klikni **Create repository**.

> Naslov aplikacije bo `https://TVOJE-UPORABNISKO-IME.github.io/predaja-vozil/`. QR kode vsebujejo ta naslov. **Ime repozitorija si izberi zdaj in ga kasneje ne spreminjaj**, sicer morajo biti QR kode natisnjene znova.

## Korak 2: Naloži datoteke in vklopi GitHub Pages

**2a. Naloži datoteke**

1. Datoteko `predaja-vozil.zip` na računalniku **razpakiraj** (desni klik → Extract all / Razširi vse).
2. V novem repozitoriju klikni **uploading an existing file** (ali **Add file** → **Upload files**).
3. Odpri razpakirano mapo, označi **vse datoteke v njej** (Ctrl+A) in jih povleci v okno brskalnika. Povleči datoteke, **ne mape**. `index.html` mora biti na vrhu repozitorija, ne v podmapi.
4. Počakaj, da se vse naložijo, in spodaj klikni **Commit changes**.

**2b. Vklopi GitHub Pages**

1. V repozitoriju klikni **Settings** → levo **Pages**.
2. Pod **Build and deployment** → **Source**: **Deploy from a branch**.
3. **Branch:** `main`, mapa `/ (root)` → **Save**.
4. Po 1–2 minutah (osveži stran) se zgoraj pokaže naslov aplikacije. Zapiši si ga.

Aplikacija se zdaj že odpre, vendar piše, da še ni povezana z bazo. To uredimo v korakih 3–5.

## Korak 3: Firebase – projekt, baza in prijava

1. Odpri https://console.firebase.google.com in se prijavi z Google računom.
2. **Create a project** (Ustvari projekt) → ime npr. `predaja-vozil` → **Continue**. Google Analytics lahko **izklopiš** → **Create project**.
3. Levo **Build** → **Firestore Database** → **Create database**.
   - Lokacija: izberi evropsko, npr. **eur3 (Europe)** ali **europe-west3 (Frankfurt)**. Kasneje je ni mogoče spremeniti.
   - Če te vpraša za izdajo (edition), izberi **Standard**.
   - Način: **Start in production mode** → **Create**.
4. Levo **Build** → **Authentication** → **Get started**.
   - Zavihek **Sign-in method** → **Email/Password** → vklopi prvo stikalo (**Enable**) → **Save**. (Stikala »Email link« ne vklapljaj.)

## Korak 4: Pravila baze (varnost)

Pravila določajo, kdo kaj sme: navadni uporabnik vidi seznam vozil in lahko odda predajo (z morebitnimi fotografijami), ne more pa brati zgodovine predaj, podpisov ali fotografij. Skrbnik lahko vse. Zapisane predaje se ne dajo spremeniti ali izbrisati.

1. Firebase → **Firestore Database** → zavihek **Rules**.
2. Izbriši vse, kar je tam.
3. Odpri datoteko `firestore.rules` (na GitHubu ali na računalniku, odpre se v Beležnici), **kopiraj vso vsebino** in jo prilepi.
4. V prilepljenem besedilu poišči `skrbnik@primer.si` in to zamenjaj z **e-poštnim naslovom skrbnika**, ki ga boš ustvaril v koraku 6a (samo male črke). Za več skrbnikov naslove ločiš z vejico: `['ana@posta.si', 'janez@posta.si']`. Naslov spremeni **samo tukaj v Firebase**, ne na GitHubu: repozitorij je javen.
5. Klikni **Publish**.

> **Pozor:** vsakič, ko pravila znova prilepiš (npr. po posodobitvi aplikacije), se v njih vrne `skrbnik@primer.si`. Takrat moraš naslov skrbnika **znova vpisati** pred **Publish**, sicer so vsi uporabniki navadni.

## Korak 5: Poveži aplikacijo z bazo (config.js)

1. Firebase → zobnik zraven **Project Overview** → **Project settings**.
2. Na zavihku **General** se pomakni na **Your apps** → klikni ikono **</>** (Web).
3. **App nickname:** `predaja-vozil`. Kljukice za Firebase Hosting **ne** označi → **Register app**.
4. Pokaže se koda z blokom `const firebaseConfig = { ... }`. Potrebuješ šest vrednosti: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.
5. Na GitHubu odpri datoteko **config.js** → ikona svinčnika (**Edit this file**).
6. Namesto vsakega `VSTAVI-TUKAJ` prilepi ustrezno vrednost. **Narekovaji ostanejo**. Primer:
   ```js
   apiKey: "AIzaSy...",
   authDomain: "predaja-vozil-1234.firebaseapp.com",
   projectId: "predaja-vozil-1234",
   ```
7. **Commit changes** → **Commit changes**.

> Te vrednosti niso skrivnost. Namenjene so spletni aplikaciji in jih vidi vsak obiskovalec. Podatke varujeta prijava in pravila iz koraka 4.

## Korak 6: Uporabniki in varnost prijave

**6a. Dodaj uporabnike**

1. Firebase → **Authentication** → zavihek **Users** → **Add user**.
2. Vpiši e-poštni naslov sodelavca in geslo → **Add user**.
3. Podatke zaupno sporoči sodelavcu. Če geslo pozabi: ⋮ pri uporabniku → **Reset password** (pošlje e-pošto na njegov naslov), ali pa račun ustvari znova.

Računi so lahko osebni (vsak sodelavec svoj, kar je bolje za sledljivost) ali pa en skupni račun za vso ekipo (preprosteje). Za skrbnike naredi osebne račune. Kdo je kdo pri predaji, se vedno vpiše v obrazec (ime oddajnika in prevzemnika, podpisa).

**6b. Skrbnik**

Vsak račun je privzeto **navadni uporabnik**. Skrbnik je tisti, čigar e-poštni naslov si vpisal v pravila (korak 4, točka 4). Če tega še nisi naredil: Firebase → **Firestore Database** → zavihek **Rules** → zamenjaj `skrbnik@primer.si` z naslovom skrbnika (male črke) → **Publish**. Skrbnik se odjavi in se znova prijavi; zdaj vidi zavihke Vozila, Napake, Zgodovina in QR kode, pod imenom pa piše »skrbnik«.

Naslov mora biti **enak** naslovu računa, ustvarjenega v koraku 6a. Novega skrbnika dodaš tako, da v pravilih dodaš njegov naslov na seznam in znova klikneš **Publish**.

*Druga možnost (ni obvezna):* skrbnik je lahko tudi tisti, ki ima v Firestore zbirki `uporabniki` dokument z ID-jem, enakim njegovemu **User UID** (Authentication → Users), in poljem `vloga` (tip `string`) z vrednostjo `admin`. Ta možnost deluje poleg seznama e-poštnih naslovov.

**6c. Izklopi samostojno registracijo (pomembno)**

Ker je koda javna, bi sicer lahko kdorkoli s podatki iz `config.js` ustvaril račun. To prepreči naslednja nastavitev:

1. Firebase → **Authentication** → zavihek **Settings** → **User actions**.
2. **Odznači** »Enable create (sign-up)« → **Save**.

Od zdaj lahko račune dodajaš samo ti, v konzoli (6a).

**6d. Dovoli domeno (če prijava ne uspe)**

Če se pri prijavi pokaže napaka z besedo `unauthorized-domain`: Firebase → **Authentication** → **Settings** → **Authorized domains** → **Add domain** → vpiši `TVOJE-UPORABNISKO-IME.github.io` (brez `https://` in brez poti).

## Korak 7: Preizkus in namestitev na telefon

1. Odpri naslov iz koraka 2b (`https://....github.io/predaja-vozil/`). Prikaže se prijava.
2. Prijavi se z računom skrbnika (koraka 6a in 6b). Zgoraj morajo biti zavihki Vozila, Napake, Zgodovina, QR kode, pod imenom pa piše »skrbnik«.
3. **Vozila** → **Dodaj vozilo** → vpiši oznako (npr. `NM-12`), registrsko in enoto.
4. Klikni **Predaja vozila** in izpolni poskusno predajo. Pri prvi predaji vozila vpišeš rok uporabe vsakega zdravila (glej poglavje Zdravila).
5. Preizkusi še račun navadnega uporabnika (ali drug brskalnik): po prijavi se ne sme videti nobenega zavihka, vidi pa seznam vozil in gumb **Skeniraj QR kodo**.
6. **Namesti na telefon:**
   - **Android (Chrome):** meni ⋮ → **Namesti aplikacijo** / **Dodaj na začetni zaslon**.
   - **iPhone (Safari):** gumb **Deli** → **Dodaj na začetni zaslon**. Na iPhonu mora biti odprt Safari.
7. Aplikacijo enkrat odpri z internetom. Potem se odpre tudi brez signala. Predaje, oddane brez signala, se shranijo v telefon in se same pošljejo, ko je povezava spet tam in je aplikacija odprta (pri vrhu zaslona piše »Brez povezave« ali »Pošiljam …«).

## Korak 8: QR kode

1. V aplikaciji odpri **QR kode** (zavihek zgoraj).
2. **Natisni vse QR kode** (natisne se po dve na vrstico) ali pri posameznem vozilu **Prenesi nalepko** (datoteka SVG).
3. Nalepko prilepi v kabino vozila (zaščiti jo s prozorno folijo).
4. Sodelavec kodo prebere na enega od dveh načinov:
   - **v aplikaciji:** na prvi strani (ali po prijavi) klikne **Skeniraj QR kodo**, telefon prvič vpraša za dovoljenje za kamero. Kodo usmeri v okvir.
   - **s kamero telefona:** odpre se povezava vozila v brskalniku ali nameščeni aplikaciji.

   Če še ni prijavljen, vpiše e-pošto in geslo (na istem telefonu **samo enkrat**, potem ostane prijavljen). Nato se odpre neposredno predaja tistega vozila. Po oddaji vidi potrditev in gumba **Skeniraj QR kodo** ali **Izbira vozila**. Zgodovine, podpisov ali QR kod ne vidi.

> Skeniranje v aplikaciji potrebuje dovoljenje za kamero (Nastavitve telefona → brskalnik ali aplikacija → Kamera) in deluje samo na naslovu `https://` (GitHub Pages to je). Če kamera ne deluje, uporabi kamero telefona. Koda iz druge aplikacije ali drugega naslova se zavrne.

---

## Kdo kaj vidi

| | Skrbnik | Navadni uporabnik |
|---|---|---|
| Predaja vozila (izbira s seznama ali skeniranje QR) | da | da |
| Seznam vozil (oznaka, registrska, enota) | da | da, za izbiro vozila |
| Vozila, Napake, Zgodovina, QR kode | da | ne |
| Podpisi in zgodovina predaj | da | ne |
| Dodajanje vozil, zapiranje napak | da | ne |
| Vpis roka uporabe, količine in narkotikov pri predaji | da | da |
| Dodajanje fotografij poškodb pri predaji | da | da |
| Ogled fotografij poškodb | da | ne |

To ni samo skrito v meniju. Pravila baze (korak 4) zgodovine, podpisov in fotografij navadnemu uporabniku sploh ne dovolijo prebrati.

## Zdravila in narkotiki

Seznam zdravil je v datoteki **oprema.js**, pod `ZDRAVILA` (na vrhu je navodilo). Skupina z `narkotik: true` je **NUJNA**.

**Narkotiki (NUJNO).** Pri vsaki predaji je za vsako zdravilo v tej skupini treba vpisati **količino** in **številko serije**. Aplikacija pokaže, kaj je bilo vpisano zadnjič. Če se količina razlikuje od zadnje predaje, je treba vpisati **razlog** (npr. uporabljeno pri pacientu). Razlika se v predaji označi z opozorilom in jo vidi skrbnik. Količina 0 ustvari napako »Količina 0«.

**Rok uporabe (mesec in leto).** Rok se vpiše **enkrat za vsako vozilo** (ob prvi predaji), aplikacija ga zapomni:

- Ob naslednjih predajah se pokaže samo »V roku · do 03/2027«. Vpisovati ni treba nič.
- **V mesecu, ko rok poteče**, se v predaji (zgoraj in pri zdravilu) izpiše: **»Opozorilo! Ta mesec poteče to zdravilo.«** Opozorilo se zapiše tudi v predajo in ga vidi skrbnik pri vozilu in v zgodovini.
- **Po izteku meseca** je zdravilo označeno kot poteklo. Predaje ni mogoče oddati, dokler ni zdravilo zamenjano (vpiše se nov rok) ali označeno kot »Manjka« (z opisom, ustvari se napaka).
- Ko zdravilo zamenjaš, ga pri predaji označiš z **Zamenjano, nov rok** in vpišeš novi rok. Neveljaven ali pretekel datum aplikacija ne sprejme.
- Če zdravilo označiš kot »Manjka«, se njegov stari rok pozabi. Ko ga dobiš nazaj, vpišeš nov rok.

Skrbnik vidi roke vseh zdravil pri vozilu (**Vozila** → **Podrobnosti**), na kartici vozila pa številko zdravil, ki ta mesec potečejo ali so že potekla.

**Količina zdravil (po potrebi).** Pri zdravilu, kjer želiš pri vsaki predaji vpisati tudi količino, v `oprema.js` dodaj tretji del:

```js
['adrenalin', 'Adrenalin', { kolicina: true }],
```

Količino pri vseh zdravilih v skupini vklopiš tako, da skupini dodaš `kolicina: true` (zraven `id` in `naziv`). Pri zdravilih z vklopljeno količino se po izbiri **V redu** pokaže obvezno polje **Količina** (celo število, aplikacija pokaže tudi, kaj je bilo vpisano zadnjič). Količina se zapiše v predajo in jo skrbnik vidi pri vozilu in v zgodovini. Rok uporabe deluje enako kot prej. V priloženem seznamu imata količino adrenalin in naloksan, kot primer. Pri narkotikih sta količina in številka serije vedno obvezni.

**Urejanje seznama.** Na GitHubu odpri `oprema.js` → svinčnik → pod `ZDRAVILA` kopiraj vrstico zdravila in spremeni besedilo (`['id', 'Naziv']`). Novo skupino narkotikov naredi s kopijo skupine Narkotiki (zraven `narkotik: true`). Id naj bo kratek, brez presledkov, šumnikov in podčrtajev. Seznam v datoteki je **primer**, zamenjaj ga s svojim.

## Fotografije poškodb

Pri **Poškodbe in opombe** se, ko uporabnik vpiše poškodbo karoserije, pokaže **Dodaj fotografijo** (do 3 fotografije na predajo, s kamero ali iz galerije). Fotografija se pred pošiljanjem pomanjša (najdaljša stran 1280 točk) in stisne, da ostane pod okoli 0,2 MB. Opis poškodbe je pri fotografijah obvezen. Fotografije vidi samo skrbnik: **Zgodovina** → predaja → **Fotografije poškodb**; klik na fotografijo jo poveča.

- Fotografije so shranjene v bazi (zbirka `fotke`), ne v Firebase Storage. Storage je namreč plačljiv del Firebasea, aplikacija pa mora ostati brezplačna.
- Brezplačna shramba baze je približno 1 GiB. Predaja s tremi fotografijami zasede do okoli 0,7 MB, običajno precej manj. Če kdaj zmanjka prostora, stare fotografije izbrišeš v Firebase → **Firestore Database** → zbirka `fotke`.
- Brez signala se fotografije shranijo skupaj s predajo in se pošljejo, ko je povezava spet tam.
- Ne fotografiraj pacientov in njihovih podatkov. Fotografije so samo za poškodbe vozila.

## Vsakdanje spremembe

### Sprememba seznama opreme

Seznam opreme je v datoteki **oprema.js** (na vrhu je navodilo). Na GitHubu jo odpri → svinčnik → spremeni ali dodaj vrstico (kopiraj obstoječo in spremeni besedilo) → **Commit changes**. Aplikacija se posodobi ob naslednjem odprtju z internetom. Stare predaje ostanejo v zgodovini take, kot so bile.

> Seznam v priloženi datoteki je primer. Pošlji svoj papirni seznam in ga bomo prilagodili.

Izmene (Dnevna, Nočna, 24 h) se spreminjajo v isti datoteki, pod `IZMENE`.

### Odstranitev uporabnika

Firebase → **Authentication** → **Users** → ⋮ pri uporabniku → **Disable account** (onemogoči) ali **Delete account**. Zapisane predaje ostanejo.

### Skrivanje vozila

Vozilo → **Podrobnosti** → **Skrij vozilo**. Zgodovina ostane. Skrita vozila so na dnu seznama vozil in jih lahko spet prikažeš.

---

## Posodobitev obstoječe namestitve

Če si prejšnjo različico že postavil:

1. Zip razpakiraj in iz mape **izbriši `config.js`**, da ne prepišeš svojih nastavitev. Če si urejal `oprema.js`, izbriši tudi to datoteko. Količino pri zdravilih dodaš ročno (glej poglavje Zdravila). Nove datoteke tega koraka so `skener.js`, `jsqr.js` in `LICENSE-jsqr.txt`, naloži jih skupaj z ostalimi.
2. Na GitHubu: **Add file** → **Upload files** → povleci preostale datoteke → **Commit changes** (obstoječe se prepišejo).
3. Korak 4: v Firebase **objavi nova pravila** (`firestore.rules`). Nova pravila dovolijo navadnemu uporabniku seznam vozil in oddajo fotografij. Brez njih seznam vozil in fotografije ne delujejo.
4. Korak 4, točka 4 in korak 6b: v pravilih **znova vpiši** e-poštni naslov skrbnika. Dokler tega ne narediš, so vsi uporabniki navadni in ne vidijo zavihkov.
5. Napake, ki so bile odprte v stari različici, se v novi ne prikažejo (shranjevanje napak se je spremenilo). Če si vnašal samo poskusne podatke, jih izbriši v Firestore Database (zbirke `vozila`, `predaje`, `podpisi`, `napake`) in začni znova.

## Brezplačne omejitve (Firebase Spark)

Dnevno približno 20.000 zapisov in 50.000 branj. Ena predaja je približno 3–6 zapisov (fotografije so še en zapis), zato to za običajno službo zadošča z veliko rezerve. Če omejitev kdaj dosežeš, aplikacija to pokaže na vrhu in spet deluje naslednji dan. Plačljivi paket ni vključen in se ne vklopi sam.

## Težave

| Težava | Rešitev |
|---|---|
| Stran na naslovu prikaže 404 | Pages še ni vklopljen (korak 2b) ali pa je `index.html` v podmapi. Mora biti na vrhu repozitorija. |
| »Aplikacija še ni povezana z bazo« | V `config.js` je še `VSTAVI-TUKAJ` (korak 5). Po shranitvi počakaj minuto in osveži. |
| »Napačen e-poštni naslov ali geslo« | Uporabnik ni ustvarjen (korak 6a) ali pa je napaka v naslovu. |
| »Baza ne dovoli dostopa« / »Zapis ni dovoljen« | Pravila niso objavljena (korak 4). |
| Prijava javi `unauthorized-domain` | Korak 6d. |
| Skrbnik ne vidi zavihkov | E-poštni naslov v pravilih ni enak naslovu računa (male črke, brez presledkov) ali pravila niso objavljena (korak 4 in 6b). Odjavi se in se prijavi znova. |
| Navadni uporabnik vidi napako »Baza ne dovoli dostopa« | Pravila v Firebase niso nova različica (korak 4). |
| Zdravilo ne sprejme roka | Rok mora biti mesec in leto, ki še nista pretekla (npr. 03/2027). |
| Po spremembi se ne vidi nova različica | Aplikacijo zapri in jo odpri še enkrat (z internetom). |
| QR koda odpre napačen naslov | QR kode vedno natisni iz aplikacije, odprte na pravem naslovu (`https://....github.io/predaja-vozil/`), ne z drugega naslova ali iz računalniške datoteke. |
| Skeniranje: »Dostop do kamere ni dovoljen« | Dovoli kamero za to stran ali aplikacijo v nastavitvah telefona (brskalnik → nastavitve spletnega mesta → Kamera). Do takrat uporabi kamero telefona. |
| Skeniranje: »Ta QR koda ni iz te aplikacije« | Koda je za drug naslov. Natisni kodo znova iz aplikacije (korak 8). |
| Seznam vozil se ne naloži ali piše »Baza ne dovoli dostopa« | Nova pravila še niso objavljena (korak 4). |
| Fotografija se ne doda | Dovoljene so slike (JPG, PNG). Največ 3 na predajo. Pri težavi izberi drugo fotografijo ali jo posnemi znova. |
| Predaja je ostala na »Pošiljam …« | Telefon še nima povezave. Ko jo dobi, se pošlje sama; aplikacija naj ostane odprta nekaj sekund. |

## Seznam datotek

| Datoteka | Namen |
|---|---|
| `index.html`, `app.js`, `app.css`, `store.js` | aplikacija |
| `oprema.js` | seznam opreme, zdravil in narkotikov, izmene (to urejaš) |
| `config.js` | povezava s Firebase (enkrat izpolniš) |
| `firestore.rules` | pravila baze (prilepiš v Firebase) |
| `sw.js`, `manifest.webmanifest` | namestitev na telefon in delovanje brez signala |
| `icon*.png`, `icon.svg`, `apple-touch-icon.png`, `favicon-32.png` | ikona aplikacije |
| `qrcode.js`, `LICENSE-qrcode.txt` | izdelava QR kod (knjižnica qrcode-generator, licenca MIT) |
| `skener.js`, `jsqr.js`, `LICENSE-jsqr.txt` | branje QR kod s kamero v aplikaciji (knjižnica jsQR, licenca Apache 2.0) |
