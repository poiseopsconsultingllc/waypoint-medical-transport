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

  // Booking form: show the thank-you banner after FormSubmit redirects back
  var banner = document.getElementById("sent-banner");
  if (banner && window.location.search.indexOf("sent=1") !== -1) {
    banner.classList.add("show");
    banner.scrollIntoView({ block: "center" });
  }
})();
