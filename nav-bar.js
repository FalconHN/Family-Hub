// Family Hub - zajednicka navigacija za prelazak izmedju aplikacija.
// Ubaci <script src="nav-bar.js"></script> pred kraj <body> u svaku app stranicu.
// Na telefonu (uzi ekran): traka na dnu. Na kompjuteru (siri ekran, >=768px): bocna traka sa leve strane.
// Boje se automatski prilagodjavaju pozadini stranice (tamna ili svijetla tema).
// Kad se doda nova aplikacija: izmeni APPS niz ispod (jedno mesto za sve stranice).
(function () {
  var APPS = [
    { label: "Voda",     icon: "💧", href: "potrosnja-vode.html", enabled: true },
    { label: "Kupovina", icon: "🛒", href: "shopping-list.html",  enabled: true },
    { label: "Raspored", icon: "📅", href: "raspored.html",       enabled: false },
    { label: "Recepti",  icon: "🍳", href: "recepti.html",        enabled: false }
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

  function tabsHtml(mode) {
    // mode: "bottom" (icon over label, stacked) or "side" (icon beside label, row)
    return APPS.map(function (app) {
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

  var bottomBar = document.createElement("div");
  bottomBar.id = "fhNavBottom";
  bottomBar.innerHTML = tabsHtml("bottom");

  var sideBar = document.createElement("div");
  sideBar.id = "fhNavSide";
  sideBar.innerHTML =
    '<div class="fh-side-header"><span class="fh-side-logo">🏠</span><span class="fh-side-title">Family Hub</span></div>' +
    '<div class="fh-side-tabs">' + tabsHtml("side") + '</div>';

  var style = document.createElement("style");
  style.textContent =
    /* shared tab look */
    '.fh-tab{display:flex;text-decoration:none;color:' + theme.text + ';border-radius:10px;position:relative;}' +
    '.fh-tab.active{color:' + theme.active + ';background:' + theme.activeBg + ';}' +
    '.fh-tab.disabled{color:' + theme.border + ';cursor:default;}' +
    '.fh-icon{font-size:20px;line-height:1;}' +
    '.fh-label{font-weight:600;}' +

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
    'body{padding-bottom:64px !important;}' +

    /* side bar (desktop) - hidden by default, shown at >=768px */
    '#fhNavSide{display:none;}' +
    '@media (min-width:768px){' +
      'body{padding-bottom:0 !important;padding-left:220px !important;}' +
      '#fhNavBottom{display:none !important;}' +
      '#fhNavSide{display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;width:220px;' +
        'z-index:9999;background:' + theme.bg + ';border-right:1px solid ' + theme.border + ';' +
        'padding:20px 14px;box-sizing:border-box;' +
        'font-family:"Public Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;}' +
      '.fh-side-header{display:flex;align-items:center;gap:8px;margin-bottom:22px;padding:0 6px;}' +
      '.fh-side-logo{font-size:22px;line-height:1;}' +
      '.fh-side-title{font-size:16px;font-weight:700;color:' + theme.headerText + ';}' +
      '.fh-side-tabs{display:flex;flex-direction:column;gap:4px;}' +
      '.fh-tab-side{flex-direction:row;align-items:center;gap:10px;padding:10px 12px;}' +
      '.fh-tab-side .fh-label{font-size:14px;}' +
      '.fh-tab-side .fh-soon{margin-left:auto;font-size:9px;font-weight:700;' +
        'background:' + theme.soonBg + ';color:' + theme.soonText + ';padding:2px 6px;border-radius:6px;}' +
    '}';

  document.head.appendChild(style);
  document.body.appendChild(bottomBar);
  document.body.appendChild(sideBar);
})();
