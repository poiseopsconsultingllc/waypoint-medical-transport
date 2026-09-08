// Waypoint Medical Transport: instant fare estimator.
// The whole retail rate card lives in RATES. Change a number here and the
// estimate, the breakdown, and the booking hand-off all follow.

(function () {
  var RATES = {
    amb: { base: 45, included: 5, perMile: 2.50, longPerMile: 2.00, label: "Ambulatory" },
    wc:  { base: 80, included: 0, perMile: 3.50, longPerMile: 3.00, label: "Wheelchair" },
    longTripOver: 25,      // one-way miles; past this the per-mile rate drops
    returnLegOff: 0.10,    // round trip: second leg 10% off
    evening: 25,           // 6 to 10 PM or Saturday afternoon, per trip
    sundayPct: 0.50,       // Sunday or major holiday: +50% of base, each leg
    sameDay: 15,
    extraStop: 10,
    discounts: {           // best ONE only, never stacked
      vet: { pct: 0.15, label: "Veteran or active military, 15% off" },
      founding: { pct: 0.20, label: "Founding rider, 20% off first ride" },
      pack: { pct: 0.08, label: "10-ride prepaid package, 8% off" }
    }
  };

  var $ = function (id) { return document.getElementById(id); };
  var form = $("est-form");
  if (!form) return;

  var totalEl = $("est-total");
  var perLegEl = $("est-perleg");
  var linesEl = $("est-lines");
  var emptyEl = $("est-empty");
  var resultEl = $("est-result");
  var bookBtn = $("est-book");

  function money(n) { return "$" + n.toFixed(2); }
  function round2(n) { return Math.round(n * 100) / 100; }
  function checked(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }
  function on(id) { var el = $(id); return !!(el && el.checked); }

  function calc() {
    var type = checked("ride") || "amb";
    var trip = checked("trip") || "round";
    var miles = parseFloat($("miles").value);
    var r = RATES[type];
    var round = trip === "round";

    if (isNaN(miles) || miles < 0) {
      resultEl.hidden = true;
      emptyEl.hidden = false;
      return;
    }
    resultEl.hidden = false;
    emptyEl.hidden = true;

    var opts = {
      evening: on("o-evening"),
      sunday: on("o-sunday"),
      sameday: on("o-sameday"),
      extra: on("o-extra"),
      vet: on("o-vet"),
      founding: on("o-founding"),
      pack: on("o-pack")
    };

    var lines = [];
    // Mileage is tiered: only the miles PAST 25 one way get the long-trip
    // rate. Wheelchair bills every mile; ambulatory includes the first 5.
    var billable = Math.max(0, miles - r.included);
    var stdCap = RATES.longTripOver - r.included;
    var stdMiles = Math.min(billable, stdCap);
    var longMiles = Math.max(0, billable - stdCap);
    var stdCost = round2(stdMiles * r.perMile);
    var longCost = round2(longMiles * r.longPerMile);
    var legFare = round2(r.base + stdCost + longCost);
    var longTrip = longMiles > 0;

    lines.push([r.label + " base fare, per leg", money(r.base)]);
    if (r.included && miles <= r.included) {
      lines.push(["First " + r.included + " miles included", "$0.00"]);
    } else {
      if (stdMiles > 0) {
        lines.push([(r.included ? stdMiles + " miles past the first " + r.included : stdMiles + " miles") + " x " + money(r.perMile), money(stdCost)]);
      }
      if (longMiles > 0) {
        lines.push([longMiles + " miles past " + RATES.longTripOver + " x " + money(r.longPerMile) + " (long-trip rate)", money(longCost)]);
      }
    }

    // Round trip: the return leg is 10% off the FARE only.
    var leg1 = legFare;
    var leg2 = round ? round2(legFare * (1 - RATES.returnLegOff)) : 0;
    if (round) lines.push(["Return leg, 10% off", money(leg2)]);

    // Sunday or holiday: half the base fare for every leg, added after the
    // return discount so it is never discounted.
    var legs = round ? 2 : 1;
    var sundayAdd = opts.sunday ? round2(r.base * RATES.sundayPct * legs) : 0;
    if (opts.sunday) lines.push(["Sunday or holiday, +50% of base" + (round ? " x 2 legs" : ""), money(sundayAdd)]);

    var addons = sundayAdd;
    if (opts.evening && !opts.sunday) {
      addons += RATES.evening;
      lines.push(["Evening or Saturday afternoon", money(RATES.evening)]);
    }
    if (opts.evening && opts.sunday) {
      lines.push(["Sunday or holiday rate applied. The evening add-on never stacks with it.", ""]);
      lines[lines.length - 1].note = true;
    }
    if (opts.sameday) { addons += RATES.sameDay; lines.push(["Same-day booking", money(RATES.sameDay)]); }
    if (opts.extra) { addons += RATES.extraStop; lines.push(["Extra stop", money(RATES.extraStop)]); }

    var subtotal = round2(leg1 + leg2 + addons);

    // Best single discount, applied last
    var best = null, picked = 0;
    ["vet", "founding", "pack"].forEach(function (k) {
      if (opts[k]) {
        picked++;
        if (!best || RATES.discounts[k].pct > best.pct) best = RATES.discounts[k];
      }
    });
    var discount = best ? round2(subtotal * best.pct) : 0;
    if (best) {
      lines.push([best.label, "-" + money(discount)]);
      lines[lines.length - 1].disc = true;
      if (picked > 1) {
        lines.push(["Best single discount applied. Discounts never stack.", ""]);
        lines[lines.length - 1].note = true;
      }
    }

    var total = round2(subtotal - discount);

    // Paint it
    totalEl.textContent = money(total);
    perLegEl.textContent = round ? "about " + money(round2(total / 2)) + " per leg, round trip" : "one-way";
    linesEl.innerHTML = "";
    lines.forEach(function (l) {
      var li = document.createElement("li");
      if (l.disc) li.className = "disc";
      if (l.note) li.className = "note";
      var a = document.createElement("span"); a.textContent = l[0];
      var b = document.createElement("span"); b.textContent = l[1];
      li.appendChild(a); li.appendChild(b);
      linesEl.appendChild(li);
    });

    // Hand the exact estimate to the booking form. Nobody re-does the math.
    var optNames = [];
    if (opts.evening && !opts.sunday) optNames.push("Evening or Saturday afternoon");
    if (opts.sunday) optNames.push("Sunday or holiday");
    if (opts.sameday) optNames.push("Same-day booking");
    if (opts.extra) optNames.push("Extra stop");
    var detail = r.label + ", " + (round ? "round trip" : "one-way") + ", " + miles + " miles one way"
      + (longTrip ? " (long-trip rate)" : "")
      + (optNames.length ? ". Add-ons: " + optNames.join(", ") : "")
      + (best ? ". Discount: " + best.label : "")
      + ". Estimated " + money(total) + ".";
    var q = new URLSearchParams();
    q.set("ride", r.label);
    q.set("trip", round ? "Round trip" : "One-way");
    q.set("miles", String(miles));
    q.set("est", total.toFixed(2));
    q.set("detail", detail);
    bookBtn.href = "book.html?" + q.toString();
  }

  form.addEventListener("input", calc);
  form.addEventListener("change", calc);
  form.addEventListener("submit", function (e) { e.preventDefault(); calc(); });
  calc();
})();
