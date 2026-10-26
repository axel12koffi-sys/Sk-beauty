/* SK Beauty — galerie : filtres + visionneuse */
(function () {
  "use strict";
  var shots = Array.prototype.slice.call(document.querySelectorAll(".shot"));
  var filters = Array.prototype.slice.call(document.querySelectorAll(".filter"));
  var dlg = document.getElementById("lightbox");
  var lbImg = document.getElementById("lb-img");
  var lbCap = document.getElementById("lb-caption");
  if (!shots.length) return;

  // Compteurs
  filters.forEach(function (f) {
    var key = f.getAttribute("data-filter");
    var n = key === "all" ? shots.length : shots.filter(function (s) { return s.getAttribute("data-cat") === key; }).length;
    f.querySelector(".count").textContent = "(" + n + ")";
  });

  // Filtres
  function applyFilter(key) {
    filters.forEach(function (f) { f.setAttribute("aria-pressed", String(f.getAttribute("data-filter") === key)); });
    shots.forEach(function (s) { s.hidden = key !== "all" && s.getAttribute("data-cat") !== key; });
  }
  filters.forEach(function (f) {
    f.addEventListener("click", function () { applyFilter(f.getAttribute("data-filter")); });
  });
  var initial = new URLSearchParams(location.search).get("style");
  if (initial && filters.some(function (f) { return f.getAttribute("data-filter") === initial; })) applyFilter(initial);

  // Visionneuse
  var current = 0;
  function visible() { return shots.filter(function (s) { return !s.hidden; }); }
  function show(i) {
    var list = visible();
    if (!list.length) return;
    current = (i + list.length) % list.length;
    var s = list[current];
    var a = s.querySelector("a");
    var img = s.querySelector("img");
    lbImg.src = a.getAttribute("href");
    lbImg.alt = img.alt;
    lbCap.textContent = s.querySelector("figcaption").textContent + " · " + (current + 1) + " / " + list.length;
  }

  if (dlg && typeof dlg.showModal === "function") {
    shots.forEach(function (s) {
      s.querySelector("a").addEventListener("click", function (e) {
        e.preventDefault();
        show(visible().indexOf(s));
        dlg.showModal();
      });
    });
    dlg.querySelector(".lb-close").addEventListener("click", function () { dlg.close(); });
    dlg.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
    dlg.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
    dlg.addEventListener("close", function () { lbImg.src = ""; });

    // Balayage sur mobile
    var x0 = null;
    dlg.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }
})();
