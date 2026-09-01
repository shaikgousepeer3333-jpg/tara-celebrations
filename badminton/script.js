// Mobile Navbar Toggle
const hamburger = document.querySelector('.hamburger');
const navLinksContainer = document.querySelector('.nav-links');

if(hamburger) {
    hamburger.addEventListener('click', () => {
        navLinksContainer.classList.toggle('active');
        const icon = hamburger.querySelector('i');
        if(navLinksContainer.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark');
        } else {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        }
    });
}

// Single-Page View vs Full Scroll Logic
const navTriggers = document.querySelectorAll('.nav-trigger');
const allSections = document.querySelectorAll('.page-section');
const allNavLinks = document.querySelectorAll('.nav-links a');

navTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
        e.preventDefault();

        if(navLinksContainer.classList.contains('active')) {
            navLinksContainer.classList.remove('active');
            hamburger.querySelector('i').classList = 'fa-solid fa-bars';
        }

        const targetId = trigger.getAttribute('data-target');

        // Update active class on nav links
        allNavLinks.forEach(item => {
            item.classList.remove('active');
            if(item.getAttribute('data-target') === targetId) {
                item.classList.add('active');
            }
        });

        if(targetId === 'home') {
            document.body.classList.remove('single-view');
            allSections.forEach(sec => sec.classList.remove('active-section'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            document.body.classList.add('single-view');
            allSections.forEach(sec => {
                sec.classList.remove('active-section');
                if(sec.getAttribute('id') === targetId) {
                    sec.classList.add('active-section');
                }
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
});

// Handle Formspree Inquiry Form Submission via AJAX
const inquiryForm = document.getElementById('inquiryForm');
const formStatus = document.getElementById('formStatus');

if(inquiryForm) {
    inquiryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(inquiryForm);
        formStatus.style.color = 'var(--text-muted)';
        formStatus.textContent = 'Sending your inquiry...';

        try {
            const response = await fetch(inquiryForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                formStatus.style.color = 'var(--primary)';
                formStatus.textContent = 'Thank you! Your request has been successfully sent.';
                inquiryForm.reset();
            } else {
                formStatus.style.color = '#ef4444';
                formStatus.textContent = 'Oops! There was a problem submitting your form.';
            }
        } catch (error) {
            formStatus.style.color = '#ef4444';
            formStatus.textContent = 'Connection error. Please try again later.';
        }
    });
}