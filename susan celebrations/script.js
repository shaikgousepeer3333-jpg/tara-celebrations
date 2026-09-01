// year
  document.getElementById('year').textContent = new Date().getFullYear();

  // nav scroll state
  const nav = document.getElementById('siteNav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  // mobile drawer
  const burger = document.getElementById('burger');
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('drawerOverlay');
  function closeDrawer(){ drawer.classList.remove('open'); overlay.classList.remove('open'); }
  burger.addEventListener('click', () => { drawer.classList.toggle('open'); overlay.classList.toggle('open'); });
  overlay.addEventListener('click', closeDrawer);
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

  // scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('in'), i * 60);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // floating petals in hero
  const petalHost = document.getElementById('petals');
  const petalGlyphs = ['✿','❀','⚘'];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('span');
      p.className = 'petal';
      p.textContent = petalGlyphs[Math.floor(Math.random() * petalGlyphs.length)];
      p.style.left = Math.random() * 100 + '%';
      p.style.fontSize = (12 + Math.random() * 14) + 'px';
      p.style.animationDuration = (9 + Math.random() * 10) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      petalHost.appendChild(p);
    }
  }

  // ================= SCROLL PROGRESS BAR =================
  const progressBar = document.getElementById('scrollProgress');
  function updateProgress(){
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const height = h.scrollHeight - h.clientHeight;
    progressBar.style.width = (height > 0 ? (scrolled / height) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', updateProgress);
  updateProgress();

  // ================= ANIMATED COUNTERS =================
  const counters = document.querySelectorAll('.counter');
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1400;
      const start = performance.now();
      function tick(now){
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      counterIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach(c => counterIO.observe(c));

  // ================= CURSOR SPARKLE TRAIL (desktop only) =================
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canHover && !prefersReducedMotion) {
    let lastSpark = 0;
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastSpark < 60) return;
      lastSpark = now;
      const s = document.createElement('div');
      s.className = 'sparkle';
      s.style.left = e.clientX + 'px';
      s.style.top = e.clientY + 'px';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 700);
    });
  }

  // ================= 3D TILT ON SERVICE CARDS =================
  if (canHover && !prefersReducedMotion) {
    document.querySelectorAll('.service-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateX = ((y / rect.height) - 0.5) * -10;
        const rotateY = ((x / rect.width) - 0.5) * 10;
        card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  // ================= MAGNETIC BUTTONS =================
  if (canHover && !prefersReducedMotion) {
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  // ================= GLIMPSE VIDEO SHOWCASE =================
  const bgVideo = document.getElementById('bgVideo');
  const playGlimpseBtn = document.getElementById('playGlimpse');
  const videoModal = document.getElementById('videoModal');
  const modalVideo = document.getElementById('modalVideo');
  const videoClose = document.getElementById('videoClose');

  function openVideoModal(){
    bgVideo.pause();
    videoModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    modalVideo.currentTime = 0;
    modalVideo.muted = false;
    modalVideo.play().catch(() => {});
  }
  function closeVideoModal(){
    modalVideo.pause();
    videoModal.classList.remove('open');
    document.body.style.overflow = '';
    bgVideo.play().catch(() => {});
  }
  playGlimpseBtn.addEventListener('click', openVideoModal);
  videoClose.addEventListener('click', closeVideoModal);
  videoModal.addEventListener('click', (e) => { if (e.target === videoModal) closeVideoModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && videoModal.classList.contains('open')) closeVideoModal();
  });

  // ================= LIGHTBOX GALLERY =================
  const galleryItems = Array.from(document.querySelectorAll('#galleryGrid .polaroid'));
  const lightbox = document.getElementById('lightbox');
  const lbFrame = document.getElementById('lbFrame');
  const lbCaption = document.getElementById('lbCaption');
  const lbCounter = document.getElementById('lbCounter');
  let lbIndex = 0;

  function openLightbox(i){
    lbIndex = i;
    renderLightbox();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox(){
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  function renderLightbox(){
    const item = galleryItems[lbIndex];
    const frameEl = item.querySelector('.frame');
    const iconSVG = frameEl.querySelector('svg').outerHTML;
    const computedBg = getComputedStyle(frameEl).backgroundImage;
    lbFrame.style.backgroundImage = computedBg;
    lbFrame.innerHTML = iconSVG;
    const title = item.querySelector('figcaption').textContent;
    const desc = item.dataset.desc || '';
    lbCaption.innerHTML = title + (desc ? `<span>${desc}</span>` : '');
    lbCounter.textContent = (lbIndex + 1) + ' / ' + galleryItems.length;
  }
  function nextLightbox(){ lbIndex = (lbIndex + 1) % galleryItems.length; renderLightbox(); }
  function prevLightbox(){ lbIndex = (lbIndex - 1 + galleryItems.length) % galleryItems.length; renderLightbox(); }

  galleryItems.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
  });
  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  document.getElementById('lbNext').addEventListener('click', nextLightbox);
  document.getElementById('lbPrev').addEventListener('click', prevLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextLightbox();
    if (e.key === 'ArrowLeft') prevLightbox();
  });
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; });
  lightbox.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) { dx < 0 ? nextLightbox() : prevLightbox(); }
  });

  // ================= MULTI-STEP BOOKING FORM =================
  const bookingForm = document.getElementById('bookingForm');
  const formSteps = Array.from(document.querySelectorAll('.form-step'));
  const stepDots = Array.from(document.querySelectorAll('.step-dot'));
  const stepLines = Array.from(document.querySelectorAll('.step-line'));
  const successState = document.getElementById('successState');
  let currentStep = 1;

  function showStep(n){
    formSteps.forEach(s => s.classList.toggle('active', parseInt(s.dataset.formStep, 10) === n));
    stepDots.forEach(d => {
      const val = parseInt(d.dataset.step, 10);
      d.classList.toggle('active', val === n);
      d.classList.toggle('done', val < n);
    });
    stepLines.forEach(l => {
      const val = parseInt(l.dataset.line, 10);
      l.classList.toggle('done', val < n);
    });
    currentStep = n;
    if (n === 3) buildReview();
  }

  function validateField(fieldEl, testFn){
    const ok = testFn();
    fieldEl.classList.toggle('invalid', !ok);
    return ok;
  }

  function validateStep(n){
    let valid = true;
    if (n === 1) {
      const name = document.getElementById('fName');
      const phone = document.getElementById('fPhone');
      if (!validateField(name.closest('.field'), () => name.value.trim().length > 1)) valid = false;
      if (!validateField(phone.closest('.field'), () => /^[0-9]{10}$/.test(phone.value.trim()))) valid = false;
    }
    if (n === 2) {
      const type = document.getElementById('fType');
      const date = document.getElementById('fDate');
      if (!validateField(type.closest('.field'), () => type.value !== '')) valid = false;
      if (!validateField(date.closest('.field'), () => date.value !== '')) valid = false;
    }
    return valid;
  }

  bookingForm.querySelectorAll('[data-next]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateStep(currentStep)) showStep(currentStep + 1);
    });
  });
  bookingForm.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => showStep(currentStep - 1));
  });

  function getFormData(){
    return {
      name: document.getElementById('fName').value.trim(),
      phone: document.getElementById('fPhone').value.trim(),
      email: document.getElementById('fEmail').value.trim(),
      type: document.getElementById('fType').value,
      date: document.getElementById('fDate').value,
      guests: document.getElementById('fGuests').value,
      notes: document.getElementById('fNotes').value.trim()
    };
  }

  function buildReview(){
    const d = getFormData();
    const reviewBox = document.getElementById('reviewBox');
    reviewBox.innerHTML = `
      <div><span>Name</span><span>${d.name || '—'}</span></div>
      <div><span>Phone</span><span>${d.phone || '—'}</span></div>
      <div><span>Event Type</span><span>${d.type || '—'}</span></div>
      <div><span>Date</span><span>${d.date || '—'}</span></div>
      <div><span>Guests</span><span>${d.guests || '—'}</span></div>
    `;
    const message = `Hi Susan Celebrations! I'd like to enquire about an event.%0A%0AName: ${encodeURIComponent(d.name)}%0APhone: ${encodeURIComponent(d.phone)}%0AEvent Type: ${encodeURIComponent(d.type)}%0ADate: ${encodeURIComponent(d.date)}%0AGuests: ${encodeURIComponent(d.guests)}%0ANotes: ${encodeURIComponent(d.notes)}`;
    document.getElementById('sendWhatsapp').href = `https://wa.me/918639379112?text=${message}`;
  }

  function saveEnquiryLocally(d){
    try{
      const list = JSON.parse(localStorage.getItem('susanEnquiries') || '[]');
      list.unshift({ ...d, submittedAt: new Date().toISOString() });
      localStorage.setItem('susanEnquiries', JSON.stringify(list.slice(0, 200)));
    }catch(e){ /* localStorage unavailable, ignore */ }
  }

  function showSuccess(){
    bookingForm.style.display = 'none';
    document.querySelector('.steps-track').style.display = 'none';
    document.querySelector('.step-labels').style.display = 'none';
    successState.classList.add('show');
  }

  // ================= FORMSPREE SUBMISSION =================
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mpqeojqj';
  const submitBtn = document.getElementById('submitEnquiry');
  const submitError = document.getElementById('submitError');

  submitBtn.addEventListener('click', async () => {
    const d = getFormData();
    submitError.classList.remove('show');
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: d.name,
          phone: d.phone,
          email: d.email,
          eventType: d.type,
          eventDate: d.date,
          guestCount: d.guests,
          notes: d.notes,
          _replyto: d.email,
          _subject: `New Booking Enquiry — ${d.type || 'Celebration'} (${d.name})`
        })
      });

      if (res.ok) {
        saveEnquiryLocally(d);
        showSuccess();
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      submitError.classList.add('show');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  document.getElementById('sendWhatsapp').addEventListener('click', () => {
    saveEnquiryLocally(getFormData());
  });

  document.getElementById('resetForm').addEventListener('click', () => {
    bookingForm.reset();
    bookingForm.style.display = 'block';
    document.querySelector('.steps-track').style.display = 'flex';
    document.querySelector('.step-labels').style.display = 'flex';
    successState.classList.remove('show');
    submitError.classList.remove('show');
    document.querySelectorAll('.field.invalid').forEach(f => f.classList.remove('invalid'));
    showStep(1);
  });