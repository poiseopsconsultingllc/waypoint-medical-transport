// Waypoint Medical Transport — shared page behavior

// Mobile nav toggle
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
})();

// Footer year
(function () {
  var el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
})();

// Ride request form: build a prefilled text message to Waypoint.
// Nothing is stored or sent anywhere; it just opens the visitor's
// own messaging app with the request written out.
(function () {
  var form = document.getElementById("ride-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var val = function (id) {
      var el = document.getElementById(id);
      return el && el.value ? el.value.trim() : "";
    };

    var lines = ["Ride request from the Waypoint website:"];
    if (val("f-name")) lines.push("Name: " + val("f-name"));
    if (val("f-type")) lines.push("Need: " + val("f-type"));
    if (val("f-from")) lines.push("Pickup: " + val("f-from"));
    if (val("f-to")) lines.push("Going to: " + val("f-to"));
    if (val("f-when")) lines.push("When: " + val("f-when"));
    var wheel = document.getElementById("f-wheel");
    if (wheel && wheel.checked) lines.push("Wheelchair or extra help needed");
    if (val("f-notes")) lines.push("Notes: " + val("f-notes"));

    var body = encodeURIComponent(lines.join("\n"));
    // The "?&body=" form works on both iPhone and Android.
    window.location.href = "sms:+13309427306?&body=" + body;
  });
})();
