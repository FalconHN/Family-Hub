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
    '<div class="fh-side-header"><img class="fh-side-logo" src="icons/sidebar-logo.png" alt="Family Hub" /><span class="fh-side-title">Family Hub</span></div>' +
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
