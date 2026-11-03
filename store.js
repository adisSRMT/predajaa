// Povezava s Firebase (baza Firestore + prijava). Knjižnice se naložijo s strežnika Google.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore,
  collection, doc, query, where, orderBy, limit, onSnapshot, setDoc, updateDoc, getDoc, writeBatch, deleteField, getDocsFromServer
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

export function connect(config) {
  var app = initializeApp(config);
  var fs;
  try { // baza se shranjuje tudi v telefon, da deluje brez signala
    fs = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch (e) { fs = getFirestore(app); }
  var auth = getAuth(app);

  function wrapDoc(d) { return { id: d.id, exists: d.exists(), data: function () { return d.data(); }, metadata: d.metadata }; }
  function wrapSnap(s) { return { docs: s.docs.map(wrapDoc), size: s.size, empty: s.empty, metadata: s.metadata }; }
  function mkQuery(path, cons) {
    var q = cons.length ? query.apply(null, [collection(fs, path)].concat(cons)) : collection(fs, path);
    return {
      where: function (f, o, v) { return mkQuery(path, cons.concat([where(f, o, v)])); },
      orderBy: function (f, d) { return mkQuery(path, cons.concat([orderBy(f, d || 'asc')])); },
      limit: function (n) { return mkQuery(path, cons.concat([limit(n)])); },
      getServer: function () { return getDocsFromServer(q).then(wrapSnap); },
      onSnapshot: function (next, err) { return onSnapshot(q, function (s) { next(wrapSnap(s)); }, err); }
    };
  }
  var db = {
    DEL: deleteField(),
    collection: function (path) { return mkQuery(path, []); },
    doc: function (path) {
      return {
        set: function (d) { return setDoc(doc(fs, path), d); },
        update: function (d) { return updateDoc(doc(fs, path), d); },
        get: function () { return getDoc(doc(fs, path)).then(wrapDoc); },
        onSnapshot: function (next, err) { return onSnapshot(doc(fs, path), function (s) { next(wrapDoc(s)); }, err); }
      };
    },
    batch: function () {
      var b = writeBatch(fs);
      return {
        set: function (p, d) { b.set(doc(fs, p), d); },
        update: function (p, d) { b.update(doc(fs, p), d); },
        commit: function () { return b.commit(); }
      };
    }
  };
  return {
    db: db,
    auth: {
      onChange: function (cb) { return onAuthStateChanged(auth, cb); },
      signIn: function (email, pass) { return signInWithEmailAndPassword(auth, email, pass); },
      signOut: function () { return signOut(auth); }
    }
  };
}
