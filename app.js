/* MediPulse front-end helpers: modals, live search, confirmations, flash messages. */
(function () {
  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.hidden = false;
    var first = m.querySelector("input, select, textarea");
    if (first) first.focus();
  }
  function closeModals() {
    document.querySelectorAll(".scrim").forEach(function (m) { m.hidden = true; });
  }

  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-open-modal]");
    if (opener) { e.preventDefault(); openModal(opener.getAttribute("data-open-modal")); return; }
    if (e.target.closest("[data-close-modal]")) { closeModals(); return; }
    if (e.target.classList && e.target.classList.contains("scrim")) { closeModals(); return; }
    var dismiss = e.target.closest("[data-dismiss]");
    if (dismiss) dismiss.parentElement.remove();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModals(); });

  // Live filter: <input data-filter="#list"> hides rows of #list whose data-search text does not match.
  document.querySelectorAll("[data-filter]").forEach(function (input) {
    var target = document.querySelector(input.getAttribute("data-filter"));
    if (!target) return;
    var empty = target.parentElement.querySelector("[data-empty]");
    function apply() {
      var q = input.value.trim().toLowerCase(), shown = 0;
      target.querySelectorAll("[data-search]").forEach(function (row) {
        var hit = !q || row.getAttribute("data-search").indexOf(q) > -1;
        row.hidden = !hit;
        if (hit) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    }
    input.addEventListener("input", apply);
    apply();
  });

  // Confirm before destructive actions: <form data-confirm="Remove this?">
  document.addEventListener("submit", function (e) {
    var msg = e.target.getAttribute && e.target.getAttribute("data-confirm");
    if (msg && !window.confirm(msg)) e.preventDefault();
  });

  // Flash messages fade out after a few seconds.
  setTimeout(function () {
    document.querySelectorAll(".flash").forEach(function (f) { f.remove(); });
  }, 5000);

  if (location.hash === "#add-patient") openModal("addPatient");

  // Browser dose reminders. These run while the patient dashboard is open.
  (function medicationNotifications() {
    var enable = document.getElementById("enableNotify");
    if (!enable) return;
    var test = document.getElementById("testNotify");
    var status = document.getElementById("notifyStatus");
    var scheduleNode = document.getElementById("medicationSchedule");
    var meds = [];
    try { meds = JSON.parse(scheduleNode ? scheduleNode.textContent : "[]"); } catch (_) {}
    if (!("Notification" in window)) {
      status.textContent = "This browser does not support notifications.";
      return;
    }
    enable.hidden = false;
    test.hidden = false;

    function scheduleTimes(med) {
      var parts = (med.time || "08:00").split(":").map(Number);
      var base = parts[0] * 60 + parts[1];
      var offsets = [];
      if (med.frequency === "Twice daily") offsets = [0, 12 * 60];
      else if (med.frequency === "Three times daily" || med.frequency === "Every 8 hours") offsets = [0, 8 * 60, 16 * 60];
      else if (med.frequency === "Once daily" || med.frequency === "Every other day" || med.frequency === "Weekly") offsets = [0];
      else return [];
      return offsets.map(function (offset) {
        var total = (base + offset) % (24 * 60);
        return String(Math.floor(total / 60)).padStart(2, "0") + ":" +
          String(total % 60).padStart(2, "0");
      });
    }

    function dateIsActive(med, dateText) {
      if (med.start && dateText < med.start) return false;
      if (med.end && dateText > med.end) return false;
      if (med.frequency === "Every other day" && med.start) {
        var start = new Date(med.start + "T00:00:00");
        var current = new Date(dateText + "T00:00:00");
        var days = Math.round((current - start) / 86400000);
        return days % 2 === 0;
      }
      if (med.frequency === "Weekly" && med.start) {
        var startDay = new Date(med.start + "T00:00:00").getDay();
        return new Date(dateText + "T00:00:00").getDay() === startDay;
      }
      return true;
    }

    function checkReminders() {
      if (Notification.permission !== "granted") return;
      var now = new Date();
      var dateText = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") +
        "-" + String(now.getDate()).padStart(2, "0");
      var hhmm = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
      meds.forEach(function (med) {
        if (!dateIsActive(med, dateText) || scheduleTimes(med).indexOf(hhmm) === -1) return;
        var key = "medipulse-reminder-" + med.id + "-" + dateText + "-" + hhmm;
        if (localStorage.getItem(key)) return;
        new Notification("Medication reminder", {
          body: "Time for " + med.name + " (" + med.dosage + "). Open MediPulse to log your dose.",
          tag: key
        });
        localStorage.setItem(key, "sent");
      });
    }

    function updateStatus() {
      status.textContent = Notification.permission === "granted"
        ? "Browser reminders are on. Keep this dashboard open at dose times."
        : Notification.permission === "denied"
          ? "Notifications are blocked. Allow them in your browser site settings."
          : "Turn on browser notifications to receive dose alerts on this device.";
    }

    enable.addEventListener("click", function () {
      Notification.requestPermission().then(function () {
        updateStatus();
        if (Notification.permission === "granted") checkReminders();
      });
    });
    test.addEventListener("click", function () {
      if (Notification.permission === "granted") {
        new Notification("MediPulse test", { body: "Your medication notifications are working." });
      } else {
        status.textContent = "Please turn on reminders first.";
      }
    });
    updateStatus();
    checkReminders();
    window.setInterval(checkReminders, 15000);
    document.addEventListener("visibilitychange", checkReminders);
  })();

})();
