// Cart Abandonment Recovery System
class CartAbandonment {
    constructor() {
        this.abandonmentDelay = 5 * 60 * 1000; // 5 minutes
        this.reminderDelay = 15 * 60 * 1000; // 15 minutes  
        this.maxReminders = 2;
                             <p>Enter your email to get a <strong>20% discount on the audiobook</strong>:</p>       this.abandonmentTimer = null;
        this.reminderTimer = null;
        this.hasShownPopup = false;
        
        this.init();
    }
    
    init() {
        this.trackCartActivity();
        this.setupPageVisibilityTracking();
        this.setupBeforeUnloadHandler();
        this.checkExistingAbandonment();
        
        console.log('🛒 Cart abandonment recovery initialized');
    }
    
    trackCartActivity() {
        // Track when items are added to cart
        this.trackCartEvents();
        
        // Monitor form interactions on checkout page
        if (window.location.pathname.includes('/checkout')) {
            this.trackCheckoutAbandonment();
        }
        
        // Track book page interactions
        if (window.location.pathname.includes('/books') || 
            window.location.pathname.includes('/audiobook')) {
            this.trackBookPageInteractions();
        }
    }
    
    trackCartEvents() {
        // Listen for cart-related events - AUDIOBOOK ONLY
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Buy now buttons - only for audiobook
            if ((target.classList.contains('buy-button') || 
                target.closest('.buy-button') ||
                target.textContent.includes('Buy Now') ||
                target.textContent.includes('Get Audiobook') ||
                target.textContent.includes('Listen -')) && 
                this.isAudiobookRelated(target)) {
                
                this.recordCartActivity('audiobook_item_added');
                this.startAbandonmentTimer();
            }
        });
        
        // Track form field interactions
        document.addEventListener('input', (e) => {
            if (e.target.type === 'email' || e.target.name === 'email') {
                this.recordCartActivity('email_entered', e.target.value);
                this.startAbandonmentTimer();
            }
        });
    }
    
    isAudiobookRelated(element) {
        const text = element.textContent.toLowerCase();
        const href = element.href || '';
        
        return text.includes('audiobook') || 
               text.includes('listen') || 
               href.includes('audiobook') ||
               text.includes('$7.99') ||
               element.closest('.audiobook-section') ||
               window.location.pathname.includes('/audiobook');
    }
    
    trackCheckoutAbandonment() {
        const checkoutForm = document.querySelector('form');
        if (!checkoutForm) return;
        
        // Track form field completion
        const formFields = checkoutForm.querySelectorAll('input, select, textarea');
        let completedFields = 0;
        
        formFields.forEach(field => {
            field.addEventListener('blur', () => {
                if (field.value.trim()) {
                    completedFields++;
                    this.recordCartActivity('form_progress', {
                        completed: completedFields,
                        total: formFields.length,
                        percentage: (completedFields / formFields.length) * 100
                    });
                    
                    // Start abandonment timer after significant progress
                    if (completedFields >= 2) {
                        this.startAbandonmentTimer();
                    }
                }
            });
        });
        
        // Track Stripe checkout initiation
        const stripeButtons = document.querySelectorAll('[data-stripe]');
        stripeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.recordCartActivity('stripe_initiated');
                this.startAbandonmentTimer();
            });
        });
    }
    
    trackBookPageInteractions() {
        // Track significant engagement with book content
        let engagementScore = 0;
        
        // Scroll tracking
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                
                if (scrollPercent > 50) {
                    engagementScore += 1;
                    this.recordCartActivity('high_engagement', { scroll: scrollPercent });
                }
            }
        });
        
        // Time on page
        setTimeout(() => {
            engagementScore += 2;
            this.recordCartActivity('time_spent', { duration: '2min+' });
            this.startAbandonmentTimer();
        }, 2 * 60 * 1000);
        
        // Audio sample interaction
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            audio.addEventListener('play', () => {
                engagementScore += 3;
                this.recordCartActivity('audio_played');
                this.startAbandonmentTimer();
            });
        });
    }
    
    recordCartActivity(action, data = {}) {
        const activity = {
            action,
            data,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent.substring(0, 100)
        };
        
        // Store in localStorage
        let activities = JSON.parse(localStorage.getItem('cart_activities') || '[]');
        activities.push(activity);
        
        // Keep only last 10 activities
        if (activities.length > 10) {
            activities = activities.slice(-10);
        }
        
        localStorage.setItem('cart_activities', JSON.stringify(activities));
        
        // Send to analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'cart_activity', {
                event_category: 'Cart Abandonment',
                event_label: action,
                custom_parameter_1: JSON.stringify(data)
            });
        }
    }
    
    startAbandonmentTimer() {
        // Clear existing timer
        if (this.abandonmentTimer) {
            clearTimeout(this.abandonmentTimer);
        }
        
        // Set new timer
        this.abandonmentTimer = setTimeout(() => {
            this.handleCartAbandonment();
        }, this.abandonmentDelay);
        
        localStorage.setItem('abandonment_timer_start', Date.now().toString());
    }
    
    handleCartAbandonment() {
        if (this.hasShownPopup) return;
        
        const email = this.getCustomerEmail();
        const activities = JSON.parse(localStorage.getItem('cart_activities') || '[]');
        
        // Record abandonment
        this.recordCartActivity('cart_abandoned', {
            email: email ? 'present' : 'missing',
            activities_count: activities.length
        });
        
        // Show recovery popup
        this.showAbandonmentPopup(email);
        
        // Schedule email reminder if we have email
        if (email) {
            this.scheduleEmailReminder(email);
        }
        
        this.hasShownPopup = true;
    }
    
    showAbandonmentPopup(email) {
        // Create popup HTML
        const popup = document.createElement('div');
        popup.className = 'abandonment-popup';
        popup.innerHTML = `
            <div class="abandonment-popup-overlay">
                <div class="abandonment-popup-content">
                    <button class="abandonment-popup-close">&times;</button>
                    <div class="abandonment-popup-header">
                        <svg class="premium-icon large colored-blush" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 12px;">
                            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                        </svg>
                        <h3>Still thinking it over?</h3>
                    </div>
                    <div class="abandonment-popup-body">
                        <p>You were about to get <strong>"The Worst Boyfriends Ever"</strong> audiobook.</p>
                        ${email ? 
                            `<p>We'll send you a reminder with a special discount code.</p>
                             <p class="email-display">${email}</p>` :
                            `<p>Enter your email to get a <strong>20% discount on the audiobook</strong>:</p>
                             <div class="email-capture">
                                 <input type="email" id="abandonment-email" placeholder="your@email.com" />
                                 <button id="abandonment-submit" class="btn-primary">Get My Discount</button>
                             </div>`
                        }
                        <div class="abandonment-benefits">
                            <div class="benefit-item">
                                <svg class="premium-icon colored-lime" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                                    <path d="M12 18V6"/>
                                </svg>
                                <span><strong>20% OFF</strong> the audiobook</span>
                            </div>
                            <div class="benefit-item">
                                <svg class="premium-icon colored-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 18V5l12-2v13"/>
                                    <circle cx="6" cy="18" r="3"/>
                                    <circle cx="18" cy="16" r="3"/>
                                </svg>
                                <span>Instant access to the audiobook</span>
                            </div>
                            <div class="benefit-item">
                                <svg class="premium-icon colored-blush" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                                </svg>
                                <span>25 hilarious dating disaster stories</span>
                            </div>
                        </div>
                    </div>
                    <div class="abandonment-popup-footer">
                        <button class="btn-primary abandonment-continue">Get the Audiobook</button>
                        <button class="abandonment-maybe-later">Maybe Later</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        const styles = `
            <style>
            .abandonment-popup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                font-family: 'Inter', sans-serif;
            }
            
            .abandonment-popup-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(14, 15, 16, 0.85);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .abandonment-popup-content {
                background: linear-gradient(135deg, #0E0F10 0%, #1a1a1a 100%);
                border: 1px solid rgba(247, 243, 237, 0.1);
                border-radius: 16px;
                max-width: 480px;
                width: 100%;
                position: relative;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                animation: popupSlideIn 0.3s ease-out;
            }
            
            @keyframes popupSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            .abandonment-popup-close {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(247, 243, 237, 0.1);
                border: none;
                font-size: 20px;
                color: #F7F3ED;
                cursor: pointer;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
            }
            
            .abandonment-popup-close:hover {
                background-color: rgba(255, 59, 59, 0.2);
                color: #FF3B3B;
            }
            
            .abandonment-popup-header {
                padding: 40px 30px 0;
                text-align: center;
            }
            
            .abandonment-popup-header h3 {
                margin: 0 0 16px 0;
                font-size: 24px;
                color: #F7F3ED;
                font-weight: 700;
                font-family: 'Space Grotesk', sans-serif;
            }
            
            .abandonment-popup-body {
                padding: 20px 30px;
                text-align: center;
            }
            
            .abandonment-popup-body p {
                margin: 15px 0;
                color: rgba(247, 243, 237, 0.8);
                line-height: 1.6;
            }
            
            .email-display {
                background: rgba(247, 243, 237, 0.1);
                padding: 12px;
                border-radius: 8px;
                font-family: 'Inter', monospace;
                color: #F7F3ED !important;
                border: 1px solid rgba(247, 243, 237, 0.2);
            }
            
            .email-capture {
                display: flex;
                gap: 12px;
                margin: 20px 0;
            }
            
            .email-capture input {
                flex: 1;
                padding: 16px 20px;
                background: rgba(247, 243, 237, 0.05);
                border: 1px solid rgba(247, 243, 237, 0.2);
                border-radius: 12px;
                font-size: 16px;
                color: #F7F3ED;
                outline: none;
                transition: all 0.3s ease;
            }
            
            .email-capture input::placeholder {
                color: rgba(247, 243, 237, 0.5);
            }
            
            .email-capture input:focus {
                border-color: #FF3B3B;
                background: rgba(247, 243, 237, 0.08);
                box-shadow: 0 0 0 3px rgba(255, 59, 59, 0.1);
            }
            
            .abandonment-benefits {
                background: rgba(255, 59, 59, 0.1);
                border: 1px solid rgba(255, 59, 59, 0.2);
                padding: 20px;
                border-radius: 12px;
                margin: 20px 0;
                text-align: left;
            }
            
            .benefit-item {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 12px 0;
                color: rgba(247, 243, 237, 0.9);
            }
            
            .benefit-dot {
                width: 6px;
                height: 6px;
                background: #FF3B3B;
                border-radius: 50%;
                flex-shrink: 0;
            }
            
            .abandonment-popup-footer {
                padding: 20px 30px 40px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .abandonment-continue {
                background: linear-gradient(135deg, #FF3B3B 0%, #e53935 100%);
                color: #F7F3ED;
                border: none;
                padding: 16px 24px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s;
                font-family: 'Space Grotesk', sans-serif;
            }
            
            .abandonment-continue:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(255, 59, 59, 0.3);
            }
            
            .abandonment-maybe-later {
                background: none;
                border: none;
                color: rgba(247, 243, 237, 0.6);
                padding: 12px;
                cursor: pointer;
                font-size: 14px;
                transition: color 0.2s;
            }
            
            .abandonment-maybe-later:hover {
                color: rgba(247, 243, 237, 0.8);
            }
            
            @media (max-width: 480px) {
                .abandonment-popup-content {
                    margin: 10px;
                }
                
                .abandonment-popup-header,
                .abandonment-popup-body,
                .abandonment-popup-footer {
                    padding-left: 20px;
                    padding-right: 20px;
                }
                
                .email-capture {
                    flex-direction: column;
                }
            }
            </style>
        `;
        
        // Insert styles
        document.head.insertAdjacentHTML('beforeend', styles);
        
        // Insert popup
        document.body.appendChild(popup);
        
        // Setup event listeners
        this.setupPopupEvents(popup, email);
    }
    
    setupPopupEvents(popup, email) {
        const closeBtn = popup.querySelector('.abandonment-popup-close');
        const continueBtn = popup.querySelector('.abandonment-continue');
        const maybeBtn = popup.querySelector('.abandonment-maybe-later');
        const submitBtn = popup.querySelector('#abandonment-submit');
        const emailInput = popup.querySelector('#abandonment-email');
        
        // Close popup
        const closePopup = () => {
            popup.remove();
            this.recordCartActivity('popup_closed');
        };
        
        closeBtn?.addEventListener('click', closePopup);
        maybeBtn?.addEventListener('click', closePopup);
        
        // Continue purchase
        continueBtn?.addEventListener('click', () => {
            this.recordCartActivity('popup_continue_clicked');
            window.location.href = '/audiobook.html';
        });
        
        // Email submission
        submitBtn?.addEventListener('click', () => {
            const emailValue = emailInput?.value.trim();
            if (emailValue && this.isValidEmail(emailValue)) {
                this.captureAbandonmentEmail(emailValue);
                closePopup();
            } else {
                emailInput?.focus();
                emailInput?.classList.add('error');
            }
        });
        
        // Enter key for email
        emailInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitBtn?.click();
            }
        });
        
        // Click outside to close
        popup.querySelector('.abandonment-popup-overlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                closePopup();
            }
        });
    }
    
    getCustomerEmail() {
        // Try to get email from various sources
        const emailSources = [
            () => localStorage.getItem('customer_email'),
            () => sessionStorage.getItem('customer_email'),
            () => document.querySelector('input[type="email"]')?.value,
            () => document.querySelector('input[name="email"]')?.value,
            () => {
                const activities = JSON.parse(localStorage.getItem('cart_activities') || '[]');
                const emailActivity = activities.find(a => a.action === 'email_entered');
                return emailActivity?.data;
            }
        ];
        
        for (const source of emailSources) {
            try {
                const email = source();
                if (email && this.isValidEmail(email)) {
                    return email;
                }
            } catch (e) {
                // Continue to next source
            }
        }
        
        return null;
    }
    
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    captureAbandonmentEmail(email) {
        // Store email
        localStorage.setItem('customer_email', email);
        this.recordCartActivity('abandonment_email_captured', email);
        
        // Generate and store discount code
        const discountCode = this.generateDiscountCode();
        localStorage.setItem('discount_code', discountCode);
        localStorage.setItem('discount_expiry', (Date.now() + 24 * 60 * 60 * 1000).toString()); // 24 hours
        
        // Subscribe to newsletter with abandonment tag
        this.subscribeToNewsletter(email, 'cart_abandonment', discountCode);
        
        // Schedule email reminder
        this.scheduleEmailReminder(email);
        
        // Show discount code immediately
        this.showDiscountCode(discountCode);
    }
    
    generateDiscountCode() {
        // Generate a unique discount code
        const prefix = 'SAVE20';
        const timestamp = Date.now().toString().slice(-4);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${timestamp}${random}`;
    }
    
    showDiscountCode(code) {
        // Create discount code display
        const discountDisplay = document.createElement('div');
        discountDisplay.className = 'discount-code-display';
        discountDisplay.innerHTML = `
            <div class="discount-overlay">
                <div class="discount-content">
                    <div class="discount-header">
                        <h3><svg class="premium-icon colored-lime" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8 2v4l-3 2v4h18V8l-3-2V2"/>
        <path d="M16 4V2"/>
        <path d="M12 4V2"/>
        <path d="M8 4V2"/>
        <path d="M8 22l8-10H8l8-10"/>
    </svg> Your 20% Discount Code!</h3>
                    </div>
                    <div class="discount-body">
                        <div class="discount-code-box">
                            <code id="discount-code-text">${code}</code>
                            <button class="copy-code-btn" onclick="this.copyDiscountCode('${code}')">Copy</button>
                        </div>
                        <p><strong>Valid for 24 hours</strong></p>
                        <p><strong>How it works:</strong> Click "Use Code Now" to automatically apply the 20% discount at checkout. No manual entry needed!</p>
                        <div class="discount-steps">
                            <div class="step">
                                <span class="step-number">1</span>
                                Copy your discount code (optional backup)
                            </div>
                            <div class="step">
                                <span class="step-number">2</span>
                                Click "Use Code Now" for instant discount
                            </div>
                            <div class="step">
                                <span class="step-number">3</span>
                                Complete checkout at 20% off price
                            </div>
                        </div>
                    </div>
                    <div class="discount-footer">
                        <button class="btn-primary" onclick="this.redirectToCheckout()">Use Code Now</button>
                        <button class="discount-close" onclick="this.closeDiscountDisplay()">Save for Later</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        const discountStyles = `
            <style>
            .discount-code-display {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10001;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .discount-overlay {
                background: rgba(0, 0, 0, 0.9);
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .discount-content {
                background: white;
                border-radius: 16px;
                max-width: 500px;
                width: 100%;
                text-align: center;
                animation: discountSlideIn 0.4s ease-out;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }
            
            @keyframes discountSlideIn {
                from {
                    opacity: 0;
                    transform: scale(0.9) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
            
            .discount-header {
                padding: 30px 30px 0;
                background: linear-gradient(135deg, #9333ea, #2563eb);
                color: white;
                border-radius: 16px 16px 0 0;
            }
            
            .discount-header h3 {
                margin: 0;
                font-size: 24px;
                font-weight: 700;
                padding-bottom: 20px;
            }
            
            .discount-body {
                padding: 30px;
            }
            
            .discount-code-box {
                background: #f3f4f6;
                border: 2px dashed #9333ea;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
            }
            
            .discount-code-box code {
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: bold;
                color: #9333ea;
                letter-spacing: 1px;
                flex: 1;
            }
            
            .copy-code-btn {
                background: #9333ea;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: background-color 0.2s;
            }
            
            .copy-code-btn:hover {
                background: #7c3aed;
            }
            
            .discount-steps {
                background: #f8fafc;
                border-radius: 8px;
                padding: 16px;
                margin: 20px 0;
                text-align: left;
            }
            
            .step {
                padding: 8px 0;
                font-size: 14px;
                color: #374151;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .step:last-child {
                border-bottom: none;
            }
            
            .step-number {
                background: #9333ea;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 600;
                flex-shrink: 0;
            }
            
            .discount-footer {
                padding: 0 30px 30px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .discount-close {
                background: none;
                border: none;
                color: #6b7280;
                padding: 10px;
                cursor: pointer;
                font-size: 14px;
            }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', discountStyles);
        document.body.appendChild(discountDisplay);
        
        // Add methods to window for onclick handlers
        window.copyDiscountCode = (code) => {
            navigator.clipboard.writeText(code).then(() => {
                const btn = document.querySelector('.copy-code-btn');
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                btn.style.background = '#10b981';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '#9333ea';
                }, 2000);
            });
        };
        
        window.redirectToCheckout = () => {
            window.location.href = '/audiobook.html?discount=' + code;
        };
        
        window.closeDiscountDisplay = () => {
            discountDisplay.remove();
        };
    }
    
    async subscribeToNewsletter(email, source = 'cart_abandonment', discountCode = null) {
        try {
            const response = await fetch('/.netlify/functions/newsletter-subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    source,
                    tags: ['cart_abandonment', 'discount_eligible'],
                    discountCode: discountCode,
                    discountExpiry: discountCode ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
                })
            });
            
            if (response.ok) {
                console.log('✅ Email captured for abandonment recovery');
            }
        } catch (error) {
            console.error('❌ Error subscribing to newsletter:', error);
        }
    }
    
    scheduleEmailReminder(email) {
        const reminderData = {
            email,
            timestamp: Date.now(),
            reminderCount: 0,
            activities: JSON.parse(localStorage.getItem('cart_activities') || '[]')
        };
        
        localStorage.setItem('pending_reminder', JSON.stringify(reminderData));
        
        // In a real implementation, this would trigger a server-side email
        console.log(`📧 Email reminder scheduled for ${email}`);
    }
    
    setupPageVisibilityTracking() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // User switched away from page
                this.recordCartActivity('page_hidden');
            } else {
                // User returned to page
                this.recordCartActivity('page_visible');
                this.checkExistingAbandonment();
            }
        });
    }
    
    setupBeforeUnloadHandler() {
        window.addEventListener('beforeunload', () => {
            const timerStart = localStorage.getItem('abandonment_timer_start');
            if (timerStart && this.abandonmentTimer) {
                this.recordCartActivity('page_unload_with_timer');
            }
        });
    }
    
    checkExistingAbandonment() {
        const timerStart = localStorage.getItem('abandonment_timer_start');
        const reminderData = localStorage.getItem('pending_reminder');
        
        if (timerStart) {
            const elapsed = Date.now() - parseInt(timerStart);
            
            // If enough time has passed and we haven't shown popup yet
            if (elapsed >= this.abandonmentDelay && !this.hasShownPopup) {
                this.handleCartAbandonment();
            }
        }
        
        // Check for pending reminders
        if (reminderData) {
            const reminder = JSON.parse(reminderData);
            const elapsed = Date.now() - reminder.timestamp;
            
            if (elapsed >= this.reminderDelay && reminder.reminderCount < this.maxReminders) {
                this.sendReminderEmail(reminder);
            }
        }
    }
    
    sendReminderEmail(reminder) {
        // Update reminder count
        reminder.reminderCount++;
        reminder.lastReminderSent = Date.now();
        localStorage.setItem('pending_reminder', JSON.stringify(reminder));
        
        // In production, this would trigger server-side email
        console.log(`📧 Sending reminder ${reminder.reminderCount} to ${reminder.email}`);
        
        this.recordCartActivity('reminder_sent', {
            email: reminder.email,
            count: reminder.reminderCount
        });
    }
    
    // Public method to manually trigger abandonment (for testing)
    triggerAbandonment() {
        this.handleCartAbandonment();
    }
    
    // Clear abandonment data
    clearAbandonmentData() {
        localStorage.removeItem('cart_activities');
        localStorage.removeItem('abandonment_timer_start');
        localStorage.removeItem('pending_reminder');
        localStorage.removeItem('customer_email');
        
        if (this.abandonmentTimer) {
            clearTimeout(this.abandonmentTimer);
        }
        if (this.reminderTimer) {
            clearTimeout(this.reminderTimer);
        }
        
        console.log('🗑️ Cart abandonment data cleared');
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on relevant pages
    const relevantPages = ['/books', '/checkout', '/audiobook', '/shop'];
    const currentPage = window.location.pathname;
    
    if (relevantPages.some(page => currentPage.includes(page))) {
        window.cartAbandonment = new CartAbandonment();
    }
});

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartAbandonment;
}
