/* =========================================================
   TT Tours & Travels - Master Engine (script.js)
   Official URL: https://toursntrave.netlify.app/
   DigiLocker PDF/Image Upload + Invoice Printing + Admin CMS
   UPDATED: Smart KYC logic
     - Logged-in customers (KYC already on file) -> no re-upload
     - Guests -> must upload KYC in booking modal
     - Bicycles -> only Aadhaar/Govt ID required, no license
========================================================= */

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mpqeojqj";
const WHATSAPP_NUMBER = "917981793207";
const OFFICIAL_WEBSITE_URL = "https://toursntrave.netlify.app/";
const ADMIN_CREDENTIALS = { user: "admin", pass: "admin123" };

// Hub Coordinates for Live GPS Simulation & Routing
const HUB_COORDINATES = {
  "Hyderabad": { coords: "17.4399° N, 78.3806° E", mapUrl: "17.4399,78.3806", name: "Hyderabad Central Hub" },
  "Bengaluru": { coords: "12.9352° N, 77.6245° E", mapUrl: "12.9352,77.6245", name: "Bengaluru Koramangala Hub" },
  "Goa": { coords: "15.5186° N, 73.7634° E", mapUrl: "15.5186,73.7634", name: "Goa Candolim Coastal Hub" },
  "Manali": { coords: "32.2432° N, 77.1892° E", mapUrl: "32.2432,77.1892", name: "Manali Mall Road Base" },
  "Visakhapatnam": { coords: "17.7126° N, 83.3182° E", mapUrl: "17.7126,83.3182", name: "Vizag Beach Road Base" },
  "Dehradun": { coords: "30.3165° N, 78.0322° E", mapUrl: "30.3165,78.0322", name: "Dehradun / Rishikesh Hub" }
};

// Default Fleet Database (Stored in localStorage for Admin CMS control)
const defaultFleet = [
  {
    id: 1,
    name: "Royal Enfield Himalayan 450",
    type: "bike",
    tag: "High-Altitude Sherpa DOHC",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
    engine: "452cc / 40 BHP",
    speed: "Switchable ABS",
    fuel: "Unlimited KMs",
    price: 1800
  },
  {
    id: 2,
    name: "Mahindra Thar 4x4 Hardtop Diesel",
    type: "car",
    tag: "Off-Road Trail Boss",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80",
    engine: "2.2L mHawk / 4WD",
    speed: "4-Seater Hardtop",
    fuel: "Unlimited KMs",
    price: 3800
  },
  {
    id: 3,
    name: "Trek Marlin 7 Gen 3",
    type: "bicycle",
    tag: "Shimano Deore 1x10 MTB",
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80",
    engine: "Hydraulic Disc",
    speed: "RockShox Fork",
    fuel: "Helmet Included",
    price: 450
  },
  {
    id: 4,
    name: "BMW R 1250 GS Adventure",
    type: "bike",
    tag: "Flagship Overland Boxer",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80",
    engine: "1254cc / ShiftCam",
    speed: "TFT Nav & Panniers",
    fuel: "Unlimited KMs",
    price: 6500
  },
  {
    id: 5,
    name: "Hyundai Creta SX (O) Automatic",
    type: "car",
    tag: "Panoramic Sunroof Cruiser",
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
    engine: "1.5L Turbo Petrol",
    speed: "Automatic / ADAS",
    fuel: "Unlimited KMs",
    price: 2900
  },
  {
    id: 6,
    name: "Giant Talon 29er MTB",
    type: "bicycle",
    tag: "Cross-Country Trail Machine",
    image: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=600&q=80",
    engine: "ALUXX Grade Alloy",
    speed: "29-inch Tubeless",
    fuel: "Pro Kit Included",
    price: 350
  },
  {
    id: 7,
    name: "KTM 390 Adventure SW",
    type: "bike",
    tag: "Corner Carver & Gravel Trail",
    image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=600&q=80",
    engine: "373cc / Quickshifter",
    speed: "Spoke Wheels",
    fuel: "Unlimited KMs",
    price: 2100
  },
  {
    id: 8,
    name: "Maruti Suzuki Jimny 4x4 Alpha",
    type: "car",
    tag: "Mountain Trail Rock Climber",
    image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80",
    engine: "1.5L K15B AllGrip",
    speed: "Low Range 4WD",
    fuel: "Unlimited KMs",
    price: 3200
  },
  {
    id: 9,
    name: "Royal Enfield Interceptor 650",
    type: "bike",
    tag: "Parallel Twin Retro Cafe",
    image: "https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=600&q=80",
    engine: "648cc Twin / 47 HP",
    speed: "Slipper Clutch",
    fuel: "Unlimited KMs",
    price: 2200
  },
  {
    id: 10,
    name: "Toyota Innova Crysta ZX Diesel",
    type: "car",
    tag: "Captain Seat Family Tourer",
    image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80",
    engine: "2.4L Turbo Diesel",
    speed: "7-Seater Luxury",
    fuel: "Unlimited KMs",
    price: 4200
  },
  {
    id: 11,
    name: "Royal Enfield Classic 350 Reborn",
    type: "bike",
    tag: "Highway Touring Icon",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80",
    engine: "349cc J-Series",
    speed: "Dual Disc ABS",
    fuel: "Unlimited KMs",
    price: 1400
  },
  {
    id: 12,
    name: "Montra Helicon Disc Hybrid",
    type: "bicycle",
    tag: "Urban Coastal Commuter",
    image: "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=600&q=80",
    engine: "Alloy 6061 Frame",
    speed: "21-Speed Tourney",
    fuel: "Bottle Holder + Lock",
    price: 300
  }
];

let selectedVehicle = null;
let currentPricing = { base: 0, addon: 0, tax: 0, total: 0 };

document.addEventListener('DOMContentLoaded', () => {
  initLocalStorage();
  renderFleet(getStoredFleet(), 'landingFleetGrid');
  renderFleet(getStoredFleet(), 'dedicatedFleetGrid');
  setupNavbarScroll();
  setupStripTabs();
  setupCalculationListeners();
  setupMobileNav();
  syncCustomerSession();
});

/* =========================================================
   LOCAL STORAGE DATABASE & CMS INITIALIZATION
========================================================= */
function initLocalStorage() {
  if (!localStorage.getItem('tt_bookings')) {
    localStorage.setItem('tt_bookings', JSON.stringify([]));
  }
  if (!localStorage.getItem('tt_inquiries')) {
    localStorage.setItem('tt_inquiries', JSON.stringify([]));
  }
  if (!localStorage.getItem('tt_users')) {
    localStorage.setItem('tt_users', JSON.stringify([]));
  }
  if (!localStorage.getItem('tt_fleet')) {
    localStorage.setItem('tt_fleet', JSON.stringify(defaultFleet));
  }
}

function getStoredFleet() {
  return JSON.parse(localStorage.getItem('tt_fleet') || JSON.stringify(defaultFleet));
}

function saveStoredFleet(fleetArray) {
  localStorage.setItem('tt_fleet', JSON.stringify(fleetArray));
}

function getStoredBookings() {
  return JSON.parse(localStorage.getItem('tt_bookings') || '[]');
}

function saveStoredBookings(data) {
  localStorage.setItem('tt_bookings', JSON.stringify(data));
}

function getStoredInquiries() {
  return JSON.parse(localStorage.getItem('tt_inquiries') || '[]');
}

function saveStoredInquiries(data) {
  localStorage.setItem('tt_inquiries', JSON.stringify(data));
}

/* =========================================================
   ADMIN CMS MANAGEMENT (ADD / DELETE VEHICLES)
========================================================= */
function switchAdminTab(tabName) {
  const btnBookings = document.querySelector('.admin-cms-tabs button:nth-child(1)');
  const btnCms = document.querySelector('.admin-cms-tabs button:nth-child(2)');
  const paneBookings = document.getElementById('adminTabBookings');
  const paneCms = document.getElementById('adminTabCms');

  if (tabName === 'bookings') {
    btnBookings.classList.add('active');
    btnCms.classList.remove('active');
    paneBookings.style.display = 'block';
    paneCms.style.display = 'none';
  } else {
    btnCms.classList.add('active');
    btnBookings.classList.remove('active');
    paneCms.style.display = 'block';
    paneBookings.style.display = 'none';
    renderAdminInventoryTable();
  }
}

function handleAddNewVehicle(e) {
  e.preventDefault();
  const fleet = getStoredFleet();

  const newVehicle = {
    id: Date.now(),
    name: document.getElementById('cmsNewName').value.trim(),
    type: document.getElementById('cmsNewType').value,
    tag: document.getElementById('cmsNewTag').value.trim(),
    image: document.getElementById('cmsNewImage').value.trim(),
    engine: document.getElementById('cmsNewEngine').value.trim(),
    speed: document.getElementById('cmsNewSpeed').value.trim(),
    fuel: "Unlimited KMs",
    price: parseInt(document.getElementById('cmsNewPrice').value) || 1500
  };

  fleet.push(newVehicle);
  saveStoredFleet(fleet);

  renderFleet(fleet, 'landingFleetGrid');
  renderFleet(fleet, 'dedicatedFleetGrid');
  renderAdminInventoryTable();

  alert(`✨ Success! "${newVehicle.name}" has been added to the live website catalog.`);
  document.getElementById('addNewVehicleForm').reset();
}

function deleteFleetVehicle(id) {
  if (confirm("Are you sure you want to remove this vehicle from the website inventory?")) {
    let fleet = getStoredFleet();
    fleet = fleet.filter(v => v.id !== id);
    saveStoredFleet(fleet);

    renderFleet(fleet, 'landingFleetGrid');
    renderFleet(fleet, 'dedicatedFleetGrid');
    renderAdminInventoryTable();
  }
}

function renderAdminInventoryTable() {
  const fleet = getStoredFleet();
  const tbody = document.getElementById('adminInventoryTableBody');

  if (fleet.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No active vehicles in inventory.</td></tr>`;
    return;
  }

  tbody.innerHTML = fleet.map(v => `
    <tr>
      <td><img src="${v.image}" alt="${v.name}" style="width: 50px; height: 35px; object-fit: cover; border-radius: 4px;"></td>
      <td><strong>${v.name}</strong><br><small style="color: var(--text-muted);">${v.tag}</small></td>
      <td><span style="text-transform: uppercase; font-weight: 700; font-size: 0.72rem; background: #e2e8f0; padding: 0.15rem 0.5rem; border-radius: 4px;">${v.type}</span></td>
      <td><strong style="color: var(--adventure-orange);">₹${v.price} / day</strong></td>
      <td><small>${v.engine} | ${v.speed}</small></td>
      <td>
        <button class="btn-admin-act del" onclick="deleteFleetVehicle(${v.id})"><i class="fa-solid fa-trash"></i> Remove</button>
      </td>
    </tr>
  `).join('');
}

/* =========================================================
   CUSTOMER AUTHENTICATION & DASHBOARD
========================================================= */
function syncCustomerSession() {
  const loggedUser = JSON.parse(localStorage.getItem('tt_current_user') || 'null');
  const userLabel = document.getElementById('navUserLabel');
  const userIcon = document.getElementById('navUserIcon');

  if (loggedUser) {
    if (userLabel) userLabel.innerText = `${loggedUser.name.split(' ')[0]} (My Hub)`;
    if (userIcon) userIcon.className = "fa-solid fa-circle-user";

    if (document.getElementById('custName')) document.getElementById('custName').value = loggedUser.name;
    if (document.getElementById('custPhone')) document.getElementById('custPhone').value = loggedUser.phone;
  } else {
    if (userLabel) userLabel.innerText = "Account / Login";
    if (userIcon) userIcon.className = "fa-solid fa-user-shield";
  }
}

function openUserAuthModal() {
  const loggedUser = JSON.parse(localStorage.getItem('tt_current_user') || 'null');
  const modal = document.getElementById('userAuthModal');

  if (loggedUser) {
    document.getElementById('customerAuthFormsState').style.display = 'none';
    document.getElementById('customerDashboardState').style.display = 'block';
    document.getElementById('dashCustomerGreeting').innerText = `Welcome Back, ${loggedUser.name}!`;
    renderCustomerDashboard(loggedUser);
  } else {
    document.getElementById('customerAuthFormsState').style.display = 'block';
    document.getElementById('customerDashboardState').style.display = 'none';
    toggleAuthTab('login');
  }

  modal.classList.add('active');
}

function closeUserAuthModal() {
  document.getElementById('userAuthModal').classList.remove('active');
}

function toggleAuthTab(tabType) {
  const tabLogin = document.getElementById('tabCustomerLogin');
  const tabReg = document.getElementById('tabCustomerRegister');
  const formLogin = document.getElementById('customerLoginForm');
  const formReg = document.getElementById('customerRegisterForm');

  if (tabType === 'login') {
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
    formLogin.style.display = 'block';
    formReg.style.display = 'none';
  } else {
    tabReg.classList.add('active');
    tabLogin.classList.remove('active');
    formReg.style.display = 'block';
    formLogin.style.display = 'none';
  }
}

async function handleCustomerRegister(e) {
  e.preventDefault();
  const users = JSON.parse(localStorage.getItem('tt_users') || '[]');
  const name = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const pass = document.getElementById('regPassword').value;

  const licenseFileInp = document.getElementById('regLicenseFile');
  const aadhaarFileInp = document.getElementById('regAadhaarFile');

  const readFileAsDataURL = (file) => {
    return new Promise((resolve) => {
      if (!file) return resolve('');
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  };

  const licenseDataUrl = licenseFileInp.files[0] ? await readFileAsDataURL(licenseFileInp.files[0]) : '';
  const aadhaarDataUrl = aadhaarFileInp.files[0] ? await readFileAsDataURL(aadhaarFileInp.files[0]) : '';

  if (users.find(u => u.phone === phone || u.email === email)) {
    alert("An account with this phone number or email already exists! Please sign in.");
    toggleAuthTab('login');
    return;
  }

  const newUser = { id: Date.now(), name, phone, email, licenseFile: licenseDataUrl, aadhaarFile: aadhaarDataUrl, pass };
  users.push(newUser);
  localStorage.setItem('tt_users', JSON.stringify(users));
  localStorage.setItem('tt_current_user', JSON.stringify(newUser));

  syncCustomerSession();
  openUserAuthModal();
}

function handleCustomerLogin(e) {
  e.preventDefault();
  const users = JSON.parse(localStorage.getItem('tt_users') || '[]');
  const idf = document.getElementById('loginIdentifier').value.trim().toLowerCase();
  const pass = document.getElementById('loginPassword').value;

  const foundUser = users.find(u => (u.phone === idf || u.email.toLowerCase() === idf) && u.pass === pass);

  if (foundUser) {
    localStorage.setItem('tt_current_user', JSON.stringify(foundUser));
    syncCustomerSession();
    openUserAuthModal();
  } else {
    alert("Invalid credentials! Please verify your phone number and password.");
  }
}

function handleCustomerLogout() {
  localStorage.removeItem('tt_current_user');
  syncCustomerSession();
  closeUserAuthModal();
}

function renderCustomerDashboard(user) {
  const allBookings = getStoredBookings();
  const userBookings = allBookings.filter(b => b.customerPhone === user.phone || b.customerEmail === user.email);
  const bookingsContainer = document.getElementById('customerBookingsList');

  if (userBookings.length === 0) {
    bookingsContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.8rem; padding: 0.5rem;">No active reservations found for phone (${user.phone}). Book a machine to track live dispatch status.</p>`;
  } else {
    bookingsContainer.innerHTML = userBookings.slice().reverse().map(b => {
      let statusClass = "pending";
      if (b.status === "Approved & Dispatched") statusClass = "approved";
      if (b.status === "Rejected / Unavailable") statusClass = "rejected";

      return `
        <div class="history-card-item">
          <div class="history-card-header">
            <div>
              <strong>${b.vehicleName}</strong> (${b.durationDays} Days)<br>
              <span style="font-size: 0.75rem; color: var(--text-muted);"><i class="fa-solid fa-map-pin"></i> ${b.travelDestinationInIndia} | Ref: ${b.refId}</span>
            </div>
            <div style="text-align: right;">
              <span class="status-badge ${statusClass}">${b.status || 'Pending Approval'}</span><br>
              <strong style="color: var(--adventure-orange); font-size: 0.85rem;">${b.totalAmount}</strong>
            </div>
          </div>
          <button class="btn-cust-track" onclick="openLiveGpsTracker('${b.refId}')">
            <i class="fa-solid fa-satellite-dish"></i> Track Live Vehicle / Route GPS
          </button>
        </div>
      `;
    }).join('');
  }

  const allInquiries = getStoredInquiries();
  const userInquiries = allInquiries.filter(i => i.phone === user.phone || i.email === user.email);
  const inqContainer = document.getElementById('customerInquiriesList');

  if (userInquiries.length === 0) {
    inqContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.8rem; padding: 0.5rem;">No custom queries logged.</p>`;
  } else {
    inqContainer.innerHTML = userInquiries.slice().reverse().map(i => `
      <div class="history-card-item">
        <div>
          <strong>Query Logged:</strong> ${i.message.substring(0, 45)}...<br>
          <span style="font-size: 0.72rem; color: var(--text-muted);">${new Date(i.timestamp).toLocaleString()}</span>
        </div>
        <span class="status-badge approved">Received by Desk</span>
      </div>
    `).join('');
  }
}

/* =========================================================
   LIVE GPS TRACKER & VEHICLE TELEMETRY SYSTEM
========================================================= */
function openLiveGpsTracker(refId) {
  const bookings = getStoredBookings();
  const booking = bookings.find(b => b.refId === refId);
  if (!booking) return;

  const city = booking.pickupCity || "Hyderabad";
  const hubInfo = HUB_COORDINATES[city] || HUB_COORDINATES["Hyderabad"];

  document.getElementById('gpsModalVehicleTitle').innerText = `${booking.vehicleName} - Live Radar`;
  document.getElementById('gpsModalRef').innerText = `Booking Ref: ${booking.refId} | Customer: ${booking.customerName}`;
  document.getElementById('gpsCoordinates').innerText = hubInfo.coords;
  document.getElementById('gpsDestination').innerText = booking.travelDestinationInIndia || "Local City Commute";

  const markerIcon = document.getElementById('gpsMarkerIcon');
  const category = (booking.vehicleCategory || booking.vehicleType || '').toLowerCase();
  if (category.includes('bicycle')) {
    markerIcon.className = "fa-solid fa-bicycle";
  } else if (category.includes('bike')) {
    markerIcon.className = "fa-solid fa-motorcycle";
  } else {
    markerIcon.className = "fa-solid fa-car-side";
  }

  if (booking.status === "Approved & Dispatched") {
    document.getElementById('gpsDeliveryStage').innerText = `Dispatched for Handover (${booking.pickupDeliveryType || 'Hub'})`;
    document.getElementById('gpsDeliveryStage').style.color = "var(--emerald-teal)";
    document.getElementById('gpsSpeed').innerText = "28 km/h (In Transit)";
  } else if (booking.status === "Rejected / Unavailable") {
    document.getElementById('gpsDeliveryStage').innerText = "Booking Not Approved";
    document.getElementById('gpsDeliveryStage').style.color = "#dc2626";
    document.getElementById('gpsSpeed').innerText = "Offline";
  } else {
    document.getElementById('gpsDeliveryStage').innerText = "Awaiting Dispatch Approval";
    document.getElementById('gpsDeliveryStage').style.color = "var(--adventure-orange)";
    document.getElementById('gpsSpeed').innerText = "Stationary (Hub Bay)";
  }

  document.getElementById('gpsExternalMapsBtn').href = `https://www.google.com/maps/dir/?api=1&destination=${hubInfo.mapUrl}`;
  document.getElementById('liveGpsModal').classList.add('active');
}

function closeLiveGpsModal() {
  document.getElementById('liveGpsModal').classList.remove('active');
}

/* =========================================================
   ADMIN MANAGEMENT CONSOLE & INVOICING / KYC VERIFICATION
========================================================= */
function handleAdminLogin(e) {
  e.preventDefault();
  const user = document.getElementById('adminUsername').value.trim();
  const pass = document.getElementById('adminPassword').value.trim();

  if (user === ADMIN_CREDENTIALS.user && pass === ADMIN_CREDENTIALS.pass) {
    sessionStorage.setItem('tt_admin_auth', 'true');
    renderAdminDashboard();
  } else {
    alert("Invalid administrative credentials!");
  }
}

function handleAdminLogout() {
  sessionStorage.removeItem('tt_admin_auth');
  document.getElementById('adminDashboardPanel').style.display = 'none';
  document.getElementById('adminLoginBox').style.display = 'flex';

  const adminForm = document.getElementById('adminAuthForm');
  if (adminForm) adminForm.reset();

  switchView('landing-full');
}

/* =========================================================
   FIX: DigiLocker KYC File Viewer (License / Aadhaar)
   -----------------------------------------------------------
   Previously the admin table linked straight to the base64
   "data:" URL via <a href target="_blank">. Chrome/Edge block
   direct navigation to data: URLs opened in a new tab for
   security reasons, so nothing appeared to happen on click.
   Fix: decode the base64 payload into a real Blob, generate a
   blob: URL from it, and open that instead — this opens/
   previews correctly for both PDFs and images.
========================================================= */
function openKycFile(refId, fileType) {
  const bookings = getStoredBookings();
  const b = bookings.find(item => item.refId === refId);
  if (!b) return;

  const dataUrl = fileType === 'license' ? b.licenseFile : b.aadhaarFile;
  if (!dataUrl) {
    alert("No file was attached for this document.");
    return;
  }

  try {
    const [header, base64Data] = dataUrl.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

    const byteString = atob(base64Data);
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([byteArray], { type: mime });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  } catch (err) {
    console.error("KYC file open error:", err);
    alert("Unable to open this document. The file may be corrupted.");
  }
}

function renderAdminDashboard() {
  document.getElementById('adminLoginBox').style.display = 'none';
  document.getElementById('adminDashboardPanel').style.display = 'block';

  const bookings = getStoredBookings();
  document.getElementById('adminTotalBookings').innerText = bookings.length;
  document.getElementById('adminPendingBookings').innerText = bookings.filter(b => !b.status || b.status === "Pending Approval").length;
  document.getElementById('adminApprovedBookings').innerText = bookings.filter(b => b.status === "Approved & Dispatched").length;

  const tbody = document.getElementById('adminBookingsTableBody');
  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No customer reservations logged yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.slice().reverse().map(b => {
    let statusClass = "pending";
    if (b.status === "Approved & Dispatched") statusClass = "approved";
    if (b.status === "Rejected / Unavailable") statusClass = "rejected";

    const isBicycleBooking = (b.vehicleCategory || '') === 'bicycle';

    const kycVerified = b.kycVerified
      ? `<span style="color:#059669; font-weight:700;"><i class="fa-solid fa-shield-check"></i> KYC Verified</span>`
      : `<span style="color:#d97706;"><i class="fa-solid fa-triangle-exclamation"></i> KYC Pending</span>`;

    const kycSourceTag = b.kycSource === 'account_on_file'
      ? `<span style="display:block; font-size:0.68rem; color:#0284c7; font-weight:700; margin-top:2px;"><i class="fa-solid fa-circle-check"></i> Auto-filled from customer account</span>`
      : '';

    const licenseLink = b.licenseFile
      ? `<a href="javascript:void(0)" onclick="openKycFile('${b.refId}','license')" style="color:var(--emerald-teal); font-weight:700; text-decoration:underline; cursor:pointer;">[View License PDF/Img]</a>`
      : (isBicycleBooking
          ? `<span style="color:var(--text-muted);">License Not Required (Bicycle)</span>`
          : `<span>No License Attached</span>`);

    const aadhaarLink = b.aadhaarFile
      ? `<a href="javascript:void(0)" onclick="openKycFile('${b.refId}','aadhaar')" style="color:var(--emerald-teal); font-weight:700; text-decoration:underline; cursor:pointer;">[View Aadhaar PDF/Img]</a>`
      : `<span>No Aadhaar Attached</span>`;

    return `
      <tr>
        <td><strong>${b.refId || 'N/A'}</strong><br><small style="color: var(--text-muted);">${new Date(b.timestamp || Date.now()).toLocaleDateString()}</small></td>
        <td>
          <strong>${b.customerName}</strong><br>
          <a href="tel:${b.customerPhone}" style="color: var(--emerald-teal); font-weight:700;">${b.customerPhone}</a><br>
          <div style="margin: 4px 0; font-size: 0.8rem; display: flex; flex-direction: column; gap: 2px;">
            ${licenseLink}
            ${aadhaarLink}
          </div>
          ${kycVerified}
          ${kycSourceTag}
        </td>
        <td>${b.vehicleName}<br><small style="color: var(--text-muted);">${b.durationDays} Days | ${b.selectedAddon}</small></td>
        <td><strong>${b.travelDestinationInIndia}</strong><br><small style="color: var(--text-muted);">${b.pickupDeliveryType}</small></td>
        <td><strong style="color: var(--adventure-orange);">${b.totalAmount}</strong><br><button onclick="generateAdminInvoice('${b.refId}')" class="btn-admin-act inv" style="margin-top:3px;"><i class="fa-solid fa-file-invoice-dollar"></i> Print Invoice</button></td>
        <td><span class="status-badge ${statusClass}">${b.status || 'Pending Approval'}</span></td>
        <td>
          <div class="admin-action-btn-group">
            <button class="btn-admin-act approve" onclick="updateBookingStatus('${b.refId}', 'Approved & Dispatched')"><i class="fa-solid fa-check"></i> Approve</button>
            <button class="btn-admin-act reject" onclick="updateBookingStatus('${b.refId}', 'Rejected / Unavailable')"><i class="fa-solid fa-xmark"></i> Reject</button>
            <button class="btn-admin-act nav" onclick="toggleKycVerification('${b.refId}')"><i class="fa-solid fa-id-card"></i> Verify KYC</button>
            <button class="btn-admin-act wa" onclick="sendClientWhatsAppUpdate('${b.refId}')"><i class="fa-brands fa-whatsapp"></i> Update Client</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updateBookingStatus(refId, newStatus) {
  const bookings = getStoredBookings();
  const index = bookings.findIndex(b => b.refId === refId);
  if (index !== -1) {
    bookings[index].status = newStatus;
    saveStoredBookings(bookings);
    renderAdminDashboard();
  }
}

function toggleKycVerification(refId) {
  const bookings = getStoredBookings();
  const index = bookings.findIndex(b => b.refId === refId);
  if (index !== -1) {
    bookings[index].kycVerified = !bookings[index].kycVerified;
    saveStoredBookings(bookings);
    renderAdminDashboard();
    alert(`DigiLocker KYC status for ${bookings[index].customerName} updated successfully.`);
  }
}

function generateAdminInvoice(refId) {
  const bookings = getStoredBookings();
  const b = bookings.find(item => item.refId === refId);
  if (!b) return;

  const invoiceWindow = window.open('', '_blank', 'width=800,height=600');
  invoiceWindow.document.write(`
    <html>
    <head>
      <title>Invoice - ${b.refId} | TT Tours & Travels</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; }
        .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #0e354a; padding-bottom: 20px; margin-bottom: 20px; }
        .invoice-title h1 { color: #0e354a; margin: 0; font-size: 24px; }
        .invoice-title p { color: #64748b; margin: 5px 0 0; font-size: 13px; }
        .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
        th, td { padding: 12px; border-bottom: 1px solid #cbd5e1; text-align: left; }
        th { background: #f1f5f9; color: #0e354a; }
        .total-box { text-align: right; font-size: 18px; font-weight: bold; color: #e86424; }
        .footer-note { text-align: center; margin-top: 50px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <div class="invoice-title">
          <h1>TT TOURS AND TRAVELS</h1>
          <p>Official Self-Drive Fleet & Expedition Invoicing Portal</p>
          <p>Website: ${OFFICIAL_WEBSITE_URL}</p>
        </div>
        <div>
          <h3>INVOICE VOUCHER</h3>
          <p><strong>Ref ID:</strong> ${b.refId}</p>
          <p><strong>Date:</strong> ${new Date(b.timestamp).toLocaleDateString()}</p>
        </div>
      </div>

      <div class="invoice-details">
        <div>
          <strong>Billed To:</strong><br>
          Name: ${b.customerName}<br>
          Phone: ${b.customerPhone}<br>
          Email: ${b.customerEmail || 'N/A'}<br>
          KYC Documents: ${b.aadhaarFile || b.licenseFile ? 'Attached' : 'Not Attached'} (${b.kycVerified ? 'APPROVED' : 'PENDING'})
        </div>
        <div>
          <strong>Dispatch & Route Details:</strong><br>
          Destination Circuit: ${b.travelDestinationInIndia}<br>
          Pickup Hub / Delivery: ${b.pickupDeliveryType}<br>
          Rental Duration: ${b.durationDays} Day(s)<br>
          Key Acceptance Agreement: Digitally Signed
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item / Description</th>
            <th>Duration</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Vehicle Rental: <strong>${b.vehicleName}</strong> (${b.vehicleType})</td>
            <td>${b.durationDays} Day(s)</td>
            <td>${b.totalAmount}</td>
          </tr>
          <tr>
            <td>Selected Gear Add-on: ${b.selectedAddon}</td>
            <td>Included</td>
            <td>Included / Active</td>
          </tr>
          <tr>
            <td>Govt. GST & Roadside Assistance Cover (18%)</td>
            <td>Active</td>
            <td>Included in Total</td>
          </tr>
        </tbody>
      </table>

      <div class="total-box">
        Total Payable Amount: ${b.totalAmount}
      </div>

      <div class="footer-note">
        <p>This is a computer-generated invoice for TT Tours & Travels. For support contact +91 7981793207.</p>
      </div>
      <script>window.print();</script>
    </body>
    </html>
  `);
  invoiceWindow.document.close();
}

// 1-Tap Admin WhatsApp Client Notification Generator (Points to https://toursntrave.netlify.app/)
function sendClientWhatsAppUpdate(refId) {
  const bookings = getStoredBookings();
  const b = bookings.find(item => item.refId === refId);
  if (!b) return;

  const cleanPhone = b.customerPhone.replace(/[^0-9]/g, '');
  const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  let approvalHeader = "✅ *YOUR RIDE RESERVATION IS CONFIRMED & APPROVED!*";
  if (b.status === "Rejected / Unavailable") {
    approvalHeader = "❌ *RESERVATION UPDATE - CURRENTLY UNAVAILABLE*";
  }

  const message = encodeURIComponent(
    `*TT TOURS & TRAVELS - OFFICIAL RESERVATION DISPATCH*\n\n` +
    `Dear ${b.customerName},\n\n` +
    `${approvalHeader}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `📋 *INVOICE & BOOKING SUMMARY*\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `• *Booking Ref ID:* ${b.refId}\n` +
    `• *Vehicle Model:* ${b.vehicleName}\n` +
    `• *Rental Duration:* ${b.durationDays} Day(s)\n` +
    `• *Travel Circuit:* ${b.travelDestinationInIndia}\n` +
    `• *Pickup / Handover:* ${b.pickupDeliveryType || 'Hub Station'}\n` +
    `• *Safety & Touring Gear:* ${b.selectedAddon}\n` +
    `• *Total Payable Tariff:* ${b.totalAmount} (Incl. GST & Insurance)\n` +
    `• *Live Dispatch Status:* ${b.status || 'Approved & Dispatched'}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `📍 *DIGILOCKER KYC & KEY ACCEPTANCE*\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Your KYC documents have been uploaded and your digital key acceptance agreement is active. You can track live GPS telemetry directly in your Customer Hub on our website.\n\n` +
    `📞 *24/7 Roadside Assistance:* +91 7981793207\n` +
    `🌐 *Website & Live Portal:* ${OFFICIAL_WEBSITE_URL}\n\n` +
    `Wishing you an unforgettable expedition on the open road!`
  );

  window.open(`https://wa.me/${targetPhone}?text=${message}`, '_blank');
}

/* =========================================================
   ROUTING & SPA NAVIGATION (HIDES TOP BAR & ACCOUNT BUTTON ON ADMIN)
========================================================= */
function switchView(targetViewId) {
  const views = document.querySelectorAll('.view-container');
  views.forEach(v => v.classList.remove('active-view'));

  const activeView = document.getElementById(targetViewId);
  if (activeView) {
    activeView.classList.add('active-view');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const menu = document.getElementById('nav-menu');
  if (menu) menu.classList.remove('active');

  const noticeBar = document.getElementById('topNoticeBar');
  const mainHeader = document.getElementById('mainHeaderNav');

  if (targetViewId === 'page-admin') {
    if (noticeBar) noticeBar.style.display = 'none';
    if (mainHeader) mainHeader.style.display = 'none';

    if (sessionStorage.getItem('tt_admin_auth') === 'true') {
      renderAdminDashboard();
    } else {
      document.getElementById('adminDashboardPanel').style.display = 'none';
      document.getElementById('adminLoginBox').style.display = 'flex';
    }
  } else {
    if (noticeBar) noticeBar.style.display = 'block';
    if (mainHeader) mainHeader.style.display = 'block';
  }
}

function switchViewAndFilter(viewId, type) {
  switchView(viewId);
  filterFleet(type, 'dedicatedFleetGrid');
}

/* =========================================================
   FLEET RENDERING & STRIP TABS
========================================================= */
function renderFleet(vehicles, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (vehicles.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 2rem;">No machines matching the criteria.</p>`;
    return;
  }

  vehicles.forEach(vehicle => {
    const card = document.createElement('div');
    card.className = 'vehicle-card';
    card.innerHTML = `
      <div class="card-img-wrapper">
        <span class="badge-tag">${vehicle.tag}</span>
        <img src="${vehicle.image}" alt="${vehicle.name}" loading="lazy">
      </div>
      <div class="card-body">
        <h3>${vehicle.name}</h3>
        <div class="specs-row">
          <span><i class="fa-solid fa-bolt" aria-hidden="true"></i> ${vehicle.engine}</span>
          <span><i class="fa-solid fa-sliders" aria-hidden="true"></i> ${vehicle.speed}</span>
          <span><i class="fa-solid fa-shield" aria-hidden="true"></i> ${vehicle.fuel}</span>
        </div>
        <div class="card-footer">
          <div class="price-box">
            <span class="price-amount">₹${vehicle.price}</span>
            <span class="price-unit">/ 24-Hr Cycle</span>
          </div>
          <button class="btn-book" onclick="openBookingModal(${vehicle.id})">Book Ride</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function filterFleet(type, containerId) {
  const section = document.getElementById(containerId).closest('.section-container');
  if (section) {
    const chips = section.querySelectorAll('.chip');
    chips.forEach(chip => {
      const onclickAttr = chip.getAttribute('onclick');
      if (onclickAttr && onclickAttr.includes(`'${type}'`)) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  const fleet = getStoredFleet();
  const filtered = (type === 'all') ? fleet : fleet.filter(v => v.type === type);
  renderFleet(filtered, containerId);
}

function setupStripTabs() {
  const tabs = document.querySelectorAll('.strip-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const type = tab.getAttribute('data-type');
      filterFleet(type, 'landingFleetGrid');
      filterFleet(type, 'dedicatedFleetGrid');

      const fleetSection = document.getElementById('landing-fleet');
      if (fleetSection && window.scrollY < 400) {
        fleetSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* =========================================================
   BOOKING MODAL & RESERVATION DISPATCH
========================================================= */
function openBookingModal(vehicleId) {
  const fleet = getStoredFleet();
  selectedVehicle = fleet.find(v => v.id === vehicleId);
  if (!selectedVehicle) return;

  document.getElementById('bookingFormState').style.display = 'block';
  document.getElementById('bookingSuccessState').style.display = 'none';

  document.getElementById('modalVehicleName').innerText = selectedVehicle.name;
  document.getElementById('modalVehicleType').innerText = selectedVehicle.tag;
  document.getElementById('modalVehiclePrice').innerText = `₹${selectedVehicle.price} / Day`;
  document.getElementById('rentalDays').value = 1;
  document.getElementById('addonOption').value = "0";

  const loggedUser = JSON.parse(localStorage.getItem('tt_current_user') || 'null');
  if (loggedUser) {
    document.getElementById('custName').value = loggedUser.name;
    document.getElementById('custPhone').value = loggedUser.phone;
  } else {
    document.getElementById('custName').value = '';
    document.getElementById('custPhone').value = '';
  }

  configureBookingKycUI(loggedUser, selectedVehicle);

  updateCalculations();
  document.getElementById('bookingModal').classList.add('active');
}

/* ---------------------------------------------------------
   Smart KYC UI Controller for the Booking Modal
   Rules:
   1) Logged-in customer whose account already has KYC on file
      -> hide upload fields, show "already verified" notice,
         re-use the stored files for this booking automatically.
   2) Guest (not logged in) -> must upload documents here.
   3) Bicycles never require a Driving License. Only an
      Aadhaar / Govt ID upload is needed (for both guests and
      logged-in users who haven't uploaded ID yet).
---------------------------------------------------------- */
function configureBookingKycUI(loggedUser, vehicle) {
  const noticeBox = document.getElementById('kycStatusNotice');
  const fileRow = document.getElementById('bookingKycFileRow');
  const licenseInput = document.getElementById('custLicenseFile');
  const aadhaarInput = document.getElementById('custAadhaarFile');
  const licenseControl = licenseInput.closest('.form-control');
  const aadhaarControl = aadhaarInput.closest('.form-control');

  const isBicycle = vehicle.type === 'bicycle';

  // Reset to a clean default state every time the modal opens
  licenseInput.required = false;
  aadhaarInput.required = false;
  licenseInput.value = '';
  aadhaarInput.value = '';
  licenseControl.style.display = 'flex';
  aadhaarControl.style.display = 'flex';
  fileRow.style.display = 'grid';
  noticeBox.style.display = 'none';

  const hasFullKycOnFile = !!(loggedUser && loggedUser.licenseFile && loggedUser.aadhaarFile);
  const hasAtLeastAadhaarOnFile = !!(loggedUser && loggedUser.aadhaarFile);

  if (loggedUser && (isBicycle ? hasAtLeastAadhaarOnFile : hasFullKycOnFile)) {
    // Returning, verified customer -> no re-upload needed at all
    fileRow.style.display = 'none';
    noticeBox.style.display = 'block';
    noticeBox.style.color = '#059669';
    noticeBox.innerHTML = isBicycle
      ? `<i class="fa-solid fa-shield-check"></i> ID Verified: Your Aadhaar is already on file from your account (${loggedUser.name}). No re-upload needed for this bicycle booking.`
      : `<i class="fa-solid fa-shield-check"></i> KYC Verified: Your Driver's License & Aadhaar are already on file from your account (${loggedUser.name}). No re-upload needed for this booking.`;
    return;
  }

  if (isBicycle) {
    // Bicycles: only Aadhaar / Govt ID required, no license at all
    licenseControl.style.display = 'none';
    aadhaarInput.required = true;
    noticeBox.style.display = 'block';
    noticeBox.style.color = '#d97706';
    noticeBox.innerHTML = `<i class="fa-solid fa-circle-info"></i> Bicycles don't require a Driving License. Please upload only your Aadhaar / Govt. ID for verification.`;
    return;
  }

  // Guest booking a motorised vehicle (bike/car) -> both documents required
  licenseInput.required = true;
  aadhaarInput.required = true;
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('active');
}

function updateCalculations() {
  if (!selectedVehicle) return;

  const days = parseInt(document.getElementById('rentalDays').value) || 1;
  const addon = parseInt(document.getElementById('addonOption').value) || 0;

  const basePrice = selectedVehicle.price * days;
  const taxes = Math.round((basePrice + addon) * 0.18);
  const total = basePrice + addon + taxes;

  currentPricing = { base: basePrice, addon, tax: taxes, total };

  document.getElementById('calcBase').innerText = `₹${basePrice.toLocaleString()}`;
  document.getElementById('calcAddon').innerText = `₹${addon.toLocaleString()}`;
  document.getElementById('calcTax').innerText = `₹${taxes.toLocaleString()}`;
  document.getElementById('calcTotal').innerText = `₹${total.toLocaleString()}`;
}

function setupCalculationListeners() {
  document.getElementById('rentalDays').addEventListener('input', updateCalculations);
  document.getElementById('addonOption').addEventListener('change', updateCalculations);

  document.getElementById('confirmBookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('bookSubmitBtn');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Registering Booking & Invoicing...`;

    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const days = document.getElementById('rentalDays').value;
    const delivery = document.getElementById('deliveryType').value;
    const destination = document.getElementById('travelDestination').value || "Local City Commute";
    const addonSelect = document.getElementById('addonOption');
    const addonText = addonSelect.options[addonSelect.selectedIndex].text;

    const loggedUser = JSON.parse(localStorage.getItem('tt_current_user') || 'null');
    const isBicycle = selectedVehicle.type === 'bicycle';

    const hasFullKycOnFile = !!(loggedUser && loggedUser.licenseFile && loggedUser.aadhaarFile);
    const hasAtLeastAadhaarOnFile = !!(loggedUser && loggedUser.aadhaarFile);
    const reuseAccountKyc = loggedUser && (isBicycle ? hasAtLeastAadhaarOnFile : hasFullKycOnFile);

    let licenseDataUrl = '';
    let aadhaarDataUrl = '';
    let kycSource = 'guest_upload';

    const readFileAsDataURL = (file) => {
      return new Promise((resolve) => {
        if (!file) return resolve('');
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    };

    if (reuseAccountKyc) {
      // Re-use the documents already stored on the customer's account
      licenseDataUrl = loggedUser.licenseFile || '';
      aadhaarDataUrl = loggedUser.aadhaarFile || '';
      kycSource = 'account_on_file';
    } else {
      // Guest (or logged-in user without stored KYC) uploads fresh here
      const licenseFileInp = document.getElementById('custLicenseFile');
      const aadhaarFileInp = document.getElementById('custAadhaarFile');

      aadhaarDataUrl = aadhaarFileInp.files[0] ? await readFileAsDataURL(aadhaarFileInp.files[0]) : '';
      // Bicycles never collect a license, even from guests
      licenseDataUrl = (!isBicycle && licenseFileInp.files[0]) ? await readFileAsDataURL(licenseFileInp.files[0]) : '';
      kycSource = 'guest_upload';
    }

    const refId = "TT-" + Math.floor(100000 + Math.random() * 900000);

    const payload = {
      refId,
      formType: "Rental Vehicle Reservation",
      vehicleName: selectedVehicle.name,
      vehicleType: selectedVehicle.tag,
      vehicleCategory: selectedVehicle.type, // 'bike' | 'car' | 'bicycle'
      customerName: name,
      customerPhone: phone,
      customerEmail: loggedUser ? loggedUser.email : "",
      licenseFile: licenseDataUrl,
      aadhaarFile: aadhaarDataUrl,
      kycSource, // 'account_on_file' | 'guest_upload'
      kycVerified: false,
      durationDays: days,
      pickupDeliveryType: delivery,
      travelDestinationInIndia: destination,
      selectedAddon: addonText,
      totalAmount: `₹${currentPricing.total}`,
      status: "Pending Approval",
      timestamp: Date.now()
    };

    const bookings = getStoredBookings();
    bookings.push(payload);
    saveStoredBookings(bookings);

    try {
      await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("Formspree fallback:", err);
    }

    const kycNoteForWa = reuseAccountKyc
      ? `Verified via existing account KYC on file`
      : (isBicycle ? `Aadhaar / Govt ID uploaded (no license required for bicycles)` : `Attached Files Verified`);

    const waText = encodeURIComponent(
      `*New Rental Reservation & Invoice - TT Tours & Travels*\n\n` +
      `📌 *Ref ID:* ${refId}\n` +
      `🚗 *Vehicle:* ${selectedVehicle.name}\n` +
      `👤 *Customer Name:* ${name}\n` +
      `📞 *Phone:* ${phone}\n` +
      `🆔 *DigiLocker KYC:* ${kycNoteForWa}\n` +
      `📅 *Duration:* ${days} Day(s)\n` +
      `📍 *Destination:* ${destination}\n` +
      `🚚 *Pickup/Delivery:* ${delivery}\n` +
      `🛡️ *Add-on:* ${addonText}\n` +
      `💰 *Total Invoice Amount:* ₹${currentPricing.total}\n\n` +
      `Hi TT Team, I just submitted my booking request online via ${OFFICIAL_WEBSITE_URL}. Please confirm my vehicle voucher!`
    );

    document.getElementById('successSummaryContent').innerHTML = `
      <strong>Ref ID:</strong> ${refId} (Invoice Generated)<br>
      <strong>Vehicle:</strong> ${selectedVehicle.name} (${days} Days)<br>
      <strong>Destination:</strong> ${destination}<br>
      <strong>Status:</strong> <span class="status-badge pending">Pending Approval</span> | <strong>Total:</strong> ₹${currentPricing.total}
    `;

    document.getElementById('modalWhatsAppChatBtn').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;

    document.getElementById('bookingFormState').style.display = 'none';
    document.getElementById('bookingSuccessState').style.display = 'block';

    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Submit Reservation Request`;
    document.getElementById('confirmBookingForm').reset();
  });

  document.getElementById('bookingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    switchView('page-fleet');
  });
}

/* =========================================================
   CONTACT INQUIRY DESK SUBMISSION
========================================================= */
async function handleInquiry(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Transmitting...`;

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  data.formType = "General Contact & Custom Tour Inquiry";
  data.timestamp = Date.now();

  const inquiries = getStoredInquiries();
  inquiries.push(data);
  saveStoredInquiries(inquiries);

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      alert("✨ Submitted Successfully! Your inquiry has been sent to our dispatch desk. Our road captain will reach out to you shortly.");
      form.reset();
    } else {
      alert("✨ Submitted Successfully! We will connect with you on WhatsApp (+91 7981793207) shortly.");
      form.reset();
    }
  } catch (err) {
    alert("✨ Submitted Successfully! Your inquiry has been logged in our dispatch desk.");
    form.reset();
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `Transmit to TT Desk <i class="fa-solid fa-paper-plane"></i>`;
  }
}

/* =========================================================
   ROUTE DETAILS & MOBILE NAV
========================================================= */
function openRouteDetails(title, duration, circuit, machine) {
  document.getElementById('routeTitle').innerText = title;
  document.getElementById('routeDuration').innerText = duration;
  document.getElementById('routeCircuit').innerText = circuit;
  document.getElementById('routeMachine').innerText = machine;
  document.getElementById('routeModal').classList.add('active');
}

function closeRouteModal() {
  document.getElementById('routeModal').classList.remove('active');
}

function setupNavbarScroll() {
  const navbar = document.getElementById('mainHeaderNav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

function setupMobileNav() {
  const toggle = document.getElementById('mobile-toggle');
  const menu = document.getElementById('nav-menu');

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      menu.classList.remove('active');
    }
  });
}