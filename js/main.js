// Waypoint Medical Transport — shared page behavior.

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

  // Booking form: show the thank-you banner after FormSubmit redirects back,
  // and tell both ad platforms a booking request just came through.
  var banner = document.getElementById("sent-banner");
  if (banner && window.location.search.indexOf("sent=1") !== -1) {
    banner.classList.add("show");
    banner.scrollIntoView({ block: "center" });
    window.uetq = window.uetq || [];
    window.uetq.push("event", "form_submit", {});
    if (typeof gtag === "function") gtag("event", "form_submit");
  }

  // Booking form: one-hour time blocks that follow the real hours.
  // Weekdays run 5 AM to 5 PM (last block starts at 4), Saturdays 5 AM
  // to 12 PM (last block starts at 11), Sunday is closed.
  var dateEl = document.getElementById("f-date");
  var timeEl = document.getElementById("f-time");
  if (dateEl && timeEl) {
    // Turn an hour number (24-hour clock) into words, e.g. 13 -> "1:00 PM"
    function hourLabel(h) {
      var ampm = h < 12 ? "AM" : "PM";
      var clock = h % 12 === 0 ? 12 : h % 12;
      return clock + ":00 " + ampm;
    }

    // Rebuild the dropdown for a given last start hour (16 = 4 PM, 11 = Sat)
    function buildBlocks(lastStart) {
      var keep = timeEl.value;
      timeEl.innerHTML = "";
      var first = document.createElement("option");
      first.value = "";
      first.textContent = "Pick a block";
      timeEl.appendChild(first);
      for (var h = 5; h <= lastStart; h++) {
        var opt = document.createElement("option");
        opt.value = hourLabel(h) + " to " + hourLabel(h + 1);
        opt.textContent = opt.value;
        timeEl.appendChild(opt);
      }
      // If the block they already picked still exists, keep it selected
      timeEl.value = keep;
      if (timeEl.value !== keep) timeEl.value = "";
    }

    // No booking the past: the calendar starts today
    var now = new Date();
    var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
    dateEl.min = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());

    var note = document.getElementById("day-note");
    var noteDefault = note ? note.textContent : "";

    function onDateChange() {
      // "2026-11-24" split into numbers and rebuilt by hand, so the
      // browser can't shift the weekday by reading it as another timezone
      var parts = dateEl.value.split("-");
      if (parts.length !== 3) return;
      var picked = new Date(parts[0], parts[1] - 1, parts[2]);
      var day = picked.getDay(); // 0 = Sunday ... 6 = Saturday

      if (day === 0) {
        timeEl.innerHTML = "<option value=''>Closed Sunday</option>";
        timeEl.value = "";
        dateEl.setCustomValidity("We're closed on Sundays. Pick Monday through Saturday.");
        if (note) note.textContent = "We're closed on Sundays. Pick Monday through Saturday and the time blocks will come back.";
      } else {
        dateEl.setCustomValidity("");
        buildBlocks(day === 6 ? 11 : 16);
        if (note) note.textContent = day === 6
          ? "Saturday blocks run 5:00 AM to 12 PM."
          : noteDefault;
      }
    }

    dateEl.addEventListener("change", onDateChange);
    buildBlocks(16); // sensible weekday default before any date is picked
  }
})();
