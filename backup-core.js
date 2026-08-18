// Family Hub - zajednička logika za backup/restore cijele aplikacije.
// Koristi se sa index.html (automatski dnevni snimak) i backup.html (ručni izvoz/uvoz
// i istorija automatskih snimaka). Ubaci OVAJ fajl POSLIJE firebase-*-compat.js skripti,
// ali PRIJE nego što ga stranica pozove (potrebno je da "firebase" globalna promjenljiva
// već postoji).
//
// Šta se snima:
//  - recepti/shared          (recepti)
//  - shopping-list/shared    (kupovina - stavke, budžet, boje, kategorije...)
//  - raspored/filip, jaksa, miljan, relja  (raspored svakog djeteta)
//  - raspored/_predmeti, _dayColors, _childColors  (zajednička podešavanja rasporeda)
//  - water/data              (potrošnja vode - poseban Firebase projekat "potrosnja-vode")
//
// Automatski dnevni snimak (backups/{YYYY-MM-DD} u glavnom projektu) pravi se najviše
// jednom dnevno i čuva se zadnjih 20. Ručni backup je obična JSON datoteka koju korisnik
// preuzme na svoj uređaj - radi čak i ako je baza potpuno nedostupna.
(function () {
  var FH_MAIN_DOCS = [
    { col: "recepti", id: "shared" },
    { col: "shopping-list", id: "shared" },
    { col: "raspored", id: "filip" },
    { col: "raspored", id: "jaksa" },
    { col: "raspored", id: "miljan" },
    { col: "raspored", id: "relja" },
    { col: "raspored", id: "_predmeti" },
    { col: "raspored", id: "_dayColors" },
    { col: "raspored", id: "_childColors" },
  ];

  function todayId() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  // Čita SVE dokumente (glavni projekat + voda) i vraća jedan ravan objekat:
  // { "recepti/shared": {...}, "raspored/filip": {...}, ..., "water/data": {...} }
  async function collectAllData(db, waterDb) {
    var data = {};
    for (var i = 0; i < FH_MAIN_DOCS.length; i++) {
      var d = FH_MAIN_DOCS[i];
      var key = d.col + "/" + d.id;
      try {
        var snap = await db.collection(d.col).doc(d.id).get();
        data[key] = snap.exists ? snap.data() : null;
      } catch (e) {
        data[key] = null;
      }
    }
    data["water/data"] = null;
    if (waterDb) {
      try {
        var wsnap = await waterDb.collection("water").doc("data").get();
        data["water/data"] = wsnap.exists ? wsnap.data() : null;
      } catch (e) { /* voda ostaje null ako nije dostupna */ }
    }
    return data;
  }

  // Pokreće preuzimanje JSON fajla na uređaj korisnika (ne dira bazu).
  function downloadBackupFile(dataObj) {
    var payload = {
      app: "Family Hub",
      version: 1,
      createdAt: new Date().toISOString(),
      data: dataObj,
    };
    var json = JSON.stringify(payload, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var stamp = payload.createdAt.slice(0, 16).replace(/[:T]/g, "-");
    var a = document.createElement("a");
    a.href = url;
    a.download = "family-hub-backup-" + stamp + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    return payload;
  }

  // Vraća sve podatke iz snimka (bilo iz JSON fajla ili iz automatske istorije).
  // Puno prepisivanje (.set bez merge) - poslije ovoga baza tačno odgovara snimku.
  async function restoreAllData(db, waterDb, dataObj) {
    var jobs = [];
    for (var i = 0; i < FH_MAIN_DOCS.length; i++) {
      var d = FH_MAIN_DOCS[i];
      var key = d.col + "/" + d.id;
      if (dataObj && Object.prototype.hasOwnProperty.call(dataObj, key) && dataObj[key] != null) {
        jobs.push(db.collection(d.col).doc(d.id).set(dataObj[key]));
      }
    }
    if (waterDb && dataObj && dataObj["water/data"] != null) {
      jobs.push(waterDb.collection("water").doc("data").set(dataObj["water/data"]));
    }
    await Promise.all(jobs);
  }

  async function pruneOldBackups(db, keep) {
    keep = keep || 20;
    var snap = await db.collection("backups").orderBy(firebase.firestore.FieldPath.documentId(), "desc").get();
    var docs = snap.docs;
    if (docs.length <= keep) return;
    var toDelete = docs.slice(keep);
    await Promise.all(toDelete.map(function (d) { return d.ref.delete(); }));
  }

  // Napravi automatski snimak za DANAS, ako već ne postoji. Bezopasno je zvati ovo
  // pri svakom otvaranju aplikacije - pravi najviše jedan upis u bazu dnevno.
  async function runAutoBackupIfNeeded(db, waterDb) {
    var id = todayId();
    var ref = db.collection("backups").doc(id);
    var existing = await ref.get();
    if (existing.exists) return false;
    var data = await collectAllData(db, waterDb);
    await ref.set({ createdAt: new Date().toISOString(), data: data });
    try { await pruneOldBackups(db, 20); } catch (e) { /* čišćenje starih nije kritično */ }
    return true;
  }

  // Spisak automatskih dnevnih snimaka, najnoviji prvi.
  async function listAutoBackups(db, max) {
    max = max || 20;
    var snap = await db.collection("backups").orderBy(firebase.firestore.FieldPath.documentId(), "desc").limit(max).get();
    return snap.docs.map(function (d) {
      var v = d.data() || {};
      return { id: d.id, createdAt: v.createdAt || null, data: v.data || null };
    });
  }

  window.FH_BACKUP = {
    FH_MAIN_DOCS: FH_MAIN_DOCS,
    collectAllData: collectAllData,
    downloadBackupFile: downloadBackupFile,
    restoreAllData: restoreAllData,
    runAutoBackupIfNeeded: runAutoBackupIfNeeded,
    listAutoBackups: listAutoBackups,
  };
})();
