// Family Hub - zajednicka traka za prelazak izmedju aplikacija.
// Ubaci <script src="nav-bar.js"></script> pred kraj <body> u svaku app stranicu.
// Kad se doda nova aplikacija: samo izmeni APPS niz ispod (jedno mesto za sve stranice).
(function () {
  var APPS = [
    { label: "Voda",     icon: "💧", href: "potrosnja-vode.html", enabled: true },
    { label: "Kupovina", icon: "🛒", href: "shopping-list.html",  enabled: true },
    { label: "Raspored", icon: "📅", href: "raspored.html",       enabled: false },
    { label: "Recepti",  icon: "🍳", href: "recepti.html",        enabled: false }
  ];

  var currentFile = (location.pathname.split("/").pop() || "index.html");

  var bar = document.createElement("div");
  bar.id = "fhNavBar";
  bar.innerHTML = APPS.map(function (app) {
    var active = app.enabled && app.href === currentFile;
    var cls = "fh-tab" + (active ? " active" : "") + (app.enabled ? "" : " disabled");
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

  var style = document.createElement("style");
  style.textContent =
    '#fhNavBar{position:fixed;left:0;right:0;bottom:0;z-index:9999;display:flex;' +
    'background:#FAF8F4;border-top:1px solid #E6E1D8;' +
    'padding:6px 4px calc(6px + env(safe-area-inset-bottom));' +
    'box-shadow:0 -2px 10px rgba(27,58,74,0.10);' +
    'font-family:"Public Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;}' +
    '.fh-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;' +
    'padding:6px 2px;text-decoration:none;color:#8A8578;border-radius:10px;position:relative;}' +
    '.fh-tab.active{color:#2F6690;background:#EAE6DC;}' +
    '.fh-tab.disabled{color:#D6D1C6;cursor:default;}' +
    '.fh-icon{font-size:20px;line-height:1;}' +
    '.fh-label{font-size:11px;font-weight:600;}' +
    '.fh-soon{position:absolute;top:0;right:6px;font-size:8px;font-weight:700;' +
    'background:#D6D1C6;color:#fff;padding:1px 4px;border-radius:6px;}' +
    'body{padding-bottom:64px !important;}';

  document.head.appendChild(style);
  document.body.appendChild(bar);
})();
