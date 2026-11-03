// ======================================================================
//  SEZNAM OPREME ZA PREGLED PRI PREDAJI
//
//  Vsaka skupina ima:  id (kratko, brez presledkov in šumnikov),  naziv,
//  in seznam postavk. Vsaka postavka je par: ['id', 'Naziv postavke'].
//
//  Postavko dodaš tako, da kopiraš eno vrstico in spremeniš besedilo.
//  Pazi na vejice in narekovaje. Id-ji morajo biti v skupini edinstveni.
//  Po spremembi shrani datoteko na GitHubu (Commit changes);
//  aplikacija se posodobi ob naslednjem odprtju z internetom.
//
//  Stare predaje ostanejo v zgodovini nespremenjene.
// ======================================================================
export const SKUPINE = [
  { id: 'vozilo', naziv: 'Vozilo (tehnično)', postavke: [
    ['olje', 'Nivo olja'],
    ['adblue', 'AdBlue'],
    ['brisalci', 'Tekočina za brisalce'],
    ['gume', 'Gume'],
    ['luci', 'Luči in modre luči'],
    ['sirena', 'Sirena'],
    ['cistoca', 'Čistoča in razkuževanje']
  ]},
  { id: 'kabina', naziv: 'Kabina', postavke: [
    ['radio', 'Radio in telefon'],
    ['tablica', 'Tablica'],
    ['kljuci', 'Ključi'],
    ['dokumenti', 'Dokumenti vozila'],
    ['kartica', 'Kartica za gorivo']
  ]},
  { id: 'nosila', naziv: 'Nosila in transport', postavke: [
    ['glavna', 'Glavna nosila'],
    ['stol', 'Stol za prenos'],
    ['vakuum', 'Vakuumska blazina'],
    ['pasovi', 'Pasovi']
  ]},
  { id: 'dihala', naziv: 'Dihala', postavke: [
    ['aspirator', 'Aspirator'],
    ['ambu', 'Ambu mehur in maske'],
    ['dihpot', 'Pripomočki za dihalno pot'],
    ['kisikmaske', 'Kisikove maske in cevke']
  ]},
  { id: 'srce', naziv: 'Srce', postavke: [
    ['defi', 'Defibrilator (samotest OK)'],
    ['elektrode', 'Elektrode (rok uporabe)'],
    ['ekg', 'EKG-kabli']
  ]},
  { id: 'infuzije', naziv: 'Infuzije', postavke: [
    ['raztopine', 'Infuzijske raztopine (rok, količina)'],
    ['kanile', 'Kanile in sistemi']
  ]},
  { id: 'imob', naziv: 'Imobilizacija', postavke: [
    ['opornice', 'Opornice'],
    ['ovratnice', 'Ovratnice']
  ]},
  { id: 'rane', naziv: 'Oskrba ran', postavke: [
    ['povoji', 'Povoji in obliži'],
    ['hemostatiki', 'Hemostatiki (rok uporabe)']
  ]},
  { id: 'zascita', naziv: 'Zaščita', postavke: [
    ['rokavice', 'Rokavice in maske'],
    ['razkuzilo', 'Razkužilo'],
    ['vrece', 'Vreče za odpadke']
  ]}
];

// ======================================================================
//  ZDRAVILA IN NARKOTIKI
//
//  Seznam je en sam za vsa vozila. Rok uporabe se za vsako vozilo vpiše
//  ENKRAT (ob prvi predaji) in aplikacija si ga zapomni. Ob vsaki
//  naslednji predaji se samo pokaže, da je zdravilo v roku. V mesecu, ko
//  rok poteče, se v predaji izpiše opozorilo, po izteku roka pa mora
//  zdravilo biti zamenjano (vpiše se nov rok).
//
//  Skupina z  narkotik: true  je NUJNA: pri vsaki predaji je treba
//  preveriti in vpisati količino in številko serije. Če se količina
//  razlikuje od zadnje predaje, je treba vpisati razlog.
//
//  Vsaka postavka je par: ['id', 'Naziv']. Id naj bo kratek, brez
//  presledkov, šumnikov in podčrtajev.
//
//  KOLIČINA (po potrebi): pri zdravilu, kjer želiš pri vsaki predaji
//  vpisati tudi količino, dodaj tretji del:
//      ['adrenalin', 'Adrenalin', { kolicina: true }],
//  Če želiš količino pri vseh zdravilih v skupini, dodaj skupini
//      kolicina: true
//  (zraven id in naziv). Pri narkotikih sta količina in številka serije
//  vedno obvezni.
//
//  PRIMER: spodnji seznam zamenjaj z zdravili, ki jih imate na vozilih.
// ======================================================================
export const ZDRAVILA = [
  { id: 'narkotiki', naziv: 'Narkotiki', narkotik: true, postavke: [
    ['morfin', 'Morfin'],
    ['fentanil', 'Fentanil'],
    ['midazolam', 'Midazolam']
  ]},
  { id: 'zdravila', naziv: 'Zdravila', postavke: [
    ['adrenalin', 'Adrenalin', { kolicina: true }],
    ['amiodaron', 'Amiodaron'],
    ['atropin', 'Atropin'],
    ['aspirin', 'Acetilsalicilna kislina'],
    ['glukoza', 'Glukoza'],
    ['hidrokortizon', 'Hidrokortizon'],
    ['naloksan', 'Naloksan', { kolicina: true }],
    ['nitro', 'Nitroglicerin'],
    ['salbutamol', 'Salbutamol']
  ]}
];

// Možnosti izmene
export const IZMENE = ['Dnevna', 'Nočna', '24 h'];
