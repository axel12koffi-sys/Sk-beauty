/* SK Beauty — scripts communs (menu mobile, catalogue, boutique, réseaux) */
(function () {
  "use strict";
  var cfg = window.SK_CONFIG || {};

  // Menu mobile
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Ouvrir le menu");
      }
    });
  }

  // Année du pied de page
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // Listes de coiffures (accueil) depuis la config
  document.querySelectorAll(".card[data-cat]").forEach(function (card) {
    var cat = cfg.catalogue && cfg.catalogue[card.getAttribute("data-cat")];
    var ul = card.querySelector(".price-list");
    if (!cat || !ul) return;
    cat.styles.forEach(function (s) {
      var li = document.createElement("li");
      var name = document.createElement("span");
      name.textContent = s.name;
      li.appendChild(name);
      if (s.price) {
        var price = document.createElement("span");
        price.className = "price";
        price.textContent = s.price;
        li.appendChild(price);
      }
      ul.appendChild(li);
    });
  });

  // Boutons boutique -> liens de paiement Square
  document.querySelectorAll("[data-product]").forEach(function (btn) {
    var url = cfg.squareProductLinks && cfg.squareProductLinks[btn.getAttribute("data-product")];
    if (url) {
      btn.href = url;
      btn.target = "_blank";
      btn.rel = "noopener";
    } else {
      btn.textContent = "Disponible au salon";
    }
  });

  // Instagram
  document.querySelectorAll('[data-social="instagram"]').forEach(function (a) {
    if (cfg.instagramUrl) a.href = cfg.instagramUrl;
    else a.remove();
  });
})();
