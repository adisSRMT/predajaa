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
  { id: 'zdravila', naziv: 'Zdravila', postavke: [
    ['zdr', 'Zdravila po seznamu vozila (rok, količina)'],
    ['narkotiki', 'Narkotiki (štetje, pečat)']
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

// Možnosti izmene
export const IZMENE = ['Dnevna', 'Nočna', '24 h'];
