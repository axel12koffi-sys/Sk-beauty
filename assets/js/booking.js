/* =========================================================
   SK Beauty — formulaire de prise de rendez-vous
   - Étapes : coiffure → détails → (date & heure) → coordonnées → récap
   - Envoi des détails à api/send-booking.php (courriel au salon)
   - Paiement / créneau : Square Appointments ou lien de paiement Square
   ========================================================= */
(function () {
  "use strict";

  var cfg = window.SK_CONFIG || {};
  var form = document.getElementById("booking-form");
  if (!form) return;

  var useSquareBooking = !!(cfg.squareBookingUrl && cfg.squareBookingUrl.trim());
  var depositLink = (cfg.squareDepositLink || "").trim();
  var fee = Number(cfg.bookingFee || 20);
  var MAX_FILE = 5 * 1024 * 1024;
  var DASH = "—";

  var STEP_LABELS = {
    coiffure: "Coiffure",
    details: "Détails",
    date: "Date & heure",
    coordonnees: "Coordonnées",
    recap: "Récapitulatif"
  };
  var steps = ["coiffure", "details", useSquareBooking ? null : "date", "coordonnees", "recap"].filter(Boolean);
  var current = 0;
  var sent = false;

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    stepper: $("stepper"),
    catList: $("cat-list"), styleList: $("style-list"),
    lenList: $("len-list"), sizeList: $("size-list"), hairList: $("hair-list"), extraList: $("extra-list"),
    dayList: $("day-list"), slotList: $("slot-list"),
    recap: $("recap"), summary: $("summary"),
    back: $("btn-back"), next: $("btn-next"), hint: $("form-hint"), alert: $("form-alert"),
    nav: $("form-nav"), fee: $("fee"), squareExplain: $("square-explain")
  };

  els.fee.textContent = fee.toFixed(2).replace(".", ",") + " $";
  els.squareExplain.textContent = useSquareBooking
    ? "Après l'envoi, vous choisirez votre créneau en temps réel et réglerez les " + fee + " $ sur la page de réservation Square (carte, Apple Pay ou Google Pay)."
    : "Après l'envoi, vous réglerez les " + fee + " $ sur la page de paiement sécurisée de Square (carte, Apple Pay ou Google Pay).";

  /* ---------- Construction des choix ---------- */
  var uid = 0;
  function choice(container, opts) {
    var wrap = document.createElement("div");
    wrap.className = "choice " + (opts.cls || "");
    var id = "c" + (++uid);
    var input = document.createElement("input");
    input.type = opts.type || "radio";
    input.name = opts.name;
    input.value = opts.value;
    input.id = id;
    if (opts.checked) input.checked = true;
    if (opts.disabled) input.disabled = true;
    if (opts.data) Object.keys(opts.data).forEach(function (k) { input.dataset[k] = opts.data[k]; });
    var label = document.createElement("label");
    label.htmlFor = id;
    (opts.parts || [{ text: opts.label }]).forEach(function (p) {
      var span = document.createElement("span");
      if (p.cls) span.className = p.cls;
      span.textContent = p.text;
      label.appendChild(span);
    });
    if (opts.ariaLabel) label.setAttribute("aria-label", opts.ariaLabel);
    wrap.appendChild(input);
    wrap.appendChild(label);
    container.appendChild(wrap);
    return input;
  }

  var catalogue = cfg.catalogue || {};
  var catKeys = Object.keys(catalogue);
  var params = new URLSearchParams(location.search);
  var initialCat = catalogue[params.get("cat")] ? params.get("cat") : catKeys[0];

  catKeys.forEach(function (key) {
    var c = catalogue[key];
    choice(els.catList, {
      name: "category", value: c.label, cls: "card-choice", checked: key === initialCat,
      data: { key: key },
      parts: [{ text: c.label, cls: "big" }, { text: c.styles.length + " styles", cls: "sub" }]
    });
  });

  function renderStyles() {
    var key = (form.querySelector('input[name="category"]:checked') || {}).dataset;
    key = key ? key.key : initialCat;
    var prev = getVal("style");
    els.styleList.innerHTML = "";
    catalogue[key].styles.forEach(function (s) {
      choice(els.styleList, {
        name: "style", value: s.name, checked: s.name === prev,
        label: s.price ? s.name + " · " + s.price : s.name
      });
    });
  }
  renderStyles();

  (cfg.lengths || []).forEach(function (t) { choice(els.lenList, { name: "length", value: t, label: t }); });
  (cfg.sizes || []).forEach(function (t) { choice(els.sizeList, { name: "size", value: t, label: t }); });
  (cfg.hairOptions || []).forEach(function (h) {
    choice(els.hairList, { name: "hair", value: h.label, cls: "card-choice", parts: [{ text: h.label, cls: "" }, { text: h.sub, cls: "sub" }] });
  });
  (cfg.extras || []).forEach(function (t) {
    choice(els.extraList, { type: "checkbox", name: "extras[]", value: t, cls: "check", parts: [{ text: "", cls: "box" }, { text: t }] });
  });

  /* ---------- Jours et heures (mode lien de paiement) ---------- */
  if (!useSquareBooking) {
    var closed = cfg.closedWeekdays || [];
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    var added = 0, guard = 0;
    while (added < (cfg.daysAhead || 21) && guard < 90) {
      d.setDate(d.getDate() + 1);
      guard++;
      if (closed.indexOf(d.getDay()) !== -1) continue;
      var iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      var full = d.toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" });
      choice(els.dayList, {
        name: "date", value: iso, cls: "day", data: { label: full }, ariaLabel: full,
        parts: [
          { text: d.toLocaleDateString("fr-CA", { weekday: "short" }).replace(".", ""), cls: "wd" },
          { text: String(d.getDate()), cls: "num" },
          { text: d.toLocaleDateString("fr-CA", { month: "short" }).replace(".", ""), cls: "mo" }
        ]
      });
      added++;
    }
    (cfg.slots || []).forEach(function (t) { choice(els.slotList, { name: "time", value: t, cls: "slot", label: t }); });
  }

  /* ---------- Lecture des valeurs ---------- */
  function getVal(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }
  function getExtras() {
    return Array.prototype.map.call(form.querySelectorAll('input[name="extras[]"]:checked'), function (i) { return i.value; });
  }
  function dateLabel() {
    var el = form.querySelector('input[name="date"]:checked');
    return el ? el.dataset.label : "";
  }

  /* ---------- Validation ---------- */
  function setInvalid(input, msg) {
    input.setAttribute("aria-invalid", "true");
    var err = input.parentNode.querySelector(".field-error");
    if (!err) {
      err = document.createElement("span");
      err.className = "field-error";
      err.id = input.id + "-err";
      input.parentNode.appendChild(err);
      input.setAttribute("aria-describedby", err.id);
    }
    err.textContent = msg;
  }
  function clearInvalid(input) {
    input.removeAttribute("aria-invalid");
    var err = input.parentNode.querySelector(".field-error");
    if (err) err.textContent = "";
  }

  function validate(step, show) {
    switch (step) {
      case "coiffure":
        return getVal("style") ? "" : "Choisissez un style pour continuer.";
      case "details":
        if (!getVal("length") || !getVal("size") || !getVal("hair")) return "Précisez la longueur, la grosseur et les mèches.";
        return "";
      case "date":
        return getVal("date") && getVal("time") ? "" : "Choisissez un jour et une heure.";
      case "coordonnees": {
        var name = $("name"), phone = $("phone"), email = $("email"), photo = $("photo"), accept = $("accept");
        var msg = "";
        [name, phone, email, photo].forEach(clearInvalid);
        if (photo.files[0]) {
          var f = photo.files[0];
          if (f.size > MAX_FILE) { msg = msg || "La photo dépasse 5 Mo."; if (show) setInvalid(photo, "La photo dépasse 5 Mo."); }
          else if (!/^image\//.test(f.type) && !/\.(jpe?g|png|webp|heic)$/i.test(f.name)) { msg = msg || "Le fichier doit être une image."; if (show) setInvalid(photo, "Le fichier doit être une image."); }
        }
        if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
          msg = "Vérifiez votre adresse courriel."; if (show) setInvalid(email, "Adresse courriel invalide.");
        }
        if (phone.value.replace(/\D/g, "").length < 10) {
          msg = "Indiquez un numéro de téléphone valide."; if (show) setInvalid(phone, "Numéro à 10 chiffres requis.");
        }
        if (name.value.trim().length < 2) {
          msg = "Indiquez votre nom."; if (show) setInvalid(name, "Champ requis.");
        }
        if (!msg && !accept.checked) msg = "Acceptez les conditions de réservation pour continuer.";
        return msg;
      }
      default:
        return "";
    }
  }

  /* ---------- Rendu ---------- */
  function renderStepper() {
    els.stepper.innerHTML = "";
    steps.forEach(function (s, i) {
      var li = document.createElement("li");
      var done = sent || i < current;
      li.className = done ? "is-done" : (i === current ? "is-current" : "");
      var b = document.createElement("button");
      b.type = "button";
      b.disabled = sent || i >= current;
      if (i === current && !sent) b.setAttribute("aria-current", "step");
      var dot = document.createElement("span");
      dot.className = "dot";
      dot.textContent = done ? "✓" : String(i + 1);
      var lab = document.createElement("span");
      lab.textContent = STEP_LABELS[s];
      b.appendChild(dot);
      b.appendChild(lab);
      b.addEventListener("click", function () { if (i < current) go(i); });
      li.appendChild(b);
      els.stepper.appendChild(li);
    });
  }

  function summaryRows() {
    var extras = getExtras();
    var rows = [
      ["Pour", getVal("category") || DASH],
      ["Coiffure", getVal("style") || DASH],
      ["Longueur", getVal("length") || DASH],
      ["Grosseur", getVal("size") || DASH],
      ["Mèches", getVal("hair") || DASH],
      ["Options", extras.length ? extras.join(", ") : "Aucune"]
    ];
    if (useSquareBooking) rows.push(["Date & heure", "Choisies sur Square"]);
    else rows.push(["Date", dateLabel() || DASH], ["Heure", getVal("time") || DASH]);
    return rows;
  }

  function fillDl(dl, rows) {
    dl.innerHTML = "";
    rows.forEach(function (r) {
      var div = document.createElement("div");
      var dt = document.createElement("dt");
      var dd = document.createElement("dd");
      dt.textContent = r[0];
      dd.textContent = r[1];
      div.appendChild(dt);
      div.appendChild(dd);
      dl.appendChild(div);
    });
  }

  function renderSummary() {
    fillDl(els.summary, summaryRows());
  }

  function renderRecap() {
    var photo = $("photo").files[0];
    fillDl(els.recap, summaryRows().concat([
      ["Nom", $("name").value.trim() || DASH],
      ["Téléphone", $("phone").value.trim() || DASH],
      ["Courriel", $("email").value.trim() || DASH],
      ["Photo d'inspiration", photo ? photo.name : "Aucune"],
      ["Précisions", $("notes").value.trim() || "Aucune"]
    ]));
  }

  function updateNav() {
    var step = steps[current];
    var msg = validate(step, false);
    els.next.setAttribute("aria-disabled", msg ? "true" : "false");
    els.hint.textContent = msg;
    els.back.hidden = current === 0;
    els.next.textContent = step === "recap" ? (useSquareBooking ? "Choisir mon créneau sur Square →" : "Envoyer ma demande") : (steps[current + 1] === "recap" ? "Vérifier ma demande" : "Continuer");
  }

  function showPanel(name) {
    form.querySelectorAll(".panel").forEach(function (p) {
      p.hidden = p.getAttribute("data-step") !== name;
    });
  }

  function go(i) {
    current = i;
    var step = steps[current];
    if (step === "recap") renderRecap();
    showPanel(step);
    renderStepper();
    updateNav();
    hideAlert();
    var h = form.querySelector('.panel[data-step="' + step + '"] h2');
    if (h) h.focus({ preventScroll: true });
    var top = form.getBoundingClientRect().top + window.scrollY - 120;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: "smooth" });
  }

  function showAlert(msg) { els.alert.textContent = msg; els.alert.hidden = false; }
  function hideAlert() { els.alert.hidden = true; els.alert.textContent = ""; }

  /* ---------- Événements ---------- */
  form.addEventListener("change", function (e) {
    if (e.target.name === "category") renderStyles();
    if (e.target.id && e.target.getAttribute("aria-invalid")) validate(steps[current], true);
    renderSummary();
    updateNav();
  });
  form.addEventListener("input", function () { updateNav(); });
  form.addEventListener("submit", function (e) { e.preventDefault(); els.next.click(); });

  els.back.addEventListener("click", function () { if (current > 0) go(current - 1); });

  els.next.addEventListener("click", function () {
    var step = steps[current];
    var msg = validate(step, true);
    if (msg) {
      els.hint.textContent = msg;
      var bad = form.querySelector('.panel[data-step="' + step + '"] [aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }
    if (step === "recap") submit();
    else go(current + 1);
  });

  /* ---------- Envoi ---------- */
  function submit() {
    var data = new FormData(form);
    data.set("mode", useSquareBooking ? "square_appointments" : "payment_link");
    data.set("date_label", dateLabel());
    els.next.disabled = true;
    els.back.disabled = true;
    var original = els.next.textContent;
    els.next.innerHTML = '<span class="spinner" aria-hidden="true"></span> Envoi…';
    hideAlert();

    fetch("api/send-booking.php", { method: "POST", body: data, headers: { "Accept": "application/json" } })
      .then(function (r) {
        return r.json().catch(function () { return { ok: false, error: "Réponse invalide du serveur." }; });
      })
      .then(function (res) {
        if (!res || !res.ok) throw new Error(res && res.error ? res.error : "Envoi impossible.");
        success(res.ref);
      })
      .catch(function (err) {
        if (useSquareBooking || depositLink) {
          // Le courriel n'est pas parti, mais la cliente peut quand même réserver sur Square.
          success(localRef(), true);
          return;
        }
        showAlert((err && err.message ? err.message + " " : "") + "Réessayez, ou écrivez-nous sur WhatsApp au (819) 635-3783.");
        els.next.disabled = false;
        els.back.disabled = false;
        els.next.textContent = original;
      });
  }

  function localRef() {
    var d = new Date();
    return "SK-" + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + "-" + Math.floor(1000 + Math.random() * 9000);
  }

  function detailsText() {
    var extras = getExtras();
    return [getVal("category"), getVal("style"), getVal("length"), getVal("size"), getVal("hair")]
      .concat(extras).filter(Boolean).join(" · ");
  }

  function success(ref, mailFailed) {
    sent = true;
    var first = $("name").value.trim().split(/\s+/)[0] || "merci";
    $("s-first").textContent = first;
    $("s-ref").textContent = ref;
    var pay = $("s-pay");
    var text = $("s-text");

    if (useSquareBooking) {
      pay.href = cfg.squareBookingUrl;
      pay.textContent = "Choisir mon créneau et payer " + fee + " $";
      pay.hidden = false;
      text.textContent = mailFailed
        ? "Dernière étape : choisissez votre créneau sur Square et réglez les " + fee + " $. Copiez ceci dans la note de réservation Square : " + ref + " — " + detailsText()
        : "Dernière étape : choisissez votre créneau en temps réel sur Square et réglez les " + fee + " $ de réservation. Indiquez votre numéro " + ref + " dans la note de réservation.";
    } else if (depositLink) {
      pay.href = depositLink;
      pay.textContent = "Payer " + fee + " $ avec Square";
      pay.hidden = false;
      text.textContent = "Dernière étape : réglez les " + fee + " $ de réservation pour bloquer votre créneau du " + dateLabel() + " à " + getVal("time") + ". Le salon vous confirme ensuite le rendez-vous.";
    } else {
      text.textContent = "Le salon vous contactera rapidement pour confirmer votre créneau et vous envoyer le lien de paiement des " + fee + " $.";
    }

    showPanel("success");
    els.nav.hidden = true;
    renderStepper();
    $("t-success").focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- Initialisation ---------- */
  renderSummary();
  go(0);
  window.scrollTo(0, 0);
})();
