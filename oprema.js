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

// ======================================================================
//  RAZLIKE MED VOZILI
//
//  Vsako vozilo (ali ambulanta) ima standardni seznam zgoraj. Če ima
//  katero vozilo drugačno opremo, ga vpišeš sem po OZNAKI (tako, kot je
//  v aplikaciji, npr. 'NM-12'). Vozila brez vnosa imajo standardni seznam.
//
//    brez:           česar vozilo NIMA. Cela skupina: 'imob'. Ena postavka
//                    opreme: 'nosila.vakuum' (skupina.postavka). Eno
//                    zdravilo: 'zdravila_atropin' (skupina_zdravilo).
//    dodaj:          dodatna oprema po skupinah, npr.
//                    { dihala: [['weinmann', 'Weinmann Standard']] }
//    dodajZdravila:  dodatna zdravila po skupinah, npr.
//                    { zdravila: [['ketamin', 'Ketamin']] }
//
//  PRIMER (odstrani // pred vrsticami, da deluje):
//  'NM-12': { brez: ['imob', 'nosila.vakuum', 'zdravila_atropin'],
//             dodaj: { dihala: [['weinmann', 'Weinmann Standard']] } },
// ======================================================================
export const RAZLIKE = {
};

// ======================================================================
//  AMBULANTA
//
//  Seznam za predajo ambulante (vrsta »Ambulanta« pri dodajanju).
//  Enaka pravila kot zgoraj: ['id', 'Naziv'], id brez presledkov in šumnikov.
//  Narkotiki imajo količino in serijo, zdravila in tablete rok uporabe.
//  Razlike med ambulantami vpišeš v RAZLIKE po oznaki ambulante.
// ======================================================================
export const AMBULANTA = {
  skupine: [
    { id: 'prostor', naziv: 'Prostor in čistoča', postavke: [
      ['ordinacija', 'Čistoča ordinacije'],
      ['povrsine', 'Površine razkužene'],
      ['odpadki', 'Koši in zabojnik za ostre predmete'],
      ['razkuzilo', 'Razkužilo in milo']
    ]},
    { id: 'racunalnik', naziv: 'Računalnik in pisarna', postavke: [
      ['racunalnik', 'Računalnik'],
      ['tiskalnik', 'Tiskalnik'],
      ['bralnik', 'Bralnik kartic'],
      ['telefon', 'Telefon'],
      ['kljuci', 'Ključi in dokumenti']
    ]},
    { id: 'hladilnik', naziv: 'Hladilnik', postavke: [
      ['delovanje', 'Hladilnik deluje'],
      ['temp', 'Temperatura 2–8 °C'],
      ['cistoca', 'Čistoča hladilnika']
    ]},
    { id: 'odvzem', naziv: 'Odvzem krvi in laboratorij', postavke: [
      ['epruvete', 'Epruvete'],
      ['igle', 'Igle'],
      ['brizge', 'Brizge'],
      ['podveze', 'Podveze'],
      ['tamponi', 'Tamponi in obliži']
    ]},
    { id: 'infuzije', naziv: 'Infuzijske raztopine in sistemi', postavke: [
      ['raztopine', 'Infuzijske raztopine (rok, količina)'],
      ['sistemi', 'Infuzijski sistemi'],
      ['kanile', 'Kanile']
    ]},
    { id: 'zascita', naziv: 'Zaščita', postavke: [
      ['rokS', 'Rokavice S'],
      ['rokM', 'Rokavice M'],
      ['rokL', 'Rokavice L'],
      ['maske', 'Maske'],
      ['predpasniki', 'Predpasniki']
    ]},
    { id: 'oprema', naziv: 'Medicinska oprema', postavke: [
      ['defi', 'Defibrilator (samotest OK)'],
      ['ekg', 'EKG aparat'],
      ['tlak', 'Merilnik tlaka'],
      ['oksimeter', 'Pulzni oksimeter'],
      ['glukometer', 'Glukometer'],
      ['aspirator', 'Aspirator']
    ]}
  ],
  zdravila: [
    { id: 'narkotiki', naziv: 'Narkotiki', narkotik: true, postavke: [
      ['morfin', 'Morfin'],
      ['fentanil', 'Fentanil'],
      ['midazolam', 'Midazolam']
    ]},
    { id: 'zdravila', naziv: 'Zdravila', postavke: [
      ['adrenalin', 'Adrenalin'],
      ['atropin', 'Atropin'],
      ['glukoza', 'Glukoza'],
      ['naloksan', 'Naloksan'],
      ['salbutamol', 'Salbutamol']
    ]},
    { id: 'tablete', naziv: 'Tablete (tabletarij)', postavke: [
      ['aspirin', 'Acetilsalicilna kislina'],
      ['paracetamol', 'Paracetamol'],
      ['ibuprofen', 'Ibuprofen'],
      ['nitro', 'Nitroglicerin']
    ]}
  ]
};
