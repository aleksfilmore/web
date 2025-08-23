// Enhanced Analytics Tracking
class AnalyticsEnhancer {
    constructor() {
        this.startTime = Date.now();
        this.maxScrollPercent = 0;
        this.milestones = {
            scroll: [25, 50, 75, 100],
            time: [30, 60, 120, 300] // 30s, 1m, 2m, 5m
        };
        this.trackedEvents = new Set();
        this.pageType = this.detectPageType();
        
        this.init();
    }

    init() {
        this.trackScrollDepth();
        this.trackTimeOnPage();
        this.trackEngagement();
        this.trackConversionFunnel();
        
        // Track page exit
        window.addEventListener('beforeunload', () => this.trackPageExit());
        window.addEventListener('pagehide', () => this.trackPageExit());
    }

    detectPageType() {
        const path = window.location.pathname.toLowerCase();
        
        if (path.includes('checkout') || path.includes('payment')) return 'checkout';
        if (path.includes('shop') || path.includes('books')) return 'product';
        if (path.includes('audiobook-player')) return 'player';
        if (path.includes('admin')) return 'admin';
        if (path.includes('blog')) return 'blog';
        if (path === '/' || path === '/index.html') return 'home';
        
        return 'other';
    }

    trackScrollDepth() {
        let ticking = false;
        
        const updateScrollDepth = () => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((scrollTop / docHeight) * 100);
            
            if (scrollPercent > this.maxScrollPercent) {
                this.maxScrollPercent = scrollPercent;
                
                // Track milestone percentages
                this.milestones.scroll.forEach(milestone => {
                    if (scrollPercent >= milestone && !this.trackedEvents.has(`scroll_${milestone}`)) {
                        this.trackEvent('scroll_depth', {
                            'percent': milestone,
                            'page_type': this.pageType,
                            'time_to_scroll': Math.round((Date.now() - this.startTime) / 1000)
                        });
                        this.trackedEvents.add(`scroll_${milestone}`);
                    }
                });
            }
            
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollDepth);
                ticking = true;
            }
        });
    }

    trackTimeOnPage() {
        this.milestones.time.forEach(seconds => {
            setTimeout(() => {
                if (!this.trackedEvents.has(`time_${seconds}`)) {
                    this.trackEvent('time_on_page', {
                        'seconds': seconds,
                        'page_type': this.pageType,
                        'scroll_depth': this.maxScrollPercent
                    });
                    this.trackedEvents.add(`time_${seconds}`);
                }
            }, seconds * 1000);
        });
    }

    trackEngagement() {
        // Track clicks on important elements
        const selectors = [
            'a[href*="shop"]',
            'a[href*="checkout"]',
            'button[class*="buy"]',
            'button[class*="purchase"]',
            '.cta-button',
            '.newsletter-signup',
            '.social-link',
            '.book-cover',
            '.audiobook-sample'
        ];

        selectors.forEach(selector => {
            document.addEventListener('click', (e) => {
                if (e.target.matches(selector) || e.target.closest(selector)) {
                    const element = e.target.matches(selector) ? e.target : e.target.closest(selector);
                    
                    this.trackEvent('engagement_click', {
                        'element_type': this.getElementType(element),
                        'element_text': element.textContent?.trim().substring(0, 50) || '',
                        'page_type': this.pageType,
                        'time_on_page': Math.round((Date.now() - this.startTime) / 1000)
                    });
                }
            });
        });

        // Track form interactions
        document.addEventListener('focus', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.trackEvent('form_interaction', {
                    'form_type': this.getFormType(e.target),
                    'field_type': e.target.type || e.target.tagName.toLowerCase(),
                    'page_type': this.pageType
                });
            }
        }, true);
    }

    trackConversionFunnel() {
        // Track funnel progression
        const funnelSteps = {
            'home': 'awareness',
            'product': 'interest',
            'checkout': 'intent',
            'payment': 'action'
        };

        if (funnelSteps[this.pageType]) {
            this.trackEvent('funnel_step', {
                'step': funnelSteps[this.pageType],
                'page_type': this.pageType,
                'session_time': this.getSessionTime()
            });
        }

        // Track specific conversion events
        if (this.pageType === 'checkout') {
            this.trackCheckoutEvents();
        }
    }

    trackCheckoutEvents() {
        // Track checkout start
        this.trackEvent('begin_checkout', {
            'page_type': this.pageType,
            'time_to_checkout': this.getSessionTime()
        });

        // Track payment method selection
        document.addEventListener('change', (e) => {
            if (e.target.name === 'payment_method' || e.target.classList.contains('payment-option')) {
                this.trackEvent('payment_method_selected', {
                    'method': e.target.value || 'unknown',
                    'page_type': this.pageType
                });
            }
        });

        // Track form completion
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('checkout-form') || e.target.id === 'payment-form') {
                this.trackEvent('checkout_form_submit', {
                    'page_type': this.pageType,
                    'form_completion_time': Math.round((Date.now() - this.startTime) / 1000)
                });
            }
        });
    }

    trackPageExit() {
        const timeOnPage = Math.round((Date.now() - this.startTime) / 1000);
        
        this.trackEvent('page_exit', {
            'time_on_page': timeOnPage,
            'max_scroll_depth': this.maxScrollPercent,
            'page_type': this.pageType,
            'session_time': this.getSessionTime()
        });
    }

    getElementType(element) {
        if (element.matches('a')) return 'link';
        if (element.matches('button')) return 'button';
        if (element.matches('img')) return 'image';
        if (element.matches('input, textarea, select')) return 'form_field';
        return element.tagName.toLowerCase();
    }

    getFormType(element) {
        const form = element.closest('form');
        if (!form) return 'unknown';
        
        if (form.classList.contains('newsletter-form')) return 'newsletter';
        if (form.classList.contains('checkout-form')) return 'checkout';
        if (form.classList.contains('contact-form')) return 'contact';
        
        return 'other';
    }

    getSessionTime() {
        const sessionStart = sessionStorage.getItem('session_start');
        if (!sessionStart) {
            sessionStorage.setItem('session_start', Date.now().toString());
            return 0;
        }
        
        return Math.round((Date.now() - parseInt(sessionStart)) / 1000);
    }

    trackEvent(eventName, parameters = {}) {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                'event_category': 'enhanced_tracking',
                'custom_map': {
                    'dimension1': 'page_type',
                    'dimension2': 'user_engagement'
                },
                ...parameters
            });
        }

        // Console log for debugging (remove in production)
        console.log(`📊 Analytics Event: ${eventName}`, parameters);
        
        // Send to custom analytics endpoint if needed
        if (window.location.hostname !== 'localhost') {
            this.sendToCustomEndpoint(eventName, parameters);
        }
    }

    async sendToCustomEndpoint(eventName, parameters) {
        try {
            await fetch('/.netlify/functions/analytics-track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event: eventName,
                    parameters: parameters,
                    timestamp: Date.now(),
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    referrer: document.referrer
                })
            });
        } catch (error) {
            console.error('Failed to send analytics event:', error);
        }
    }

    // Public method to track custom events
    track(eventName, parameters = {}) {
        this.trackEvent(eventName, {
            ...parameters,
            'page_type': this.pageType,
            'time_on_page': Math.round((Date.now() - this.startTime) / 1000)
        });
    }
}

// Initialize analytics enhancer
document.addEventListener('DOMContentLoaded', () => {
    window.analytics = new AnalyticsEnhancer();
});

// Expose global tracking function
window.trackEvent = function(eventName, parameters = {}) {
    if (window.analytics) {
        window.analytics.track(eventName, parameters);
    }
};
