/**
 * H Medi Connect — Unified Interactive Logic Engine
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. STATE CONFIGURATIONS: MODAL LAYER
    // ==========================================
    const bookingModal = document.getElementById('bookingModal');
    const modalForm = document.getElementById('appointmentForm');
    const successMessageBlock = document.getElementById('successMessageBlock');
    const modalTriggers = document.querySelectorAll('.trigger-modal');
    const modalCloseBtn = document.querySelector('.close-modal-btn');
    const closeSuccessBtn = document.querySelector('.close-success-btn');
    
    const submitBtn = modalForm ? modalForm.querySelector('button[type="submit"]') : null;
    const submitBtnText = document.getElementById('submitBtnText');

    function openModal() {
        if (bookingModal) bookingModal.classList.add('open');
        document.body.style.overflow = 'hidden'; 
        
        if (modalForm) {
            modalForm.style.opacity = '1';
            modalForm.style.pointerEvents = 'auto';
        }
        if (successMessageBlock) {
            successMessageBlock.classList.remove('active');
        }
        if (submitBtn) {
            submitBtn.disabled = false;
        }
        if (submitBtnText) {
            submitBtnText.innerText = "Submit Registration Details";
        }
    }

    function closeModal() {
        if (bookingModal) bookingModal.classList.remove('open');
        document.body.style.overflow = ''; 
    }

    modalTriggers.forEach(trigger => trigger.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    }));
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', closeModal);

    if (bookingModal) {
        bookingModal.addEventListener('click', (e) => {
            if (e.target === bookingModal) {
                closeModal();
            }
        });
    }

    // ==========================================
    // 1B. MOBILE NAV: HAMBURGER TOGGLE
    // ==========================================
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const mobileNavLinks = document.getElementById('mobileNavLinks');
    const navActionsBlock = document.querySelector('.nav-actions');

    function closeMobileMenu() {
        if (mobileNavLinks) mobileNavLinks.classList.remove('mobile-menu-open');
        if (navActionsBlock) navActionsBlock.classList.remove('mobile-menu-open');
        if (mobileNavToggle) mobileNavToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }

    if (mobileNavToggle && mobileNavLinks) {
        mobileNavToggle.addEventListener('click', () => {
            const isOpen = mobileNavLinks.classList.toggle('mobile-menu-open');
            if (navActionsBlock) navActionsBlock.classList.toggle('mobile-menu-open', isOpen);
            mobileNavToggle.innerHTML = isOpen
                ? '<i class="fa-solid fa-xmark"></i>'
                : '<i class="fa-solid fa-bars"></i>';
        });

        // Close the menu after tapping any nav link (mobile UX)
        mobileNavLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    // ==========================================
    // 2. SMART HYBRID SCROLL & TAB CONTROLLER
    // ==========================================
    const pageScrollLinks = document.querySelectorAll('.page-scroll-link');
    const mainContentSections = document.querySelectorAll('.main-content-section');
    
    function switchActiveTab(targetId) {
        document.body.classList.add('tab-mode-active');

        mainContentSections.forEach(section => {
            section.classList.remove('active-tab');
        });

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.classList.add('active-tab');
        }

        const htmlElement = document.documentElement;
        htmlElement.style.scrollBehavior = 'auto';
        window.scrollTo({ top: 0 });
        htmlElement.style.scrollBehavior = ''; 

        pageScrollLinks.forEach(link => {
            if (link.getAttribute('href') === targetId) {
                link.classList.add('nav-link-active');
            } else {
                link.classList.remove('nav-link-active');
            }
        });

        // Re-check scroll-reveal elements inside the freshly activated tab —
        // they were display:none a moment ago so the observer may not have
        // caught them yet.
        if (typeof refreshRevealObserver === 'function') {
            refreshRevealObserver();
        }
    }

    pageScrollLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                switchActiveTab(targetId);
            }
        });
    });

    // ==========================================
    // 2B. LEARN MORE BUTTONS: JUMP TO FULL SECTION TAB
    // ==========================================
    const homeLearnMoreBtns = document.querySelectorAll('.home-learn-more-btn');
    homeLearnMoreBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            if (target) switchActiveTab(target);
        });
    });

    // ==========================================
    // 3. DATA TRANSPORT: FORMSPREE PIPELINE
    // ==========================================
    const inlineContactForm = document.getElementById('contactFormInline');
    const inlineSuccessBlock = document.getElementById('inlineSuccessMessageBlock');
    const inlineSubmitBtn = inlineContactForm ? inlineContactForm.querySelector('button[type="submit"]') : null;
    const inlineSubmitBtnText = document.getElementById('inlineSubmitBtnText');
    const closeInlineSuccessBtn = document.querySelector('.close-inline-success-btn');

    if (modalForm) {
        modalForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            if (submitBtn) submitBtn.disabled = true;
            if (submitBtnText) submitBtnText.innerText = "Sending Secure Payload...";

            const formData = {
                name: document.getElementById('formName').value,
                organizationType: document.getElementById('formOrg').value,
                email: document.getElementById('formEmail').value,
                phone: document.getElementById('formPhone').value,
                preferredDate: document.getElementById('formDate').value
            };

            try {
                const response = await fetch('https://formspree.io/f/mpqeojqj', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    modalForm.reset();
                    modalForm.style.opacity = '0';
                    modalForm.style.pointerEvents = 'none';
                    if (successMessageBlock) {
                        successMessageBlock.classList.add('active');
                    }
                } else {
                    throw new Error('Formspree endpoint sync fault.');
                }
            } catch (error) {
                console.error('Data Routing Error:', error);
                alert('Submission pipeline issue detected. Please link directly via WhatsApp support button.');
                if (submitBtn) submitBtn.disabled = false;
                if (submitBtnText) submitBtnText.innerText = "Submit Registration Details";
            }
        });
    }

    if (inlineContactForm) {
        inlineContactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (inlineSubmitBtn) inlineSubmitBtn.disabled = true;
            if (inlineSubmitBtnText) inlineSubmitBtnText.innerText = "Sending Secure Payload...";

            const formData = {
                name: document.getElementById('inlineName').value,
                organizationType: document.getElementById('inlineOrg').value,
                email: document.getElementById('inlineEmail').value,
                phone: document.getElementById('inlinePhone').value,
                preferredDate: document.getElementById('inlineDate').value
            };

            try {
                const response = await fetch('https://formspree.io/f/mpqeojqj', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    inlineContactForm.reset();
                    inlineContactForm.style.opacity = '0';
                    inlineContactForm.style.pointerEvents = 'none';
                    if (inlineSuccessBlock) {
                        inlineSuccessBlock.classList.add('active');
                    }
                } else {
                    throw new Error('Formspree endpoint sync fault.');
                }
            } catch (error) {
                console.error('Data Routing Error:', error);
                alert('Submission pipeline issue detected. Please link directly via WhatsApp support button.');
                if (inlineSubmitBtn) inlineSubmitBtn.disabled = false;
                if (inlineSubmitBtnText) inlineSubmitBtnText.innerText = "Submit Registration Details";
            }
        });
    }

    if (closeInlineSuccessBtn) {
        closeInlineSuccessBtn.addEventListener('click', () => {
            if (inlineSuccessBlock) inlineSuccessBlock.classList.remove('active');
            if (inlineContactForm) {
                inlineContactForm.style.opacity = '1';
                inlineContactForm.style.pointerEvents = 'auto';
            }
            if (inlineSubmitBtn) inlineSubmitBtn.disabled = false;
            if (inlineSubmitBtnText) inlineSubmitBtnText.innerText = "Submit Registration Details";
        });
    }

    // ==========================================
    // 3B. HOME PAGE: EMBEDDED CONTACT FORM
    // ==========================================
    const homeContactForm = document.getElementById('homeContactFormInline');
    const homeSuccessBlock = document.getElementById('homeSuccessMessageBlock');
    const homeSubmitBtn = homeContactForm ? homeContactForm.querySelector('button[type="submit"]') : null;
    const homeSubmitBtnText = document.getElementById('homeSubmitBtnText');
    const closeHomeSuccessBtn = document.querySelector('.close-home-success-btn');

    if (homeContactForm) {
        homeContactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (homeSubmitBtn) homeSubmitBtn.disabled = true;
            if (homeSubmitBtnText) homeSubmitBtnText.innerText = "Sending Secure Payload...";

            const formData = {
                name: document.getElementById('homeName').value,
                organizationType: document.getElementById('homeOrg').value,
                email: document.getElementById('homeEmail').value,
                phone: document.getElementById('homePhone').value,
                preferredDate: document.getElementById('homeDate').value
            };

            try {
                const response = await fetch('https://formspree.io/f/mpqeojqj', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    homeContactForm.reset();
                    homeContactForm.style.opacity = '0';
                    homeContactForm.style.pointerEvents = 'none';
                    if (homeSuccessBlock) {
                        homeSuccessBlock.classList.add('active');
                    }
                } else {
                    throw new Error('Formspree endpoint sync fault.');
                }
            } catch (error) {
                console.error('Data Routing Error:', error);
                alert('Submission pipeline issue detected. Please link directly via WhatsApp support button.');
                if (homeSubmitBtn) homeSubmitBtn.disabled = false;
                if (homeSubmitBtnText) homeSubmitBtnText.innerText = "Submit Registration Details";
            }
        });
    }

    if (closeHomeSuccessBtn) {
        closeHomeSuccessBtn.addEventListener('click', () => {
            if (homeSuccessBlock) homeSuccessBlock.classList.remove('active');
            if (homeContactForm) {
                homeContactForm.style.opacity = '1';
                homeContactForm.style.pointerEvents = 'auto';
            }
            if (homeSubmitBtn) homeSubmitBtn.disabled = false;
            if (homeSubmitBtnText) homeSubmitBtnText.innerText = "Submit Registration Details";
        });
    }

    // ==========================================
    // 4. SECTIONS UI: DYNAMIC GRID TOGGLE
    // ==========================================
    const reasonsGrid = document.getElementById('reasonsGrid');
    const toggleReasonsBtn = document.getElementById('toggleReasonsBtn');
    
    if (toggleReasonsBtn && reasonsGrid) {
        toggleReasonsBtn.addEventListener('click', () => {
            reasonsGrid.classList.toggle('expanded');
            toggleReasonsBtn.classList.toggle('active');

            if (reasonsGrid.classList.contains('expanded')) {
                toggleReasonsBtn.innerHTML = `See fewer reasons <i class="fa-solid fa-chevron-up"></i>`;
                if (typeof refreshRevealObserver === 'function') refreshRevealObserver();
            } else {
                toggleReasonsBtn.innerHTML = `See all reasons <i class="fa-solid fa-chevron-down"></i>`;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // ==========================================
    // 5. CHAT INTERACTION: WORKING ENGINE
    // ==========================================
    const openChatbotBtn = document.getElementById('openChatbot');
    const closeChatbotBtn = document.getElementById('closeChatbot');
    const chatbotDrawer = document.getElementById('chatbotDrawer');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatInputFiled = document.getElementById('chatInputFiled');
    const chatLogs = document.getElementById('chatLogs');
    const botChipsBlock = document.getElementById('botChipsBlock');

    const botResponses = {
        hms: "Our Unified Hospital Management core coordinates live electronic queues, processes encrypted clinical charts, and handles diagnostic file workflows safely across your server framework.",
        services: "H Medi Connect provides complete stack frameworks: Next-Gen Unified Cloud EHR engines, automated tracking, OPD consultation structures, e-Prescriptions, and billing routines.",
        demo: "Opening the registration matrix portal overview window right now...",
        pricing: "H Medi Connect features flexible scale pricing models tailored to your institution's footprint. Chat with our sales desk on WhatsApp for an itemized quote profile.",
        security: "All architecture structures comply rigorously with global infrastructure security protocols, end-to-end storage encryption, strict role-based access management (RBAC), and fully automated cloud data logs.",
        support: "Need immediate technical setup assistance? Our standard maintenance networks operate 24/7. Connect straight to our engineer logs via WhatsApp (+91 79817 93207) or drop an email ticket.",
        sales: "Connect via email at hello@hmediconnect.com, or directly call our Hyderabad operations desk at +91 79817 93207.",
        faqs: "Absolutely. All active frameworks operate with complete zero-trust verification layers, ensuring 99.9% hotfix execution log speeds."
    };

    function toggleChatbot(openState) {
        if (openState) {
            if (chatbotDrawer) chatbotDrawer.classList.add('open'); 
            if (openChatbotBtn) openChatbotBtn.style.display = 'none';
        } else {
            if (chatbotDrawer) chatbotDrawer.classList.remove('open');
            if (openChatbotBtn) openChatbotBtn.style.display = 'flex';
        }
    }

    if (openChatbotBtn) openChatbotBtn.addEventListener('click', () => toggleChatbot(true));
    if (closeChatbotBtn) closeChatbotBtn.addEventListener('click', () => toggleChatbot(false));

    function appendMessage(text, isUser = false) {
        if (!chatLogs) return;
        const msgBubble = document.createElement('div');
        msgBubble.className = `msg ${isUser ? 'user-msg' : 'bot-msg'}`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        msgBubble.innerHTML = `${text} <div class="chat-timestamp" style="${isUser ? 'color: #ffd1d3; text-align: right;' : ''}">${timestamp}</div>`;
        
        chatLogs.appendChild(msgBubble);
        chatLogs.scrollTop = chatLogs.scrollHeight;
    }

    if (botChipsBlock) {
        botChipsBlock.querySelectorAll('.chat-navigation-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                const intent = chip.getAttribute('data-intent');
                appendMessage(chip.innerText, true);

                setTimeout(() => {
                    if (botResponses[intent]) {
                        appendMessage(botResponses[intent], false);
                        
                        if (intent === 'demo') {
                            setTimeout(() => { toggleChatbot(false); openModal(); }, 700);
                        } else if (intent === 'services') {
                            setTimeout(() => {
                                toggleChatbot(false);
                                switchActiveTab('#servicesSection');
                            }, 1000);
                        }
                    }
                }, 400);
            });
        });
    }

    function processManualChatInput() {
        if (!chatInputFiled) return;
        const value = chatInputFiled.value.trim();
        if (!value) return;

        appendMessage(value, true);
        chatInputFiled.value = '';

        setTimeout(() => {
            const lowerInput = value.toLowerCase();
            
            if (lowerInput.includes('system') || lowerInput.includes('hms') || lowerInput.includes('hospital')) {
                appendMessage(botResponses.hms, false);
            } else if (lowerInput.includes('service') || lowerInput.includes('feature') || lowerInput.includes('modules')) {
                appendMessage(botResponses.services, false);
            } else if (lowerInput.includes('demo') || lowerInput.includes('book') || lowerInput.includes('appointment')) {
                appendMessage(botResponses.demo, false);
                setTimeout(() => { toggleChatbot(false); openModal(); }, 800);
            } else if (lowerInput.includes('price') || lowerInput.includes('quote') || lowerInput.includes('cost') || lowerInput.includes('pricing')) {
                appendMessage(botResponses.pricing, false);
            } else if (lowerInput.includes('security') || lowerInput.includes('hipaa') || lowerInput.includes('safe') || lowerInput.includes('data')) {
                appendMessage(botResponses.security, false);
            } else if (lowerInput.includes('support') || lowerInput.includes('help') || lowerInput.includes('error') || lowerInput.includes('issue')) {
                appendMessage(botResponses.support, false);
            } else if (lowerInput.includes('contact') || lowerInput.includes('sales') || lowerInput.includes('phone') || lowerInput.includes('call')) {
                appendMessage(botResponses.sales, false);
            } else {
                appendMessage("I have registered your input parameter selection. Please click on the options menu quick chips or tap our live WhatsApp link for support.", false);
            }
        }, 550);
    }

    if (sendChatBtn) sendChatBtn.addEventListener('click', processManualChatInput);
    if (chatInputFiled) {
        chatInputFiled.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') processManualChatInput();
        });
    }

    // ==========================================
    // 6. WHY SECTION: FAQ ACCORDION
    // ==========================================
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question-btn');
        if (!questionBtn) return;

        questionBtn.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            faqItems.forEach(other => other.classList.remove('open'));
            if (!isOpen) {
                item.classList.add('open');
            }
        });
    });

    // ==========================================
    // 7. SCROLL REVEAL ANIMATIONS (CLASSIC FADE-UP)
    //    Applies to every repeating card element across the
    //    site — no HTML edits required. Elements fade + rise
    //    into place with a light stagger as they enter view.
    // ==========================================
    const revealSelectors = [
        '.reason-item-box',
        '.pillar-card',
        '.value-mini-card',
        '.testimonial-card',
        '.counter-card',
        '.metric-result-card',
        '.module-mini-card',
        '.timeline-node',
        '.process-timeline-node',
        '.faq-item',
        '.ind-pill',
        '.gradient-banner-box',
        '.contact-detail-card',
        '.contact-form-panel',
        '.comparison-matrix-wrapper',
        '.section-tag',
        '.classical-tag',
        '.section-sub-tag'
    ];

    let revealObserver = null;

    function refreshRevealObserver() {
        const elements = document.querySelectorAll(revealSelectors.join(','));

        elements.forEach((el, index) => {
            if (el.dataset.revealBound) return; // already wired up
            el.dataset.revealBound = 'true';

            el.classList.add('reveal-up');
            const delay = (index % 4) * 0.09;
            el.style.transitionDelay = `${delay}s`;

            if (revealObserver) {
                revealObserver.observe(el);
            } else {
                // Fallback for browsers without IntersectionObserver
                el.classList.add('in-view');
            }
        });
    }

    if ('IntersectionObserver' in window) {
        revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    }

    refreshRevealObserver();
});