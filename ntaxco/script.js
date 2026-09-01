/* ===========================================================
   nTAXco — front-end demo logic
   Email + Mobile OTP login supported.
   Trial OTP: 123456
   Includes: full Agent Portal (agents land straight on their
   dashboard after login — enrollment is now an optional
   "Enroll as New Agent" action from the dashboard, not a login
   gate) -> admin approval -> dashboard with client filing
   submission, submissions tracker, leads, commission / cash-flow
   proof uploads with admin approval, profile — and the Super
   Admin agent-management screen.
   =========================================================== */

(function () {
  "use strict";

  const TRIAL_OTP = "123456";

  const state = {
    role: "customer",
    loginMethod: "mobile",   // "mobile" | "email"
    mobile: "",
    email: "",
    otp: "",
    otpSentAt: null,
    resendSeconds: 30,
    user: null,
    backendAvailable: null,
    applications: [],
    enquiries: [],
    pendingFiles: [],
    activeApply: null,
    customerPage: "home",
    attendance: [],
    attendanceClock: null,

    // ---- agent portal state ----
    agents: [],              // enrollment records
    agentFilings: [],        // client filings submitted by agents
    agentPendingFiles: [],   // staged files for the "submit filing" form
    commissionClaims: [],    // cash-flow / commission upload claims
    commissionPendingFile: null, // staged file for a claim being drafted
    currentAgent: null,      // the logged-in agent's enrollment record (if any)
    agentSubFilter: "all",   // filter chip for "My Submissions"
    enrollFromDashboard: false, // was the enroll form opened from inside the dashboard?
  };

  const CUSTOMER_PAGE_SECTIONS = {
    about: ["about"],
    services: ["services", "my-applications"],
    offers: ["offers"],
    contact: ["contact"],
  };

  const SERVICE_DOCS = {
    "GST Registration & Returns": ["PAN card", "Aadhaar card", "Business address proof", "Bank statement / cancelled cheque", "Passport-size photo"],
    "GST Audits, Refunds & Notices": ["GSTIN certificate", "Last 12 months' GST returns", "Notice copy (if any)", "Bank statement"],
    "Income Tax Returns": ["PAN card", "Form 16 / salary slips", "Bank statement", "Investment proofs (80C, 80D, etc.)"],
    "Refunds & Tax Planning": ["PAN card", "Previous year's ITR copy", "Form 26AS / AIS", "Investment details"],
    "Company & LLP Registration": ["Directors'/Partners' PAN & Aadhaar", "Registered office address proof", "Passport-size photos", "Digital Signature Certificate (if you have one)"],
    "Licenses & Statutory Registrations": ["PAN card", "Business address proof", "Partnership deed / MOA (if applicable)", "Photo ID of applicant"],
    "Bookkeeping & Tally": ["Sales & purchase invoices", "Bank statements", "Expense receipts", "Previous year's books (if any)"],
    "Payroll Management": ["Employee list with salary structure", "PF / ESI registration details", "Attendance records", "Bank details for salary transfer"],
    "Digital Signature & Certifications": ["PAN card", "Aadhaar card", "Passport-size photo", "Active email & mobile number for verification"],
  };

  const ROLE_LABEL = {
    customer: "Customer",
    employee: "Employee",
    agent: "Agent",
    superadmin: "Super Admin",
  };

  const ROLE_REDIRECT = {
    customer: "app",
    employee: "dashboard",
    agent: "dashboard",
    superadmin: "dashboard",
  };

  const DASH_NAV = {
    employee: [
      ["Overview", true, "overview"], ["Assigned Clients", false, "customers"], ["Tasks", false, "filings"],
      ["Filings", false, "filings"], ["Attendance", false, "attendance"], ["Messages", false, "messages"],
    ],
    agent: [
      ["Overview", true, "overview"], ["Submit Filing", false, "agent-submit"], ["My Submissions", false, "agent-submissions"],
      ["My Leads", false, "leads"], ["Commission", false, "commission"], ["Profile", false, "agent-profile"],
    ],
    superadmin: [
      ["Overview", true, "overview"], ["All Customers", false, "customers"], ["Employees", false, "employees"],
      ["Attendance", false, "attendance"], ["Agents", false, "agents"], ["Filings Queue", false, "filings"],
      ["Reports", false, "reports"], ["Settings", false, "settings"],
    ],
  };

  const AGENTS_STORAGE_KEY = "ntaxco_agents_v1";
  const AGENT_FILINGS_STORAGE_KEY = "ntaxco_agent_filings_v1";
  const COMMISSION_CLAIMS_STORAGE_KEY = "ntaxco_commission_claims_v1";
  const ATTENDANCE_STORAGE_KEY = "ntaxco_attendance_v1";
  const LATE_AFTER_HOUR = 9;
  const LATE_AFTER_MINUTE = 30;
  const HALF_DAY_HOURS = 4;

  const AGENT_SERVICES = [
    { value: "GST Registration & Returns", cat: "gst" },
    { value: "GST Audits, Refunds & Notices", cat: "gst" },
    { value: "Income Tax Returns", cat: "tax" },
    { value: "Refunds & Tax Planning", cat: "tax" },
    { value: "Company & LLP Registration", cat: "reg" },
    { value: "Licenses & Statutory Registrations", cat: "reg" },
    { value: "Bookkeeping & Tally", cat: "acc" },
    { value: "Payroll Management", cat: "acc" },
    { value: "Digital Signature & Certifications", cat: "other" },
  ];

  const EMPLOYEE_ROSTER = [
    { name: "Priya Sharma", role: "Senior Tax Consultant", clients: 42, status: "Active", mobile: "9876543210" },
    { name: "Ravi Kumar", role: "GST Specialist", clients: 31, status: "Active", mobile: "9876543211" },
    { name: "Ananya Rao", role: "Accounts Executive", clients: 27, status: "Active", mobile: "9876543212" },
    { name: "Vikram Singh", role: "Compliance Officer", clients: 19, status: "On leave", mobile: "9876543213" },
    { name: "Meera Iyer", role: "Junior Consultant", clients: 24, status: "Active", mobile: "9876543214" },
  ];

  const DASH_STATS = {
    employee: [
      ["Assigned clients", "38", "+3 this week"],
      ["Filings due (7 days)", "12", "4 GST · 8 ITR"],
      ["Completed this month", "54", "+12% vs last month"],
      ["Open queries", "6", "2 awaiting docs"],
    ],
    agent: [], // computed live — see computeAgentStats()
    superadmin: [
      ["Total customers", "1,240", "+42 this month"],
      ["Employees", "16", "3 on leave"],
      ["Active agents", "27", "+2 this month"],
      ["Filings this month", "312", "GST + ITR combined"],
    ],
  };

  const DASH_ROWS = {
    employee: [
      ["Entrivity Media", "GST Returns — July", "Pending"],
      ["Vasudhaara Enterprises LLP", "ITR — FY 25-26", "Review"],
      ["Sreenivasa Motors", "GSTR-9C", "Done"],
      ["Aryan Enterprises", "TDS Reconciliation", "Pending"],
    ],
    agent: [], // computed live from state.agentFilings
    superadmin: [
      ["Nagesh Constructions", "GST Half Yearly Plan", "Pending"],
      ["Lalitha Jewelry", "ITR + GST Combo", "Done"],
      ["Ananatpur Publications", "New Registration", "Review"],
      ["0I0 Resource Pvt Ltd", "MCA Filing", "Pending"],
    ],
  };

  /* ---------- helpers ---------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  function showToast(msg) {
    const t = $("#toast");
    t.querySelector(".msg").textContent = msg;
    t.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => t.classList.remove("show"), 3200);
  }

  function initials(str) {
    return (str || "")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function fmtMoney(n) {
    const num = Number(n) || 0;
    return "₹" + num.toLocaleString("en-IN");
  }

  function nowStamp() {
    return new Date().toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
  }

  /* ---------- OTP hooks ---------- */
  async function sendOtp(identifier, method) {
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, method }),
      });
      if (res.ok) {
        state.backendAvailable = true;
        return { ok: true, demo: false };
      }
      throw new Error("backend responded with " + res.status);
    } catch (err) {
      state.backendAvailable = false;
      return { ok: true, demo: true, code: TRIAL_OTP };
    }
  }

  async function verifyOtp(identifier, code, method) {
    if (state.backendAvailable) {
      try {
        const res = await fetch("/api/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, code, method }),
        });
        return { ok: res.ok };
      } catch (err) {
        return { ok: false };
      }
    }
    return { ok: code === TRIAL_OTP };
  }

  /* ---------- role tabs ---------- */
  function initRoleTabs() {
    $$(".role-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".role-tab").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.role = btn.dataset.role;
        $("#roleName").textContent = ROLE_LABEL[state.role];
        $("#roleNameEmail").textContent = ROLE_LABEL[state.role];
      });
    });
  }

  /* ---------- method toggle (Mobile / Email) ---------- */
  function initMethodTabs() {
    $$(".method-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".method-tab").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.loginMethod = btn.dataset.method;

        const isMobile = state.loginMethod === "mobile";
        $("#mobileField").classList.toggle("hidden", !isMobile);
        $("#emailField").classList.toggle("hidden", isMobile);

        $("#mobileInput").value = "";
        $("#emailInput").value = "";
        $("#sendOtpBtn").disabled = true;
      });
    });
  }

  /* ---------- step 1: mobile or email -> send OTP ---------- */
  function initMobileStep() {
    const mobileInput = $("#mobileInput");
    const emailInput = $("#emailInput");
    const sendBtn = $("#sendOtpBtn");
    const sendingRow = $("#otpSendingRow");

    mobileInput.addEventListener("input", () => {
      mobileInput.value = mobileInput.value.replace(/\D/g, "").slice(0, 10);
      if (state.loginMethod === "mobile") {
        sendBtn.disabled = mobileInput.value.length !== 10;
      }
    });

    emailInput.addEventListener("input", () => {
      if (state.loginMethod === "email") {
        const val = emailInput.value.trim();
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        sendBtn.disabled = !valid;
      }
    });

    sendBtn.addEventListener("click", async () => {
      const isMobile = state.loginMethod === "mobile";
      let identifier = "";

      if (isMobile) {
        if (mobileInput.value.length !== 10) return;
        identifier = mobileInput.value;
        state.mobile = identifier;
        state.email = "";
      } else {
        identifier = emailInput.value.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) return;
        state.email = identifier;
        state.mobile = "";
      }

      sendBtn.disabled = true;
      sendingRow.classList.remove("hidden");

      const result = await sendOtp(identifier, state.loginMethod);

      sendingRow.classList.add("hidden");
      sendBtn.disabled = false;

      if (result.demo) {
        state.otp = result.code;
        $("#demoOtpValue").textContent = state.otp;
      } else {
        state.otp = "";
        $("#demoOtpValue").textContent = "sent";
      }
      state.otpSentAt = Date.now();

      $("#step-mobile").classList.add("hidden");
      $("#step-otp").classList.remove("hidden");

      if (isMobile) {
        $("#otpTargetDisplay").textContent = "+91 " + state.mobile;
      } else {
        $("#otpTargetDisplay").textContent = state.email;
      }

      const boxes = $$(".otp-box");
      boxes.forEach((b) => (b.value = ""));
      boxes[0].focus();

      startResendTimer();
      showToast(isMobile ? `OTP sent to +91 ${state.mobile}` : `OTP sent to ${state.email}`);
    });
  }

  /* ---------- OTP boxes ---------- */
  function initOtpBoxes() {
    const boxes = $$(".otp-box");
    boxes.forEach((box, i) => {
      box.addEventListener("input", () => {
        box.value = box.value.replace(/\D/g, "").slice(0, 1);
        if (box.value && boxes[i + 1]) boxes[i + 1].focus();
        checkOtpComplete();
      });
      box.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !box.value && boxes[i - 1]) {
          boxes[i - 1].focus();
        }
      });
      box.addEventListener("paste", (e) => {
        e.preventDefault();
        const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
        text.split("").forEach((ch, idx) => {
          if (boxes[idx]) boxes[idx].value = ch;
        });
        checkOtpComplete();
      });
    });
  }

  function checkOtpComplete() {
    const val = $$(".otp-box").map((b) => b.value).join("");
    $("#verifyBtn").disabled = val.length !== 6;
    return val;
  }

  function startResendTimer() {
    let seconds = 30;
    const resendBtn = $("#resendBtn");
    resendBtn.disabled = true;
    clearInterval(startResendTimer._i);
    startResendTimer._i = setInterval(() => {
      seconds -= 1;
      resendBtn.textContent = seconds > 0 ? `Resend OTP (${seconds}s)` : "Resend OTP";
      if (seconds <= 0) {
        clearInterval(startResendTimer._i);
        resendBtn.disabled = false;
      }
    }, 1000);
  }

  function initOtpActions() {
    $("#resendBtn").addEventListener("click", async () => {
      $("#resendBtn").disabled = true;
      const identifier = state.loginMethod === "mobile" ? state.mobile : state.email;
      const result = await sendOtp(identifier, state.loginMethod);
      if (result.demo) {
        state.otp = result.code;
        $("#demoOtpValue").textContent = state.otp;
      } else {
        $("#demoOtpValue").textContent = "sent";
      }
      startResendTimer();
      showToast(
        state.loginMethod === "mobile"
          ? `New OTP sent to +91 ${state.mobile}`
          : `New OTP sent to ${state.email}`
      );
    });

    $("#changeNumberBtn").addEventListener("click", () => {
      $("#step-otp").classList.add("hidden");
      $("#step-mobile").classList.remove("hidden");
      if (state.loginMethod === "mobile") {
        $("#mobileInput").focus();
      } else {
        $("#emailInput").focus();
      }
    });

    $("#verifyBtn").addEventListener("click", async () => {
      const entered = checkOtpComplete();
      if (entered.length !== 6) return;

      const btn = $("#verifyBtn");
      btn.disabled = true;
      const originalLabel = btn.textContent;
      btn.textContent = "Verifying…";

      const identifier = state.loginMethod === "mobile" ? state.mobile : state.email;
      const result = await verifyOtp(identifier, entered, state.loginMethod);

      btn.textContent = originalLabel;

      if (!result.ok) {
        btn.disabled = false;
        $("#otpError").textContent = state.backendAvailable
          ? "That code doesn't match. Check the code and try again."
          : `That code doesn't match. In trial mode, enter ${TRIAL_OTP} to sign in.`;
        $("#otpError").classList.remove("hidden");
        const row = $("#otpRow");
        row.classList.add("shake");
        setTimeout(() => row.classList.remove("shake"), 400);
        return;
      }
      $("#otpError").classList.add("hidden");
      loginSuccess();
    });
  }

  /* ---------- login success ---------- */
  function loginSuccess() {
    const rosterMatch = EMPLOYEE_ROSTER.find((e) => e.mobile === state.mobile);
    state.user = {
      mobile: state.mobile || "",
      email: state.email || "",
      role: state.role,
      name:
        state.role === "customer"
          ? "Guest Customer"
          : rosterMatch
            ? rosterMatch.name
            : ROLE_LABEL[state.role],
      loginTime: new Date().toLocaleString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      }),
    };

    $("#view-login").classList.add("hidden");

    if (state.role === "agent") {
      routeAgentAfterLogin();
      showToast(`Welcome! Logged in as ${ROLE_LABEL[state.role]}`);
      return;
    }

    if (ROLE_REDIRECT[state.role] === "app") {
      renderApp();
    } else {
      renderDashboard();
    }
    showToast(`Welcome! Logged in as ${ROLE_LABEL[state.role]}`);
  }

  /* ---------- customer landing app ---------- */
  function renderApp() {
    const view = $("#view-app");
    view.style.display = "block";
    view.classList.remove("hidden");

    // Show mobile or email
    if (state.user.mobile) {
      $("#custMobile").textContent = "+91 " + state.user.mobile;
    } else if (state.user.email) {
      $("#custMobile").textContent = state.user.email;
    } else {
      $("#custMobile").textContent = "—";
    }

    $("#custAvatar").textContent = "GC";
    $("#custLoginTime").textContent = state.user.loginTime;
    switchCustomerPage("home");
    animateCounters();
    renderMyApplications();
  }

  function switchCustomerPage(page) {
    if (!page) page = "home";
    state.customerPage = page;

    const view = $("#view-app");
    if (!view) return;

    const homeOnly = $$("#view-app [data-cust-home-only]");
    const pageSections = $$("#view-app section[id]");

    $$("[data-cust-nav]").forEach((a) => {
      a.classList.toggle("active", a.dataset.custNav === page);
    });

    if (page === "home") {
      view.classList.remove("cust-single-page");
      homeOnly.forEach((el) => el.classList.remove("hidden"));
      pageSections.forEach((el) => el.classList.remove("hidden"));
      window.scrollTo(0, 0);
    } else {
      view.classList.add("cust-single-page");
      homeOnly.forEach((el) => el.classList.add("hidden"));
      const showIds = CUSTOMER_PAGE_SECTIONS[page] || [page];
      pageSections.forEach((el) => {
        el.classList.toggle("hidden", !showIds.includes(el.id));
      });
      window.scrollTo(0, 0);
    }

    initScrollReveal();
  }

  function initCustomerNav() {
    $$("[data-cust-nav]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        switchCustomerPage(a.dataset.custNav);
        const nav = $("#mainNav");
        if (nav) {
          nav.classList.remove("open-mobile");
          nav.style.display = "";
        }
      });
    });

    $$('#view-app a[href^="#"]').forEach((a) => {
      if (a.dataset.custNav) return;
      a.addEventListener("click", (e) => {
        const hash = (a.getAttribute("href") || "").slice(1);
        if (!hash || hash === "home") return;
        if (Object.prototype.hasOwnProperty.call(CUSTOMER_PAGE_SECTIONS, hash)) {
          e.preventDefault();
          switchCustomerPage(hash);
        } else if (hash === "my-applications") {
          e.preventDefault();
          switchCustomerPage("services");
          requestAnimationFrame(() => {
            $("#my-applications")?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }
      });
    });
  }

  /* =========================================================
     AGENT PORTAL — persistence
  ========================================================== */
  function loadAgents() {
    try {
      const raw = localStorage.getItem(AGENTS_STORAGE_KEY);
      state.agents = raw ? JSON.parse(raw) : [];
    } catch (err) {
      state.agents = [];
    }
  }
  function saveAgents() {
    try { localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(state.agents)); } catch (err) {}
  }

  function loadAgentFilings() {
    try {
      const raw = localStorage.getItem(AGENT_FILINGS_STORAGE_KEY);
      state.agentFilings = raw ? JSON.parse(raw) : [];
    } catch (err) {
      state.agentFilings = [];
    }
  }
  function saveAgentFilings() {
    try { localStorage.setItem(AGENT_FILINGS_STORAGE_KEY, JSON.stringify(state.agentFilings)); } catch (err) {}
  }

  function loadCommissionClaims() {
    try {
      const raw = localStorage.getItem(COMMISSION_CLAIMS_STORAGE_KEY);
      state.commissionClaims = raw ? JSON.parse(raw) : [];
    } catch (err) {
      state.commissionClaims = [];
    }
  }
  function saveCommissionClaims() {
    try { localStorage.setItem(COMMISSION_CLAIMS_STORAGE_KEY, JSON.stringify(state.commissionClaims)); } catch (err) {}
  }

  function agentIdentifier() {
    return (state.user && (state.user.mobile || state.user.email)) || state.mobile || state.email || "";
  }

  function findAgentRecord() {
    const id = agentIdentifier();
    if (!id) return null;
    return state.agents.find((a) => a.mobile === id || a.email === id) || null;
  }

  /* ---------- routing after an agent logs in ----------
     Agents now land straight on their dashboard, exactly like
     Employee / Super Admin. Enrollment is no longer a login
     gate — it's an optional action surfaced inside the
     dashboard (see renderAgentEnrollBanner). */
  function routeAgentAfterLogin() {
    const rec = findAgentRecord();
    state.currentAgent = rec;
    renderDashboard();
  }

  function showAgentEnrollView() {
    $("#view-agent-enroll").classList.remove("hidden");
    $("#ae-mobile").value = state.user.mobile ? ("+91 " + state.user.mobile) : (state.user.email || "");
    $("#ae-email").value = state.user.email || "";
  }

  function hideAgentEnrollView() {
    $("#view-agent-enroll").classList.add("hidden");
  }

  function showAgentStatusView(rec) {
    $("#view-agent-status").classList.remove("hidden");
    const icon = $("#agentStatusIcon");
    const title = $("#agentStatusTitle");
    const msg = $("#agentStatusMsg");
    const meta = $("#agentStatusMeta");
    const actions = $("#agentStatusActions");

    if (rec.status === "Pending") {
      icon.className = "status-icon pending";
      icon.textContent = "⏳";
      title.textContent = "Enrollment under review";
      msg.textContent = "Your agent profile has been submitted. Our admin team will verify and activate your account within 24–48 hours.";
      actions.innerHTML = `<button type="button" class="btn btn-outline js-logout">Sign out</button>`;
    } else {
      icon.className = "status-icon rejected";
      icon.textContent = "✕";
      title.textContent = "Enrollment not approved";
      msg.textContent = rec.reviewNote
        ? "Our admin team reviewed your application and it wasn't approved this time."
        : "Our admin team reviewed your application and it wasn't approved this time. You're welcome to re-apply with updated details.";
      actions.innerHTML = `
        <button type="button" class="btn btn-primary" id="agentReapplyBtn">Re-apply</button>
        <button type="button" class="btn btn-outline js-logout">Sign out</button>`;
    }

    meta.innerHTML = `
      <div>Applied as: <b>${escapeHtml(rec.name)}</b></div>
      <div>Contact: <b>${rec.mobile ? "+91 " + rec.mobile : rec.email}</b></div>
      <div>Submitted: <b>${rec.appliedAt}</b></div>
      ${rec.reviewNote ? `<div>Admin note: <b>${escapeHtml(rec.reviewNote)}</b></div>` : ""}
    `;

    const reapplyBtn = $("#agentReapplyBtn");
    if (reapplyBtn) {
      reapplyBtn.addEventListener("click", () => {
        state.agents = state.agents.filter((a) => a.id !== rec.id);
        saveAgents();
        hideAgentStatusView();
        showAgentEnrollView();
      });
    }
  }

  function hideAgentStatusView() {
    $("#view-agent-status").classList.add("hidden");
  }

  /* ---------- open/close the enrollment form as a dashboard overlay ---------- */
  function openAgentEnrollFromDashboard() {
    state.enrollFromDashboard = true;
    $("#view-dashboard").classList.add("hidden");
    $("#view-agent-enroll").classList.remove("hidden");
    $("#ae-mobile").value = state.user.mobile ? ("+91 " + state.user.mobile) : (state.user.email || "");
    $("#ae-email").value = state.user.email || "";
    if (state.currentAgent) {
      $("#ae-name").value = state.currentAgent.name || "";
      $("#ae-city").value = state.currentAgent.city || "";
      $("#ae-pan").value = state.currentAgent.pan || "";
      $("#ae-firm").value = state.currentAgent.firm || "";
    }
  }

  function closeAgentEnrollBackToDashboard() {
    $("#view-agent-enroll").classList.add("hidden");
    $("#view-dashboard").classList.remove("hidden");
    state.enrollFromDashboard = false;
    renderDashboard();
  }

  function initAgentEnrollForm() {
    const form = $("#agentEnrollForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const rec = {
        id: "AGT-" + Date.now().toString(36).toUpperCase(),
        name: $("#ae-name").value.trim(),
        mobile: state.user ? state.user.mobile : state.mobile,
        email: ($("#ae-email").value.trim() || (state.user ? state.user.email : state.email)).toLowerCase(),
        city: $("#ae-city").value.trim(),
        pan: $("#ae-pan").value.trim().toUpperCase(),
        firm: $("#ae-firm").value.trim(),
        status: "Pending",
        appliedAt: nowStamp(),
        reviewedAt: null,
        reviewNote: "",
      };
      // replace any prior record for this same agent (fresh submission / re-apply)
      state.agents = state.agents.filter((a) => !(a.mobile === rec.mobile && a.email === rec.email));
      state.agents.unshift(rec);
      saveAgents();
      state.currentAgent = rec;

      form.reset();
      showToast("Enrollment submitted — our admin team will review it shortly.");

      if (state.enrollFromDashboard) {
        closeAgentEnrollBackToDashboard();
      } else {
        hideAgentEnrollView();
        showAgentStatusView(rec);
      }
    });
  }

  function initAgentEnrollBackBtn() {
    const btn = $("#agentEnrollBackBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (state.enrollFromDashboard) {
        closeAgentEnrollBackToDashboard();
      } else {
        doLogout();
      }
    });
  }

  /* ---------- dashboard banner: enroll / pending / rejected ---------- */
  function renderAgentEnrollBanner() {
    let panel = $("#agentEnrollBanner");
    const overview = $("#dashView-overview");

    if (state.role !== "agent") {
      if (panel) panel.remove();
      return;
    }
    if (!overview) return;

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "agentEnrollBanner";
      panel.className = "dash-panel att-overview-panel";
      const livePanel = $("#liveAppsPanel");
      if (livePanel) overview.insertBefore(panel, livePanel);
      else overview.prepend(panel);
    }

    const rec = state.currentAgent;

    if (!rec) {
      panel.innerHTML = `
        <div class="att-overview-grid">
          <div>
            <div class="dash-panel-head" style="margin-bottom:0;"><h3>Become an approved agent</h3></div>
            <p>You're browsing your dashboard as a guest agent. Enroll to submit client filings and start earning commission.</p>
          </div>
          <div class="att-overview-actions">
            <button type="button" class="btn btn-primary btn-sm" id="agentEnrollBtn">Enroll as New Agent</button>
          </div>
        </div>`;
    } else if (rec.status === "Pending") {
      panel.innerHTML = `
        <div class="att-overview-grid">
          <div>
            <div class="dash-panel-head" style="margin-bottom:0;"><h3>Enrollment under review</h3></div>
            <p>Submitted on ${rec.appliedAt}. Our admin team will verify within 24–48 hours — feel free to browse the dashboard meanwhile.</p>
          </div>
          <div class="att-overview-actions"><span class="status-pill pending">Pending approval</span></div>
        </div>`;
    } else if (rec.status === "Rejected") {
      panel.innerHTML = `
        <div class="att-overview-grid">
          <div>
            <div class="dash-panel-head" style="margin-bottom:0;"><h3>Enrollment not approved</h3></div>
            <p>${rec.reviewNote ? escapeHtml(rec.reviewNote) : "You're welcome to re-apply with updated details."}</p>
          </div>
          <div class="att-overview-actions">
            <span class="status-pill review">Rejected</span>
            <button type="button" class="btn btn-outline btn-sm" id="agentEnrollBtn">Re-apply</button>
          </div>
        </div>`;
    } else {
      // Approved — nothing to prompt, remove the banner entirely
      panel.remove();
      return;
    }

    $("#agentEnrollBtn", panel)?.addEventListener("click", openAgentEnrollFromDashboard);
  }

  function isApprovedAgent() {
    return !!(state.currentAgent && state.currentAgent.status === "Approved");
  }

  function renderEnrollRequiredPanel(hostEl, message) {
    hostEl.innerHTML = `
      <div class="dash-panel" style="text-align:center;">
        <h3>Enrollment required</h3>
        <p class="dash-panel-sub">${message}</p>
        <button type="button" class="btn btn-primary" id="enrollRequiredBtn">Enroll as New Agent</button>
      </div>`;
    $("#enrollRequiredBtn", hostEl)?.addEventListener("click", openAgentEnrollFromDashboard);
  }

  /* =========================================================
     AGENT PORTAL — stats helpers
  ========================================================== */
  function myAgentFilings() {
    const id = agentIdentifier();
    return state.agentFilings.filter((f) => f.agentMobile === id || f.agentEmail === id);
  }
  function myCommissionClaims() {
    const id = agentIdentifier();
    return state.commissionClaims.filter((c) => c.agentMobile === id || c.agentEmail === id);
  }

  function computeAgentStats() {
    const mine = myAgentFilings();
    const converted = mine.filter((f) => f.status === "Done").length;
    const active = mine.length - converted;
    const claims = myCommissionClaims();
    const approvedTotal = claims.filter((c) => c.status === "Approved").reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const pendingTotal = claims.filter((c) => c.status === "Pending").reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const closeRate = mine.length ? Math.round((converted / mine.length) * 100) : 0;

    return [
      ["Active referrals", String(active), `${mine.length} total this session`],
      ["Conversions", String(converted), `${closeRate}% close rate`],
      ["Commission approved", fmtMoney(approvedTotal), "Paid out"],
      ["Commission pending", fmtMoney(pendingTotal), "Awaiting admin review"],
    ];
  }

  function computeAgentRows() {
    return myAgentFilings()
      .slice(0, 6)
      .map((f) => [f.clientName || "—", f.service, f.status]);
  }

  /* ---------- staff dashboard ---------- */
  function renderDashboard() {
    const view = $("#view-dashboard");
    view.style.display = "block";
    view.classList.remove("hidden");

    const role = state.role;
    $("#dashRolePill").textContent = ROLE_LABEL[role];

    const displayName = role === "agent" && state.currentAgent ? state.currentAgent.name : state.user.name;
    $("#dashWelcome").textContent = `Welcome back, ${displayName}`;

    if (state.user.mobile) {
      $("#dashSub").textContent = `+91 ${state.user.mobile} · Logged in ${state.user.loginTime}`;
    } else if (state.user.email) {
      $("#dashSub").textContent = `${state.user.email} · Logged in ${state.user.loginTime}`;
    } else {
      $("#dashSub").textContent = `Logged in ${state.user.loginTime}`;
    }

    $("#dashAvatar").textContent = initials(displayName);

    const nav = $("#dashNav");
    nav.innerHTML = "";
    (DASH_NAV[role] || []).forEach(([label, active, view]) => {
      const a = document.createElement("a");
      a.href = "#";
      a.className = active ? "active" : "";
      a.dataset.view = view;
      a.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/></svg>${label}`;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        $$("#dashNav a").forEach((el) => el.classList.remove("active"));
        a.classList.add("active");
        switchDashView(view);
      });
      nav.appendChild(a);
    });

    const cardsWrap = $("#dashCards");
    cardsWrap.innerHTML = "";
    const statSource = role === "agent" ? computeAgentStats() : (DASH_STATS[role] || []);
    statSource.forEach(([label, value, delta]) => {
      cardsWrap.innerHTML += `
        <div class="dash-card">
          <span>${label}</span>
          <b>${value}</b>
          <span class="delta">${delta}</span>
        </div>`;
    });

    const tbody = $("#dashTableBody");
    tbody.innerHTML = "";
    const rowSource = role === "agent" ? computeAgentRows() : (DASH_ROWS[role] || []);
    if (!rowSource.length) {
      tbody.innerHTML = `<tr><td colspan="3" style="color:var(--ink-soft);text-align:center;padding:22px;">Nothing here yet.</td></tr>`;
    } else {
      rowSource.forEach(([client, task, status]) => {
        const cls = statusClass(status);
        tbody.innerHTML += `
          <tr>
            <td>${escapeHtml(client)}</td>
            <td>${escapeHtml(task)}</td>
            <td><span class="status-pill ${cls}">${escapeHtml(status)}</span></td>
          </tr>`;
      });
    }

    $("#dashPanelTitle").textContent =
      role === "agent" ? "My recent referrals" : role === "superadmin" ? "Latest filings across all clients" : "My assigned work";

    $("#liveAppsTitle").textContent =
      role === "agent" ? "Filings you can follow up on" : "Customer submissions";
    $("#liveAppsSub").textContent =
      role === "agent"
        ? "Every service a customer files with us — follow up if one of your referrals needs a nudge."
        : "Every service a customer files with us lands here the moment they submit it.";

    $("#liveEnquiriesPanel").classList.toggle("hidden", role !== "superadmin");

    renderEmployeeAttendanceOverview(role);
    renderAgentEnrollBanner();
    renderLiveApps();
    renderLiveEnquiries();
    switchDashView("overview");
  }

  function switchDashView(view) {
    $$(".dash-view").forEach((el) => el.classList.add("hidden"));
    const target = $("#dashView-" + view);
    if (!target) return;
    target.classList.remove("hidden");

    if (view === "customers") renderCustomersView();
    else if (view === "employees") renderEmployeesView();
    else if (view === "agents") renderAdminAgentsView();
    else if (view === "filings") renderFilingsView();
    else if (view === "reports") renderReportsView();
    else if (view === "leads") renderAgentLeadsView();
    else if (view === "commission") renderAgentCommissionView();
    else if (view === "attendance") renderAttendanceView();
    else if (view === "agent-submit") renderAgentSubmitView();
    else if (view === "agent-submissions") renderAgentSubmissionsView();
    else if (view === "agent-profile") renderAgentProfileView();
  }

  function renderCustomersView() {
    $("#customersTitle").textContent = state.role === "employee" ? "Assigned clients" : "All customers";

    const cardsWrap = $("#customersCards");
    const totalOnRecord = state.role === "superadmin" ? "1,240" : "38";
    cardsWrap.innerHTML = `
      <div class="dash-card"><span>Total on record</span><b>${totalOnRecord}</b><span class="delta">Company-wide</span></div>
      <div class="dash-card"><span>Active this session</span><b>${new Set(state.applications.map((a) => a.customerMobile)).size}</b><span class="delta">Filed something today</span></div>
      <div class="dash-card"><span>Total filings this session</span><b>${state.applications.length}</b><span class="delta">All services combined</span></div>
    `;

    const byCustomer = {};
    state.applications.forEach((a) => {
      if (!byCustomer[a.customerMobile]) byCustomer[a.customerMobile] = [];
      byCustomer[a.customerMobile].push(a);
    });
    const mobiles = Object.keys(byCustomer);

    const emptyEl = $("#customersEmpty");
    const tableEl = $("#customersTable");
    if (!mobiles.length) {
      emptyEl.classList.remove("hidden");
      tableEl.style.display = "none";
      return;
    }
    emptyEl.classList.add("hidden");
    tableEl.style.display = "table";
    $("#customersBody").innerHTML = mobiles
      .map((m) => {
        const apps = byCustomer[m];
        const latest = apps[0];
        return `
        <tr>
          <td>+91 ${m}</td>
          <td>${apps.length}</td>
          <td>${latest.submittedAt}</td>
          <td><span class="status-pill ${statusClass(latest.status)}">${latest.status}</span></td>
        </tr>`;
      })
      .join("");
  }

  function renderEmployeesView() {
    $("#employeesBody").innerHTML = EMPLOYEE_ROSTER.map(
      (emp) => `
        <tr>
          <td>${emp.name}</td>
          <td>${emp.role}</td>
          <td>${emp.clients}</td>
          <td><span class="status-pill ${emp.status === "Active" ? "done" : "review"}">${emp.status}</span></td>
        </tr>`
    ).join("");
  }

  function renderFilingsView() {
    $("#filingsTitle").textContent = state.role === "employee" ? "My filings queue" : "Filings queue";
    const listEl = $("#filingsList");
    const emptyEl = $("#filingsEmpty");

    const combined = [
      ...state.applications.map((a) => ({ ...a, __src: "customer" })),
      ...state.agentFilings.map((a) => ({ ...a, __src: "agent" })),
    ].sort((a, b) => (b.__ts || 0) - (a.__ts || 0));

    if (!combined.length) {
      listEl.innerHTML = "";
      emptyEl.classList.remove("hidden");
      return;
    }
    emptyEl.classList.add("hidden");
    listEl.innerHTML = combined
      .map((a) => appCardHtml(a, { staffActions: true, source: a.__src }))
      .join("");
    $$("[data-action]", listEl).forEach((btn) => {
      btn.addEventListener("click", () => {
        handleFilingAction(btn.dataset.src, btn.dataset.id, btn.dataset.action);
        renderFilingsView();
        renderLiveApps();
      });
    });
  }

  function handleFilingAction(src, id, action) {
    const arr = src === "agent" ? state.agentFilings : state.applications;
    const app = arr.find((a) => a.id === id);
    if (!app) return;
    if (action === "accept") app.status = "Accepted";
    else if (action === "review") app.status = "In Review";
    else if (action === "done") app.status = "Done";
    else if (action === "followup") {
      showToast(`Follow-up noted for ${app.service} (+91 ${app.customerMobile || app.clientMobile}).`);
      return;
    }
    if (src === "agent") saveAgentFilings();
    showToast(`${app.service} marked "${app.status}".`);
  }

  function renderReportsView() {
    const counts = { Submitted: 0, Accepted: 0, "In Review": 0, Done: 0 };
    [...state.applications, ...state.agentFilings].forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    const total = state.applications.length + state.agentFilings.length;
    $("#reportsCards").innerHTML = `
      <div class="dash-card"><span>Total filings</span><b>${total}</b><span class="delta">Customers + agent referrals</span></div>
      <div class="dash-card"><span>Completed</span><b>${counts.Done || 0}</b><span class="delta">Marked done</span></div>
      <div class="dash-card"><span>In progress</span><b>${(counts.Accepted || 0) + (counts["In Review"] || 0)}</b><span class="delta">Being worked on</span></div>
      <div class="dash-card"><span>Awaiting pickup</span><b>${counts.Submitted || 0}</b><span class="delta">Not yet accepted</span></div>
    `;
    $("#reportsBody").innerHTML = Object.entries(counts)
      .map(([status, count]) => `<tr><td><span class="status-pill ${statusClass(status)}">${status}</span></td><td>${count}</td></tr>`)
      .join("");
  }

  /* =========================================================
     AGENT: Submit client filing
  ========================================================== */
  function renderAgentSubmitView() {
    const root = $("#agentSubmitRoot");
    if (!root) return;

    if (state.role === "agent" && !isApprovedAgent()) {
      renderEnrollRequiredPanel(
        root,
        "Submitting client filings and earning commission is only available to approved agents. Enroll to get started — approval usually takes 24–48 hours."
      );
      return;
    }

    const optionsHtml = AGENT_SERVICES.map((s) => `<option value="${s.value}" data-cat="${s.cat}">${s.value}</option>`).join("");

    root.innerHTML = `
      <div class="agent-hero">
        <div class="agent-hero-main">
          <span class="eyebrow">Refer &amp; file</span>
          <h2>Submit a client filing</h2>
          <p>Fill in your client's details, attach their documents, and our team picks it up from here — track it any time under "My Submissions".</p>
        </div>
      </div>

      <div class="dash-panel">
        <div class="dash-panel-head"><h3>New client filing</h3></div>
        <p class="dash-panel-sub">Every filing you submit is linked to your agent profile so commission can be tracked correctly.</p>

        <div class="agent-form-grid">
          <div class="field"><label for="as-client-name">Client name</label><input class="inp" id="as-client-name" type="text" placeholder="Client's full name"></div>
          <div class="field"><label for="as-client-mobile">Client mobile</label><input class="inp" id="as-client-mobile" type="tel" placeholder="10-digit mobile" maxlength="10"></div>
          <div class="field full"><label for="as-service">Service required</label>
            <select class="inp" id="as-service">${optionsHtml}</select>
          </div>
          <div class="field full">
            <label>Documents required for this service</label>
            <ul class="doc-checklist" id="asDocChecklist"></ul>
          </div>
          <div class="field full">
            <label>Upload client documents</label>
            <div class="upload-zone" id="asUploadZone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <p><b>Tap to upload</b> client documents (PDF, JPG or PNG)</p>
              <span class="hint">You can add more than one file</span>
              <input type="file" id="asFileInput" accept="image/*,.pdf" multiple>
            </div>
            <div class="file-chips" id="asFileChips"></div>
          </div>
          <div class="field full"><label for="as-notes">Notes for the team (optional)</label><textarea class="inp" id="as-notes" placeholder="Anything the team should know about this client"></textarea></div>
        </div>

        <button type="button" class="btn btn-primary btn-block" id="asSubmitBtn" style="margin-top:8px;">Submit client filing</button>
      </div>`;

    state.agentPendingFiles = [];

    const svcSelect = $("#as-service", root);
    function refreshDocs() {
      const docs = SERVICE_DOCS[svcSelect.value] || [];
      $("#asDocChecklist", root).innerHTML = docs.map((d) => `<li>${d}</li>`).join("");
    }
    svcSelect.addEventListener("change", refreshDocs);
    refreshDocs();

    $("#as-client-mobile", root).addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
    });

    function renderAsFileChips() {
      const wrap = $("#asFileChips", root);
      wrap.innerHTML = state.agentPendingFiles
        .map((f, i) => `<span class="file-chip" data-idx="${i}">${escapeHtml(f.name)}<button type="button" aria-label="Remove file">&times;</button></span>`)
        .join("");
      $$(".file-chip button", wrap).forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.closest(".file-chip").dataset.idx);
          state.agentPendingFiles.splice(idx, 1);
          renderAsFileChips();
        });
      });
    }

    $("#asFileInput", root).addEventListener("change", (e) => {
      Array.from(e.target.files || []).forEach((file) => {
        state.agentPendingFiles.push({ name: file.name, size: file.size });
      });
      e.target.value = "";
      renderAsFileChips();
    });

    $("#asSubmitBtn", root).addEventListener("click", () => {
      const clientName = $("#as-client-name", root).value.trim();
      const clientMobile = $("#as-client-mobile", root).value.trim();
      const service = svcSelect.value;
      const cat = svcSelect.selectedOptions[0]?.dataset.cat || "other";
      const notes = $("#as-notes", root).value.trim();

      if (!clientName) { showToast("Please enter the client's name."); return; }
      if (clientMobile.length !== 10) { showToast("Please enter a valid 10-digit client mobile number."); return; }
      if (!state.agentPendingFiles.length) { showToast("Please attach at least one client document."); return; }

      const agentRec = state.currentAgent || {};
      const record = {
        id: "REF-" + Date.now().toString(36).toUpperCase(),
        __ts: Date.now(),
        service,
        category: cat,
        docs: (SERVICE_DOCS[service] || []).slice(),
        files: state.agentPendingFiles.slice(),
        notes,
        clientName,
        clientMobile,
        customerMobile: clientMobile,
        agentMobile: agentRec.mobile || state.user.mobile || "",
        agentEmail: agentRec.email || state.user.email || "",
        agentName: agentRec.name || state.user.name,
        status: "Submitted",
        submittedAt: nowStamp(),
      };
      state.agentFilings.unshift(record);
      saveAgentFilings();

      state.agentPendingFiles = [];
      renderAsFileChips();
      $("#as-client-name", root).value = "";
      $("#as-client-mobile", root).value = "";
      $("#as-notes", root).value = "";

      showToast(`Filing submitted for ${clientName}. Our team will review it shortly.`);
      renderLiveApps();
    });
  }

  /* =========================================================
     AGENT: My submissions
  ========================================================== */
  function renderAgentSubmissionsView() {
    const root = $("#agentSubmissionsRoot");
    if (!root) return;

    const mine = myAgentFilings();
    const filters = ["all", "Submitted", "Accepted", "In Review", "Done"];
    const filterLabel = { all: "All", Submitted: "Submitted", Accepted: "Accepted", "In Review": "In Review", Done: "Done" };

    root.innerHTML = `
      <div class="agent-hero">
        <div class="agent-hero-main">
          <span class="eyebrow">Track your work</span>
          <h2>My submissions</h2>
          <p>Every client filing you've submitted, and exactly where it stands with our team.</p>
        </div>
        <div class="agent-hero-stats">
          <div><b>${mine.length}</b><span>Total filed</span></div>
          <div><b>${mine.filter((f) => f.status === "Done").length}</b><span>Completed</span></div>
          <div><b>${mine.filter((f) => f.status === "Submitted").length}</b><span>Awaiting pickup</span></div>
        </div>
      </div>

      <div class="dash-panel">
        <div class="dash-panel-head"><h3>Submissions</h3></div>
        <div class="agent-filter-row" id="asFilterRow">
          ${filters.map((f) => `<button type="button" class="agent-filter-chip${state.agentSubFilter === f ? " active" : ""}" data-filter="${f}">${filterLabel[f]}</button>`).join("")}
        </div>
        <div id="asSubmissionsList" class="app-list"></div>
        <div id="asSubmissionsEmpty" class="myapp-empty small hidden"><p>No submissions match this filter yet.</p></div>
      </div>`;

    function paint() {
      const list = state.agentSubFilter === "all" ? mine : mine.filter((f) => f.status === state.agentSubFilter);
      const listEl = $("#asSubmissionsList", root);
      const emptyEl = $("#asSubmissionsEmpty", root);
      if (!list.length) {
        listEl.innerHTML = "";
        emptyEl.classList.remove("hidden");
        return;
      }
      emptyEl.classList.add("hidden");
      listEl.innerHTML = list.map((a) => appCardHtml(a, { agentActions: true, source: "agent" })).join("");
      $$("[data-action]", listEl).forEach((btn) => {
        btn.addEventListener("click", () => {
          handleFilingAction("agent", btn.dataset.id, btn.dataset.action);
        });
      });
    }

    $$(".agent-filter-chip", root).forEach((btn) => {
      btn.addEventListener("click", () => {
        state.agentSubFilter = btn.dataset.filter;
        $$(".agent-filter-chip", root).forEach((b) => b.classList.toggle("active", b === btn));
        paint();
      });
    });

    paint();
  }

  /* =========================================================
     AGENT: Leads (referral pipeline view)
  ========================================================== */
  function renderAgentLeadsView() {
    const root = $("#agentLeadsRoot");
    if (!root) return;

    if (state.role === "superadmin" || state.role === "employee") {
      // not used for these roles currently
      root.innerHTML = "";
      return;
    }

    const mine = myAgentFilings();
    root.innerHTML = `
      <div class="agent-hero">
        <div class="agent-hero-main">
          <span class="eyebrow">Pipeline</span>
          <h2>My leads &amp; referrals</h2>
          <p>Every client you've referred, grouped by where they are in the process.</p>
        </div>
      </div>
      <div class="dash-panel">
        <div class="dash-panel-head"><h3>Referral pipeline</h3></div>
        <p class="dash-panel-sub">This mirrors "My Submissions" — use it as a quick glance at conversion.</p>
        <div id="agentLeadsList" class="app-list"></div>
        <div id="agentLeadsEmpty" class="myapp-empty small ${mine.length ? "hidden" : ""}"><p>No referrals yet — head to "Submit Filing" to add your first client.</p></div>
      </div>`;

    if (mine.length) {
      $("#agentLeadsList", root).innerHTML = mine.map((a) => appCardHtml(a, { agentActions: true, source: "agent" })).join("");
      $$("[data-action]", root).forEach((btn) => {
        btn.addEventListener("click", () => handleFilingAction("agent", btn.dataset.id, btn.dataset.action));
      });
    }
  }

  /* =========================================================
     AGENT: Commission / cash-flow uploads
  ========================================================== */
  function renderAgentCommissionView() {
    const cardsWrap = $("#commissionCards");
    const panelHost = $("#dashView-commission");
    if (!cardsWrap || !panelHost) return;

    if (state.role === "agent" && !isApprovedAgent()) {
      cardsWrap.innerHTML = "";
      let gateHost = $("#commissionUploadHost");
      if (gateHost) gateHost.remove();
      gateHost = document.createElement("div");
      gateHost.id = "commissionUploadHost";
      cardsWrap.insertAdjacentElement("afterend", gateHost);
      renderEnrollRequiredPanel(
        gateHost,
        "Uploading commission / cash-flow proof and tracking payouts is only available to approved agents."
      );
      return;
    }

    const claims = myCommissionClaims();
    const approvedTotal = claims.filter((c) => c.status === "Approved").reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const pendingTotal = claims.filter((c) => c.status === "Pending").reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const rejectedCount = claims.filter((c) => c.status === "Rejected").length;

    cardsWrap.innerHTML = `
      <div class="dash-card"><span>Approved payouts</span><b>${fmtMoney(approvedTotal)}</b><span class="delta">All time</span></div>
      <div class="dash-card"><span>Pending review</span><b>${fmtMoney(pendingTotal)}</b><span class="delta">${claims.filter((c) => c.status === "Pending").length} claim(s)</span></div>
      <div class="dash-card"><span>Rejected claims</span><b>${rejectedCount}</b><span class="delta">Check admin notes</span></div>
      <div class="dash-card"><span>Total claims filed</span><b>${claims.length}</b><span class="delta">This account</span></div>
    `;

    // remove any previously injected upload panel/history, then rebuild after the cards
    let uploadHost = $("#commissionUploadHost");
    if (uploadHost) uploadHost.remove();
    uploadHost = document.createElement("div");
    uploadHost.id = "commissionUploadHost";
    cardsWrap.insertAdjacentElement("afterend", uploadHost);

    uploadHost.innerHTML = `
      <div class="dash-panel" style="margin-bottom:22px;">
        <div class="dash-panel-head"><h3>Upload cash flow / commission proof</h3></div>
        <p class="dash-panel-sub">Attach your commission statement, invoice or cash-flow proof for a period — our admin team reviews and approves each claim.</p>
        <div class="upload-panel">
          <div class="field"><label for="cc-month">Month / period</label><input class="inp" id="cc-month" type="month"></div>
          <div class="field"><label for="cc-amount">Claim amount (₹)</label><input class="inp" id="cc-amount" type="number" min="0" placeholder="e.g. 4200"></div>
          <div class="field full">
            <label>Attach proof document</label>
            <div class="upload-zone" id="ccUploadZone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <p><b>Tap to upload</b> your cash-flow statement or commission proof</p>
              <span class="hint">PDF, JPG, PNG or XLSX</span>
              <input type="file" id="ccFileInput" accept="image/*,.pdf,.xlsx,.xls,.csv">
            </div>
            <div class="file-chips" id="ccFileChip"></div>
          </div>
          <div class="field full"><label for="cc-note">Note (optional)</label><textarea class="inp" id="cc-note" placeholder="Any context for the admin reviewing this claim"></textarea></div>
        </div>
        <button type="button" class="btn btn-primary btn-block" id="ccSubmitBtn" style="margin-top:8px;">Submit for admin approval</button>
      </div>

      <div class="dash-panel">
        <div class="dash-panel-head"><h3>My claim history</h3></div>
        <p class="dash-panel-sub">Track every cash-flow / commission upload and its approval status.</p>
        <div id="ccHistoryList" class="cf-upload-list"></div>
        <div id="ccHistoryEmpty" class="myapp-empty small ${claims.length ? "hidden" : ""}"><p>No claims submitted yet.</p></div>
      </div>
    `;

    state.commissionPendingFile = null;
    $("#ccFileInput", uploadHost).addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      state.commissionPendingFile = file ? { name: file.name, size: file.size } : null;
      $("#ccFileChip", uploadHost).innerHTML = state.commissionPendingFile
        ? `<span class="file-chip">${escapeHtml(state.commissionPendingFile.name)}<button type="button" id="ccFileRemove">&times;</button></span>`
        : "";
      const rm = $("#ccFileRemove", uploadHost);
      if (rm) rm.addEventListener("click", () => {
        state.commissionPendingFile = null;
        e.target.value = "";
        $("#ccFileChip", uploadHost).innerHTML = "";
      });
    });

    $("#ccSubmitBtn", uploadHost).addEventListener("click", () => {
      const month = $("#cc-month", uploadHost).value;
      const amount = Number($("#cc-amount", uploadHost).value);
      const note = $("#cc-note", uploadHost).value.trim();

      if (!month) { showToast("Please select the month / period this claim covers."); return; }
      if (!amount || amount <= 0) { showToast("Please enter a valid claim amount."); return; }
      if (!state.commissionPendingFile) { showToast("Please attach a proof document before submitting."); return; }

      const agentRec = state.currentAgent || {};
      const claim = {
        id: "CLM-" + Date.now().toString(36).toUpperCase(),
        agentMobile: agentRec.mobile || state.user.mobile || "",
        agentEmail: agentRec.email || state.user.email || "",
        agentName: agentRec.name || state.user.name,
        month,
        amount,
        note,
        file: state.commissionPendingFile,
        status: "Pending",
        submittedAt: nowStamp(),
        reviewedAt: null,
        reviewNote: "",
      };
      state.commissionClaims.unshift(claim);
      saveCommissionClaims();

      showToast("Claim submitted — admin will review your cash-flow proof shortly.");
      renderAgentCommissionView();
    });

    paintCommissionHistory(claims, $("#ccHistoryList", uploadHost), $("#ccHistoryEmpty", uploadHost));
  }

  function paintCommissionHistory(claims, listEl, emptyEl) {
    if (!listEl) return;
    if (!claims.length) {
      listEl.innerHTML = "";
      if (emptyEl) emptyEl.classList.remove("hidden");
      return;
    }
    if (emptyEl) emptyEl.classList.add("hidden");
    listEl.innerHTML = claims
      .map(
        (c) => `
        <div class="cf-upload-card">
          <div class="cf-main">
            <div class="cf-title">${c.month ? new Date(c.month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}</div>
            <div class="cf-meta">
              <span>🆔 ${c.id}</span>
              <span>📎 ${escapeHtml(c.file ? c.file.name : "—")}</span>
              <span>🕒 ${c.submittedAt}</span>
              ${c.agentName ? `<span>👤 ${escapeHtml(c.agentName)}</span>` : ""}
            </div>
            ${c.note ? `<div class="cf-note">📝 ${escapeHtml(c.note)}</div>` : ""}
            ${c.reviewNote ? `<div class="cf-review-note">Admin note: ${escapeHtml(c.reviewNote)}</div>` : ""}
          </div>
          <div class="cf-actions">
            <span class="cf-amount">${fmtMoney(c.amount)}</span>
            <span class="status-pill ${statusClass(c.status)}">${c.status}</span>
          </div>
        </div>`
      )
      .join("");
  }

  /* =========================================================
     AGENT: Profile view
  ========================================================== */
  function renderAgentProfileView() {
    const root = $("#agentProfileRoot");
    if (!root) return;

    if (state.role === "agent" && !state.currentAgent) {
      renderEnrollRequiredPanel(root, "Enroll as an agent to build out your profile — name, PAN, city and firm details are captured during enrollment.");
      return;
    }

    const rec = state.currentAgent || {};
    const mine = myAgentFilings();
    const claims = myCommissionClaims();

    root.innerHTML = `
      <div class="dash-panel">
        <div class="agent-profile-card">
          <div class="agent-profile-av">${initials(rec.name || state.user.name)}</div>
          <div>
            <h2 style="font-size:20px;">${escapeHtml(rec.name || state.user.name)}</h2>
            <p style="margin-top:4px;">${rec.mobile ? "+91 " + rec.mobile : ""}${rec.mobile && rec.email ? " · " : ""}${rec.email || ""}</p>
            <div class="agent-profile-meta">
              <span>📍 ${escapeHtml(rec.city || "—")}</span>
              <span>🪪 PAN: ${escapeHtml(rec.pan || "—")}</span>
              ${rec.firm ? `<span>🏢 ${escapeHtml(rec.firm)}</span>` : ""}
              <span class="status-pill ${rec.status === "Approved" ? "done" : rec.status === "Rejected" ? "review" : "pending"}">${rec.status === "Approved" ? "Approved agent" : rec.status === "Rejected" ? "Rejected — re-apply" : "Pending approval"}</span>
            </div>
          </div>
        </div>
        <div class="dash-cards" style="margin-bottom:0;">
          <div class="dash-card"><span>Referrals filed</span><b>${mine.length}</b><span class="delta">This session</span></div>
          <div class="dash-card"><span>Completed</span><b>${mine.filter((f) => f.status === "Done").length}</b><span class="delta">Marked done by our team</span></div>
          <div class="dash-card"><span>Claims filed</span><b>${claims.length}</b><span class="delta">${claims.filter((c) => c.status === "Approved").length} approved</span></div>
          <div class="dash-card"><span>Agent since</span><b style="font-size:16px;">${escapeHtml(rec.appliedAt || "—")}</b><span class="delta">Enrollment date</span></div>
        </div>
      </div>
      <div class="dash-panel" style="margin-top:22px;">
        <div class="dash-panel-head"><h3>Enrollment details</h3></div>
        <p class="dash-panel-sub">Submitted when you enrolled as an agent.</p>
        <div class="form-grid">
          <div class="field"><label>Full name</label><input class="inp" value="${escapeHtml(rec.name || "")}" disabled></div>
          <div class="field"><label>Mobile</label><input class="inp" value="${rec.mobile ? "+91 " + rec.mobile : "—"}" disabled></div>
          <div class="field"><label>Email</label><input class="inp" value="${escapeHtml(rec.email || "—")}" disabled></div>
          <div class="field"><label>City</label><input class="inp" value="${escapeHtml(rec.city || "—")}" disabled></div>
          <div class="field"><label>PAN number</label><input class="inp" value="${escapeHtml(rec.pan || "—")}" disabled></div>
          <div class="field"><label>Firm / business name</label><input class="inp" value="${escapeHtml(rec.firm || "—")}" disabled></div>
        </div>
        <button type="button" class="btn btn-outline" id="agentProfileEditBtn" style="margin-top:16px;">
          ${rec.status === "Rejected" ? "Re-apply with updated details" : "Update enrollment details"}
        </button>
      </div>`;

    $("#agentProfileEditBtn", root)?.addEventListener("click", openAgentEnrollFromDashboard);
  }

  /* =========================================================
     SUPER ADMIN: Agents roster + approvals + claim reviews
  ========================================================== */
  function renderAdminAgentsView() {
    const root = $("#adminAgentsRoot");
    if (!root) return;

    const pending = state.agents.filter((a) => a.status === "Pending");
    const approved = state.agents.filter((a) => a.status === "Approved");
    const rejected = state.agents.filter((a) => a.status === "Rejected");
    const pendingClaims = state.commissionClaims.filter((c) => c.status === "Pending");

    root.innerHTML = `
      <div class="dash-cards">
        <div class="dash-card"><span>Pending enrollments</span><b>${pending.length}</b><span class="delta">Awaiting review</span></div>
        <div class="dash-card"><span>Approved agents</span><b>${approved.length}</b><span class="delta">Active on the platform</span></div>
        <div class="dash-card"><span>Rejected</span><b>${rejected.length}</b><span class="delta">Can re-apply</span></div>
        <div class="dash-card"><span>Pending commission claims</span><b>${pendingClaims.length}</b><span class="delta">Cash-flow proofs to review</span></div>
      </div>

      <div class="dash-panel" style="margin-bottom:22px;">
        <div class="dash-panel-head">
          <h3>Pending agent enrollments</h3>
          <span class="live-chip"><span class="dot"></span>Live</span>
        </div>
        <p class="dash-panel-sub">Review each applicant's details, then approve or reject to control who can submit client filings.</p>
        <div id="adminAgentPendingList" style="display:grid;gap:12px;"></div>
        <div id="adminAgentPendingEmpty" class="myapp-empty small ${pending.length ? "hidden" : ""}"><p>No pending enrollments right now.</p></div>
      </div>

      <div class="dash-panel" style="margin-bottom:22px;">
        <div class="dash-panel-head"><h3>Approved agents</h3></div>
        <p class="dash-panel-sub">All agents currently able to submit client filings and earn commission.</p>
        <table class="dash-table" id="adminAgentApprovedTable" style="${approved.length ? "" : "display:none;"}">
          <thead><tr><th>Name</th><th>City</th><th>Contact</th><th>Referrals</th><th>Status</th></tr></thead>
          <tbody id="adminAgentApprovedBody"></tbody>
        </table>
        <div class="myapp-empty small ${approved.length ? "hidden" : ""}"><p>No approved agents yet.</p></div>
      </div>

      <div class="dash-panel">
        <div class="dash-panel-head">
          <h3>Commission / cash-flow claims to approve</h3>
          <span class="live-chip"><span class="dot"></span>Live</span>
        </div>
        <p class="dash-panel-sub">Agents upload commission or cash-flow proof here — approve to release payout, or reject with a note.</p>
        <div id="adminClaimsList" class="cf-upload-list"></div>
        <div id="adminClaimsEmpty" class="myapp-empty small ${state.commissionClaims.length ? "hidden" : ""}"><p>No commission claims submitted yet.</p></div>
      </div>
    `;

    // pending enrollments
    const pendingListEl = $("#adminAgentPendingList", root);
    pendingListEl.innerHTML = pending
      .map(
        (a) => `
        <div class="agent-approval-card">
          <div class="aa-main">
            <div class="aa-name">${escapeHtml(a.name)}</div>
            <div class="aa-meta">
              <span>📱 ${a.mobile ? "+91 " + a.mobile : "—"}</span>
              <span>✉ ${escapeHtml(a.email || "—")}</span>
              <span>📍 ${escapeHtml(a.city || "—")}</span>
              <span>🪪 ${escapeHtml(a.pan || "—")}</span>
              ${a.firm ? `<span>🏢 ${escapeHtml(a.firm)}</span>` : ""}
              <span>🕒 ${a.appliedAt}</span>
            </div>
          </div>
          <div class="aa-actions">
            <span class="status-pill pending">Pending</span>
            <div class="aa-actions-row">
              <button type="button" class="btn btn-outline btn-sm" data-agent-action="reject" data-id="${a.id}">Reject</button>
              <button type="button" class="btn btn-primary btn-sm" data-agent-action="approve" data-id="${a.id}">Approve</button>
            </div>
          </div>
        </div>`
      )
      .join("");

    $$("[data-agent-action]", pendingListEl).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const rec = state.agents.find((a) => a.id === id);
        if (!rec) return;
        if (btn.dataset.agentAction === "approve") {
          rec.status = "Approved";
          rec.reviewedAt = nowStamp();
          rec.reviewNote = "";
          showToast(`${rec.name} approved as an agent.`);
        } else {
          const note = window.prompt(`Reason for rejecting ${rec.name}'s enrollment (optional):`, "") || "";
          rec.status = "Rejected";
          rec.reviewedAt = nowStamp();
          rec.reviewNote = note;
          showToast(`${rec.name}'s enrollment was rejected.`);
        }
        saveAgents();
        renderAdminAgentsView();
      });
    });

    // approved table
    if (approved.length) {
      $("#adminAgentApprovedBody", root).innerHTML = approved
        .map((a) => {
          const referrals = state.agentFilings.filter((f) => f.agentMobile === a.mobile || f.agentEmail === a.email).length;
          return `
          <tr>
            <td>${escapeHtml(a.name)}</td>
            <td>${escapeHtml(a.city || "—")}</td>
            <td>${a.mobile ? "+91 " + a.mobile : escapeHtml(a.email || "—")}</td>
            <td>${referrals}</td>
            <td><span class="status-pill done">Approved</span></td>
          </tr>`;
        })
        .join("");
    }

    // commission claims
    const claimsListEl = $("#adminClaimsList", root);
    claimsListEl.innerHTML = state.commissionClaims
      .map(
        (c) => `
        <div class="cf-upload-card">
          <div class="cf-main">
            <div class="cf-title">${escapeHtml(c.agentName)} — ${c.month ? new Date(c.month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}</div>
            <div class="cf-meta">
              <span>🆔 ${c.id}</span>
              <span>📱 ${c.agentMobile ? "+91 " + c.agentMobile : escapeHtml(c.agentEmail || "—")}</span>
              <span>📎 ${escapeHtml(c.file ? c.file.name : "—")}</span>
              <span>🕒 ${c.submittedAt}</span>
            </div>
            ${c.note ? `<div class="cf-note">📝 ${escapeHtml(c.note)}</div>` : ""}
            ${c.reviewNote ? `<div class="cf-review-note">Your note: ${escapeHtml(c.reviewNote)}</div>` : ""}
          </div>
          <div class="cf-actions">
            <span class="cf-amount">${fmtMoney(c.amount)}</span>
            <span class="status-pill ${statusClass(c.status)}">${c.status}</span>
            ${
              c.status === "Pending"
                ? `<div class="aa-actions-row">
                    <button type="button" class="btn btn-outline btn-sm" data-claim-action="reject" data-id="${c.id}">Reject</button>
                    <button type="button" class="btn btn-primary btn-sm" data-claim-action="approve" data-id="${c.id}">Approve</button>
                   </div>`
                : ""
            }
          </div>
        </div>`
      )
      .join("");

    $$("[data-claim-action]", claimsListEl).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const claim = state.commissionClaims.find((c) => c.id === id);
        if (!claim) return;
        if (btn.dataset.claimAction === "approve") {
          claim.status = "Approved";
          claim.reviewedAt = nowStamp();
          showToast(`Approved ${fmtMoney(claim.amount)} for ${claim.agentName}.`);
        } else {
          const note = window.prompt(`Reason for rejecting this claim (optional):`, "") || "";
          claim.status = "Rejected";
          claim.reviewedAt = nowStamp();
          claim.reviewNote = note;
          showToast(`Claim from ${claim.agentName} rejected.`);
        }
        saveCommissionClaims();
        renderAdminAgentsView();
      });
    });
  }

  /* ---------- attendance (kept original logic) ---------- */
  function loadAttendance() {
    try {
      const raw = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
      if (raw) state.attendance = JSON.parse(raw);
    } catch (err) {
      state.attendance = [];
    }
    if (!state.attendance.length) seedAttendanceDemo();
  }

  function saveAttendance() {
    try {
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(state.attendance));
    } catch (err) {}
  }

  function dateKey(d) {
    const dt = d || new Date();
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function formatTime(d) {
    return d.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  }

  function formatDateLabel(key) {
    const [y, m, d] = key.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const today = dateKey();
    const yesterday = dateKey(new Date(Date.now() - 86400000));
    if (key === today) return "Today";
    if (key === yesterday) return "Yesterday";
    return dt.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  }

  function formatDuration(minutes) {
    if (!minutes || minutes <= 0) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (!h) return `${m}m`;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  function getEmployeeByMobile(mobile) {
    return EMPLOYEE_ROSTER.find((e) => e.mobile === mobile) || null;
  }

  function attendanceRecordKey(mobile, key) {
    return `${mobile}_${key}`;
  }

  function getRecord(mobile, key) {
    return state.attendance.find((r) => r.employeeMobile === mobile && r.date === key) || null;
  }

  function isLateCheckIn(d) {
    const start = new Date(d);
    start.setHours(LATE_AFTER_HOUR, LATE_AFTER_MINUTE, 0, 0);
    return d > start;
  }

  function computeWorkMinutes(checkInIso, checkOutIso) {
    if (!checkInIso || !checkOutIso) return 0;
    return Math.max(0, Math.round((new Date(checkOutIso) - new Date(checkInIso)) / 60000));
  }

  function deriveStatus(record) {
    if (!record) return "Not checked in";
    if (record.status === "On Leave") return "On Leave";
    if (!record.checkIn) return "Absent";
    if (!record.checkOut) {
      return isLateCheckIn(new Date(record.checkIn)) ? "Late · In office" : "Present · In office";
    }
    const mins = record.workMinutes || computeWorkMinutes(record.checkIn, record.checkOut);
    if (mins > 0 && mins < HALF_DAY_HOURS * 60) return "Half Day";
    return isLateCheckIn(new Date(record.checkIn)) ? "Late" : "Present";
  }

  function attendanceStatusClass(status) {
    const s = (status || "").toLowerCase();
    if (s.includes("present") && s.includes("office")) return "accepted";
    if (s.includes("present") || s === "done") return "done";
    if (s.includes("late")) return "pending";
    if (s.includes("half")) return "review";
    if (s.includes("leave")) return "review";
    if (s.includes("not") || s.includes("absent")) return "submitted";
    return "submitted";
  }

  function seedAttendanceDemo() {
    const today = dateKey();
    const yesterday = dateKey(new Date(Date.now() - 86400000));
    const twoDaysAgo = dateKey(new Date(Date.now() - 2 * 86400000));

    const seeds = [
      { mobile: "9876543210", date: yesterday, inH: 9, inM: 2, outH: 18, outM: 45 },
      { mobile: "9876543211", date: yesterday, inH: 9, inM: 15, outH: 19, outM: 10 },
      { mobile: "9876543212", date: yesterday, inH: 10, inM: 5, outH: 18, outM: 30 },
      { mobile: "9876543214", date: yesterday, inH: 8, inM: 55, outH: 18, outM: 0 },
      { mobile: "9876543210", date: twoDaysAgo, inH: 9, inM: 0, outH: 18, outM: 15 },
      { mobile: "9876543211", date: twoDaysAgo, inH: 9, inM: 30, outH: 17, outM: 45 },
    ];

    seeds.forEach((s) => {
      const emp = getEmployeeByMobile(s.mobile);
      if (!emp) return;
      const checkIn = new Date(`${s.date}T${String(s.inH).padStart(2, "0")}:${String(s.inM).padStart(2, "0")}:00`);
      const checkOut = new Date(`${s.date}T${String(s.outH).padStart(2, "0")}:${String(s.outM).padStart(2, "0")}:00`);
      const workMinutes = computeWorkMinutes(checkIn.toISOString(), checkOut.toISOString());
      state.attendance.push({
        id: attendanceRecordKey(s.mobile, s.date),
        employeeMobile: s.mobile,
        employeeName: emp.name,
        employeeRole: emp.role,
        date: s.date,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        workMinutes,
        status: deriveStatus({ checkIn: checkIn.toISOString(), checkOut: checkOut.toISOString(), workMinutes }),
      });
    });

    ["9876543213"].forEach((mobile) => {
      const emp = getEmployeeByMobile(mobile);
      [today, yesterday].forEach((d) => {
        state.attendance.push({
          id: attendanceRecordKey(mobile, d),
          employeeMobile: mobile,
          employeeName: emp.name,
          employeeRole: emp.role,
          date: d,
          checkIn: null,
          checkOut: null,
          workMinutes: 0,
          status: "On Leave",
        });
      });
    });

    saveAttendance();
  }

  function checkInEmployee() {
    const mobile = state.user.mobile;
    const today = dateKey();
    const existing = getRecord(mobile, today);

    if (existing && existing.checkIn && !existing.checkOut) {
      showToast("You're already checked in for today.");
      return;
    }
    if (existing && existing.checkIn && existing.checkOut) {
      showToast("You've already completed today's attendance.");
      return;
    }
    if (existing && existing.status === "On Leave") {
      showToast("You're marked on leave today. Contact admin to update.");
      return;
    }

    const now = new Date();
    const emp = getEmployeeByMobile(mobile);
    const record = {
      id: attendanceRecordKey(mobile, today),
      employeeMobile: mobile,
      employeeName: state.user.name,
      employeeRole: emp ? emp.role : "Consultant",
      date: today,
      checkIn: now.toISOString(),
      checkOut: null,
      workMinutes: 0,
      status: isLateCheckIn(now) ? "Late · In office" : "Present · In office",
    };

    state.attendance = state.attendance.filter((r) => r.id !== record.id);
    state.attendance.unshift(record);
    saveAttendance();
    showToast(`Checked in at ${formatTime(now)}${isLateCheckIn(now) ? " (marked late)" : ""}.`);
    renderAttendanceView();
  }

  function checkOutEmployee() {
    const mobile = state.user.mobile;
    const today = dateKey();
    const record = getRecord(mobile, today);

    if (!record || !record.checkIn) {
      showToast("Please check in first before checking out.");
      return;
    }
    if (record.checkOut) {
      showToast("You've already checked out for today.");
      return;
    }

    const now = new Date();
    record.checkOut = now.toISOString();
    record.workMinutes = computeWorkMinutes(record.checkIn, record.checkOut);
    record.status = deriveStatus(record);
    saveAttendance();
    showToast(`Checked out at ${formatTime(now)} · ${formatDuration(record.workMinutes)} worked.`);
    renderAttendanceView();
  }

  function getMonthRecords(mobile) {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return state.attendance
      .filter((r) => r.employeeMobile === mobile && r.date.startsWith(ym))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function getEmployeeMonthStats(mobile) {
    const records = getMonthRecords(mobile);
    let present = 0;
    let late = 0;
    let totalMins = 0;
    records.forEach((r) => {
      const st = deriveStatus(r);
      if (r.checkIn && st !== "On Leave") {
        present += 1;
        if (st.includes("Late")) late += 1;
        totalMins += r.workMinutes || 0;
      }
    });
    const avgMins = present ? Math.round(totalMins / present) : 0;
    return { present, late, avgMins, records };
  }

  function stopAttendanceClock() {
    if (state.attendanceClock) {
      clearInterval(state.attendanceClock);
      state.attendanceClock = null;
    }
  }

  function startAttendanceClock() {
    stopAttendanceClock();
    state.attendanceClock = setInterval(() => {
      const el = $("#attLiveClock");
      if (!el) {
        stopAttendanceClock();
        return;
      }
      const now = new Date();
      el.textContent = now.toLocaleString("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    }, 1000);
  }

  function renderAttendanceView() {
    const root = $("#attendanceRoot");
    if (!root) return;

    if (state.role === "superadmin") {
      stopAttendanceClock();
      renderAdminAttendance(root);
      return;
    }

    if (state.role !== "employee") {
      root.innerHTML = `<div class="dash-panel"><p class="dash-panel-sub">Attendance tracking is available for employees and administrators.</p></div>`;
      return;
    }

    renderEmployeeAttendance(root);
    startAttendanceClock();
  }

  function renderEmployeeAttendance(root) {
    const mobile = state.user.mobile;
    const today = dateKey();
    const todayRecord = getRecord(mobile, today);
    const stats = getEmployeeMonthStats(mobile);
    const status = todayRecord ? deriveStatus(todayRecord) : "Not checked in";
    const canCheckIn = !todayRecord || (!todayRecord.checkIn && todayRecord.status !== "On Leave");
    const canCheckOut = todayRecord && todayRecord.checkIn && !todayRecord.checkOut;
    const history = state.attendance
      .filter((r) => r.employeeMobile === mobile)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 14);

    root.innerHTML = `
      <div class="att-hero">
        <div class="att-hero-main">
          <span class="eyebrow">Daily attendance</span>
          <h2>${escapeHtml(state.user.name)}</h2>
          <p class="att-live-clock" id="attLiveClock">—</p>
          <div class="att-status-row">
            <span class="status-pill ${attendanceStatusClass(status)}">${escapeHtml(status)}</span>
            ${todayRecord && todayRecord.checkIn ? `<span class="att-meta">In: <b>${formatTime(new Date(todayRecord.checkIn))}</b></span>` : ""}
            ${todayRecord && todayRecord.checkOut ? `<span class="att-meta">Out: <b>${formatTime(new Date(todayRecord.checkOut))}</b></span>` : ""}
            ${todayRecord && todayRecord.workMinutes ? `<span class="att-meta">Worked: <b>${formatDuration(todayRecord.workMinutes)}</b></span>` : ""}
          </div>
        </div>
        <div class="att-actions">
          <button type="button" class="btn btn-primary att-btn-checkin" id="attCheckInBtn" ${canCheckIn ? "" : "disabled"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Check In
          </button>
          <button type="button" class="btn btn-yellow att-btn-checkout" id="attCheckOutBtn" ${canCheckOut ? "" : "disabled"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Check Out
          </button>
        </div>
      </div>

      <div class="dash-cards att-stats">
        <div class="dash-card"><span>Present this month</span><b>${stats.present}</b><span class="delta">Days logged</span></div>
        <div class="dash-card"><span>Late arrivals</span><b>${stats.late}</b><span class="delta">After ${LATE_AFTER_HOUR}:${String(LATE_AFTER_MINUTE).padStart(2, "0")} AM</span></div>
        <div class="dash-card"><span>Avg. hours / day</span><b>${formatDuration(stats.avgMins)}</b><span class="delta">This month</span></div>
        <div class="dash-card"><span>Office hours</span><b>8 AM – 9 PM</b><span class="delta">Mon–Sat · Sun till 2 PM</span></div>
      </div>

      <div class="dash-panel">
        <div class="dash-panel-head">
          <h3>Your attendance history</h3>
          <span class="live-chip"><span class="dot"></span>Synced</span>
        </div>
        <p class="dash-panel-sub">Check-in and check-out times are recorded automatically. Late is flagged after ${LATE_AFTER_HOUR}:${String(LATE_AFTER_MINUTE).padStart(2, "0")} AM.</p>
        ${
          history.length
            ? `<div class="att-table-wrap"><table class="dash-table att-table">
            <thead><tr><th>Date</th><th>Check-in</th><th>Check-out</th><th>Duration</th><th>Status</th></tr></thead>
            <tbody>${history
              .map((r) => {
                const st = deriveStatus(r);
                return `<tr>
                  <td><b>${formatDateLabel(r.date)}</b><br><span class="att-date-sub">${r.date}</span></td>
                  <td>${r.checkIn ? formatTime(new Date(r.checkIn)) : "—"}</td>
                  <td>${r.checkOut ? formatTime(new Date(r.checkOut)) : "—"}</td>
                  <td>${formatDuration(r.workMinutes)}</td>
                  <td><span class="status-pill ${attendanceStatusClass(st)}">${escapeHtml(st)}</span></td>
                </tr>`;
              })
              .join("")}</tbody>
          </table></div>`
            : `<div class="myapp-empty small"><p>No attendance records yet. Tap <b>Check In</b> when you start work.</p></div>`
        }
      </div>`;

    const checkInBtn = $("#attCheckInBtn", root);
    const checkOutBtn = $("#attCheckOutBtn", root);
    if (checkInBtn) checkInBtn.addEventListener("click", checkInEmployee);
    if (checkOutBtn) checkOutBtn.addEventListener("click", checkOutEmployee);
  }

  function renderAdminAttendance(root) {
    const filterDate = root.dataset.filterDate || dateKey();
    root.dataset.filterDate = filterDate;

    const rows = EMPLOYEE_ROSTER.map((emp) => {
      const rec = getRecord(emp.mobile, filterDate);
      const st = rec ? deriveStatus(rec) : emp.status === "On leave" ? "On Leave" : "Not checked in";
      return { emp, rec, st };
    });

    const present = rows.filter((r) => r.rec && r.rec.checkIn && !r.st.includes("Leave")).length;
    const inOffice = rows.filter((r) => r.rec && r.rec.checkIn && !r.rec.checkOut).length;
    const late = rows.filter((r) => r.st.includes("Late")).length;
    const absent = rows.filter((r) => !r.rec || (!r.rec.checkIn && r.st !== "On Leave")).length;
    const onLeave = rows.filter((r) => r.st === "On Leave").length;

    root.innerHTML = `
      <div class="dash-panel att-admin-head">
        <div class="att-admin-head-row">
          <div>
            <span class="eyebrow">Team monitoring</span>
            <h2 style="margin-top:8px;font-size:22px;">Employee attendance</h2>
            <p class="dash-panel-sub" style="margin-bottom:0;">Live check-in and check-out across your in-house team — ${formatDateLabel(filterDate)}.</p>
          </div>
          <div class="att-date-filter">
            <label for="attAdminDate">View date</label>
            <input type="date" class="inp" id="attAdminDate" value="${filterDate}">
          </div>
        </div>
      </div>

      <div class="dash-cards att-stats">
        <div class="dash-card"><span>Checked in</span><b>${present}</b><span class="delta">${inOffice} currently in office</span></div>
        <div class="dash-card"><span>Late today</span><b>${late}</b><span class="delta">After ${LATE_AFTER_HOUR}:${String(LATE_AFTER_MINUTE).padStart(2, "0")} AM</span></div>
        <div class="dash-card"><span>Not checked in</span><b>${absent}</b><span class="delta">Awaiting check-in</span></div>
        <div class="dash-card"><span>On leave</span><b>${onLeave}</b><span class="delta">Marked absent</span></div>
      </div>

      <div class="dash-panel">
        <div class="dash-panel-head">
          <h3>Team roster — ${formatDateLabel(filterDate)}</h3>
          <span class="live-chip"><span class="dot"></span>Live</span>
        </div>
        <div class="att-table-wrap">
          <table class="dash-table att-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(({ emp, rec, st }) => {
                  const inOfficeNow = rec && rec.checkIn && !rec.checkOut;
                  return `<tr class="${inOfficeNow ? "att-row-active" : ""}">
                    <td>
                      <div class="att-emp-cell">
                        <span class="av">${initials(emp.name)}</span>
                        <div><b>${escapeHtml(emp.name)}</b><span class="att-date-sub">+91 ${emp.mobile}</span></div>
                      </div>
                    </td>
                    <td>${escapeHtml(emp.role)}</td>
                    <td>${rec && rec.checkIn ? formatTime(new Date(rec.checkIn)) : "—"}</td>
                    <td>${rec && rec.checkOut ? formatTime(new Date(rec.checkOut)) : inOfficeNow ? '<span class="att-in-office">In office</span>' : "—"}</td>
                    <td>${rec ? formatDuration(rec.workMinutes) : "—"}</td>
                    <td><span class="status-pill ${attendanceStatusClass(st)}">${escapeHtml(st)}</span></td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="dash-panel">
        <div class="dash-panel-head"><h3>Monthly summary</h3></div>
        <p class="dash-panel-sub">Attendance totals for the current month across all employees.</p>
        <div class="att-table-wrap">
          <table class="dash-table att-table">
            <thead><tr><th>Employee</th><th>Present days</th><th>Late days</th><th>Avg. hours</th></tr></thead>
            <tbody>
              ${EMPLOYEE_ROSTER.map((emp) => {
                const s = getEmployeeMonthStats(emp.mobile);
                return `<tr>
                  <td><b>${escapeHtml(emp.name)}</b></td>
                  <td>${s.present}</td>
                  <td>${s.late}</td>
                  <td>${formatDuration(s.avgMins)}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>`;

    const dateInput = $("#attAdminDate", root);
    if (dateInput) {
      dateInput.addEventListener("change", () => {
        root.dataset.filterDate = dateInput.value || dateKey();
        renderAdminAttendance(root);
      });
    }
  }

  function renderEmployeeAttendanceOverview(role) {
    let panel = $("#attOverviewPanel");
    if (role !== "employee" && role !== "superadmin") {
      if (panel) panel.remove();
      return;
    }

    const overview = $("#dashView-overview");
    if (!overview) return;

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "attOverviewPanel";
      panel.className = "dash-panel att-overview-panel";
      const livePanel = $("#liveAppsPanel");
      if (livePanel) overview.insertBefore(panel, livePanel);
      else overview.prepend(panel);
    }

    if (role === "employee") {
      const today = dateKey();
      const rec = getRecord(state.user.mobile, today);
      const st = rec ? deriveStatus(rec) : "Not checked in";
      const canCheckIn = !rec || (!rec.checkIn && rec.status !== "On Leave");
      const canCheckOut = rec && rec.checkIn && !rec.checkOut;

      panel.innerHTML = `
        <div class="att-overview-grid">
          <div>
            <div class="dash-panel-head" style="margin-bottom:0;"><h3>Today's attendance</h3></div>
            <p>Status: <span class="status-pill ${attendanceStatusClass(st)}">${escapeHtml(st)}</span>
              ${rec && rec.checkIn ? ` · In ${formatTime(new Date(rec.checkIn))}` : ""}
              ${rec && rec.checkOut ? ` · Out ${formatTime(new Date(rec.checkOut))}` : ""}
            </p>
          </div>
          <div class="att-overview-actions">
            ${canCheckIn ? `<button type="button" class="btn btn-primary btn-sm" id="attOverviewCheckIn">Check In</button>` : ""}
            ${canCheckOut ? `<button type="button" class="btn btn-yellow btn-sm" id="attOverviewCheckOut">Check Out</button>` : ""}
            <button type="button" class="btn btn-outline btn-sm" id="attOverviewOpen">View full log</button>
          </div>
        </div>`;

      $("#attOverviewCheckIn", panel)?.addEventListener("click", () => {
        checkInEmployee();
        renderEmployeeAttendanceOverview("employee");
      });
      $("#attOverviewCheckOut", panel)?.addEventListener("click", () => {
        checkOutEmployee();
        renderEmployeeAttendanceOverview("employee");
      });
      $("#attOverviewOpen", panel)?.addEventListener("click", () => {
        $$("#dashNav a").forEach((a) => a.classList.toggle("active", a.dataset.view === "attendance"));
        switchDashView("attendance");
      });
      return;
    }

    const today = dateKey();
    const inOffice = EMPLOYEE_ROSTER.filter((e) => {
      const r = getRecord(e.mobile, today);
      return r && r.checkIn && !r.checkOut;
    }).length;
    const checkedIn = EMPLOYEE_ROSTER.filter((e) => {
      const r = getRecord(e.mobile, today);
      return r && r.checkIn;
    }).length;

    panel.innerHTML = `
      <div class="att-overview-grid">
        <div>
          <div class="dash-panel-head" style="margin-bottom:0;"><h3>Team attendance today</h3></div>
          <p><b>${checkedIn}</b> of ${EMPLOYEE_ROSTER.length} checked in · <b>${inOffice}</b> currently in office</p>
        </div>
        <div class="att-overview-actions">
          <button type="button" class="btn btn-outline btn-sm" id="attOverviewOpen">Open attendance monitor</button>
        </div>
      </div>`;

    $("#attOverviewOpen", panel)?.addEventListener("click", () => {
      $$("#dashNav a").forEach((a) => a.classList.toggle("active", a.dataset.view === "attendance"));
      switchDashView("attendance");
    });
  }

  /* ---------- apply / file service (customer) ---------- */
  function initServiceApply() {
    $$(".js-apply-service").forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = btn.closest(".svc-card");
        const service = card.dataset.service;
        const category = card.dataset.cat;
        openApplyModal(service, category);
      });
    });

    $("#applyModalClose").addEventListener("click", closeApplyModal);
    $("#applyModalOverlay").addEventListener("click", (e) => {
      if (e.target.id === "applyModalOverlay") closeApplyModal();
    });

    $("#applyFileInput").addEventListener("change", (e) => {
      Array.from(e.target.files || []).forEach((file) => {
        state.pendingFiles.push({ name: file.name, size: file.size });
      });
      e.target.value = "";
      renderFileChips();
    });

    $("#applySubmitBtn").addEventListener("click", submitApplication);
  }

  function openApplyModal(service, category) {
    state.activeApply = { service, category };
    state.pendingFiles = [];

    $("#applyModalTag").textContent = { gst: "GST", tax: "Income Tax", reg: "Registrations", acc: "Accounting", other: "Other" }[category] || "Service";
    $("#applyModalTitle").textContent = service;
    $("#applyNotes").value = "";
    $("#applyFileError").classList.add("hidden");

    const docs = SERVICE_DOCS[service] || [];
    $("#applyDocChecklist").innerHTML = docs.map((d) => `<li>${d}</li>`).join("");

    renderFileChips();
    $("#applyModalOverlay").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeApplyModal() {
    $("#applyModalOverlay").classList.add("hidden");
    document.body.style.overflow = "";
    state.activeApply = null;
  }

  function renderFileChips() {
    const wrap = $("#fileChips");
    wrap.innerHTML = state.pendingFiles
      .map(
        (f, i) => `
        <span class="file-chip" data-idx="${i}">
          ${escapeHtml(f.name)}
          <button type="button" aria-label="Remove file">&times;</button>
        </span>`
      )
      .join("");
    $$(".file-chip button", wrap).forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.closest(".file-chip").dataset.idx);
        state.pendingFiles.splice(idx, 1);
        renderFileChips();
      });
    });
  }

  function submitApplication() {
    if (!state.pendingFiles.length) {
      $("#applyFileError").classList.remove("hidden");
      return;
    }
    $("#applyFileError").classList.add("hidden");

    const { service, category } = state.activeApply;
    const record = {
      id: "APP-" + Date.now().toString(36).toUpperCase(),
      __ts: Date.now(),
      service,
      category,
      docs: (SERVICE_DOCS[service] || []).slice(),
      files: state.pendingFiles.slice(),
      notes: $("#applyNotes").value.trim(),
      customerMobile: state.user ? state.user.mobile : state.mobile,
      status: "Submitted",
      submittedAt: nowStamp(),
    };
    state.applications.unshift(record);

    closeApplyModal();
    showToast(`Application submitted for "${service}". We'll be in touch shortly.`);
    renderMyApplications();

    if (!$("#view-dashboard").classList.contains("hidden")) {
      renderLiveApps();
    }

    switchCustomerPage("services");
    requestAnimationFrame(() => {
      document.querySelector("#my-applications")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function statusClass(status) {
    if (status === "Done" || status === "Completed" || status === "Approved" || status === "Paid") return "done";
    if (status === "Review" || status === "In Review") return "review";
    if (status === "Accepted" || status === "In Progress" || status === "Processing") return "accepted";
    if (status === "Rejected") return "review";
    if (status === "Pending") return "pending";
    return "submitted";
  }

  function appCardHtml(app, opts) {
    opts = opts || {};
    const docsHtml = (app.files || [])
      .map((f) => `<span class="app-doc-chip">${escapeHtml(f.name)}</span>`)
      .join("");
    let actionsHtml = "";
    const src = opts.source || "customer";
    const clientMobile = app.customerMobile || app.clientMobile || "";
    const clientLabel = app.clientName ? `${escapeHtml(app.clientName)} · +91 ${clientMobile}` : `+91 ${clientMobile}`;

    if (opts.staffActions) {
      if (app.status === "Submitted") {
        actionsHtml = `
          <div class="app-actions-row">
            <button type="button" class="primary" data-action="accept" data-id="${app.id}" data-src="${src}">Accept</button>
          </div>`;
      } else if (app.status === "Accepted") {
        actionsHtml = `
          <div class="app-actions-row">
            <button type="button" data-action="review" data-id="${app.id}" data-src="${src}">Mark in review</button>
            <button type="button" class="primary" data-action="done" data-id="${app.id}" data-src="${src}">Mark done</button>
          </div>`;
      } else if (app.status === "In Review") {
        actionsHtml = `
          <div class="app-actions-row">
            <button type="button" class="primary" data-action="done" data-id="${app.id}" data-src="${src}">Mark done</button>
          </div>`;
      } else {
        actionsHtml = `<div class="app-actions-row"><span style="font-size:11.5px;color:var(--ink-soft);">Filing complete ✓</span></div>`;
      }
    } else if (opts.agentActions) {
      actionsHtml = `
        <div class="app-actions-row">
          <button type="button" data-action="followup" data-id="${app.id}" data-src="agent">Follow up</button>
        </div>`;
    }

    return `
      <div class="app-card">
        <div class="app-main">
          <div class="app-service">${escapeHtml(app.service)}${src === "agent" ? ' <span class="app-doc-chip">Agent referral</span>' : ""}</div>
          <div class="app-meta">
            <span>🆔 ${app.id}</span>
            <span>👤 ${clientLabel}</span>
            <span>🕒 ${app.submittedAt}</span>
            ${app.agentName ? `<span>🤝 ${escapeHtml(app.agentName)}</span>` : ""}
          </div>
          ${docsHtml ? `<div class="app-docs">${docsHtml}</div>` : ""}
          ${app.notes ? `<div class="app-meta" style="margin-top:6px;">📝 ${escapeHtml(app.notes)}</div>` : ""}
        </div>
        <div class="app-actions">
          <span class="status-pill ${statusClass(app.status)}">${app.status}</span>
          ${actionsHtml}
        </div>
      </div>`;
  }

  function renderMyApplications() {
    const list = $("#myAppList");
    if (!list) return;
    const mine = state.applications.filter(
      (a) => a.customerMobile === (state.user ? state.user.mobile : state.mobile)
    );
    if (!mine.length) {
      list.innerHTML = `
        <div class="myapp-empty" id="myAppEmpty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p>You haven't filed anything yet. Pick a service above and hit <b>Apply / File Now</b> to get started — it only takes a couple of minutes.</p>
        </div>`;
      return;
    }
    list.innerHTML = mine.map((a) => appCardHtml(a, {})).join("");
  }

  function renderLiveApps() {
    const listEl = $("#liveAppsList");
    const emptyEl = $("#liveAppsEmpty");
    if (!listEl) return;

    const combined = [
      ...state.applications.map((a) => ({ ...a, __src: "customer" })),
      ...state.agentFilings.map((a) => ({ ...a, __src: "agent" })),
    ].sort((a, b) => (b.__ts || 0) - (a.__ts || 0));

    if (!combined.length) {
      listEl.innerHTML = "";
      emptyEl.classList.remove("hidden");
      return;
    }
    emptyEl.classList.add("hidden");

    const isAgent = state.role === "agent";
    const relevant = isAgent ? combined.filter((a) => a.__src === "agent" && (a.agentMobile === agentIdentifier() || a.agentEmail === agentIdentifier())) : combined;

    if (!relevant.length) {
      listEl.innerHTML = "";
      emptyEl.classList.remove("hidden");
      return;
    }

    listEl.innerHTML = relevant
      .map((a) => appCardHtml(a, { staffActions: !isAgent, agentActions: isAgent, source: a.__src }))
      .join("");

    $$("[data-action]", listEl).forEach((btn) => {
      btn.addEventListener("click", () => {
        handleFilingAction(btn.dataset.src, btn.dataset.id, btn.dataset.action);
        renderLiveApps();
      });
    });
  }

  function renderLiveEnquiries() {
    const tableEl = $("#liveEnquiriesTable");
    const bodyEl = $("#liveEnquiriesBody");
    const emptyEl = $("#liveEnquiriesEmpty");
    if (!tableEl) return;

    if (!state.enquiries.length) {
      tableEl.style.display = "none";
      emptyEl.classList.remove("hidden");
      return;
    }
    emptyEl.classList.add("hidden");
    tableEl.style.display = "table";
    bodyEl.innerHTML = state.enquiries
      .map(
        (q) => `
        <tr>
          <td>${escapeHtml(q.name)}</td>
          <td>${escapeHtml(q.mobile)}</td>
          <td>${escapeHtml(q.requirement)}</td>
          <td>${q.receivedAt}</td>
        </tr>`
      )
      .join("");
  }

  /* ---------- logout ---------- */
  function doLogout() {
    $("#view-app").classList.add("hidden");
    $("#view-app").style.display = "none";
    $("#view-dashboard").classList.add("hidden");
    $("#view-dashboard").style.display = "none";
    hideAgentEnrollView();
    hideAgentStatusView();
    $("#view-login").classList.remove("hidden");

    $("#step-otp").classList.add("hidden");
    $("#step-mobile").classList.remove("hidden");
    $("#mobileInput").value = "";
    $("#emailInput").value = "";
    $("#sendOtpBtn").disabled = true;
    $$(".otp-box").forEach((b) => (b.value = ""));
    state.otp = "";
    state.mobile = "";
    state.email = "";
    state.user = null;
    state.currentAgent = null;
    state.enrollFromDashboard = false;
    stopAttendanceClock();
    showToast("You have been logged out");
  }

  function initLogout() {
    // Delegated listener so this also works for .js-logout buttons that
    // get injected into the page later (e.g. the pending/rejected status
    // screen's "Sign out" button, which is created dynamically).
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".js-logout");
      if (btn) doLogout();
    });
  }

  /* ---------- services filter ---------- */
  function initServiceTabs() {
    const tabs = $$(".svc-tab");
    const cards = $$(".svc-card");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const cat = tab.dataset.cat;
        cards.forEach((card) => {
          card.style.display = cat === "all" || card.dataset.cat === cat ? "flex" : "none";
        });
      });
    });
  }

  /* ---------- mobile nav ---------- */
  function initMobileNav() {
    const btn = $("#hamburgerBtn");
    const nav = $("#mainNav");
    if (!btn) return;
    btn.addEventListener("click", () => {
      nav.classList.toggle("open-mobile");
      nav.style.display = nav.classList.contains("open-mobile") ? "flex" : "";
    });
  }

  /* ---------- contact form ---------- */
  function initContactForm() {
    const form = $("#contactForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      state.enquiries.unshift({
        name: $("#cf-name").value.trim() || "—",
        mobile: $("#cf-mobile").value.trim() || "—",
        email: $("#cf-email").value.trim(),
        requirement: $("#cf-req").value,
        message: $("#cf-msg").value.trim(),
        receivedAt: nowStamp(),
      });

      showToast("Thanks! Your enquiry has been recorded. We'll call you shortly.");
      form.reset();

      if (!$("#view-dashboard").classList.contains("hidden")) {
        renderLiveEnquiries();
      }
    });
  }

  /* ---------- scroll-reveal ---------- */
  function initScrollReveal() {
    const targets = $$("[data-reveal]");
    if (!targets.length || !("IntersectionObserver" in window)) {
      targets.forEach((t) => t.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((t) => io.observe(t));
  }

  /* ---------- animated counters ---------- */
  function animateCounters() {
    $$(".counter").forEach((el) => {
      const target = parseInt(el.dataset.target, 10) || 0;
      const duration = 1100;
      const start = performance.now();
      function tick(now) {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target).toLocaleString("en-IN");
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    loadAttendance();
    loadAgents();
    loadAgentFilings();
    loadCommissionClaims();
    initRoleTabs();
    initMethodTabs();
    initMobileStep();
    initOtpBoxes();
    initOtpActions();
    initLogout();
    initServiceTabs();
    initMobileNav();
    initCustomerNav();
    initContactForm();
    initServiceApply();
    initAgentEnrollForm();
    initAgentEnrollBackBtn();
  });
})();