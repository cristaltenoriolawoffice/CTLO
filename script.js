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
  t._timer = setTimeout(function(){ t.classList.remove("show"); }, 2800);
}

function localIso(d){
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

/* ---------------------------------------------------------------
   SAVE CONTACT
   A browser is not allowed to silently write to the phone's address
   book, so "Save Contact" opens the phone's own contact-save screen
   with every field pre-filled — the visitor taps the final Add.

   - iPhone / iPad: the vCard opens as a data link; iOS displays the
     contact preview card where the visitor taps "Add" (or Share →
     Save to Contacts). This is the closest thing to a direct save
     that Safari allows.
   - Android (Chrome): the .vcf file is shared through the system
     share sheet, where "Contacts / Save to contacts" appears and
     opens the new-contact screen pre-filled.
   - Desktop: the .vcf downloads and is imported via Outlook /
     Google Contacts / iCloud as usual.
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

function isAndroid(){
  return /Android/.test(navigator.userAgent);
}

function saveContact(){
  var vcard = buildVCard();

  /* iPhone / iPad — data: vCard link opens the iOS contact preview */
  if (isIOS()){
    var uri = "data:text/vcard;charset=utf-8;base64," +
      btoa(unescape(encodeURIComponent(vcard)));
    var a = document.createElement("a");
    a.href = uri;
    a.download = "Attorney_Tenorio.vcf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){
      toast("Your phone is opening the contact — tap “Add” to save it.");
    }, 700);
    return;
  }

  /* Android — system share sheet with the .vcf file */
  if (isAndroid() && navigator.share && navigator.canShare){
    var file = new File([vcard], "Attorney_Tenorio.vcf", { type: "text/vcard" });
    if (navigator.canShare({ files: [file] })){
      navigator.share({ files: [file], title: OFFICE.fullName })
        .catch(function(){ /* user cancelled */ });
      return;
    }
  }

  /* Desktop & other browsers — download the .vcf */
  var blob = new Blob([vcard], { type: "text/vcard" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "Attorney_Tenorio.vcf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); }, 60000);
  toast("Contact file downloaded — open it to add to your contacts.");
}

/* ---------------------------------------------------------------
   Modals
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

document.querySelectorAll("[data-open]").forEach(function(btn){
  btn.addEventListener("click", function(){ openModal(btn.getAttribute("data-open")); });
});

document.querySelectorAll("[data-close]").forEach(function(btn){
  btn.addEventListener("click", function(){ closeModal(btn.closest(".modal")); });
});

document.querySelectorAll(".modal").forEach(function(m){
  m.addEventListener("click", function(e){
    if (e.target === m) closeModal(m);
  });
});

window.addEventListener("keydown", function(e){
  if (e.key === "Escape"){
    var open = document.querySelector(".modal.open");
    if (open) closeModal(open);
  }
});

/* ---------------------------------------------------------------
   Chips (single-select radiogroups)
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
   Appointment form
   --------------------------------------------------------------- */
var today = new Date();
var apptDateInput = $("appt-date");
apptDateInput.min = localIso(today);

var apptForm = $("appointment-form");
var apptError = $("appt-error");
var lastAppointment = null;   /* used by the "Add to Calendar" button */

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

apptForm.addEventListener("submit", async function(e){
  e.preventDefault();
  setError(apptError, "");

  /* Honeypot — a bot fills hidden fields. Pretend success, send nothing. */
  if ($("appt-company").value !== ""){ showAppointmentSuccess("honeypot"); return; }

  var problem = validateAppointment();
  if (problem){ setError(apptError, problem); return; }

  var payload = buildAppointmentPayload();
  lastAppointment = payload;

  if (APPOINTMENT_ENDPOINT){
    try {
      var res = await fetch(APPOINTMENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      apptForm.reset();
      showAppointmentSuccess("backend");
      toast("Appointment request sent.");
    } catch (err){
      apptForm.reset();
      openAppointmentMailto(payload);
      showAppointmentSuccess("email-fallback");
    }
  } else {
    apptForm.reset();
    openAppointmentMailto(payload);
    showAppointmentSuccess("email-fallback");
  }
});

/* ---------------------------------------------------------------
   Add to Calendar (.ics)
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

function icsStamp(d){
  return d.getUTCFullYear() +
    String(d.getUTCMonth() + 1).padStart(2, "0") +
    String(d.getUTCDate()).padStart(2, "0") + "T" +
    String(d.getUTCHours()).padStart(2, "0") +
    String(d.getUTCMinutes()).padStart(2, "0") + "00Z";
}

function buildIcs(p){
  var parts = p.appointmentDate.split("-");
  var tm = parseTime(p.appointmentTime);
  var start = new Date(+parts[0], +parts[1] - 1, +parts[2], tm.h, tm.m, 0);
  var end = new Date(start.getTime() + 60 * 60 * 1000);

  function localStamp(d){
    return d.getFullYear() +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0") + "T" +
      String(d.getHours()).padStart(2, "0") +
      String(d.getMinutes()).padStart(2, "0") + "00";
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
    "DTSTART:" + localStamp(start),
    "DTEND:" + localStamp(end),
    "SUMMARY:" + escapeIcs(summary),
    "DESCRIPTION:" + escapeIcs(description),
    "LOCATION:" + escapeIcs(OFFICE.address),
    "END:VEVENT",
    "END:VCALENDAR"
  ];
  return lines.join("\r\n") + "\r\n";
}

$("add-calendar").addEventListener("click", function(){
  if (!lastAppointment){ toast("No appointment to add yet."); return; }
  var ics = buildIcs(lastAppointment);
  var blob = new Blob([ics], { type: "text/calendar" });
  var url = URL.createObjectURL(blob);

  var file = new File([blob], "appointment.ics", { type: "text/calendar" });
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })){
    navigator.share({ files: [file], title: "Add consultation to calendar" })
      .catch(function(){})
      .finally(function(){ setTimeout(function(){ URL.revokeObjectURL(url); }, 60000); });
    return;
  }

  var a = document.createElement("a");
  a.href = url;
  a.download = "appointment.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast("Calendar file downloaded — open it to add.");
  setTimeout(function(){ URL.revokeObjectURL(url); }, 60000);
});

/* ---------------------------------------------------------------
   Save contact buttons (every element with class js-save)
   --------------------------------------------------------------- */
document.querySelectorAll(".js-save").forEach(function(btn){
  btn.addEventListener("click", saveContact);
});
