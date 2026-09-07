/* =========================================================
   TARA CELEBRATIONS
   CUSTOMER SCRIPT
   MongoDB + Gallery + Booking + Tracking
   WhatsApp + Lightbox + Mobile Menu
   ========================================================= */

"use strict";

/* =========================================================
   CONFIG
   ========================================================= */

/*
   IMPORTANT:
   Put your real Render backend URL here.

   Example:
   const API_BASE_URL = "https://tara-celebrations-api.onrender.com";

   Do NOT add /bookings or /gallery here.
*/
const API_BASE_URL = "https://tara-celebrations-api.onrender.com";

const WHATSAPP_NUMBER = "917981793207";

const DEFAULT_WHATSAPP_MESSAGE =
  "Hello, I'd like to know more about Tara Celebrations.";


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function $(selector, parent) {
  return (parent || document).querySelector(selector);
}

function $$(selector, parent) {
  return Array.from(
    (parent || document).querySelectorAll(selector)
  );
}

function apiUrl(path) {
  return API_BASE_URL.replace(/\/$/, "") + path;
}

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function show(element) {
  if (element) {
    element.hidden = false;
  }
}

function hide(element) {
  if (element) {
    element.hidden = true;
  }
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  var date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function generateTicketId() {
  var number =
    Math.floor(100000 + Math.random() * 900000);

  return "TC-" + number;
}

function whatsappUrl(message) {
  return (
    "https://api.whatsapp.com/send?phone=" +
    WHATSAPP_NUMBER +
    "&text=" +
    encodeURIComponent(message)
  );
}


/* =========================================================
   GLOBAL GALLERY STATE
   ========================================================= */

var galleryItems = [];
var visibleGalleryItems = [];
var currentLightboxIndex = 0;


/* =========================================================
   START
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  removeLogoElements();

  initCurtain();

  initYear();

  initHeader();

  initMobileMenu();

  initSmoothScroll();

  initRevealAnimations();

  initCounters();

  initGallery();

  initLightbox();

  initBookingDate();

  initBooking();

  initTracking();

  initWhatsApp();

  initBackToTop();

});


/* =========================================================
   REMOVE LOGOS
   ========================================================= */

function removeLogoElements() {

  /*
    Your HTML still contains old .js-logo elements.
    We remove them completely so there are no broken
    logo images or giant logo problems.
  */

  $$(".js-logo").forEach(function (image) {
    image.remove();
  });

  $$(".brand-mark").forEach(function (mark) {
    mark.style.display = "none";
  });

}


/* =========================================================
   CURTAIN INTRO
   ========================================================= */

function initCurtain() {

  var curtain = $("#curtainWrap");

  if (!curtain) {
    return;
  }

  setTimeout(function () {

    curtain.classList.add("open");

  }, 500);

  setTimeout(function () {

    curtain.classList.add("hidden");

  }, 2200);

}


/* =========================================================
   YEAR
   ========================================================= */

function initYear() {

  var year = $("#year");

  if (year) {
    year.textContent =
      new Date().getFullYear();
  }

}


/* =========================================================
   HEADER
   ========================================================= */

function initHeader() {

  var header = $("#siteHeader");

  if (!header) {
    return;
  }

  function updateHeader() {

    if (window.scrollY > 40) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }

  }

  updateHeader();

  window.addEventListener(
    "scroll",
    updateHeader,
    { passive: true }
  );

}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function initMobileMenu() {

  var toggle = $("#navToggle");
  var nav = $("#mainNav");

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener("click", function () {

    var open =
      nav.classList.toggle("open");

    toggle.classList.toggle(
      "open",
      open
    );

    toggle.setAttribute(
      "aria-expanded",
      String(open)
    );

  });

  $$(".nav-link", nav).forEach(function (link) {

    link.addEventListener("click", function () {

      nav.classList.remove("open");

      toggle.classList.remove("open");

      toggle.setAttribute(
        "aria-expanded",
        "false"
      );

    });

  });

  document.addEventListener(
    "click",
    function (event) {

      if (!nav.classList.contains("open")) {
        return;
      }

      if (
        nav.contains(event.target) ||
        toggle.contains(event.target)
      ) {
        return;
      }

      nav.classList.remove("open");

      toggle.classList.remove("open");

      toggle.setAttribute(
        "aria-expanded",
        "false"
      );

    }
  );

}


/* =========================================================
   SMOOTH SCROLL
   ========================================================= */

function initSmoothScroll() {

  $$('a[href^="#"]').forEach(function (link) {

    link.addEventListener(
      "click",
      function (event) {

        var href =
          link.getAttribute("href");

        if (!href || href === "#") {
          return;
        }

        var target =
          document.querySelector(href);

        if (!target) {
          return;
        }

        event.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }
    );

  });

}


/* =========================================================
   REVEAL ANIMATIONS
   ========================================================= */

function initRevealAnimations() {

  var elements =
    $$(".reveal-up, .reveal-left, .reveal-right");

  if (!elements.length) {
    return;
  }

  if (
    !("IntersectionObserver" in window)
  ) {

    elements.forEach(function (element) {
      element.classList.add("in");
    });

    return;
  }

  var observer =
    new IntersectionObserver(
      function (entries, obs) {

        entries.forEach(function (entry) {

          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("in");

          obs.unobserve(entry.target);

        });

      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px"
      }
    );

  elements.forEach(function (element) {
    observer.observe(element);
  });

}


/* =========================================================
   COUNTERS
   ========================================================= */

function initCounters() {

  var counters =
    $$(".stat-num[data-count]");

  if (!counters.length) {
    return;
  }

  if (
    !("IntersectionObserver" in window)
  ) {

    counters.forEach(function (counter) {

      var value =
        Number(counter.dataset.count || 0);

      counter.textContent =
        value.toLocaleString("en-IN");

    });

    return;
  }

  var observer =
    new IntersectionObserver(
      function (entries, obs) {

        entries.forEach(function (entry) {

          if (!entry.isIntersecting) {
            return;
          }

          animateCounter(entry.target);

          obs.unobserve(entry.target);

        });

      },
      {
        threshold: 0.4
      }
    );

  counters.forEach(function (counter) {
    observer.observe(counter);
  });

}

function animateCounter(element) {

  var target =
    Number(element.dataset.count || 0);

  if (!Number.isFinite(target)) {
    element.textContent = "0";
    return;
  }

  var duration = 1400;

  var start =
    performance.now();

  function update(time) {

    var progress =
      Math.min(
        (time - start) / duration,
        1
      );

    var eased =
      1 - Math.pow(1 - progress, 3);

    var current =
      Math.floor(target * eased);

    element.textContent =
      current.toLocaleString("en-IN");

    if (progress < 1) {
      requestAnimationFrame(update);
    }

  }

  requestAnimationFrame(update);

}


/* =========================================================
   GALLERY
   ========================================================= */

async function initGallery() {

  var grid = $("#galleryGrid");

  if (!grid) {
    return;
  }

  initGalleryFilters();

  grid.innerHTML =
    '<div style="grid-column:1/-1;text-align:center;padding:50px 20px;color:var(--cream-dim);">Loading gallery...</div>';

  try {

    var response =
      await fetch(
        apiUrl("/gallery")
      );

    var result = {};

    try {
      result = await response.json();
    } catch (error) {
      result = {};
    }

    if (!response.ok) {

      throw new Error(
        result.message ||
        "Gallery request failed."
      );

    }

    /*
      Your admin MongoDB code returns:

      {
        success: true,
        gallery: [...]
      }

      The gallery image field is "img".
    */

    if (
      result &&
      Array.isArray(result.gallery)
    ) {

      galleryItems =
        result.gallery;

    } else if (
      Array.isArray(result)
    ) {

      galleryItems =
        result;

    } else {

      galleryItems = [];

    }

    renderGallery("all");

  } catch (error) {

    console.error(
      "Gallery error:",
      error
    );

    grid.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:50px 20px;color:var(--cream-dim);">Gallery is temporarily unavailable.</div>';

  }

}


/* =========================================================
   GALLERY FILTERS
   ========================================================= */

function initGalleryFilters() {

  $$(".filter-btn").forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          $$(".filter-btn").forEach(
            function (item) {
              item.classList.remove("active");
            }
          );

          button.classList.add("active");

          renderGallery(
            button.dataset.filter || "all"
          );

        }
      );

    }
  );

}


/* =========================================================
   RENDER GALLERY
   ========================================================= */

function renderGallery(filter) {

  var grid =
    $("#galleryGrid");

  if (!grid) {
    return;
  }

  var selected =
    String(filter || "all")
      .toLowerCase();

  if (selected === "all") {

    visibleGalleryItems =
      galleryItems.slice();

  } else {

    visibleGalleryItems =
      galleryItems.filter(
        function (item) {

          var category =
            String(
              item.category ||
              item.type ||
              ""
            ).toLowerCase();

          return category === selected;

        }
      );

  }

  if (!visibleGalleryItems.length) {

    grid.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:50px 20px;color:var(--cream-dim);">No gallery images available.</div>';

    return;
  }

  grid.innerHTML =
    visibleGalleryItems
      .map(function (item, index) {

        var image =
          item.img ||
          item.image ||
          item.imageUrl ||
          item.url ||
          item.src ||
          "";

        var caption =
          item.caption ||
          item.title ||
          item.name ||
          "";

        var category =
          item.category ||
          item.type ||
          "";

        var big =
          index === 0 ||
          item.big === true;

        return (
          '<div class="gallery-item ' +
          (big ? "big" : "") +
          '" ' +
          'data-gallery-index="' +
          index +
          '" ' +
          'data-caption="' +
          escapeHtml(caption) +
          '" ' +
          'data-category="' +
          escapeHtml(category) +
          '">' +

          '<img src="' +
          escapeHtml(image) +
          '" ' +
          'alt="' +
          escapeHtml(caption) +
          '" ' +
          'loading="lazy">' +

          "</div>"
        );

      })
      .join("");

  $$(".gallery-item", grid)
    .forEach(function (item) {

      item.addEventListener(
        "click",
        function () {

          var index =
            Number(
              item.dataset.galleryIndex || 0
            );

          openLightbox(index);

        }
      );

    });

}


/* =========================================================
   LIGHTBOX
   ========================================================= */

function initLightbox() {

  var lightbox =
    $("#lightbox");

  if (!lightbox) {
    return;
  }

  var close =
    $("#lightboxClose");

  var previous =
    $("#lightboxPrev");

  var next =
    $("#lightboxNext");

  if (close) {

    close.addEventListener(
      "click",
      closeLightbox
    );

  }

  if (previous) {

    previous.addEventListener(
      "click",
      function () {
        changeLightbox(-1);
      }
    );

  }

  if (next) {

    next.addEventListener(
      "click",
      function () {
        changeLightbox(1);
      }
    );

  }

  lightbox.addEventListener(
    "click",
    function (event) {

      if (
        event.target === lightbox
      ) {
        closeLightbox();
      }

    }
  );

  document.addEventListener(
    "keydown",
    function (event) {

      if (lightbox.hidden) {
        return;
      }

      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowLeft") {
        changeLightbox(-1);
      }

      if (event.key === "ArrowRight") {
        changeLightbox(1);
      }

    }
  );

}


function openLightbox(index) {

  if (!visibleGalleryItems.length) {
    return;
  }

  currentLightboxIndex =
    Math.max(
      0,
      Math.min(
        index,
        visibleGalleryItems.length - 1
      )
    );

  updateLightbox();

  var lightbox =
    $("#lightbox");

  if (lightbox) {
    lightbox.hidden = false;
  }

  document.body.style.overflow =
    "hidden";

}


function updateLightbox() {

  var item =
    visibleGalleryItems[
      currentLightboxIndex
    ];

  if (!item) {
    return;
  }

  var image =
    $("#lightboxImg");

  var caption =
    $("#lightboxCaption");

  if (!image) {
    return;
  }

  var imageUrl =
    item.img ||
    item.image ||
    item.imageUrl ||
    item.url ||
    item.src ||
    "";

  var text =
    item.caption ||
    item.title ||
    item.name ||
    "";

  image.src = imageUrl;

  image.alt = text;

  if (caption) {
    caption.textContent = text;
  }

}


function changeLightbox(direction) {

  if (!visibleGalleryItems.length) {
    return;
  }

  currentLightboxIndex += direction;

  if (
    currentLightboxIndex < 0
  ) {

    currentLightboxIndex =
      visibleGalleryItems.length - 1;

  }

  if (
    currentLightboxIndex >=
    visibleGalleryItems.length
  ) {

    currentLightboxIndex = 0;

  }

  updateLightbox();

}


function closeLightbox() {

  var lightbox =
    $("#lightbox");

  if (!lightbox) {
    return;
  }

  lightbox.hidden = true;

  document.body.style.overflow = "";

}


/* =========================================================
   BOOKING DATE
   ========================================================= */

function initBookingDate() {

  var dateInput =
    $("#date");

  if (!dateInput) {
    return;
  }

  var now =
    new Date();

  var year =
    now.getFullYear();

  var month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  var day =
    String(
      now.getDate()
    ).padStart(2, "0");

  dateInput.min =
    year + "-" + month + "-" + day;

}


/* =========================================================
   BOOKING
   ========================================================= */

function initBooking() {

  var form =
    $("#bookingForm");

  if (!form) {
    return;
  }

  createTicketId();

  [
    "#fullName",
    "#phone",
    "#email",
    "#occasion",
    "#package",
    "#date",
    "#time",
    "#guests",
    "#notes"
  ].forEach(function (selector) {

    var input =
      $(selector);

    if (!input) {
      return;
    }

    input.addEventListener(
      "input",
      updateTicketPreview
    );

    input.addEventListener(
      "change",
      updateTicketPreview
    );

  });

  form.addEventListener(
    "submit",
    submitBooking
  );

  var another =
    $("#bookAnotherBtn");

  if (another) {

    another.addEventListener(
      "click",
      resetBooking
    );

  }

}


function createTicketId() {

  var preview =
    $("#ticketIdPreview");

  if (!preview) {
    return;
  }

  if (
    !preview.dataset.ticketId
  ) {

    preview.dataset.ticketId =
      generateTicketId();

  }

  preview.textContent =
    preview.dataset.ticketId;

}


function updateTicketPreview() {
  createTicketId();
}


/* =========================================================
   GET BOOKING DATA
   ========================================================= */

function getBookingData() {

  var preview =
    $("#ticketIdPreview");

  var ticketId =
    preview &&
    preview.dataset.ticketId
      ? preview.dataset.ticketId
      : generateTicketId();

  return {

    id: ticketId,

    ticketId: ticketId,

    fullName:
      $("#fullName") ?
        $("#fullName").value.trim() :
        "",

    phone:
      $("#phone") ?
        $("#phone").value.trim() :
        "",

    email:
      $("#email") ?
        $("#email").value.trim() :
        "",

    occasion:
      $("#occasion") ?
        $("#occasion").value :
        "",

    package:
      $("#package") ?
        $("#package").value :
        "",

    date:
      $("#date") ?
        $("#date").value :
        "",

    time:
      $("#time") ?
        $("#time").value :
        "",

    guests:
      $("#guests") ?
        Number($("#guests").value) :
        0,

    notes:
      $("#notes") ?
        $("#notes").value.trim() :
        ""

  };

}


/* =========================================================
   VALIDATE BOOKING
   ========================================================= */

function validateBooking(data) {

  if (!data.fullName) {
    return "Please enter your full name.";
  }

  if (
    !/^[0-9]{10}$/.test(data.phone)
  ) {
    return "Please enter a valid 10-digit mobile number.";
  }

  if (!data.occasion) {
    return "Please choose an occasion.";
  }

  if (!data.package) {
    return "Please choose a package.";
  }

  if (!data.date) {
    return "Please choose a date.";
  }

  if (!data.time) {
    return "Please choose a time slot.";
  }

  if (
    !Number.isInteger(data.guests) ||
    data.guests < 1 ||
    data.guests > 30
  ) {
    return "Number of guests must be between 1 and 30.";
  }

  if (data.email) {

    var emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(data.email)) {
      return "Please enter a valid email address.";
    }

  }

  return "";

}


/* =========================================================
   SUBMIT BOOKING TO MONGODB API
   ========================================================= */

async function submitBooking(event) {

  event.preventDefault();

  var form =
    event.currentTarget;

  var data =
    getBookingData();

  var error =
    validateBooking(data);

  if (error) {

    alert(error);

    return;

  }

  var button =
    $('button[type="submit"]', form);

  var originalText =
    button ?
      button.textContent :
      "Confirm Reservation";

  if (button) {

    button.disabled = true;

    button.textContent =
      "Sending...";

  }

  try {

    /*
      Backend route:

      POST /bookings

      This matches the admin portal's MongoDB API.
    */

    var response =
      await fetch(
        apiUrl("/bookings"),
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(data)
        }
      );

    var result = {};

    try {
      result =
        await response.json();
    } catch (jsonError) {
      result = {};
    }

    if (!response.ok) {

      throw new Error(
        result.message ||
        result.error ||
        "Unable to create booking."
      );

    }

    if (
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "Unable to create booking."
      );

    }

    var booking =
      result.booking ||
      result.data ||
      result;

    var bookingId =
      booking.id ||
      booking.ticketId ||
      booking.reference ||
      data.id;

    booking =
      Object.assign(
        {},
        data,
        booking,
        {
          id: bookingId,
          ticketId: bookingId
        }
      );

    showBookingSuccess(
      booking
    );

  } catch (error) {

    console.error(
      "Booking error:",
      error
    );

    alert(
      error.message ||
      "Unable to submit your booking. Please try again."
    );

  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        originalText;

    }

  }

}


/* =========================================================
   BOOKING SUCCESS
   ========================================================= */

function showBookingSuccess(
  booking
) {

  var form =
    $("#bookingForm");

  var success =
    $("#ticketSuccess");

  if (!form || !success) {
    return;
  }

  hide(form);

  show(success);

  var successId =
    $("#ticketSuccessId");

  if (successId) {

    successId.textContent =
      "Reference: " +
      (
        booking.id ||
        booking.ticketId ||
        "—"
      );

  }

  var successText =
    $("#ticketSuccessText");

  if (successText) {

    successText.textContent =
      "Your " +
      (
        booking.occasion ||
        "celebration"
      ) +
      " request for " +
      formatDate(booking.date) +
      " has been received. We'll confirm within the hour.";

  }

  var whatsapp =
    $("#whatsappConfirmBtn");

  if (whatsapp) {

    whatsapp.href =
      whatsappUrl(
        createBookingWhatsAppMessage(
          booking
        )
      );

  }

}


/* =========================================================
   WHATSAPP BOOKING MESSAGE
   ========================================================= */

function createBookingWhatsAppMessage(
  booking
) {

  return [
    "Hello Tara Celebrations! 🎬",
    "",
    "I have submitted a booking request.",
    "",
    "Reference: " +
      (
        booking.id ||
        booking.ticketId ||
        ""
      ),
    "Name: " +
      (booking.fullName || ""),
    "Phone: " +
      (booking.phone || ""),
    "Occasion: " +
      (booking.occasion || ""),
    "Package: " +
      (booking.package || ""),
    "Date: " +
      formatDate(booking.date),
    "Time: " +
      (booking.time || ""),
    "Guests: " +
      (booking.guests || ""),
    "Notes: " +
      (booking.notes || "None"),
    "",
    "Please confirm my reservation."
  ].join("\n");

}


/* =========================================================
   RESET BOOKING
   ========================================================= */

function resetBooking() {

  var form =
    $("#bookingForm");

  var success =
    $("#ticketSuccess");

  if (!form || !success) {
    return;
  }

  form.reset();

  var preview =
    $("#ticketIdPreview");

  if (preview) {

    preview.dataset.ticketId =
      generateTicketId();

    preview.textContent =
      preview.dataset.ticketId;

  }

  hide(success);

  show(form);

}


/* =========================================================
   TRACKING
   ========================================================= */

function initTracking() {

  var form =
    $("#trackForm");

  if (!form) {
    return;
  }

  form.addEventListener(
    "submit",
    trackBooking
  );

}


/* =========================================================
   TRACK BOOKING
   ========================================================= */

async function trackBooking(event) {

  event.preventDefault();

  var input =
    $("#trackQuery");

  var result =
    $("#trackResult");

  var empty =
    $("#trackEmpty");

  if (!input || !result || !empty) {
    return;
  }

  var query =
    input.value.trim();

  if (!query) {

    alert(
      "Please enter your booking reference or phone number."
    );

    return;

  }

  hide(empty);

  result.innerHTML =
    '<div style="text-align:center;color:var(--cream-dim);">Checking booking...</div>';

  show(result);

  try {

    /*
      Customer tracking endpoint.

      Expected:
      GET /bookings/track?q=TC-123456
    */

    var url =
      apiUrl(
        "/bookings/track?q=" +
        encodeURIComponent(query)
      );

    var response =
      await fetch(url);

    var data = {};

    try {
      data =
        await response.json();
    } catch (jsonError) {
      data = {};
    }

    if (!response.ok) {

      throw new Error(
        data.message ||
        data.error ||
        "Booking not found."
      );

    }

    var booking =
      data.booking ||
      data.data ||
      null;

    if (!booking) {

      hide(result);

      show(empty);

      return;

    }

    renderTrackingResult(
      booking
    );

  } catch (error) {

    console.error(
      "Tracking error:",
      error
    );

    hide(result);

    show(empty);

  }

}


/* =========================================================
   TRACKING RESULT
   ========================================================= */

function renderTrackingResult(
  booking
) {

  var result =
    $("#trackResult");

  if (!result) {
    return;
  }

  var reference =
    booking.id ||
    booking.ticketId ||
    booking.reference ||
    "—";

  var status =
    booking.status ||
    "Pending";

  var statusClass =
    String(status)
      .trim()
      .replace(/\s+/g, "-");

  result.innerHTML =

    '<div class="track-result-head">' +

      "<h3>" +
        "Reservation " +
        escapeHtml(reference) +
      "</h3>" +

      '<span class="status-badge st-' +
        escapeHtml(statusClass) +
      '">' +
        escapeHtml(status) +
      "</span>" +

    "</div>" +

    '<dl class="track-dl">' +

      "<dt>Name</dt>" +
      "<dd>" +
        escapeHtml(
          booking.fullName ||
          booking.name ||
          "—"
        ) +
      "</dd>" +

      "<dt>Occasion</dt>" +
      "<dd>" +
        escapeHtml(
          booking.occasion ||
          "—"
        ) +
      "</dd>" +

      "<dt>Package</dt>" +
      "<dd>" +
        escapeHtml(
          booking.package ||
          "—"
        ) +
      "</dd>" +

      "<dt>Date</dt>" +
      "<dd>" +
        escapeHtml(
          formatDate(
            booking.date
          )
        ) +
      "</dd>" +

      "<dt>Time</dt>" +
      "<dd>" +
        escapeHtml(
          booking.time ||
          "—"
        ) +
      "</dd>" +

      "<dt>Guests</dt>" +
      "<dd>" +
        escapeHtml(
          booking.guests ||
          "—"
        ) +
      "</dd>" +

      "<dt>Notes</dt>" +
      "<dd>" +
        escapeHtml(
          booking.notes ||
          "—"
        ) +
      "</dd>" +

    "</dl>";

  show(result);

}


/* =========================================================
   WHATSAPP
   ========================================================= */

function initWhatsApp() {

  var links =
    $$(
      'a[href*="whatsapp"], a[href*="wa.me"]'
    );

  links.forEach(function (link) {

    /*
      Keep all existing WhatsApp links working,
      but replace the floating button with the
      correct default message.
    */

  });

  var floating =
    $(".whatsapp-float");

  if (floating) {

    floating.href =
      whatsappUrl(
        DEFAULT_WHATSAPP_MESSAGE
      );

  }

}


/* =========================================================
   BACK TO TOP
   ========================================================= */

function initBackToTop() {

  var button =
    $("#toTop");

  if (!button) {
    return;
  }

  function update() {

    if (window.scrollY > 500) {

      button.classList.add(
        "visible"
      );

    } else {

      button.classList.remove(
        "visible"
      );

    }

  }

  update();

  window.addEventListener(
    "scroll",
    update,
    { passive: true }
  );

  button.addEventListener(
    "click",
    function () {

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }
  );

}