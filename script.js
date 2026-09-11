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

   2) PAYMENT_RECEIPT_ENDPOINT
      Paste the URL of your secure backend / serverless upload endpoint
      for payment receipts, e.g.  "https://yourdomain.com/api/receipt"
      Leave as "" to use the fallback: the visitor's email app opens
      prefilled with the receipt details (they attach the screenshot).

   NEVER put API keys, email passwords or secrets in this file.
   ===================================================================== */

var APPOINTMENT_ENDPOINT = "";
var PAYMENT_RECEIPT_ENDPOINT = "";

/* Office constants — edit here if contact details ever change */
var OFFICE = {
  firstName: "Donnabel",
  lastName: "Tenorio",
  fullName: "Atty. Donnabel C. Tenorio",                 /* FN / display name */
  formalName: "ATTY. DONNABEL C. TENORIO",
  org: "Cristal Tenorio Law Office",
  title: "Lawyer",
  landline: "+63272571802",
  mobiles: ["+639917924302", "+639338124210", "+639338549529"],
  email1: "cristaltenoriolawoffice@yahoo.com",
  email2: "cristaltenoriolawoffice@gmail.com",
  address: "Unit 4 Mezzanine Area, Estrera Building, 789 J.P. Rizal St., Brgy. Poblacion, Makati City, Metro Manila 1208, Philippines",
  addressLines: "Unit 4 Mezzanine Area, Estrera Building\n789 J.P. Rizal St., Brgy. Poblacion\nMakati City, Metro Manila 1208, Philippines"
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
   SAVE CONTACT
   Builds the vCard (CRLF line endings, as the vCard spec requires)
   and hands it to the device in the most "save to contacts" friendly
   way each platform supports. A browser can NEVER silently write to
   the phone's address book — the visitor always taps the final
   confirmation, and the page never claims otherwise.

   - iPhone / iPad (Safari): navigating to a data: vCard URL opens
     the system contact preview, where the visitor taps "Add".
   - Android (Chrome): the .vcf is shared through the Web Share API;
     "Contacts" / "Save to contacts" appears in the share sheet and
     the visitor confirms there.
   - Desktop & other browsers: the .vcf downloads normally and is
     imported via Outlook / Contacts / iCloud as usual.
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

  /* iPhone / iPad — data: vCard opens the iOS contact preview */
  if (isIOS()){
    var uri = "data:text/vcard;charset=utf-8," + encodeURIComponent(vcard);
    window.location.href = uri;
    setTimeout(function(){
      toast("Tap “Add” to save the contact, or Share → Save to Contacts.");
    }, 800);
    return;
  }

  /* Android — try the system share sheet with the .vcf file so the
     Contacts app is available as a handler */
  if (isAndroid() && navigator.share && navigator.canShare){
    var file = new File([vcard], "Attorney_Tenorio.vcf", { type: "text/vcard" });
    if (navigator.canShare({ files: [file] })){
      navigator.share({ files: [file], title: OFFICE.fullName })
        .catch(function(){ /* user cancelled — nothing to do */ });
      return;
    }
  }

  /* Desktop & other browsers — normal download of the .vcf file */
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
function buildChips(containerId, options, selectedClass){
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

var getTimeSlot = buildChips(
  "ctime-grid",
  ["09:00 AM","10:00 AM","11:00 AM","01:00 PM","02:00 PM","03:00 PM","04:00 PM","05:00 PM"]
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
      /* Backend unreachable → graceful email fallback */
      apptForm.reset();
      openAppointmentMailto(payload);
      showAppointmentSuccess("email-fallback");
    }
  } else {
    /* No endpoint configured → email fallback */
    apptForm.reset();
    openAppointmentMailto(payload);
    showAppointmentSuccess("email-fallback");
  }
});

/* ---------------------------------------------------------------
   Add to Calendar (.ics) — shown after a request is submitted.
   The event is saved to the visitor's calendar; the appointment is
   still only CONFIRMED once the law office confirms the request.
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
  var end = new Date(start.getTime() + 60 * 60 * 1000); /* 1-hour slot */

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
   Copy account numbers (payment)
   --------------------------------------------------------------- */
document.querySelectorAll(".copy-btn").forEach(function(btn){
  btn.addEventListener("click", function(){
    var value = btn.getAttribute("data-copy");
    copyText(value)
      .then(function(){
        btn.classList.add("copied");
        var span = btn.querySelector("span");
        if (span) span.textContent = "Copied";
        toast("Account number copied.");
        setTimeout(function(){
          btn.classList.remove("copied");
          if (span) span.textContent = "Copy";
        }, 2200);
      })
      .catch(function(){
        toast("Could not copy — long-press the account number instead.");
      });
  });
});

/* Show the QR area only when at least one real QR image exists */
function checkQrArea(){
  var area = $("qr-area");
  if (!area) return;
  var holders = area.querySelectorAll(".qr-holder");
  var visible = false;
  holders.forEach(function(h){
    if (!h.classList.contains("no-qr")) visible = true;
  });
  if (!visible) area.classList.add("hidden");
}
window.addEventListener("load", checkQrArea);

/* ---------------------------------------------------------------
   Payment receipt form
   --------------------------------------------------------------- */
var receiptForm = $("receipt-form");
var recError = $("rec-error");

function validateReceipt(){
  var name = $("rec-name").value.trim();
  var email = $("rec-email").value.trim();
  var mobile = $("rec-mobile").value.trim();
  var method = $("rec-method").value;
  var ref = $("rec-ref").value.trim();

  if (name.length < 2) return "Please enter your name.";
  if (!isValidEmail(email)) return "Please enter a valid email address.";
  if (!isValidPhone(mobile)) return "Please enter a valid mobile number.";
  if (!method) return "Please select the payment method.";
  if (!$("rec-amount").value.trim()) return "Please enter the amount.";
  if (!ref) return "Please enter the reference number.";
  if (!$("rec-date").value) return "Please enter the date of payment.";
  return "";
}

function openReceiptMailto(){
  var subject = "Payment Receipt — " + $("rec-name").value.trim() + " — " + $("rec-amount").value.trim();
  var body =
    "Payment Receipt Details\n\n" +
    "Name: " + $("rec-name").value.trim() + "\n" +
    "Email: " + $("rec-email").value.trim() + "\n" +
    "Mobile: " + $("rec-mobile").value.trim() + "\n" +
    "Payment Method: " + $("rec-method").value + "\n" +
    "Amount: " + $("rec-amount").value.trim() + "\n" +
    "Reference Number: " + $("rec-ref").value.trim() + "\n" +
    "Date of Payment: " + $("rec-date").value + "\n" +
    "Submitted: " + new Date().toISOString() + "\n" +
    "Source: digital business card (QR/NFC)\n\n" +
    "Note: please attach a screenshot of your payment receipt to this email before sending.";
  var mailto = "mailto:" + OFFICE.email2 +
    "?cc=" + encodeURIComponent(OFFICE.email1) +
    "&subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(body);
  window.location.href = mailto;
}

receiptForm.addEventListener("submit", async function(e){
  e.preventDefault();
  setError(recError, "");

  if ($("rec-company").value !== ""){ /* honeypot */ closeModal($("modal-receipt")); return; }

  var problem = validateReceipt();
  if (problem){ setError(recError, problem); return; }

  if (PAYMENT_RECEIPT_ENDPOINT){
    try {
      var fd = new FormData();
      fd.append("name", $("rec-name").value.trim());
      fd.append("email", $("rec-email").value.trim());
      fd.append("mobile", $("rec-mobile").value.trim());
      fd.append("paymentMethod", $("rec-method").value);
      fd.append("amount", $("rec-amount").value.trim());
      fd.append("referenceNumber", $("rec-ref").value.trim());
      fd.append("dateOfPayment", $("rec-date").value);
      var fileInput = $("rec-file");
      if (fileInput.files.length) fd.append("receiptFile", fileInput.files[0]);
      fd.append("timestamp", new Date().toISOString());
      fd.append("source", "digital business card (QR/NFC)");

      var res = await fetch(PAYMENT_RECEIPT_ENDPOINT, { method: "POST", body: fd });
      if (!res.ok) throw new Error("HTTP " + res.status);
      closeModal($("modal-receipt"));
      receiptForm.reset();
      toast("Receipt sent. Thank you!");
    } catch (err){
      openReceiptMailto();
      closeModal($("modal-receipt"));
      toast("Email app opened — please send the receipt email.");
    }
  } else {
    openReceiptMailto();
    closeModal($("modal-receipt"));
    toast("Email app opened — please send the receipt email.");
  }
});

/* ---------------------------------------------------------------
   Save contact buttons (every element with class js-save)
   --------------------------------------------------------------- */
document.querySelectorAll(".js-save").forEach(function(btn){
  btn.addEventListener("click", saveContact);
});
