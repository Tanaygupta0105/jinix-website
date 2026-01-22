document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => observer.observe(el));

    // Simple smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        // Create overlay if it doesn't exist
        let overlay = document.querySelector('.nav-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'nav-overlay';
            navLinks.parentNode.insertBefore(overlay, navLinks.nextSibling);
        }

        const toggleMenu = () => {
            menuToggle.classList.toggle('open');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        };

        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        // Close when clicking overlay
        overlay.addEventListener('click', toggleMenu);

        // Close when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    toggleMenu();
                }
            });
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                toggleMenu();
            }
        });
    }

    // Contact Form Submission with Web3Forms
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = document.getElementById('contactName').value;
            const email = document.getElementById('contactEmail').value;
            const message = document.getElementById('contactMessage').value;
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;

            // Web3Forms configured - sends to se.sourabhgupta@gmail.com
            // Get your access key at https://web3forms.com
            const WEB3FORMS_ACCESS_KEY = 'da35283a-91fc-4b36-9b24-c288e6a57d12';

            // If not configured yet, provide helpful feedback
            if (WEB3FORMS_ACCESS_KEY === 'YOUR_ACCESS_KEY_HERE') {
                showNotification('⚠️ Form not configured yet. Please email us directly at Solutions@jinix.co.in', 'error');
                // Fallback to mailto - sends to actual email while displaying branded email
                window.location.href = `mailto:se.sourabhgupta@gmail.com?subject=Q2R Strategy Session Request&body=Name: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0AMessage:%0D%0A${message}`;
                return;
            }

            // Disable button and show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            try {
                const formData = new FormData();
                formData.append('access_key', WEB3FORMS_ACCESS_KEY);
                formData.append('name', name);
                formData.append('email', email);
                formData.append('message', message);
                formData.append('subject', 'New Q2R Strategy Session Request from JINIX Website');
                formData.append('from_name', 'JINIX Solutions Website');

                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    // Success
                    submitBtn.textContent = '✓ Message Sent!';
                    submitBtn.style.background = 'var(--color-action)';
                    contactForm.reset();

                    // Show success message
                    showNotification('Thank you! We\'ll be in touch within 24 hours.', 'success');

                    // Reset button after 3 seconds
                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                        submitBtn.style.background = '';
                    }, 3000);
                } else {
                    throw new Error(data.message || 'Form submission failed');
                }
            } catch (error) {
                // Error handling
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
                showNotification('Oops! Something went wrong. Please email us at Solutions@jinix.co.in', 'error');
                console.error('Form submission error:', error);
            }
        });
    }

    // Notification function
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(162, 255, 0, 0.95)' : 'rgba(255, 68, 68, 0.95)'};
            color: ${type === 'success' ? '#1a1a1b' : '#fff'};
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 500;
            max-width: 350px;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Add animation styles
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
});
