// Family Hub - zajednicka navigacija za prelazak izmedju aplikacija.
// Ubaci <script src="nav-bar.js"></script> pred kraj <body> u svaku app stranicu.
// Na telefonu (uzi ekran): traka na dnu. Na kompjuteru (siri ekran, >=768px): bocna traka sa leve strane.
// Boje se automatski prilagodjavaju pozadini stranice (tamna ili svijetla tema).
// Kad se doda nova aplikacija: izmeni APPS niz ispod (jedno mesto za sve stranice).
(function () {
  var ICONS = {
    droplets:
      '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>' +
      '<path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
    cart:
      '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>' +
      '<path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    calendar:
      '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>' +
      '<line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' +
      '<line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/>' +
      '<line x1="8" y1="18" x2="8" y2="18"/><line x1="12" y1="18" x2="12" y2="18"/>',
    chefHat:
      '<path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.042V20a1 1 0 0 0 1 1Z"/>' +
      '<path d="M6 17h12"/>',
    logOut:
      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
      '<polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'
  };
  function svgIcon(pathData) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" width="20" height="20">' + pathData + '</svg>';
  }
  var APPS = [
    { label: "Kupovina", icon: svgIcon(ICONS.cart),     href: "shopping-list.html",  enabled: true },
    { label: "Recepti",  icon: svgIcon(ICONS.chefHat),  href: "recepti.html",        enabled: true },
    { label: "Raspored", icon: svgIcon(ICONS.calendar), href: "raspored.html",       enabled: true },
    { label: "Voda",     icon: svgIcon(ICONS.droplets), href: "potrosnja-vode.html", enabled: true }
  ];

  var currentFile = (location.pathname.split("/").pop() || "index.html");

  // --- Prepoznavanje tamne/svijetle teme na osnovu stvarne pozadine stranice ---
  function luminance(rgbStr) {
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgbStr || "");
    if (!m) return 255;
    var r = +m[1], g = +m[2], b = +m[3];
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
  function isTransparent(rgbStr) {
    return !rgbStr || rgbStr === "transparent" || /rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(rgbStr);
  }
  var bodyBg = getComputedStyle(document.body).backgroundColor;
  if (isTransparent(bodyBg)) bodyBg = getComputedStyle(document.documentElement).backgroundColor;
  var isDark = luminance(bodyBg) < 128;

  var theme = isDark
    ? { bg: "#1c1c1c", border: "#333333", text: "#9a9a96", active: "#2383e2",
        activeBg: "#232323", shadow: "rgba(0,0,0,0.35)", soonBg: "#3a3a3a", soonText: "#cfcfcf",
        headerText: "#e8e8e6" }
    : { bg: "#FAF8F4", border: "#E6E1D8", text: "#8A8578", active: "#007991",
        activeBg: "#DEE9E3", shadow: "rgba(15,34,43,0.10)", soonBg: "#D6D1C6", soonText: "#ffffff",
        headerText: "#0F222B" };

  function tabsHtml(mode, list) {
    // mode: "bottom" (icon over label, stacked) or "side" (icon beside label, row)
    list = list || APPS;
    return list.map(function (app) {
      var active = app.enabled && app.href === currentFile;
      var cls = "fh-tab fh-tab-" + mode + (active ? " active" : "") + (app.enabled ? "" : " disabled");
      var href = app.enabled ? app.href : "javascript:void(0)";
      var extraAttrs = app.enabled ? "" : ' aria-disabled="true" tabindex="-1"';
      return (
        '<a class="' + cls + '" href="' + href + '"' + extraAttrs + '>' +
          '<span class="fh-icon">' + app.icon + '</span>' +
          '<span class="fh-label">' + app.label + '</span>' +
          (app.enabled ? "" : '<span class="fh-soon">uskoro</span>') +
        '</a>'
      );
    }).join("");
  }

  var topBar = document.createElement("div");
  topBar.id = "fhNavTop";
  topBar.innerHTML =
    '<span class="fh-top-title">Family Hub</span>' +
    '<button class="fh-top-logout" id="fhLogoutBtnTop" aria-label="Odjava">' + svgIcon(ICONS.logOut) + '</button>';

  // Zapamcena uloga iz proslog logina (localStorage) - da odmah iscrtamo pravu
  // verziju trake, bez treptaja svih tabova dok se uloga tek ucita iz baze.
  var cachedRole = null;
  try { cachedRole = localStorage.getItem("fhRole"); } catch (e) {}
  function appsForRole(role) {
    return role === "child"
      ? APPS.filter(function (app) { return app.href === "raspored.html"; })
      : APPS;
  }

  var bottomBar = document.createElement("div");
  bottomBar.id = "fhNavBottom";
  bottomBar.innerHTML = tabsHtml("bottom", appsForRole(cachedRole));

  var sideBar = document.createElement("div");
  sideBar.id = "fhNavSide";
  sideBar.innerHTML =
    '<div class="fh-side-header"><img class="fh-side-logo" src="data:image/png;base64,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" alt="Family Hub" /><span class="fh-side-title">Family Hub</span></div>' +
    '<div class="fh-side-tabs">' + tabsHtml("side", appsForRole(cachedRole)) + '</div>' +
    '<button class="fh-logout-btn" id="fhLogoutBtn">' +
      '<span class="fh-icon">' + svgIcon(ICONS.logOut) + '</span>' +
      '<span class="fh-label">Odjava</span>' +
    '</button>';

  var style = document.createElement("style");
  style.textContent =
    /* shared tab look */
    '.fh-tab{display:flex;text-decoration:none;color:' + theme.text + ';border-radius:10px;position:relative;}' +
    '.fh-tab.active{color:' + theme.active + ';background:' + theme.activeBg + ';}' +
    '.fh-tab.disabled{color:' + theme.border + ';cursor:default;}' +
    '.fh-icon{display:inline-flex;align-items:center;justify-content:center;line-height:1;}' +
    '.fh-icon svg{display:block;}' +
    '.fh-label{font-weight:600;}' +

    /* top bar (mobile default) - naslov + odjava */
    '#fhNavTop{position:fixed;left:0;right:0;top:0;z-index:9999;display:flex;align-items:center;justify-content:space-between;' +
    'background:' + theme.bg + ';border-bottom:1px solid ' + theme.border + ';' +
    'padding:calc(14px + env(safe-area-inset-top)) 16px 14px;' +
    'font-family:"Public Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;}' +
    '.fh-top-title{font-size:16px;font-weight:700;color:' + theme.headerText + ';}' +
    '.fh-top-logout{background:none;border:none;color:' + theme.text + ';cursor:pointer;padding:4px;' +
      'display:flex;align-items:center;justify-content:center;}' +

    /* bottom bar (mobile default) */
    '#fhNavBottom{position:fixed;left:0;right:0;bottom:0;z-index:9999;display:flex;' +
    'background:' + theme.bg + ';border-top:1px solid ' + theme.border + ';' +
    'padding:6px 4px calc(6px + env(safe-area-inset-bottom));' +
    'box-shadow:0 -2px 10px ' + theme.shadow + ';' +
    'font-family:"Public Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;}' +
    '.fh-tab-bottom{flex:1;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;}' +
    '.fh-tab-bottom .fh-label{font-size:11px;}' +
    '.fh-tab-bottom .fh-soon{position:absolute;top:0;right:6px;font-size:8px;font-weight:700;' +
    'background:' + theme.soonBg + ';color:' + theme.soonText + ';padding:1px 4px;border-radius:6px;}' +
    'body{padding-top:52px !important;padding-bottom:64px !important;}' +

    /* side bar (desktop) - hidden by default, shown at >=768px */
    '#fhNavSide{display:none;}' +
    '@media (min-width:768px){' +
      'body{padding-top:0 !important;padding-bottom:0 !important;padding-left:220px !important;}' +
      '#fhNavTop{display:none !important;}' +
      '#fhNavBottom{display:none !important;}' +
      '#fhNavSide{display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;width:220px;' +
        'z-index:9999;background:' + theme.bg + ';border-right:1px solid ' + theme.border + ';' +
        'padding:20px 14px;box-sizing:border-box;' +
        'font-family:"Public Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;}' +
      '.fh-side-header{display:flex;align-items:center;gap:10px;margin-bottom:26px;padding:0 6px;}' +
      '.fh-side-logo{width:48px;height:48px;display:block;border-radius:12px;}' +
      '.fh-side-title{font-size:16px;font-weight:700;color:' + theme.headerText + ';}' +
      '.fh-side-tabs{display:flex;flex-direction:column;gap:4px;}' +
      '.fh-tab-side{flex-direction:row;align-items:center;gap:10px;padding:10px 12px;}' +
      '.fh-tab-side .fh-label{font-size:14px;}' +
      '.fh-tab-side .fh-soon{margin-left:auto;font-size:9px;font-weight:700;' +
        'background:' + theme.soonBg + ';color:' + theme.soonText + ';padding:2px 6px;border-radius:6px;}' +
      '.fh-logout-btn{margin-top:auto;display:flex;align-items:center;gap:10px;padding:10px 12px;' +
        'border:none;background:transparent;color:' + theme.text + ';border-radius:10px;cursor:pointer;' +
        'font-family:inherit;font-size:14px;text-align:left;}' +
      '.fh-logout-btn:hover{background:' + theme.activeBg + ';}' +
      '.fh-logout-btn .fh-label{font-weight:600;}' +
    '}';

  document.head.appendChild(style);
  document.body.appendChild(topBar);
  document.body.appendChild(bottomBar);
  document.body.appendChild(sideBar);

  // --- Tacno mjerenje visine gornje/donje trake, umjesto nagadjanja u px. ---
  // Sprjecava da traka (koja moze biti visa na telefonima sa "notch"-om ili
  // zbog fonta) prekrije sadrzaj stranice ispod nje (npr. logo vodovoda).
  var mobileQuery = window.matchMedia("(min-width:768px)");
  function syncBodyOffsets() {
    if (mobileQuery.matches) {
      document.body.style.setProperty("padding-top", "0px", "important");
      document.body.style.setProperty("padding-bottom", "0px", "important");
    } else {
      document.body.style.setProperty("padding-top", topBar.offsetHeight + "px", "important");
      document.body.style.setProperty("padding-bottom", bottomBar.offsetHeight + "px", "important");
    }
  }
  syncBodyOffsets();
  window.addEventListener("resize", syncBodyOffsets);
  window.addEventListener("orientationchange", syncBodyOffsets);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncBodyOffsets); // fontovi se ucitaju kasnije i mogu blago promijeniti visinu
  }

  function doLogout() {
    try { localStorage.removeItem("fhRole"); } catch (e) {}
    if (typeof window.fhLogout === "function") {
      window.fhLogout();
    }
  }
  ["fhLogoutBtn", "fhLogoutBtnTop"].forEach(function (id) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", doLogout);
  });

  // --- Ogranicen prikaz za djecu: samo "Raspored" tab, ostalo sakriveno. ---
  // Stranice pozivaju ovo posto saznaju ulogu ulogovanog korisnika (users/{uid} u bazi).
  // Sve dok se ne pozove, prikazuju se svi tabovi (podrazumijevano ponasanje za roditelje).
  window.fhApplyRole = function (role) {
    try { localStorage.setItem("fhRole", role); } catch (e) {}
    var visibleApps = appsForRole(role);
    bottomBar.innerHTML = tabsHtml("bottom", visibleApps);
    var tabsEl = sideBar.querySelector(".fh-side-tabs");
    if (tabsEl) tabsEl.innerHTML = tabsHtml("side", visibleApps);
  };
})();
