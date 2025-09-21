// Mobile-Optimized Call-to-Action System
class MobileCTA {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
        this.ctaVisible = false;
        this.scrollThreshold = 50; // Show after 50% scroll
        this.timeThreshold = 30000; // Show after 30 seconds
        
        this.init();
    }
    
    init() {
        if (!this.isMobile && !this.isTablet) return;
        
        this.createMobileCTA();
        this.setupScrollTracking();
        this.setupTimeTracking();
        this.setupResizeHandler();
        
        console.log('📱 Mobile CTA system initialized');
    }
    
    createMobileCTA() {
        // Only create on relevant pages
        const relevantPages = ['/books', '/audiobook', '/about', '/blog', '/shop'];
        const currentPage = window.location.pathname;
        
        if (!relevantPages.some(page => currentPage.includes(page))) return;
        
        // Create sticky mobile CTA
        const ctaHTML = this.generateCTAHTML();
        document.body.insertAdjacentHTML('beforeend', ctaHTML);
        
        // Add styles
        this.addMobileCTAStyles();
        
        // Setup interactions
        this.setupCTAInteractions();
    }
    
    generateCTAHTML() {
        const currentPage = window.location.pathname;
        let ctaContent = '';
        
        if (currentPage.includes('/books') || currentPage.includes('/audiobook')) {
            ctaContent = `
                <div class="mobile-cta-content">
                    <div class="mobile-cta-text">
                        <div class="mobile-cta-title">The Worst Boyfriends Ever</div>
                        <div class="mobile-cta-subtitle"><svg class="premium-icon colored-lime" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
        <path d="M12 18V6"/>
    </svg> Special Price: $7.99</div>
                    </div>
                    <button class="mobile-cta-button" data-action="buy-audiobook">
                        🎧 Get Audiobook
                    </button>
                </div>
            `;
        } else if (currentPage.includes('/blog')) {
            ctaContent = `
                <div class="mobile-cta-content">
                    <div class="mobile-cta-text">
                        <div class="mobile-cta-title"><svg class="premium-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg> Love these stories?</div>
                        <div class="mobile-cta-subtitle">Get the full audiobook!</div>
                    </div>
                    <button class="mobile-cta-button" data-action="view-books">
                        See Books
                    </button>
                </div>
            `;
        } else if (currentPage.includes('/about')) {
            ctaContent = `
                <div class="mobile-cta-content">
                    <div class="mobile-cta-text">
                        <div class="mobile-cta-title">👋 Hi! I'm A.M. Alexander</div>
                        <div class="mobile-cta-subtitle">Check out my books!</div>
                    </div>
                    <button class="mobile-cta-button" data-action="view-books">
                        My Books
                    </button>
                </div>
            `;
        } else {
            ctaContent = `
                <div class="mobile-cta-content">
                    <div class="mobile-cta-text">
                        <div class="mobile-cta-title"><svg class="premium-icon colored-blush" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
    </svg> Stay Updated</div>
                        <div class="mobile-cta-subtitle">Get book news & dating tips</div>
                    </div>
                    <button class="mobile-cta-button" data-action="newsletter">
                        Subscribe
                    </button>
                </div>
            `;
        }
        
        return `
            <div id="mobile-cta" class="mobile-cta hidden">
                ${ctaContent}
                <button class="mobile-cta-close" aria-label="Close">×</button>
            </div>
        `;
    }
    
    addMobileCTAStyles() {
        const styles = `
            <style>
            .mobile-cta {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #9333ea, #2563eb);
                color: white;
                padding: 12px 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
                z-index: 9999;
                transform: translateY(100%);
                transition: transform 0.3s ease-out;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .mobile-cta.visible {
                transform: translateY(0);
            }
            
            .mobile-cta.hidden {
                transform: translateY(100%);
            }
            
            .mobile-cta-content {
                display: flex;
                align-items: center;
                flex: 1;
                gap: 12px;
            }
            
            .mobile-cta-text {
                flex: 1;
                min-width: 0;
            }
            
            .mobile-cta-title {
                font-size: 14px;
                font-weight: 600;
                line-height: 1.2;
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .mobile-cta-subtitle {
                font-size: 12px;
                opacity: 0.9;
                line-height: 1.2;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .mobile-cta-button {
                background: rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 10px 20px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                white-space: nowrap;
                touch-action: manipulation;
            }
            
            .mobile-cta-button:hover,
            .mobile-cta-button:active {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.05);
            }
            
            .mobile-cta-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                font-weight: bold;
                cursor: pointer;
                padding: 4px;
                margin-left: 12px;
                opacity: 0.7;
                transition: opacity 0.2s;
                touch-action: manipulation;
                min-width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .mobile-cta-close:hover,
            .mobile-cta-close:active {
                opacity: 1;
            }
            
            /* Tablet adjustments */
            @media (min-width: 769px) and (max-width: 1024px) {
                .mobile-cta {
                    padding: 16px 24px;
                }
                
                .mobile-cta-title {
                    font-size: 16px;
                }
                
                .mobile-cta-subtitle {
                    font-size: 14px;
                }
                
                .mobile-cta-button {
                    padding: 12px 24px;
                    font-size: 16px;
                }
            }
            
            /* Very small screens */
            @media (max-width: 360px) {
                .mobile-cta {
                    padding: 10px 12px;
                }
                
                .mobile-cta-title {
                    font-size: 13px;
                }
                
                .mobile-cta-subtitle {
                    font-size: 11px;
                }
                
                .mobile-cta-button {
                    padding: 8px 16px;
                    font-size: 13px;
                }
            }
            
            /* Ensure content doesn't get hidden behind CTA */
            body.mobile-cta-active {
                padding-bottom: 80px;
            }
            
            /* Animation classes */
            .mobile-cta.bounce {
                animation: ctaBounce 0.6s ease-out;
            }
            
            @keyframes ctaBounce {
                0% { transform: translateY(100%); }
                50% { transform: translateY(-10px); }
                100% { transform: translateY(0); }
            }
            
            .mobile-cta.pulse {
                animation: ctaPulse 2s infinite;
            }
            
            @keyframes ctaPulse {
                0%, 100% { box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3); }
                50% { box-shadow: 0 -4px 25px rgba(147, 51, 234, 0.5); }
            }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    setupCTAInteractions() {
        const cta = document.getElementById('mobile-cta');
        if (!cta) return;
        
        const button = cta.querySelector('.mobile-cta-button');
        const closeBtn = cta.querySelector('.mobile-cta-close');
        
        // Button clicks (use element dataset to avoid e.target mismatches)
        button?.addEventListener('click', () => {
            const action = button.dataset.action;
            this.handleCTAAction(action);
            this.trackCTAClick(action);
        });
        
        // Close button
        closeBtn?.addEventListener('click', () => {
            this.hideCTA();
            this.trackCTAClose();
            
            // Don't show again for this session
            sessionStorage.setItem('mobile_cta_dismissed', 'true');
        });
        
        // Prevent accidental touches
        cta.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        });
        
        // Swipe to dismiss
        this.setupSwipeGesture(cta);
    }
    
    setupSwipeGesture(element) {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        
        element.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
            element.style.transition = 'none';
        }, { passive: true });
        
        element.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            // Only allow downward swipe
            if (deltaY > 0) {
                element.style.transform = `translateY(${deltaY}px)`;
            }
        }, { passive: true });
        
        element.addEventListener('touchend', () => {
            if (!isDragging) return;
            
            const deltaY = currentY - startY;
            isDragging = false;
            
            element.style.transition = 'transform 0.3s ease-out';
            
            // If swiped down enough, dismiss
            if (deltaY > 50) {
                this.hideCTA();
                sessionStorage.setItem('mobile_cta_dismissed', 'true');
                this.trackCTASwipe();
            } else {
                element.style.transform = 'translateY(0)';
            }
        });
    }
    
    handleCTAAction(action) {
        switch (action) {
            case 'buy-audiobook':
                window.location.href = '/checkout.html';
                break;
            case 'view-books':
                window.location.href = '/books.html';
                break;
            case 'newsletter':
                this.showNewsletterPopup();
                break;
            default:
                console.log(`Unknown CTA action: ${action}`);
        }
    }
    
    showNewsletterPopup() {
        // Use the centralized popup manager to prevent double-close issues
        if (window.NewsletterPopupManager) {
            return window.NewsletterPopupManager.create('mobile-cta');
        }
        
        // Fallback to old logic if manager not available
        console.warn('[MobileCTA] NewsletterPopupManager not found, using fallback');
        
        // Prevent multiple popups from stacking (which can feel like "double close")
        if (document.querySelector('.newsletter-popup-mobile')) {
            console.log('Newsletter popup already exists, not creating another');
            return;
        }
        
        // Also check if one was dismissed recently to avoid annoying users
        if (sessionStorage.getItem('newsletter_popup_dismissed_recently')) {
            console.log('Newsletter popup was dismissed recently, not showing again');
            return;
        }

        // Suppress the mobile CTA bar while popup is open to avoid having to close two things
        try {
            this.hideCTA();
            sessionStorage.setItem('mobile_cta_dismissed', 'true');
            sessionStorage.setItem('newsletter_popup_open', 'true');
            document.body.classList.add('newsletter-popup-open');
        } catch (e) {}
        
        // Create inline newsletter signup
        const popup = document.createElement('div');
        popup.className = 'newsletter-popup-mobile';
        popup.innerHTML = `
            <div class="newsletter-popup-overlay">
                <div class="newsletter-popup-content">
                    <div class="popup-header">
                        <h3>Don't miss the red flags</h3>
                        <p>Get behind-the-scenes content and be the first to know about new releases.</p>
                    </div>
                    <form class="newsletter-form">
                        <input type="email" placeholder="your@email.com" required />
                        <button type="submit" class="submit-btn">Get Updates</button>
                    </form>
                    <div class="popup-benefits">
                        <div class="benefit">Exclusive behind-the-scenes content</div>
                        <div class="benefit">Early access to new releases</div>
                        <div class="benefit">Personal updates from Aleks</div>
                    </div>
                    <div class="popup-footer">
                        <p>We respect your privacy. Unsubscribe at any time.</p>
                    </div>
                    <button class="newsletter-close" type="button" aria-label="Close newsletter popup">×</button>
                </div>
            </div>
        `;
        
        // Add popup styles
        const popupStyles = `
            <style>
            .newsletter-popup-mobile {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .newsletter-popup-overlay {
                background: rgba(14, 15, 16, 0.95);
                backdrop-filter: blur(8px);
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .newsletter-popup-content {
                background: linear-gradient(135deg, #0E0F10 0%, #1a1a1a 100%);
                border: 1px solid rgba(199, 255, 65, 0.2);
                border-radius: 8px;
                max-width: 440px;
                width: 100%;
                position: relative;
                animation: slideUpFade 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
            }
            
            @keyframes slideUpFade {
                from {
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            .popup-header {
                padding: 32px 32px 24px;
                border-bottom: 1px solid rgba(247, 243, 237, 0.1);
            }
            
            .popup-header h3 {
                margin: 0 0 12px 0;
                color: #F7F3ED;
                font-size: 24px;
                font-weight: 700;
                font-family: 'Space Grotesk', sans-serif;
                line-height: 1.2;
            }
            
            .popup-header p {
                margin: 0;
                color: rgba(247, 243, 237, 0.8);
                font-size: 16px;
                line-height: 1.5;
            }
            
            .newsletter-form {
                padding: 24px 32px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .newsletter-form input {
                background: rgba(247, 243, 237, 0.05);
                border: 1px solid rgba(247, 243, 237, 0.2);
                color: #F7F3ED;
                padding: 16px 20px;
                border-radius: 6px;
                font-size: 16px;
                width: 100%;
                box-sizing: border-box;
                transition: all 0.2s ease;
                font-family: inherit;
            }
            
            .newsletter-form input::placeholder {
                color: rgba(247, 243, 237, 0.5);
            }
            
            .newsletter-form input:focus {
                outline: none;
                border-color: #C7FF41;
                box-shadow: 0 0 0 2px rgba(199, 255, 65, 0.1);
                background: rgba(247, 243, 237, 0.08);
            }
            
            .submit-btn {
                background: linear-gradient(135deg, #FF3B3B 0%, #e63946 100%);
                color: #F7F3ED;
                border: none;
                padding: 16px 24px;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                font-family: inherit;
                letter-spacing: 0.01em;
            }
            
            .submit-btn:hover {
                background: linear-gradient(135deg, #e63946 0%, #d62828 100%);
                transform: translateY(-1px);
                box-shadow: 0 8px 20px rgba(255, 59, 59, 0.3);
            }
            
            .submit-btn:active {
                transform: translateY(0);
            }
            
            .popup-benefits {
                padding: 0 32px 24px;
            }
            
            .benefit {
                padding: 8px 0;
                font-size: 14px;
                color: rgba(247, 243, 237, 0.7);
                position: relative;
                padding-left: 16px;
            }
            
            .benefit:before {
                content: "→";
                position: absolute;
                left: 0;
                color: #C7FF41;
                font-weight: bold;
            }
            
            .popup-footer {
                padding: 16px 32px 32px;
                border-top: 1px solid rgba(247, 243, 237, 0.1);
            }
            
            .popup-footer p {
                margin: 0;
                color: rgba(247, 243, 237, 0.5);
                font-size: 12px;
                text-align: center;
                line-height: 1.4;
            }
            
            .newsletter-close {
                position: absolute;
                top: 16px;
                right: 16px;
                background: none;
                border: none;
                color: rgba(247, 243, 237, 0.6);
                font-size: 24px;
                font-weight: 300;
                cursor: pointer;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s ease;
            }
            
            .newsletter-close:hover {
                background: rgba(247, 243, 237, 0.1);
                color: #F7F3ED;
            }
            
            @media (max-width: 480px) {
                .newsletter-popup-content {
                    margin: 10px;
                    max-width: none;
                }
                
                .popup-header,
                .newsletter-form,
                .popup-benefits,
                .popup-footer {
                    padding-left: 24px;
                    padding-right: 24px;
                }
                
                .popup-header h3 {
                    font-size: 22px;
                }
            }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', popupStyles);
        document.body.appendChild(popup);
        
        // Setup popup events
    const form = popup.querySelector('.newsletter-form');
    const closeBtn = popup.querySelector('.newsletter-close');
    const overlayEl = popup.querySelector('.newsletter-popup-overlay');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = form.querySelector('input[type="email"]').value;
            
            if (email) {
                await this.subscribeToNewsletter(email, 'mobile_cta');
                popup.remove();
                this.hideCTA();
                this.showSuccessMessage();
            }
        });
        
        let isClosing = false; // Prevent double-close on mobile
        
        const closeNow = (e) => {
            if (isClosing) return; // Prevent multiple rapid calls
            isClosing = true;
            
            if (e) {
                e.preventDefault?.();
                e.stopPropagation?.();
            }
            popup.remove();
            // Also hide the CTA so user doesn't need to close two things
            this.hideCTA();
            sessionStorage.setItem('mobile_cta_dismissed', 'true');
            // Set a temporary flag to prevent immediate re-popup
            sessionStorage.setItem('newsletter_popup_dismissed_recently', 'true');
            setTimeout(() => {
                sessionStorage.removeItem('newsletter_popup_dismissed_recently');
            }, 5000); // Allow popup again after 5 seconds

            // Mark popup closed
            sessionStorage.removeItem('newsletter_popup_open');
            document.body.classList.remove('newsletter-popup-open');
        };

        // Close button: use touchend instead of touchstart to avoid conflicts with click
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault?.();
            e.stopPropagation?.();
            e.stopImmediatePropagation?.();
            closeNow(e);
        });
        closeBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent click event from also firing
            e.stopPropagation?.();
            e.stopImmediatePropagation?.();
            closeNow(e);
        });

        // Close when clicking/tapping on the dark overlay but not when clicking inside content
        const overlayMaybeClose = (e) => {
            // Only close if the direct target is the overlay itself
            if (e.target === overlayEl) {
                closeNow(e);
            }
        };
        overlayEl.addEventListener('click', (e) => {
            e.stopPropagation?.();
            if (e.target === overlayEl) overlayMaybeClose(e);
        });
        overlayEl.addEventListener('touchend', (e) => {
            // Only close if the direct target is the overlay itself
            if (e.target === overlayEl) {
                e.preventDefault(); // Prevent click event from also firing
                closeNow(e);
            }
        });
    }
    
    async subscribeToNewsletter(email, source) {
        try {
            const response = await fetch('/api/newsletter-subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    source,
                    tags: ['mobile_signup']
                })
            });
            
            if (response.ok) {
                console.log('✅ Newsletter subscription successful');
                return true;
            }
        } catch (error) {
            console.error('❌ Newsletter subscription failed:', error);
        }
        return false;
    }
    
    showSuccessMessage() {
        const message = document.createElement('div');
        message.className = 'success-toast';
        message.innerHTML = '✅ Successfully subscribed! Check your email.';
        
        const toastStyles = `
            <style>
            .success-toast {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #10b981;
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                font-weight: 600;
                z-index: 10001;
                animation: toastSlideIn 0.3s ease-out;
            }
            
            @keyframes toastSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', toastStyles);
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }
    
    setupScrollTracking() {
        let hasTriggered = false;
        
        window.addEventListener('scroll', () => {
            if (hasTriggered) return;
            
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent >= this.scrollThreshold) {
                this.showCTA('scroll');
                hasTriggered = true;
            }
        });
    }
    
    setupTimeTracking() {
        setTimeout(() => {
            if (!this.ctaVisible) {
                this.showCTA('time');
            }
        }, this.timeThreshold);
    }
    
    setupResizeHandler() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.isMobile = window.innerWidth <= 768;
                this.isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
                
                // Hide CTA on desktop
                if (!this.isMobile && !this.isTablet && this.ctaVisible) {
                    this.hideCTA();
                }
            }, 250);
        });
    }
    
    showCTA(trigger) {
        // Don't show if dismissed this session
        if (sessionStorage.getItem('mobile_cta_dismissed') === 'true') {
            return;
        }
        // Don't show if a newsletter popup is currently open
        if (sessionStorage.getItem('newsletter_popup_open') === 'true') {
            return;
        }
        // Don't show if CTA is suppressed by popup manager
        if (sessionStorage.getItem('cta_suppressed_by_popup') === 'true') {
            return;
        }
        
        const cta = document.getElementById('mobile-cta');
        if (!cta || this.ctaVisible) return;
        
        cta.classList.remove('hidden');
        cta.classList.add('visible', 'bounce');
        document.body.classList.add('mobile-cta-active');
        
        this.ctaVisible = true;
        
        // Add pulse effect after a delay
        setTimeout(() => {
            cta.classList.add('pulse');
        }, 3000);
        
        this.trackCTAShow(trigger);
        
        console.log(`<svg class="premium-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg> Mobile CTA shown (trigger: ${trigger})`);
    }
    
    hideCTA() {
        const cta = document.getElementById('mobile-cta');
        if (!cta) return;
        
        cta.classList.remove('visible', 'bounce', 'pulse');
        cta.classList.add('hidden');
        document.body.classList.remove('mobile-cta-active');
        
        this.ctaVisible = false;
    }
    
    // Analytics tracking
    trackCTAShow(trigger) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'mobile_cta_show', {
                event_category: 'Mobile CTA',
                event_label: trigger,
                custom_parameter_1: window.location.pathname
            });
        }
    }
    
    trackCTAClick(action) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'mobile_cta_click', {
                event_category: 'Mobile CTA',
                event_label: action,
                custom_parameter_1: window.location.pathname
            });
        }
    }
    
    trackCTAClose() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'mobile_cta_close', {
                event_category: 'Mobile CTA',
                custom_parameter_1: window.location.pathname
            });
        }
    }
    
    trackCTASwipe() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'mobile_cta_swipe', {
                event_category: 'Mobile CTA',
                custom_parameter_1: window.location.pathname
            });
        }
    }
    
    // Public methods for manual control
    show() {
        this.showCTA('manual');
    }
    
    hide() {
        this.hideCTA();
    }
    
    toggle() {
        if (this.ctaVisible) {
            this.hideCTA();
        } else {
            this.showCTA('manual');
        }
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.mobileCTA = new MobileCTA();
});

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileCTA;
}
