// Waypoint Medical Transport: shared page behavior.

(function () {
  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Footer year
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  var params = new URLSearchParams(window.location.search);
  function money(n) { return "$" + Number(n).toFixed(2); }

  // ------------------------------------------------------------------
  // Website forms. js/forms-config.js holds John's Apps Script URL and
  // reCAPTCHA site key. Both forms post there (inside his HIPAA-covered
  // Google Workspace) and this page redirects itself to the thank-you view.
  // ------------------------------------------------------------------
  var FORMS = window.WAYPOINT_FORMS || {};
  var formsLive = !!(FORMS.endpoint && FORMS.recaptchaSiteKey);
  var captchaWidgets = [];

  window.waypointCaptchaReady = function () {
    captchaWidgets.forEach(function (w) {
      if (w.widgetId === null) w.widgetId = grecaptcha.render(w.holder, { sitekey: FORMS.recaptchaSiteKey });
    });
  };

  if (formsLive && document.querySelector(".captcha-slot")) {
    var api = document.createElement("script");
    api.src = "https://www.google.com/recaptcha/api.js?onload=waypointCaptchaReady&render=explicit";
    api.async = true;
    api.defer = true;
    document.head.appendChild(api);
  }

  function say(el, text, isError) {
    if (!el) return;
    el.textContent = text;
    el.hidden = !text;
    el.classList.toggle("is-error", !!isError);
  }

  // Sends a form to the Apps Script endpoint and moves on to nextUrl().
  // Registered AFTER each form's own submit listener, so the fields those
  // listeners fill in (appointment time in words, the estimate) are ready.
  function wireForm(form, kind, holder, status, nextUrl) {
    if (!formsLive || !form || !holder) return;
    var widget = { holder: holder, widgetId: null };
    captchaWidgets.push(widget);
    holder.hidden = false;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (widget.widgetId === null || !grecaptcha.getResponse(widget.widgetId)) {
        say(status, "Please check the \"I'm not a robot\" box first.", true);
        return;
      }
      var btn = form.querySelector("button[type=submit]");
      var label = btn ? btn.innerHTML : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }
      say(status, "", false);

      var data = new FormData(form);
      data.set("_form", kind);
      fetch(FORMS.endpoint, { method: "POST", body: data })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.ok) { window.location.href = nextUrl(); return; }
          throw new Error(res && res.error === "captcha" ? "captcha" : "server");
        })
        .catch(function (err) {
          if (btn) { btn.disabled = false; btn.innerHTML = label; }
          if (typeof grecaptcha !== "undefined" && widget.widgetId !== null) grecaptcha.reset(widget.widgetId);
          say(status, err && err.message === "captcha"
            ? "The robot check didn't go through. Please tick the box again and resend."
            : "We couldn't send that just now. Please call or text (330) 942-7306 and we'll take it by phone.", true);
        });
    });
  }

  // Booking form: show the thank-you banner after the redirect back,
  // and tell both ad platforms a booking request just came through.
  // If the rider came from the estimator, "est" carries their number so they
  // can pay it right away and lock the ride in.
  var banner = document.getElementById("sent-banner");
  if (banner && params.get("sent") === "1") {
    banner.classList.add("show");
    window.uetq = window.uetq || [];
    window.uetq.push("event", "form_submit", {});
    if (typeof gtag === "function") gtag("event", "form_submit");

    var est = parseFloat(params.get("est"));
    var payLock = document.getElementById("pay-lock");
    if (payLock && est > 0) {
      payLock.classList.add("show");
      var amtEl = document.getElementById("pay-amt");
      if (amtEl) amtEl.textContent = money(est);
      var payBtn = document.getElementById("pay-btn");
      if (payBtn) payBtn.textContent = "Pay " + money(est) + " with Square";
      var copyBtn = document.getElementById("copy-amt");
      if (copyBtn) {
        copyBtn.addEventListener("click", function () {
          var text = est.toFixed(2);
          var done = function () { copyBtn.textContent = "Copied " + money(est); };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, done);
          } else {
            done();
          }
        });
      }
      payLock.scrollIntoView({ block: "center" });
    } else {
      banner.scrollIntoView({ block: "center" });
    }
  }

  // For Facilities: "Request the Rate Sheet" opens a short form. John gets
  // the request by email with a reply draft he can paste, then attaches
  // the rate sheet himself. The PDF is not hosted on the site.
  var rateToggle = document.getElementById("rate-toggle");
  var ratePanel = document.getElementById("rate-request");
  if (rateToggle && ratePanel) {
    rateToggle.addEventListener("click", function () {
      var open = ratePanel.hidden;
      ratePanel.hidden = !open;
      rateToggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        var first = document.getElementById("r-name");
        if (first) first.focus();
      }
    });
  }
  var rateForm = document.getElementById("rate-form");
  if (rateForm) {
    var facSel = document.getElementById("r-facility");
    var whichWrap = document.getElementById("r-which-wrap");
    var whichEl = document.getElementById("r-which");
    function syncWhich() {
      var yes = facSel.value === "Yes";
      whichWrap.hidden = !yes;
      whichEl.required = yes;
      if (!yes) whichEl.value = "";
    }
    facSel.addEventListener("change", syncWhich);
    syncWhich();
    wireForm(rateForm, "ratesheet", document.getElementById("rate-captcha"), document.getElementById("rate-status"), function () {
      return "facilities.html?sent=1";
    });
  }
  var rateSent = document.getElementById("rate-sent");
  if (rateSent && params.get("sent") === "1") {
    rateSent.classList.add("show");
    rateSent.scrollIntoView({ block: "center" });
  }

  // Booking form behavior
  var form = document.getElementById("ride-form");
  if (form) {
    var dateEl = document.getElementById("f-date");
    var timeEl = document.getElementById("f-time");
    var timeOut = document.getElementById("f-time-out");
    var tripEl = document.getElementById("f-trip");
    var rideEl = document.getElementById("f-ridetype");
    var returnBox = document.getElementById("return-ride");
    var wcWrap = document.getElementById("f-wctype-wrap");
    var wcEl = document.getElementById("f-wctype");
    var note = document.getElementById("day-note");
    var noteDefault = note ? note.textContent : "";
    var pad = function (n) { return n < 10 ? "0" + n : "" + n; };

    // No booking the past: the calendar starts today
    if (dateEl) {
      var now = new Date();
      dateEl.min = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());

      dateEl.addEventListener("change", function () {
        // "2026-11-24" split into numbers and rebuilt by hand, so the
        // browser can't shift the weekday by reading it as another timezone
        var parts = dateEl.value.split("-");
        if (parts.length !== 3 || !note) return;
        var day = new Date(parts[0], parts[1] - 1, parts[2]).getDay(); // 0 = Sunday
        if (day === 0) {
          note.textContent = "Sunday rides are by advance arrangement and add 50% of the base fare. John will confirm by text.";
        } else if (day === 6) {
          note.textContent = "Saturday hours are 5:00 AM to 12 PM. Saturday afternoon rides are by arrangement and add $25.";
        } else {
          note.textContent = noteDefault;
        }
      });
    }

    // Appointment time: the picker gives "13:05", John's email gets "1:05 PM"
    function timeWords(v) {
      var bits = v.split(":");
      if (bits.length < 2) return v;
      var h = parseInt(bits[0], 10);
      var ampm = h < 12 ? "AM" : "PM";
      var clock = h % 12 === 0 ? 12 : h % 12;
      return clock + ":" + bits[1] + " " + ampm;
    }
    if (timeEl && timeOut) {
      var syncTime = function () { timeOut.value = timeEl.value ? timeWords(timeEl.value) : ""; };
      timeEl.addEventListener("change", syncTime);
      timeEl.addEventListener("input", syncTime);
    }

    // Return ride choices only matter on a round trip
    function syncReturn() {
      if (!tripEl || !returnBox) return;
      var round = tripEl.value.indexOf("Round") === 0;
      returnBox.hidden = !round;
      var radios = returnBox.querySelectorAll("input[type=radio]");
      for (var i = 0; i < radios.length; i++) {
        radios[i].required = round;
        if (!round) radios[i].checked = false;
      }
    }
    if (tripEl) tripEl.addEventListener("change", syncReturn);

    // Wheelchair type only matters for wheelchair rides
    function syncWheelchair() {
      if (!rideEl || !wcWrap || !wcEl) return;
      var wc = rideEl.value.indexOf("Wheelchair") === 0;
      wcWrap.hidden = !wc;
      wcEl.required = wc;
      if (!wc) wcEl.value = "";
    }
    if (rideEl) rideEl.addEventListener("change", syncWheelchair);

    // Came here from the estimator? Carry the estimate in with them.
    var estTotal = parseFloat(params.get("est"));
    if (estTotal > 0 && params.get("sent") !== "1") {
      var ride = params.get("ride") || "";
      var trip = params.get("trip") || "";
      var miles = params.get("miles") || "";
      var detail = params.get("detail") || "";

      if (rideEl && ride) rideEl.selectedIndex = ride.indexOf("Wheel") === 0 ? 1 : 0;
      if (tripEl && trip) tripEl.selectedIndex = trip.indexOf("One") === 0 ? 1 : 0;

      var fill = function (id, value) {
        var el = document.getElementById(id);
        if (!el) return;
        el.value = value;
        el.disabled = false;
      };
      fill("h-est", money(estTotal));
      fill("h-detail", detail || (ride + ", " + trip + ", " + miles + " miles one way"));
      fill("h-miles", miles);

      var card = document.getElementById("est-card");
      if (card) {
        card.classList.add("show");
        var amt = card.querySelector(".est-amt");
        if (amt) amt.textContent = money(estTotal);
        var sum = card.querySelector(".est-sum");
        if (sum) sum.textContent = detail || (ride + ", " + trip + ", " + miles + " miles one way.");
      }
    }
    syncReturn();
    syncWheelchair();

    // Send the estimate along to the thank-you page so they can pay it
    var thankYou = function () {
      return "book.html?sent=1" + (estTotal > 0 ? "&est=" + estTotal.toFixed(2) : "");
    };
    form.addEventListener("submit", function () {
      if (timeEl && timeOut && timeEl.value) timeOut.value = timeWords(timeEl.value);
    });
    wireForm(form, "booking", document.getElementById("book-captcha"), document.getElementById("book-status"), thankYou);
  }
})();
