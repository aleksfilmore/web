// GDPR Cookie Notice JavaScript
// Include this script in all pages

class CookieNotice {
    constructor() {
        this.cookieName = 'gdpr_consent';
        this.cookieExpiry = 365; // days
        this.init();
    }

    init() {
        // Check if user has already made a choice
        if (!this.getCookie(this.cookieName)) {
            this.showNotice();
        }
        
        // Initialize event listeners
        this.initEventListeners();
    }

    showNotice() {
        // Create cookie notice HTML if it doesn't exist
        if (!document.getElementById('cookie-notice')) {
            this.createNoticeHTML();
        }
        
        // Show the notice
        setTimeout(() => {
            const notice = document.getElementById('cookie-notice');
            if (notice) {
                notice.classList.add('show');
            }
        }, 1000); // Delay to not interrupt page load
    }

    createNoticeHTML() {
        const noticeHTML = `
            <div id="cookie-notice" class="cookie-notice">
                <div class="cookie-notice-content">
                    <div class="cookie-notice-text">
                        🍪 We use essential cookies to make our site work. We'd also like to use analytics cookies to understand how you interact with our site. 
                        <a href="privacy.html">Privacy Policy</a> | <a href="terms.html">Terms</a>
                    </div>
                    <div class="cookie-notice-buttons">
                        <button class="cookie-btn cookie-btn-accept" data-action="accept-all">Accept All</button>
                        <button class="cookie-btn cookie-btn-decline" data-action="essential-only">Essential Only</button>
                        <button class="cookie-btn cookie-btn-settings" data-action="settings">Settings</button>
                    </div>
                </div>
            </div>

            <!-- Cookie Settings Modal -->
            <div id="cookie-settings-modal" class="cookie-settings-modal">
                <div class="cookie-settings-content">
                    <div class="cookie-settings-header">
                        <h2 class="font-display font-bold text-xl">Cookie Settings</h2>
                        <span class="cookie-settings-close">&times;</span>
                    </div>
                    
                    <div class="cookie-category">
                        <h3>Essential Cookies</h3>
                        <p>These cookies are necessary for the website to function and cannot be disabled.</p>
                        <div class="cookie-toggle">
                            <span>Always Active</span>
                            <div class="toggle-switch active">
                                <div class="toggle-slider"></div>
                            </div>
                        </div>
                    </div>

                    <div class="cookie-category">
                        <h3>Analytics Cookies</h3>
                        <p>These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.</p>
                        <div class="cookie-toggle">
                            <span>Google Analytics</span>
                            <div class="toggle-switch" id="analytics-toggle" data-category="analytics">
                                <div class="toggle-slider"></div>
                            </div>
                        </div>
                    </div>

                    <div class="cookie-category">
                        <h3>Marketing Cookies</h3>
                        <p>These cookies are used to track visitors across websites to display relevant advertisements.</p>
                        <div class="cookie-toggle">
                            <span>Marketing & Advertising</span>
                            <div class="toggle-switch" id="marketing-toggle" data-category="marketing">
                                <div class="toggle-slider"></div>
                            </div>
                        </div>
                    </div>

                    <div class="cookie-settings-buttons">
                        <button class="cookie-btn cookie-btn-accept" data-action="save-settings">Save Settings</button>
                        <button class="cookie-btn cookie-btn-decline" data-action="close-settings">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', noticeHTML);
    }

    initEventListeners() {
        // Use event delegation for dynamically created elements
        document.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            
            switch(action) {
                case 'accept-all':
                    this.acceptAll();
                    break;
                case 'essential-only':
                    this.essentialOnly();
                    break;
                case 'settings':
                    this.openSettings();
                    break;
                case 'save-settings':
                    this.saveSettings();
                    break;
                case 'close-settings':
                    this.closeSettings();
                    break;
            }

            // Close modal when clicking close button
            if (e.target.classList.contains('cookie-settings-close')) {
                this.closeSettings();
            }

            // Toggle switches
            if (e.target.closest('.toggle-switch') && e.target.closest('.toggle-switch').getAttribute('data-category')) {
                this.toggleSwitch(e.target.closest('.toggle-switch'));
            }
        });

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('cookie-settings-modal');
            if (e.target === modal) {
                this.closeSettings();
            }
        });
    }

    acceptAll() {
        const consent = {
            essential: true,
            analytics: true,
            marketing: true,
            timestamp: new Date().toISOString()
        };
        
        this.setCookie(this.cookieName, JSON.stringify(consent), this.cookieExpiry);
        this.hideNotice();
        this.loadAnalytics();
        this.loadMarketing();
    }

    essentialOnly() {
        const consent = {
            essential: true,
            analytics: false,
            marketing: false,
            timestamp: new Date().toISOString()
        };
        
        this.setCookie(this.cookieName, JSON.stringify(consent), this.cookieExpiry);
        this.hideNotice();
    }

    openSettings() {
        const modal = document.getElementById('cookie-settings-modal');
        if (modal) {
            modal.style.display = 'block';
            
            // Set current preferences if they exist
            const currentConsent = this.getCurrentConsent();
            if (currentConsent) {
                this.updateToggleStates(currentConsent);
            }
        }
    }

    closeSettings() {
        const modal = document.getElementById('cookie-settings-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    saveSettings() {
        const analyticsToggle = document.getElementById('analytics-toggle');
        const marketingToggle = document.getElementById('marketing-toggle');
        
        const consent = {
            essential: true,
            analytics: analyticsToggle ? analyticsToggle.classList.contains('active') : false,
            marketing: marketingToggle ? marketingToggle.classList.contains('active') : false,
            timestamp: new Date().toISOString()
        };
        
        this.setCookie(this.cookieName, JSON.stringify(consent), this.cookieExpiry);
        this.hideNotice();
        this.closeSettings();
        
        // Load appropriate scripts
        if (consent.analytics) {
            this.loadAnalytics();
        }
        if (consent.marketing) {
            this.loadMarketing();
        }
    }

    toggleSwitch(toggle) {
        toggle.classList.toggle('active');
    }

    updateToggleStates(consent) {
        const analyticsToggle = document.getElementById('analytics-toggle');
        const marketingToggle = document.getElementById('marketing-toggle');
        
        if (analyticsToggle && consent.analytics) {
            analyticsToggle.classList.add('active');
        }
        if (marketingToggle && consent.marketing) {
            marketingToggle.classList.add('active');
        }
    }

    hideNotice() {
        const notice = document.getElementById('cookie-notice');
        if (notice) {
            notice.classList.remove('show');
            setTimeout(() => {
                notice.remove();
            }, 300);
        }
    }

    loadAnalytics() {
        // Load Google Analytics
        if (typeof gtag === 'undefined') {
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
            document.head.appendChild(script);
            
            script.onload = () => {
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'GA_MEASUREMENT_ID');
                window.gtag = gtag;
            };
        }
    }

    loadMarketing() {
        // Load marketing scripts here
        console.log('Marketing cookies accepted - load marketing scripts');
    }

    getCurrentConsent() {
        const consent = this.getCookie(this.cookieName);
        return consent ? JSON.parse(consent) : null;
    }

    hasConsent(category) {
        const consent = this.getCurrentConsent();
        return consent ? consent[category] === true : false;
    }

    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CookieNotice();
});

// Utility function to check consent before loading tracking scripts
window.checkCookieConsent = function(category) {
    const cookieNotice = new CookieNotice();
    return cookieNotice.hasConsent(category);
};

// Function to manually trigger cookie settings
window.openCookieSettings = function() {
    const cookieNotice = new CookieNotice();
    cookieNotice.openSettings();
};
