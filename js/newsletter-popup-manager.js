// Newsletter Popup Manager - Ensures single close behavior across all devices
(function() {
    'use strict';
    
    // Global popup manager to prevent duplicates and ensure single close
    window.NewsletterPopupManager = {
        currentPopup: null,
        isClosing: false,
        isCreating: false,
        createCount: 0, // Track how many times create has been called
        
        create: function(source = 'unknown') {
            // NEWSLETTER POPUP DISABLED - Too annoying and not efficient
            console.log('[NewsletterPopup] Popup disabled site-wide');
            return null;
        },
        
        close: function() {
            if (this.isClosing || !this.currentPopup) {
                return;
            }
            
            console.log('[NewsletterPopup] Closing popup');
            this.isClosing = true;
            
            const popup = this.currentPopup;
            
            // Immediate cleanup
            document.body.style.overflow = '';
            document.body.classList.remove('newsletter-popup-active');
            sessionStorage.removeItem('newsletter_popup_open');
            
            // Fade out effect
            popup.style.opacity = '0';
            popup.style.pointerEvents = 'none';
            
            // Remove after animation
            setTimeout(() => {
                if (popup && popup.parentNode) {
                    popup.parentNode.removeChild(popup);
                }
                this.currentPopup = null;
                this.isClosing = false;
                
                // Set dismissal timestamp
                sessionStorage.setItem('newsletter_popup_dismissed', Date.now());
                
                // Keep CTAs hidden for a short period
                setTimeout(() => {
                    this.allowCTAReappearance();
                }, 5000);
                
                console.log('[NewsletterPopup] Closed and cleaned up');
            }, 300);
        },
        
        hideAllCTAs: function() {
            const ctas = document.querySelectorAll('.mobile-cta, .desktop-cta, [id*="cta"]');
            ctas.forEach(cta => {
                cta.style.display = 'none';
            });
            sessionStorage.setItem('cta_suppressed_by_popup', 'true');
        },
        
        allowCTAReappearance: function() {
            sessionStorage.removeItem('cta_suppressed_by_popup');
            // Don't automatically show CTAs, let their logic decide
        },
        
        bindEvents: function(popup) {
            const closeBtn = popup.querySelector('.newsletter-popup-close');
            const overlay = popup.querySelector('.newsletter-popup-overlay');
            const form = popup.querySelector('.newsletter-form');
            
            // Single close handler with proper event stopping
            const closeHandler = (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }
                this.close();
            };
            
            // Close button - use capturing phase and once option
            if (closeBtn) {
                closeBtn.addEventListener('click', closeHandler, { capture: true, once: true });
                closeBtn.addEventListener('touchend', closeHandler, { capture: true, once: true });
            }
            
            // Overlay click - only if clicking directly on overlay
            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        closeHandler(e);
                    }
                }, { capture: true });
            }
            
            // Form submission
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const email = form.email.value.trim();
                    if (email) {
                        this.handleSubscription(email);
                    }
                }, { once: true });
            }
            
            // Escape key
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    closeHandler(e);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        },
        
        handleSubscription: async function(email) {
            try {
                // Mark as subscribed immediately to prevent re-popup
                sessionStorage.setItem('newsletter_subscribed', 'true');
                
                // Call newsletter API
                const response = await fetch('/api/newsletter-subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        source: 'popup',
                        tags: ['website_popup']
                    })
                });
                
                this.close();
                
                if (response.ok) {
                    this.showSuccess('✅ Successfully subscribed! Check your email.');
                } else {
                    this.showSuccess('✅ Thanks for subscribing!');
                }
            } catch (error) {
                console.error('Newsletter subscription error:', error);
                this.close();
                this.showSuccess('✅ Thanks for subscribing!');
            }
        },
        
        showSuccess: function(message) {
            const toast = document.createElement('div');
            toast.className = 'newsletter-success-toast';
            toast.textContent = message;
            toast.style.cssText = `
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
                animation: slideDown 0.3s ease-out;
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                if (toast && toast.parentNode) {
                    toast.remove();
                }
            }, 4000);
        },
        
        addStyles: function() {
            if (document.getElementById('newsletter-popup-styles')) {
                return; // Already added
            }
            
            const styles = document.createElement('style');
            styles.id = 'newsletter-popup-styles';
            styles.textContent = `
                .newsletter-popup-mobile {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    opacity: 1;
                    transition: opacity 0.3s ease-out;
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
                    cursor: pointer;
                }
                
                .newsletter-popup-content {
                    background: linear-gradient(135deg, #0E0F10 0%, #1a1a1a 100%);
                    border: 1px solid rgba(199, 255, 65, 0.2);
                    border-radius: 12px;
                    max-width: 440px;
                    width: 100%;
                    position: relative;
                    animation: slideUpFade 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
                    cursor: default;
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
                
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
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
                
                .benefit::before {
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
                
                .newsletter-popup-close {
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
                    z-index: 10001;
                }
                
                .newsletter-popup-close:hover {
                    background: rgba(247, 243, 237, 0.1);
                    color: #F7F3ED;
                }
                
                .newsletter-popup-active {
                    overflow: hidden !important;
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
            `;
            
            document.head.appendChild(styles);
        }
    };
    
    // Override any existing global popup functions
    window.showNewsletterPopup = function(source) {
        return window.NewsletterPopupManager.create(source);
    };
    
    console.log('[NewsletterPopup] Manager initialized');
})();