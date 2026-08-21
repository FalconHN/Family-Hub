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
//
// ------------------------------ VAŽNO PRAVILO --------------------------------
// Snimak se pravi SAMO ako je svaki dokument stvarno pročitan. Ranije se greška pri
// čitanju (nema interneta, istekla prijava, pravila pristupa) upisivala kao "nema
// podataka", pa je backup izgledao uredno a bio prazan - i vraćanje takvog snimka bi
// "uspjelo" a ne bi vratilo ništa. Sad se u tom slučaju snimak NE pravi i javlja se
// greška, jer je bolje nemati snimak nego imati lažan.
// -----------------------------------------------------------------------------
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

  // Rezervisani snimak koji se automatski napravi NEPOSREDNO PRIJE svakog vraćanja, da
  // pogrešno vraćanje ne bude nepovratno. Počinje podvlakom pa u spisku uvijek stoji
  // odvojeno od dnevnih snimaka (i čišćenje starih ga nikad ne briše).
  var SAFETY_ID = "_prije-vracanja";

  function todayId() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function opisGreske(e) {
    if (!e) return "greška";
    return e.code || e.message || "greška";
  }

  // Kratak opis sadržaja snimka ("12 recepata, 8 stavki kupovine, ..."). Računa se jednom
  // pri pravljenju snimka i pamti uz njega, da spisak snimaka ne bi morao da povlači cijeli
  // sadržaj svakog snimka samo da bi ispisao koliko čega ima.
  function makeSummary(data) {
    if (!data) return "";
    var parts = [];
    try {
      var rec = data["recepti/shared"];
      if (rec && typeof rec.recepti === "string") parts.push(JSON.parse(rec.recepti).length + " recepata");
    } catch (e) {}
    try {
      var sl = data["shopping-list/shared"];
      if (sl && typeof sl.items === "string") parts.push(JSON.parse(sl.items).length + " stavki kupovine");
    } catch (e) {}
    var kids = ["filip", "jaksa", "miljan", "relja"].filter(function (id) { return data["raspored/" + id]; });
    if (kids.length) parts.push("raspored (" + kids.length + "/4 djece)");
    if (data["water/data"]) parts.push("potrošnja vode");
    return parts.join(", ");
  }

  // Čita SVE dokumente (glavni projekat + voda) i vraća jedan ravan objekat:
  // { "recepti/shared": {...}, "raspored/filip": {...}, ..., "water/data": {...} }
  // BACA grešku ako ijedan dokument nije mogao da se pročita - vidi pravilo na vrhu fajla.
  // Dokument koji uredno ne postoji (npr. dijete kojem raspored još nije unesen) nije
  // greška; on se upisuje kao null i pri vraćanju se jednostavno preskače.
  async function collectAllData(db, waterDb) {
    var data = {};
    var neuspjeli = [];
    for (var i = 0; i < FH_MAIN_DOCS.length; i++) {
      var d = FH_MAIN_DOCS[i];
      var key = d.col + "/" + d.id;
      try {
        var snap = await db.collection(d.col).doc(d.id).get();
        data[key] = snap.exists ? snap.data() : null;
      } catch (e) {
        neuspjeli.push(key + " (" + opisGreske(e) + ")");
        data[key] = null;
      }
    }
    data["water/data"] = null;
    if (waterDb) {
      try {
        var wsnap = await waterDb.collection("water").doc("data").get();
        data["water/data"] = wsnap.exists ? wsnap.data() : null;
      } catch (e) {
        neuspjeli.push("water/data (" + opisGreske(e) + ")");
      }
    }
    if (neuspjeli.length) {
      var greska = new Error("Nisu pročitani svi podaci: " + neuspjeli.join(", "));
      greska.code = "nepotpuno-citanje";
      greska.neuspjeli = neuspjeli;
      throw greska;
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

  // Provjerava da li je učitani JSON zaista Family Hub backup i vraća sam sadržaj (data),
  // ili null ako nije. Bez ove provjere bi bilo koji JSON fajl "uspješno vraćen" - ne bi se
  // upisalo ništa, a korisnik bi dobio poruku da je sve u redu.
  function extractBackupData(parsed) {
    if (!parsed || typeof parsed !== "object") return null;
    var dataObj = parsed.data && typeof parsed.data === "object" ? parsed.data : parsed;
    var poznatiKljucevi = FH_MAIN_DOCS.map(function (d) { return d.col + "/" + d.id; }).concat(["water/data"]);
    var imaBarJedan = poznatiKljucevi.some(function (k) {
      return Object.prototype.hasOwnProperty.call(dataObj, k);
    });
    return imaBarJedan ? dataObj : null;
  }

  // Vraća sve podatke iz snimka (bilo iz JSON fajla ili iz automatske istorije).
  // Puno prepisivanje (.set bez merge) - poslije ovoga baza odgovara snimku.
  // Vraća izvještaj { vraceno: [...], preskoceno: [...], neuspjelo: [...] } umjesto da samo
  // "prođe": vraćanje dodiruje dva odvojena Firebase projekta pa ne može biti jedna
  // nedjeljiva radnja, i korisnik mora tačno vidjeti šta jeste a šta nije vraćeno.
  async function restoreAllData(db, waterDb, dataObj) {
    var poslovi = [];
    var preskoceno = [];
    for (var i = 0; i < FH_MAIN_DOCS.length; i++) {
      var d = FH_MAIN_DOCS[i];
      var key = d.col + "/" + d.id;
      if (dataObj && Object.prototype.hasOwnProperty.call(dataObj, key) && dataObj[key] != null) {
        poslovi.push({ key: key, promise: db.collection(d.col).doc(d.id).set(dataObj[key]) });
      } else {
        preskoceno.push(key);
      }
    }
    if (dataObj && dataObj["water/data"] != null) {
      if (waterDb) {
        poslovi.push({ key: "water/data", promise: waterDb.collection("water").doc("data").set(dataObj["water/data"]) });
      } else {
        preskoceno.push("water/data");
      }
    } else {
      preskoceno.push("water/data");
    }

    var ishodi = await Promise.allSettled(poslovi.map(function (p) { return p.promise; }));
    var vraceno = [];
    var neuspjelo = [];
    ishodi.forEach(function (ish, idx) {
      if (ish.status === "fulfilled") vraceno.push(poslovi[idx].key);
      else neuspjelo.push(poslovi[idx].key + " (" + opisGreske(ish.reason) + ")");
    });
    return { vraceno: vraceno, preskoceno: preskoceno, neuspjelo: neuspjelo };
  }

  // Snimi trenutno stanje u rezervisani slot PRIJE vraćanja, da se pogrešno vraćanje može
  // poništiti. Ako trenutno stanje ne može da se pročita, javlja grešku - tada pozivalac
  // mora da pita korisnika da li ipak želi da nastavi bez ove sigurnosne mreže.
  async function saveSafetySnapshot(db, waterDb) {
    var data = await collectAllData(db, waterDb);
    await db.collection("backups").doc(SAFETY_ID).set({
      createdAt: new Date().toISOString(),
      summary: makeSummary(data),
      potpun: true,
      opis: "Automatski snimak napravljen neposredno prije vraćanja podataka.",
      data: data,
    });
    return true;
  }

  async function pruneOldBackups(db, keep) {
    keep = keep || 20;
    var snap = await db.collection("backups").orderBy(firebase.firestore.FieldPath.documentId(), "desc").get();
    // Rezervisani sigurnosni snimak se nikad ne briše čišćenjem starih.
    var docs = snap.docs.filter(function (d) { return d.id !== SAFETY_ID; });
    if (docs.length <= keep) return;
    var toDelete = docs.slice(keep);
    await Promise.all(toDelete.map(function (d) { return d.ref.delete(); }));
  }

  // Napravi automatski snimak za DANAS, ako već ne postoji. Bezopasno je zvati ovo
  // pri svakom otvaranju aplikacije - pravi najviše jedan upis u bazu dnevno.
  // Ako čitanje podataka ne uspije, collectAllData baca grešku i snimak se NE pravi
  // (bolje nikakav snimak nego lažan, prazan snimak koji zauzme mjesto ispravnom).
  async function runAutoBackupIfNeeded(db, waterDb) {
    var id = todayId();
    var ref = db.collection("backups").doc(id);
    var existing = await ref.get();
    if (existing.exists) return false;
    var data = await collectAllData(db, waterDb);
    await ref.set({
      createdAt: new Date().toISOString(),
      summary: makeSummary(data),
      potpun: true,
      data: data,
    });
    try { await pruneOldBackups(db, 20); } catch (e) { /* čišćenje starih nije kritično */ }
    return true;
  }

  // Spisak automatskih dnevnih snimaka, najnoviji prvi - BEZ samog sadržaja.
  // Sadržaj svakog snimka je kopija cijele baze, pa bi povlačenje 20 snimaka samo da bi se
  // ispisao spisak trošilo i mobilni internet i Firestore kvotu pri svakom otvaranju
  // stranice. Sadržaj se dovlači tek kad korisnik izabere da vrati određenu verziju
  // (getAutoBackup ispod).
  async function listAutoBackups(db, max) {
    max = max || 20;
    var snap = await db.collection("backups").orderBy(firebase.firestore.FieldPath.documentId(), "desc").limit(max).get();
    return snap.docs.map(function (d) {
      var v = d.data() || {};
      return {
        id: d.id,
        createdAt: v.createdAt || null,
        summary: v.summary || "",
        potpun: v.potpun !== false,
        sigurnosni: d.id === SAFETY_ID,
        opis: v.opis || "",
      };
    });
  }

  // Dovuci sadržaj jednog snimka (za vraćanje).
  async function getAutoBackup(db, id) {
    var snap = await db.collection("backups").doc(id).get();
    if (!snap.exists) return null;
    var v = snap.data() || {};
    return v.data || null;
  }

  window.FH_BACKUP = {
    FH_MAIN_DOCS: FH_MAIN_DOCS,
    SAFETY_ID: SAFETY_ID,
    collectAllData: collectAllData,
    makeSummary: makeSummary,
    extractBackupData: extractBackupData,
    downloadBackupFile: downloadBackupFile,
    restoreAllData: restoreAllData,
    saveSafetySnapshot: saveSafetySnapshot,
    runAutoBackupIfNeeded: runAutoBackupIfNeeded,
    listAutoBackups: listAutoBackups,
    getAutoBackup: getAutoBackup,
  };
})();
