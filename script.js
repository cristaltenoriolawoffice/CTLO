/* =====================================================================
   Cristal Tenorio Law Office — Digital Business Card
   ---------------------------------------------------------------------
   WEBSITE OWNER CONFIGURATION — READ THIS
   ---------------------------------------------------------------------
   1) APPOINTMENT_ENDPOINT  ← this is what sends the appointment email
      It is pre-set to FormSubmit (free, no API key needed):
        https://formsubmit.co/ajax/<the office email>
      ONE-TIME ACTIVATION: the very first appointment ever submitted
      sends an activation email to that inbox. Open it and click the
      confirm link once — after that, every request is delivered
      automatically with no email app opening on the visitor's phone.

      Prefer Web3Forms or EmailJS instead? Just replace the URL with
      your own endpoint; the form posts JSON, so any endpoint works.

   2) APPOINTMENT_CC — a second inbox that also receives the request.

   NEVER put API keys, passwords or secrets in this file.
   ===================================================================== */

var APPOINTMENT_ENDPOINT = "https://formsubmit.co/ajax/cristaltenoriolawoffice@yahoo.com";
var APPOINTMENT_CC = "cristaltenoriolawoffice@gmail.com";

/* Office constants — edit here if contact details ever change */
var OFFICE = {
  firstName: "Donnabel",
  lastName: "Tenorio",
  fullName: "Atty. Donnabel C. Tenorio",
  formalName: "ATTY. DONNABEL C. TENORIO",
  org: "Cristal Tenorio Law Office",
  title: "Lawyer",
  landline: "+63272571802",
  mobiles: ["+639917924302", "+639338124210", "+639338549529"],
  email1: "cristaltenoriolawoffice@yahoo.com",
  email2: "cristaltenoriolawoffice@gmail.com",
  address: "Unit 4 Mezzanine Area, Estrera Building, 789 J.P. Rizal St., Brgy. Poblacion, Makati City, Metro Manila 1208, Philippines",
  timezone: "Asia/Manila"
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
  t._timer = setTimeout(function(){ t.classList.remove("show"); }, 3200);
}

function pad2(n){ return String(n).padStart(2, "0"); }

function localIso(d){
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
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
   The request is POSTed straight to the office inbox — the visitor
   never leaves the page and no email app opens.
   --------------------------------------------------------------- */
var today = new Date();
var apptDateInput = $("appt-date");
apptDateInput.min = localIso(today);

var apptForm = $("appointment-form");
var apptError = $("appt-error");
var sendBtn = $("appt-send");
var lastAppointment = null;   /* used by the Add to Calendar button */

function setError(el, msg){
  if (msg){ el.textContent = msg; el.classList.remove("hidden"); }
  else { el.textContent = ""; el.classList.add("hidden"); }
}

function isValidPhone(v){
  var digits = v.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function isValidEmail(v){
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

function validateAppointment(){
  if (!getConsultationType()) return "Please choose a consultation type.";
  if (!apptDateInput.value) return "Please choose a preferred date.";
  if (apptDateInput.value < localIso(today)) return "Please choose a date in the future.";
  if (!getTimeSlot()) return "Please choose a preferred time.";
  if ($("appt-name").value.trim().length < 2) return "Please enter your full name.";
  if (!isValidPhone($("appt-mobile").value.trim())) return "Please enter a valid mobile number.";
  if (!isValidEmail($("appt-email").value.trim())) return "Please enter a valid email address.";
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

function showAppointmentSuccess(){
  apptForm.classList.add("hidden");
  var success = $("appt-success");
  success.classList.remove("hidden");
  var sheet = document.querySelector("#modal-appointment .modal-sheet");
  if (sheet) sheet.scrollTo({ top: 0, behavior: "smooth" });
}

apptForm.addEventListener("submit", function(e){
  e.preventDefault();
  setError(apptError, "");

  /* Honeypot — a bot filled the hidden field. Do nothing visible. */
  if ($("appt-company").value !== ""){ return; }

  var problem = validateAppointment();
  if (problem){ setError(apptError, problem); return; }

  var p = buildAppointmentPayload();
  lastAppointment = p;

  var subject = "New Consultation Appointment — " + p.clientName + " — " + p.appointmentDate;

  var data = {
    _subject: subject,
    _cc: APPOINTMENT_CC,
    _template: "table",
    _captcha: "false",
    _honey: $("appt-company").value,
    "Client Name": p.clientName,
    "Mobile Number": p.mobileNumber,
    "Email Address": p.email,
    "Consultation Type": p.consultationType,
    "Appointment Date": p.appointmentDate,
    "Appointment Time": p.appointmentTime,
    "Reason / Message": p.message || "Not provided",
    "Submitted": p.timestamp,
    "Source": p.source
  };

  if (sendBtn){ sendBtn.disabled = true; sendBtn.textContent = "Sending…"; }

  fetch(APPOINTMENT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(data)
  }).then(function(res){
    if (!res.ok) throw new Error("HTTP " + res.status);
    apptForm.reset();
    showAppointmentSuccess();
    toast("Appointment request sent.");
  }).catch(function(err){
    if (window.console) console.error(err);
    setError(apptError, "Sorry, we could not send your request. Please call the office at 02 7257 1802.");
    toast("Could not send — please call the office.");
  }).finally(function(){
    if (sendBtn){ sendBtn.disabled = false; sendBtn.textContent = "Request Appointment"; }
  });
});

/* ---------------------------------------------------------------
   ADD TO CALENDAR — one clean action.
   Google Calendar opens pre-filled with the appointment, and the
   office is added as a guest (add=) so the booking is tagged to the
   law office inboxes.
   --------------------------------------------------------------- */
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
  var end = new Date(start.getTime() + 60 * 60 * 1000);   /* 1-hour slot */
  return { start: start, end: end };
}

function googleCalendarUrl(p){
  var se = eventStartEnd(p);
  function fmt(d){
    return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) +
      "T" + pad2(d.getHours()) + pad2(d.getMinutes()) + "00";
  }
  var summary = p.consultationType + " — " + OFFICE.formalName + " (" + OFFICE.org + ")";
  var details =
    p.consultationType + " with " + OFFICE.fullName + " — " + OFFICE.org + ".\n\n" +
    "Client: " + p.clientName + "\n" +
    "Mobile: " + p.mobileNumber + "\n" +
    "Email: " + p.email + "\n" +
    (p.message ? "Reason: " + p.message + "\n" : "") +
    "\nOffice: " + OFFICE.address + "\n" +
    "Office landline: 02 7257 1802\n" +
    "Office email: " + OFFICE.email1 + "\n\n" +
    "This appointment is a request and is only confirmed after the law office confirms it.";
  return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent(summary) +
    "&dates=" + fmt(se.start) + "/" + fmt(se.end) +
    "&details=" + encodeURIComponent(details) +
    "&location=" + encodeURIComponent(OFFICE.address) +
    "&add=" + encodeURIComponent(OFFICE.email1 + "," + OFFICE.email2) +
    "&ctz=" + encodeURIComponent(OFFICE.timezone);
}

function addToCalendar(){
  try {
    if (!lastAppointment){ toast("No appointment to add yet."); return; }
    var url = googleCalendarUrl(lastAppointment);
    var w = window.open(url, "_blank");
    if (!w) window.location.href = url;
  } catch(err){
    if (window.console) console.error(err);
    toast("Could not open the calendar — please try again.");
  }
}

/* ---------------------------------------------------------------
   ONE delegated click handler for everything.
   --------------------------------------------------------------- */
document.addEventListener("click", function(e){
  var t = e.target;

  if (t.classList && t.classList.contains("modal")){ closeModal(t); return; }

  var openBtn = t.closest ? t.closest("[data-open]") : null;
  if (openBtn){ openModal(openBtn.getAttribute("data-open")); return; }

  var closeBtn = t.closest ? t.closest("[data-close]") : null;
  if (closeBtn){ closeModal(closeBtn.closest(".modal")); return; }

  if (t.closest && t.closest("#add-calendar")){ addToCalendar(); return; }
});

window.addEventListener("keydown", function(e){
  if (e.key === "Escape"){
    var open = document.querySelector(".modal.open");
    if (open) closeModal(open);
  }
});
