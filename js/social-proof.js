// Social Proof Purchase Notifications
class SocialProofManager {
    constructor() {
        this.names = [
            'Sarah', 'Emma', 'Jessica', 'Ashley', 'Amanda', 'Stephanie', 'Nicole',
            'Michelle', 'Kimberly', 'Lisa', 'Angela', 'Heather', 'Amy', 'Rachel',
            'Melissa', 'Rebecca', 'Laura', 'Jennifer', 'Maria', 'Karen'
        ];
        this.products = [
            'The Worst Boyfriends Ever Audiobook',
            'Midway Signed Book',
            'Audiobook + Book Bundle',
            'Dacia Rising Audiobook'
        ];
        this.locations = [
            'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
            'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
            'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Sheffield',
            'Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton',
            'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast'
        ];
        this.isActive = true;
        this.lastShown = 0;
        this.minInterval = 45000; // 45 seconds minimum
        this.maxInterval = 90000; // 90 seconds maximum
        
        this.init();
    }

    init() {
        // Don't show on checkout/payment pages
        if (window.location.pathname.includes('checkout') || 
            window.location.pathname.includes('payment')) {
            return;
        }

        // Start showing notifications after page loads
        setTimeout(() => this.scheduleNext(), 10000); // Wait 10s after page load
    }

    scheduleNext() {
        if (!this.isActive) return;
        
        const interval = this.minInterval + Math.random() * (this.maxInterval - this.minInterval);
        setTimeout(() => {
            this.showNotification();
            this.scheduleNext();
        }, interval);
    }

    showNotification() {
        const now = Date.now();
        if (now - this.lastShown < 30000) return; // Don't spam
        
        const name = this.getRandomItem(this.names);
        const product = this.getRandomItem(this.products);
        const location = this.getRandomItem(this.locations);
        const timeAgo = this.getRandomTimeAgo();
        
        const message = `${name} from ${location} just purchased "${product}" ${timeAgo}`;
        
        this.displayNotification(message);
        this.lastShown = now;
        
        // Track analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'social_proof_shown', {
                'event_category': 'engagement',
                'product': product
            });
        }
    }

    getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    getRandomTimeAgo() {
        const options = [
            '2 minutes ago',
            '5 minutes ago',
            '8 minutes ago',
            '12 minutes ago',
            '15 minutes ago',
            '18 minutes ago',
            '22 minutes ago',
            '25 minutes ago'
        ];
        return this.getRandomItem(options);
    }

    displayNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'social-proof-notification';
        notification.innerHTML = `
            <div class="social-proof-content">
                <div class="social-proof-icon">🛒</div>
                <div class="social-proof-text">${message}</div>
                <button class="social-proof-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;

        // Add styles if not already added
        if (!document.querySelector('#social-proof-styles')) {
            this.addStyles();
        }

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto remove after 6 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 6000);
    }

    addStyles() {
        const styles = document.createElement('style');
        styles.id = 'social-proof-styles';
        styles.textContent = `
            .social-proof-notification {
                position: fixed;
                bottom: 20px;
                left: 20px;
                max-width: 350px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                z-index: 10000;
                transform: translateX(-100%);
                transition: transform 0.3s ease-out;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .social-proof-notification.show {
                transform: translateX(0);
            }

            .social-proof-content {
                display: flex;
                align-items: center;
                padding: 16px;
                gap: 12px;
            }

            .social-proof-icon {
                font-size: 20px;
                flex-shrink: 0;
            }

            .social-proof-text {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
                font-weight: 500;
            }

            .social-proof-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
                flex-shrink: 0;
            }

            .social-proof-close:hover {
                background-color: rgba(255,255,255,0.2);
            }

            @media (max-width: 768px) {
                .social-proof-notification {
                    left: 10px;
                    right: 10px;
                    max-width: none;
                    bottom: 10px;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    // Methods to control notifications
    pause() {
        this.isActive = false;
    }

    resume() {
        this.isActive = true;
        this.scheduleNext();
    }

    stop() {
        this.isActive = false;
        // Remove any existing notifications
        document.querySelectorAll('.social-proof-notification').forEach(el => el.remove());
    }
}

// Initialize social proof manager
document.addEventListener('DOMContentLoaded', () => {
    window.socialProof = new SocialProofManager();
});

// Pause notifications when user is actively interacting with checkout
document.addEventListener('focus', (e) => {
    if (e.target.matches('input, select, textarea')) {
        window.socialProof?.pause();
        setTimeout(() => window.socialProof?.resume(), 30000); // Resume after 30s
    }
}, true);
