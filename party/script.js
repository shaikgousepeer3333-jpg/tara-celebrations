/* =========================================================
   PARTY HOUSE — site script
   Data storage: everything the admin portal manages (gallery
   images + bookings) lives in localStorage under these keys,
   so admin.html and index.html always read the same data
   inside one browser. There's no server — for a live multi-
   device system, these localStorage calls would be swapped
   for real API calls.
========================================================= */
const PH_KEYS = { gallery: 'ph_gallery', bookings: 'ph_bookings' };

/* ---------- default seed data (first run only) ---------- */
function phSeedGallery(){
  if (localStorage.getItem(PH_KEYS.gallery)) return;
  const seed = [
    { id:'g1', category:'theatre',    caption:'Main Screening Room',    img:'https://picsum.photos/seed/phg1/700/700', big:true },
    { id:'g2', category:'birthday',   caption:'Birthday Set-Up',        img:'https://picsum.photos/seed/phg2/700/500' },
    { id:'g3', category:'decor',      caption:'Balloon Arch Decor',     img:'https://picsum.photos/seed/phg3/700/500' },
    { id:'g4', category:'anniversary',caption:'Anniversary Dinner',     img:'https://picsum.photos/seed/phg4/700/500' },
    { id:'g5', category:'theatre',    caption:'Premiere Room Seating',  img:'https://picsum.photos/seed/phg5/700/500' },
    { id:'g6', category:'decor',      caption:'Fairy-Light Backdrop',   img:'https://picsum.photos/seed/phg6/700/500' },
    { id:'g7', category:'birthday',   caption:'Cake Table Styling',     img:'https://picsum.photos/seed/phg7/700/500' },
    { id:'g8', category:'anniversary',caption:'Couple\u2019s Screening',img:'https://picsum.photos/seed/phg8/700/500' },
    { id:'g9', category:'theatre',    caption:'4K Projection Wall',     img:'https://picsum.photos/seed/phg9/700/500' },
  ];
  localStorage.setItem(PH_KEYS.gallery, JSON.stringify(seed));
}
function phGetGallery(){
  try{ return JSON.parse(localStorage.getItem(PH_KEYS.gallery)) || []; }catch(e){ return []; }
}
function phGetBookings(){
  try{ return JSON.parse(localStorage.getItem(PH_KEYS.bookings)) || []; }catch(e){ return []; }
}
function phSaveBookings(list){ localStorage.setItem(PH_KEYS.bookings, JSON.stringify(list)); }

document.addEventListener('DOMContentLoaded', () => {
  phSeedGallery();
  initCurtain();
  initHeader();
  initNavToggle();
  initReveal();
  initTicketId();
  initStats();
  initGallery();
  initLightbox();
  initBookingForm();
  initBackToTop();
  document.getElementById('year').textContent = new Date().getFullYear();
});

/* ---------- curtain intro ---------- */
function initCurtain(){
  const wrap = document.getElementById('curtainWrap');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    wrap.classList.add('open');
    document.body.style.overflow = '';
  }, 500);
  setTimeout(() => wrap.classList.add('hidden'), 2200);
}

/* ---------- sticky header + active link ---------- */
function initHeader(){
  const header = document.getElementById('siteHeader');
  const links = document.querySelectorAll('.nav-link');
  const sections = [...links].map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);

  function onScroll(){
    header.classList.toggle('scrolled', window.scrollY > 40);
    let current = sections[0];
    sections.forEach(sec => { if (window.scrollY + 140 >= sec.offsetTop) current = sec; });
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current.id));
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  links.forEach(l => l.addEventListener('click', () => document.getElementById('mainNav').classList.remove('open')));
}

/* ---------- mobile nav toggle ---------- */
function initNavToggle(){
  const btn = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
  });
}

/* ---------- scroll reveal ---------- */
function initReveal(){
  const items = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold:.15 });
  items.forEach(i => io.observe(i));
}

/* ---------- animated stat counters ---------- */
function initStats(){
  const nums = document.querySelectorAll('.stat-num');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const target = +e.target.dataset.count;
      const dur = 1400;
      const start = performance.now();
      function tick(now){
        const p = Math.min(1, (now - start) / dur);
        e.target.textContent = Math.floor(p * target).toLocaleString('en-IN') + (p === 1 ? '+' : '');
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, { threshold:.4 });
  nums.forEach(n => io.observe(n));
}

/* ---------- gallery render + filter ---------- */
function initGallery(){
  const grid = document.getElementById('galleryGrid');
  const filters = document.getElementById('galleryFilters');
  if (!grid) return;

  function render(){
    const items = phGetGallery();
    grid.innerHTML = items.map((it, i) => `
      <figure class="gallery-item${it.big ? ' big':''}" data-cat="${it.category}" data-index="${i}" style="animation-delay:${(i%6)*.05}s" data-caption="${it.caption}">
        <img src="${it.img}" alt="${it.caption}" loading="lazy">
      </figure>
    `).join('');
    grid.querySelectorAll('.gallery-item').forEach(el => {
      el.addEventListener('click', () => openLightbox(+el.dataset.index));
    });
  }
  render();

  filters?.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    grid.querySelectorAll('.gallery-item').forEach(item => {
      item.classList.toggle('hide', f !== 'all' && item.dataset.cat !== f);
    });
  });

  window.phRenderGallery = render; // allow other tabs / a live admin session to refresh it
}

/* ---------- lightbox ---------- */
let phLightboxIndex = 0;
function initLightbox(){
  const lb = document.getElementById('lightbox');
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  document.getElementById('lightboxPrev').addEventListener('click', () => stepLightbox(-1));
  document.getElementById('lightboxNext').addEventListener('click', () => stepLightbox(1));
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
  });
}
function openLightbox(index){
  phLightboxIndex = index;
  renderLightbox();
  document.getElementById('lightbox').hidden = false;
}
function stepLightbox(dir){
  const items = phGetGallery();
  phLightboxIndex = (phLightboxIndex + dir + items.length) % items.length;
  renderLightbox();
}
function renderLightbox(){
  const items = phGetGallery();
  const it = items[phLightboxIndex];
  if (!it) return;
  document.getElementById('lightboxImg').src = it.img;
  document.getElementById('lightboxImg').alt = it.caption;
  document.getElementById('lightboxCaption').textContent = it.caption;
}
function closeLightbox(){ document.getElementById('lightbox').hidden = true; }

/* ---------- booking ticket id preview ---------- */
function initTicketId(){
  const el = document.getElementById('ticketIdPreview');
  if (el) el.textContent = 'PH-' + String(Math.floor(100000 + Math.random()*900000));

  // default min date = today
  const dateInput = document.getElementById('date');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];
}

/* ---------- booking form submit ---------- */
function initBookingForm(){
  const form = document.getElementById('bookingForm');
  if (!form) return;
  const successBox = document.getElementById('ticketSuccess');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()){ form.reportValidity(); return; }

    const data = Object.fromEntries(new FormData(form).entries());
    const id = 'PH-' + String(Math.floor(100000 + Math.random()*900000));
    const booking = { id, ...data, status:'Pending', createdAt: new Date().toISOString() };

    const list = phGetBookings();
    list.unshift(booking);
    phSaveBookings(list);

    // reveal success + build WhatsApp deep link with the booking summary
    document.getElementById('ticketSuccessId').textContent = `Reference ${id}`;
    document.getElementById('ticketSuccessText').textContent =
      `We've held a ${data.package} slot for your ${data.occasion.toLowerCase()} on ${data.date} (${data.time}). We'll confirm within the hour.`;

    const msg = encodeURIComponent(
      `Hello Party House! I'd like to confirm a booking.\n` +
      `Reference: ${id}\nName: ${data.fullName}\nPhone: ${data.phone}\n` +
      `Occasion: ${data.occasion}\nPackage: ${data.package}\nDate: ${data.date}\nTime: ${data.time}\nGuests: ${data.guests}` +
      (data.notes ? `\nNotes: ${data.notes}` : '')
    );
    document.getElementById('whatsappConfirmBtn').href = `https://api.whatsapp.com/send?phone=+918019597774&text=${msg}`;

    form.hidden = true;
    successBox.hidden = false;
    successBox.scrollIntoView({ behavior:'smooth', block:'center' });
  });

  document.getElementById('bookAnotherBtn')?.addEventListener('click', () => {
    form.reset();
    initTicketId();
    form.hidden = false;
    successBox.hidden = true;
  });
}

/* ---------- back to top ---------- */
function initBackToTop(){
  const btn = document.getElementById('toTop');
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 700), { passive:true });
  btn.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
}