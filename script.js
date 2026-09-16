/* =====================================================================
   Cristal Tenorio Law Office — Digital Business Card
   ---------------------------------------------------------------------
   WEBSITE OWNER CONFIGURATION — READ THIS
   ---------------------------------------------------------------------
   1) APPOINTMENT_ENDPOINT
      Paste the URL of your backend / serverless endpoint that receives
      appointment requests, e.g.  "https://yourdomain.com/api/appointment"
      Leave as "" (empty) to use the built-in fallback: the visitor's
      email app opens with the request prefilled to BOTH office emails.

   NEVER put API keys, email passwords or secrets in this file.
   ===================================================================== */

var APPOINTMENT_ENDPOINT = "";

/* Office constants — edit here if contact details ever change */
var OFFICE = {
  firstName: "Donnabel",
  lastName: "Tenorio",
  fullName: "Atty. Donnabel C. Tenorio",                 /* FN / display name */
  formalName: "ATTY. DONNABEL C. TENORIO",
  org: "Cristal Tenorio Law Office",
  title: "Lawyer",
  landline: "+63272571802",                              /* tel: link format */
  mobiles: ["+639917924302", "+639338124210", "+639338549529"],
  email1: "cristaltenoriolawoffice@yahoo.com",
  email2: "cristaltenoriolawoffice@gmail.com",
  address: "Unit 4 Mezzanine Area, Estrera Building, 789 J.P. Rizal St., Brgy. Poblacion, Makati City, Metro Manila 1208, Philippines"
};

/* ---------------------------------------------------------------
   Helpers
   --------------------------------------------------------------- */
function $(id){ return document.getElementById(id); }

function toast(msg){
  var t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){ t.classList.remove("show"); }, 3000);
}

function localIso(d){
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function copyText(text){
  if (navigator.clipboard && window.isSecureContext){
    return navigator.clipboard.writeText(text);
  }
  return new Promise(function(resolve, reject){
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      resolve();
    } catch(e){
      reject(e);
    }
    ta.remove();
  });
}

/* ---------------------------------------------------------------
   VCARD BUILDER
   Built entirely in the browser from OFFICE above — no file is
   fetched from the server, ever. Uses CRLF line endings and escaped
   commas, as the vCard spec requires.
   --------------------------------------------------------------- */
function buildVCard(){
  var lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:" + OFFICE.lastName + ";" + OFFICE.firstName + ";;;",
    "FN:" + OFFICE.formalName,
    "ORG:" + OFFICE.org,
    "TITLE:" + OFFICE.title,
    "TEL;TYPE=WORK;TYPE=VOICE:" + OFFICE.landline,
    "TEL;TYPE=CELL:" + OFFICE.mobiles[0],
    "TEL;TYPE=CELL:" + OFFICE.mobiles[1],
    "TEL;TYPE=CELL:" + OFFICE.mobiles[2],
    "EMAIL;TYPE=INTERNET:" + OFFICE.email1,
    "EMAIL;TYPE=INTERNET:" + OFFICE.email2,
    "ADR;TYPE=WORK:;;" + OFFICE.address.replace(/,/g, "\\,") + ";;;;",
    "END:VCARD"
  ];
  return lines.join("\r\n") + "\r\n";
}

function isIOS(){
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/* ---------------------------------------------------------------
   SAVE CONTACT
   No Blob, no <a download> — those are what iOS ignores. Instead:

   1) Web Share API (Android Chrome 89+ and iOS Safari 15+):
      the phone's own share sheet opens with the .vcf attached.
      iPhone: tap "Contacts" in the sheet → pre-filled contact → Add.
      Android: tap "Contacts / Save to contacts" → new-contact screen
      pre-filled → save.
   2) iOS without share support: the vCard opens as a data: URI, so
      the browser shows the contact preview card with an "Add" button.
   3) Desktop/other: a data: URI link with a filename — this works in
      every desktop browser.
   If all else fails, "Copy contact details" (the small link under
   the buttons) opens a panel with the full vCard text, a copy button
   and one-tap call/email links.
   --------------------------------------------------------------- */
function saveContact(){
  try {
    var vcard = buildVCard();

    /* 1) Share sheet with the file (Android + iOS 15+) */
    var file = new File([vcard], "Attorney_Tenorio.vcf", { type: "text/vcard" });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })){
      navigator.share({ files: [file], title: OFFICE.fullName })
        .then(function(){
          toast("Choose “Contacts” in the share menu to save.");
        })
        .catch(function(){ /* user cancelled */ });
      return;
    }

    /* 2) iOS fallback — open the vCard directly (contact preview
          appears with an “Add” button) */
    if (isIOS()){
      var uri = "data:text/vcard;charset=utf-8," + encodeURIComponent(vcard);
      window.location.href = uri;
      setTimeout(function(){
        toast("If nothing opened, use “Copy the contact details” below.");
      }, 1500);
      return;
    }

    /* 3) Desktop / other browsers */
    var uri2 = "data:text/vcard;charset=utf-8," + encodeURIComponent(vcard);
    var a = document.createElement("a");
    a.href = uri2;
    a.download = "Attorney_Tenorio.vcf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast("Contact opening — add it to your contacts.");
  } catch(err){
    if (window.console) console.error(err);
    toast("Could not open the contact — use “Copy the contact details” below.");
  }
}

/* ---------------------------------------------------------------
   MODALS
   --------------------------------------------------------------- */
var lastFocus = null;

function openModal(id){
  var m = $(id);
  if (!m) return;
  lastFocus = document.activeElement;
  m.classList.add("open");
  m.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  var first = m.querySelector("input, select, textarea, a[href], button");
  if (first) first.focus();
}

function closeModal(m){
  m.classList.remove("open");
  m.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (lastFocus) lastFocus.focus();
}

/* ---------------------------------------------------------------
   CHIPS (single-select radiogroups)
   --------------------------------------------------------------- */
function buildChips(containerId, options){
  var grid = $(containerId);
  if (!grid) return function(){ return ""; };
  var selected = "";
  options.forEach(function(opt){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", "false");
    b.textContent = opt;
    b.addEventListener("click", function(){
      grid.querySelectorAll(".chip").forEach(function(c){
        c.classList.remove("selected");
        c.setAttribute("aria-checked", "false");
      });
      b.classList.add("selected");
      b.setAttribute("aria-checked", "true");
      selected = opt;
    });
    grid.appendChild(b);
  });
  return function(){ return selected; };
}

var getConsultationType = buildChips(
  "ctype-grid",
  ["Initial Consultation", "Legal Consultation", "Follow-up Consultation", "Other"]
);

/* Preferred time: 10:00 AM – 2:00 PM only */
var getTimeSlot = buildChips(
  "ctime-grid",
  ["10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM"]
);

/* ---------------------------------------------------------------
   APPOINTMENT FORM
   --------------------------------------------------------------- */
var today = new Date();
var apptDateInput = $("appt-date");
apptDateInput.min = localIso(today);

var apptForm = $("appointment-form");
var apptError = $("appt-error");
var lastAppointment = null;   /* used by the calendar actions below */

function setError(el, msg){
  if (msg){ el.textContent = msg; el.classList.remove("hidden"); }
  else { el.textContent = ""; el.classList.add("hidden"); }
}

function isValidPhone(v){
  return (v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15);
}

function isValidEmail(v){
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

function validateAppointment(){
  var dateVal = apptDateInput.value;
  var name = $("appt-name").value.trim();
  var mobile = $("appt-mobile").value.trim();
  var email = $("appt-email").value.trim();

  if (!getConsultationType()) return "Please choose a consultation type.";
  if (!dateVal) return "Please choose a preferred date.";
  if (dateVal < localIso(today)) return "Please choose a date in the future.";
  if (!getTimeSlot()) return "Please choose a preferred time.";
  if (name.length < 2) return "Please enter your full name.";
  if (!isValidPhone(mobile)) return "Please enter a valid mobile number.";
  if (!isValidEmail(email)) return "Please enter a valid email address.";
  return "";
}

function buildAppointmentPayload(){
  return {
    clientName: $("appt-name").value.trim(),
    mobileNumber: $("appt-mobile").value.trim(),
    email: $("appt-email").value.trim(),
    consultationType: getConsultationType(),
    appointmentDate: $("appt-date").value,
    appointmentTime: getTimeSlot(),
    message: $("appt-msg").value.trim(),
    timestamp: new Date().toISOString(),
    source: "digital business card (QR/NFC)"
  };
}

function openAppointmentMailto(p){
  var subject = "New Consultation Appointment — " + p.clientName + " — " + p.appointmentDate;
  var body =
    "New Consultation Appointment Request\n\n" +
    "Client Name: " + p.clientName + "\n" +
    "Mobile Number: " + p.mobileNumber + "\n" +
    "Email: " + p.email + "\n" +
    "Consultation Type: " + p.consultationType + "\n" +
    "Appointment Date: " + p.appointmentDate + "\n" +
    "Appointment Time: " + p.appointmentTime + "\n" +
    "Reason / Message: " + (p.message || "Not provided") + "\n" +
    "Submitted: " + p.timestamp + "\n" +
    "Source: " + p.source;
  var mailto = "mailto:" + OFFICE.email1 +
    "?cc=" + encodeURIComponent(OFFICE.email2) +
    "&subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(body);
  window.location.href = mailto;
}

function showAppointmentSuccess(mode){
  apptForm.classList.add("hidden");
  var success = $("appt-success");
  var fb = $("appt-fallback-note");
  if (fb){
    if (mode === "email-fallback"){
      fb.classList.remove("hidden");
    } else {
      fb.classList.add("hidden");
    }
  }
  success.classList.remove("hidden");
  var sheet = document.querySelector("#modal-appointment .modal-sheet");
  if (sheet) sheet.scrollTo({ top: 0, behavior: "smooth" });
}

apptForm.addEventListener("submit", function(e){
  e.preventDefault();
  setError(apptError, "");

  /* Honeypot — a bot fills hidden fields. Pretend success, send nothing. */
  if ($("appt-company").value !== ""){ showAppointmentSuccess("honeypot"); return; }

  var problem = validateAppointment();
  if (problem){ setError(apptError, problem); return; }

  var payload = buildAppointmentPayload();
  lastAppointment = payload;

  doSend(payload);
});

function doSend(payload){
  function viaMail(){
    apptForm.reset();
    openAppointmentMailto(payload);
    showAppointmentSuccess("email-fallback");
  }
  function viaBackend(){
    apptForm.reset();
    showAppointmentSuccess("backend");
    toast("Appointment request sent.");
  }

  if (!APPOINTMENT_ENDPOINT){ viaMail(); return; }

  fetch(APPOINTMENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then(function(res){
    if (!res.ok) throw new Error("HTTP " + res.status);
    viaBackend();
  }).catch(function(){
    viaMail();
  });
}

/* ---------------------------------------------------------------
   CALENDAR — after a request is submitted.
   Primary: Google Calendar template link (works in every mobile
   browser — no app needed). Secondary: .ics file download and a
   copy-the-details fallback. No Blob URLs anywhere.
   --------------------------------------------------------------- */
function escapeIcs(s){
  return String(s || "").replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function parseTime(t){
  var parts = t.split(":");
  var h = parseInt(parts[0], 10);
  var m = parseInt(parts[1].slice(0, 2), 10);
  if (/PM/i.test(t) && h < 12) h += 12;
  if (/AM/i.test(t) && h === 12) h = 0;
  return { h: h, m: m };
}

function eventStartEnd(p){
  var parts = p.appointmentDate.split("-");
  var tm = parseTime(p.appointmentTime);
  var start = new Date(+parts[0], +parts[1] - 1, +parts[2], tm.h, tm.m, 0);
  var end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start: start, end: end };
}

function pad2(n){ return String(n).padStart(2, "0"); }

function googleCalendarUrl(p){
  var se = eventStartEnd(p);
  function fmt(d){
    return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) +
      "T" + pad2(d.getHours()) + pad2(d.getMinutes()) + "00";
  }
  var summary = p.consultationType + " — " + OFFICE.fullName;
  var details =
    p.consultationType + " with " + OFFICE.fullName + " (" + OFFICE.org + ").\n" +
    "Client: " + p.clientName + "\nMobile: " + p.mobileNumber + "\nEmail: " + p.email +
    (p.message ? "\nReason: " + p.message : "") +
    "\n\nThis appointment is a request and is only confirmed after the law office confirms it.";
  return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent(summary) +
    "&dates=" + fmt(se.start) + "/" + fmt(se.end) +
    "&details=" + encodeURIComponent(details) +
    "&location=" + encodeURIComponent(OFFICE.address);
}

function icsStamp(d){
  return d.getUTCFullYear() +
    pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate()) + "T" +
    pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + "00Z";
}

function buildIcs(p){
  var se = eventStartEnd(p);
  function localStamp(d){
    return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) +
      "T" + pad2(d.getHours()) + pad2(d.getMinutes()) + "00";
  }
  var uid = "ctlo-" + Date.now() + "-" + Math.random().toString(36).slice(2) + "@cristaltenorio.ph";
  var summary = p.consultationType + " — " + OFFICE.fullName;
  var description =
    p.consultationType + " with " + OFFICE.fullName + " (" + OFFICE.org + ").\n" +
    "Client: " + p.clientName + "\nMobile: " + p.mobileNumber + "\nEmail: " + p.email +
    (p.message ? "\nReason: " + p.message : "") +
    "\n\nThis appointment is a request and is only confirmed after the law office confirms it.";
  var lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cristal Tenorio Law Office//Digital Business Card//EN",
    "BEGIN:VEVENT",
    "UID:" + uid,
    "DTSTAMP:" + icsStamp(new Date()),
    "DTSTART:" + localStamp(se.start),
    "DTEND:" + localStamp(se.end),
    "SUMMARY:" + escapeIcs(summary),
    "DESCRIPTION:" + escapeIcs(description),
    "LOCATION:" + escapeIcs(OFFICE.address),
    "END:VEVENT",
    "END:VCALENDAR"
  ];
  return lines.join("\r\n") + "\r\n";
}

function addToCalendar(){
  try {
    if (!lastAppointment){ toast("No appointment to add yet."); return; }
    var url = googleCalendarUrl(lastAppointment);
    var w = window.open(url, "_blank");
    if (!w){ window.location.href = url; }
  } catch(err){
    if (window.console) console.error(err);
    toast("Could not open the calendar — use “Copy event details” instead.");
  }
}

function downloadIcs(){
  try {
    if (!lastAppointment){ toast("No appointment to add yet."); return; }
    var ics = buildIcs(lastAppointment);
    var uri = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
    var a = document.createElement("a");
    a.href = uri;
    a.download = "appointment.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch(err){
    if (window.console) console.error(err);
    toast("Could not create the file — use “Copy event details” instead.");
  }
}

function copyIcsDetails(){
  try {
    if (!lastAppointment){ toast("No appointment to add yet."); return; }
    copyText(buildIcs(lastAppointment))
      .then(function(){ toast("Event details copied — paste them into your calendar app."); })
      .catch(function(){ toast("Could not copy — long-press the request email instead."); });
  } catch(err){
    if (window.console) console.error(err);
    toast("Could not copy — long-press the request email instead.");
  }
}

/* ---------------------------------------------------------------
   SAVE CONTACT HELP (visible fallback)
   --------------------------------------------------------------- */
function openContactHelp(){
  try {
    $("sv-vcard-text").value = buildVCard();
    openModal("modal-save-help");
  } catch(err){
    if (window.console) console.error(err);
    toast("Could not prepare the details — please call or email us.");
  }
}

function copyContactDetails(){
  try {
    copyText($("sv-vcard-text").value)
      .then(function(){ toast("Contact details copied — paste into your Contacts app."); })
      .catch(function(){ toast("Could not copy — long-press the text box instead."); });
  } catch(err){
    if (window.console) console.error(err);
    toast("Could not copy — long-press the text box instead.");
  }
}

/* ---------------------------------------------------------------
   ONE delegated click handler for everything.
   Because it lives on document, handlers can never be orphaned by
   DOM changes (e.g. after the appointment form is hidden/swapped).
   --------------------------------------------------------------- */
document.addEventListener("click", function(e){
  var t = e.target;

  /* Backdrop click closes the modal */
  if (t.classList && t.classList.contains("modal")){
    closeModal(t);
    return;
  }

  var openBtn = t.closest ? t.closest("[data-open]") : null;
  if (openBtn){ openModal(openBtn.getAttribute("data-open")); return; }

  var closeBtn = t.closest ? t.closest("[data-close]") : null;
  if (closeBtn){ closeModal(closeBtn.closest(".modal")); return; }

  if (t.closest && t.closest(".js-save")){ saveContact(); return; }
  if (t.closest && t.closest("#copy-contact-details")){ openContactHelp(); return; }
  if (t.closest && t.closest("#sv-copy")){ copyContactDetails(); return; }
  if (t.closest && t.closest("#add-calendar")){ addToCalendar(); return; }
  if (t.closest && t.closest("#dl-ics")){ downloadIcs(); return; }
  if (t.closest && t.closest("#copy-ics-details")){ copyIcsDetails(); return; }
});

window.addEventListener("keydown", function(e){
  if (e.key === "Escape"){
    var open = document.querySelector(".modal.open");
    if (open) closeModal(open);
  }
});
