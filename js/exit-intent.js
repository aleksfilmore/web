// Exit Intent Email Capture
if (typeof ExitIntentManager === 'undefined') {
class ExitIntentManager {
    constructor() {
        this.hasShown = sessionStorage.getItem('exit_intent_shown') === 'true';
        this.isActive = true;
        this.emailCaptured = localStorage.getItem('email_captured') === 'true';
        this.modal = null;
        this.escKeyHandler = null;
        this.handleSubmit = this.handleSubmit.bind(this);
        this.closeModal = this.closeModal.bind(this);
        
        // Don't show if already subscribed or shown this session
        if (this.hasShown || this.emailCaptured) {
            return;
        }
        
        this.init();
    }

    init() {
        // Exit intent detection
        document.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        // Mobile scroll up detection (simulates exit intent)
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY < lastScrollY && currentScrollY < 100 && !this.hasShown) {
                // Scrolled up near top of page
                this.showModal();
            }
            lastScrollY = currentScrollY;
        });

        // Show after 60 seconds as fallback
        setTimeout(() => {
            if (!this.hasShown && this.isActive) {
                this.showModal();
            }
        }, 60000);
    }

    handleMouseLeave(e) {
        // Only trigger if mouse leaves through top of viewport
        if (e.clientY <= 0 && !this.hasShown && this.isActive) {
            this.showModal();
        }
    }

    showModal() {
        if (!this.shouldShowModal()) return;
        
        this.hasShown = true;
        sessionStorage.setItem('exit_intent_shown', 'true');

        const modal = this.createModal();
        this.modal = modal;
        document.body.appendChild(modal);

        // Animate in
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => modal.classList.add('show'));
        } else {
            setTimeout(() => modal.classList.add('show'), 100);
        }

        // Prevent other newsletter prompts while visible
        sessionStorage.setItem('newsletter_popup_open', 'true');
        document.body.classList.add('newsletter-popup-active');
        document.body.style.overflow = 'hidden';

        this.bindModalEvents(modal);

        // Track analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'exit_intent_shown', {
                'event_category': 'engagement'
            });
        }
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'exit-intent-modal';
        modal.innerHTML = `
            <div class="exit-intent-backdrop" data-exit-backdrop></div>
            <div class="exit-intent-content">
                <button class="exit-intent-close" type="button" data-exit-close>&times;</button>
                
                <div class="exit-intent-header">
                    <h2>Before you go...</h2>
                    <p>Join readers who get exclusive access to behind-the-scenes content, early releases, and personal updates that never make it to social media.</p>
                </div>

                <form class="exit-intent-form" data-exit-form>
                    <div class="form-group">
                        <input 
                            type="email" 
                            name="email" 
                            placeholder="Your email address" 
                            required
                            class="email-input"
                        >
                        <button type="submit" class="submit-btn">
                            Get Exclusive Access
                        </button>
                    </div>
                    
                    <div class="benefits">
                        <div class="benefit">
                            <span class="benefit-dot"></span>
                            <span>Behind-the-scenes writing insights</span>
                        </div>
                        <div class="benefit">
                            <span class="benefit-dot"></span>
                            <span>Early access to new releases</span>
                        </div>
                        <div class="benefit">
                            <span class="benefit-dot"></span>
                            <span>Personal stories and updates</span>
                        </div>
                    </div>

                    <p class="privacy-note">
                        No spam, ever. Unsubscribe with one click.
                    </p>
                </form>
            </div>
        `;

        this.addStyles();
        return modal;
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const email = form.email.value;
        const submitBtn = form.querySelector('.submit-btn');
        
        // Update button state
        submitBtn.textContent = 'Joining...';
        submitBtn.disabled = true;

        try {
            // Submit to MailerLite
            const response = await fetch('/api/newsletter-subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email,
                    source: 'exit_intent'
                })
            });

            if (response.ok) {
                // Success
                localStorage.setItem('email_captured', 'true');
                sessionStorage.setItem('newsletter_subscribed', 'true');
                
                // Show success message
                form.innerHTML = `
                    <div class="success-message">
                        <div class="success-icon"></div>
                        <h3>Welcome to the inner circle</h3>
                        <p>Check your email for exclusive content that never makes it to social media.</p>
                        <button type="button" class="close-btn" data-exit-close>
                            Continue Reading
                        </button>
                    </div>
                `;

                // Track conversion
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'exit_intent_conversion', {
                        'event_category': 'conversion',
                        'value': 1
                    });
                }

                this.bindModalEvents(this.modal);

                // Auto-close after 3 seconds
                setTimeout(() => {
                    this.closeModal('auto-success');
                }, 3000);

            } else {
                throw new Error('Subscription failed');
            }

        } catch (error) {
            console.error('Newsletter subscription error:', error);
            
            // Show error message
            submitBtn.textContent = 'Try Again';
            submitBtn.disabled = false;
            
            // Show error toast
            if (typeof showToast !== 'undefined') {
                showToast('Something went wrong. Please try again.', 'error');
            }
        }

        return false;
    }

    shouldShowModal() {
        if (this.hasShown || !this.isActive) {
            return false;
        }

        if (sessionStorage.getItem('newsletter_popup_open') === 'true') {
            console.log('[ExitIntent] Newsletter popup already open, skipping exit intent');
            return false;
        }

        if (sessionStorage.getItem('newsletter_subscribed') === 'true') {
            console.log('[ExitIntent] User already subscribed via newsletter popup');
            return false;
        }

        const dismissedTime = sessionStorage.getItem('newsletter_popup_dismissed');
        if (dismissedTime && (Date.now() - parseInt(dismissedTime, 10)) < 300000) {
            console.log('[ExitIntent] Newsletter popup recently dismissed, skipping');
            return false;
        }

        return true;
    }

    bindModalEvents(modal) {
        if (!modal) return;

        const backdrop = modal.querySelector('[data-exit-backdrop]');
        if (backdrop && !backdrop.dataset.exitBound) {
            backdrop.addEventListener('click', (event) => {
                if (event.target === backdrop) {
                    event.preventDefault();
                    this.closeModal('backdrop');
                }
            });
            backdrop.dataset.exitBound = 'true';
        }

        const closeButtons = modal.querySelectorAll('[data-exit-close]');
        closeButtons.forEach((button) => {
            if (!button.dataset.exitBound) {
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    this.closeModal('close-button');
                }, { capture: true });
                button.dataset.exitBound = 'true';
            }
        });

        const form = modal.querySelector('[data-exit-form]');
        if (form && !form.dataset.exitBound) {
            form.addEventListener('submit', this.handleSubmit, { once: false });
            form.dataset.exitBound = 'true';
        }

        if (!this.escKeyHandler) {
            this.escKeyHandler = (event) => {
                if (event.key === 'Escape') {
                    this.closeModal('escape');
                }
            };
            document.addEventListener('keydown', this.escKeyHandler);
        }
    }

    closeModal(trigger = 'manual') {
        if (!this.modal) return;

        const modal = this.modal;
        modal.classList.remove('show');
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';

        setTimeout(() => {
            if (modal && modal.parentElement) {
                modal.parentElement.removeChild(modal);
            }
        }, 300);

        this.modal = null;
        this.isActive = false;

        document.body.classList.remove('newsletter-popup-active');
        document.body.style.overflow = '';
        sessionStorage.removeItem('newsletter_popup_open');
        sessionStorage.setItem('newsletter_popup_dismissed', Date.now());

        if (this.escKeyHandler) {
            document.removeEventListener('keydown', this.escKeyHandler);
            this.escKeyHandler = null;
        }

        console.log('[ExitIntent] Modal closed', trigger);
    }

    addStyles() {
        if (document.querySelector('#exit-intent-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'exit-intent-styles';
        styles.textContent = `
            .exit-intent-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10001;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }

            .exit-intent-modal.show {
                opacity: 1;
                visibility: visible;
            }

            .exit-intent-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(14, 15, 16, 0.85);
                backdrop-filter: blur(8px);
            }

            .exit-intent-content {
                position: relative;
                max-width: 480px;
                margin: 50px auto;
                background: linear-gradient(135deg, #0E0F10 0%, #1a1a1a 100%);
                border: 1px solid rgba(247, 243, 237, 0.1);
                border-radius: 16px;
                padding: 40px 30px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                transform: translateY(-20px);
                transition: transform 0.3s ease;
            }

            .exit-intent-modal.show .exit-intent-content {
                transform: translateY(0);
            }

            .exit-intent-close {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(247, 243, 237, 0.1);
                border: none;
                font-size: 20px;
                color: #F7F3ED;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
            }

            .exit-intent-close:hover {
                background-color: rgba(255, 59, 59, 0.2);
                color: #FF3B3B;
            }

            .exit-intent-header {
                text-align: center;
                margin-bottom: 30px;
            }

            .exit-intent-header h2 {
                font-size: 28px;
                margin: 0 0 16px 0;
                color: #F7F3ED;
                font-weight: 700;
                font-family: 'Space Grotesk', sans-serif;
            }

            .exit-intent-header p {
                font-size: 16px;
                color: rgba(247, 243, 237, 0.8);
                margin: 0;
                line-height: 1.6;
            }

            .form-group {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 24px;
            }

            .email-input {
                width: 100%;
                padding: 16px 20px;
                background: rgba(247, 243, 237, 0.05);
                border: 1px solid rgba(247, 243, 237, 0.2);
                border-radius: 12px;
                font-size: 16px;
                color: #F7F3ED;
                outline: none;
                transition: all 0.3s ease;
                font-family: 'Inter', sans-serif;
                box-sizing: border-box;
            }

            .email-input::placeholder {
                color: rgba(247, 243, 237, 0.5);
            }

            .email-input:focus {
                border-color: #FF3B3B;
                background: rgba(247, 243, 237, 0.08);
                box-shadow: 0 0 0 3px rgba(255, 59, 59, 0.1);
            }

            .submit-btn {
                width: 100%;
                background: linear-gradient(135deg, #FF3B3B 0%, #e53935 100%);
                color: #F7F3ED;
                border: none;
                padding: 16px 24px;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                white-space: nowrap;
                font-family: 'Space Grotesk', sans-serif;
                box-sizing: border-box;
            }

            @media (min-width: 480px) {
                .form-group {
                    flex-direction: row;
                }
                
                .email-input {
                    flex: 1;
                }
                
                .submit-btn {
                    width: auto;
                    flex-shrink: 0;
                }
            }

            .submit-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(255, 59, 59, 0.3);
            }

            .submit-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
            }

            .benefits {
                margin-bottom: 24px;
            }

            .benefit {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
                font-size: 14px;
                color: rgba(247, 243, 237, 0.8);
            }

            .benefit-dot {
                width: 6px;
                height: 6px;
                background: #FF3B3B;
                border-radius: 50%;
                flex-shrink: 0;
            }

            .privacy-note {
                text-align: center;
                font-size: 12px;
                color: rgba(247, 243, 237, 0.6);
                margin: 0;
            }

            .success-message {
                text-align: center;
                padding: 20px 0;
            }

            .success-icon {
                width: 48px;
                height: 48px;
                margin: 0 auto 16px auto;
                background: linear-gradient(135deg, #FF3B3B 0%, #e53935 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }

            .success-icon::after {
                content: '✓';
                color: #F7F3ED;
                font-size: 24px;
                font-weight: bold;
            }

            .success-message h3 {
                color: #F7F3ED;
                margin: 0 0 12px 0;
                font-size: 24px;
                font-family: 'Space Grotesk', sans-serif;
            }

            .success-message p {
                color: rgba(247, 243, 237, 0.8);
                margin: 0 0 24px 0;
                line-height: 1.5;
            }

            .close-btn {
                background: linear-gradient(135deg, #FF3B3B 0%, #e53935 100%);
                color: #F7F3ED;
                border: none;
                padding: 12px 24px;
                border-radius: 12px;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: 'Space Grotesk', sans-serif;
                font-weight: 600;
            }

            .close-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(255, 59, 59, 0.3);
            }

            @media (max-width: 768px) {
                .exit-intent-content {
                    margin: 20px;
                    padding: 30px 20px;
                }

                .form-group {
                    flex-direction: column;
                }

                .exit-intent-header h2 {
                    font-size: 24px;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

// Initialize exit intent manager
document.addEventListener('DOMContentLoaded', () => {
    window.exitIntent = new ExitIntentManager();
});

}
