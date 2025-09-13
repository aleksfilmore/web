// Trust Badges Component
if (typeof TrustBadges === 'undefined') {
class TrustBadges {
    constructor() {
        this.badges = [
            {
                icon: '🔒',
                title: 'SSL Secured',
                description: 'Your data is protected'
            },
            {
                icon: '💳',
                title: 'Stripe Verified',
                description: 'Secure payment processing'
            },
    {
        icon: '<svg class="premium-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>' +
              '</svg>',
        title: 'Instant Access',
        description: 'Access immediately after purchase'
    },
    {
        icon: '<svg class="premium-icon filled colored-blush" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1">' +
              '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>' +
              '</svg>',
        title: '5-Star Rated',
        description: 'Loved by thousands of readers'
    },
            {
                icon: '🇪🇺',
                title: 'EU Compliant',
                description: 'Follows all digital rights regulations'
            }
        ];
        
        this.init();
    }

    init() {
        this.addStyles();
        this.insertTrustBadges();
    }

    insertTrustBadges() {
        // Add to checkout page
        const checkoutContainer = document.querySelector('.checkout-form, .payment-form, #checkout-container');
        if (checkoutContainer) {
            const trustSection = this.createTrustSection();
            checkoutContainer.insertBefore(trustSection, checkoutContainer.firstChild);
        }

        // Add to product pages
        const productContainers = document.querySelectorAll('.product-info, .book-details, .purchase-section');
        productContainers.forEach(container => {
            const miniTrust = this.createMiniTrustBadges();
            container.appendChild(miniTrust);
        });

        // Add to footer of all pages
        const footer = document.querySelector('footer');
        if (footer) {
            const footerTrust = this.createFooterTrustBadges();
            footer.insertBefore(footerTrust, footer.firstChild);
        }
    }

    createTrustSection() {
        const section = document.createElement('div');
        section.className = 'trust-badges-section';
        section.innerHTML = `
            <h3 class="trust-title">Your Purchase is Protected</h3>
            <div class="trust-badges-grid">
                ${this.badges.map(badge => `
                    <div class="trust-badge">
                        <div class="trust-icon">${badge.icon}</div>
                        <div class="trust-content">
                            <div class="trust-badge-title">${badge.title}</div>
                            <div class="trust-badge-description">${badge.description}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="trust-note">
                <p>🔐 All transactions are encrypted and secure. Digital products are delivered instantly.</p>
            </div>
        `;
        return section;
    }

    createMiniTrustBadges() {
        const container = document.createElement('div');
        container.className = 'mini-trust-badges';
        container.innerHTML = `
            <div class="mini-trust-items">
                <div class="mini-trust-item">
                    <span class="mini-trust-icon">🔒</span>
                    <span>Secure Checkout</span>
                </div>
                <div class="mini-trust-item">
                    <span class="mini-trust-icon"><svg class="premium-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg></span>
                    <span>Instant Access</span>
                </div>
                <div class="mini-trust-item">
                    <span class="mini-trust-icon"><svg class="premium-icon filled colored-blush" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg></span>
                    <span>5-Star Rated</span>
                </div>
            </div>
        `;
        return container;
    }

    createFooterTrustBadges() {
        const container = document.createElement('div');
        container.className = 'footer-trust-badges';
        container.innerHTML = `
            <div class="footer-trust-content">
                <div class="footer-trust-items">
                    <div class="footer-trust-item">
                        <span class="footer-trust-icon">🔒</span>
                        <span>SSL Secured</span>
                    </div>
                    <div class="footer-trust-item">
                        <span class="footer-trust-icon">💳</span>
                        <span>Stripe Protected</span>
                    </div>
                    <div class="footer-trust-item">
                        <span class="footer-trust-icon">🇪🇺</span>
                        <span>EU Compliant</span>
                    </div>
                    <div class="footer-trust-item">
                        <span class="footer-trust-icon"><svg class="premium-icon filled colored-blush" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg></span>
                        <span>Trusted by 1000s</span>
                    </div>
                </div>
            </div>
        `;
        return container;
    }

    addStyles() {
        if (document.querySelector('#trust-badges-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'trust-badges-styles';
        styles.textContent = `
            /* Main Trust Badges Section */
            .trust-badges-section {
                background: linear-gradient(135deg, #f8f9ff 0%, #e8f4f8 100%);
                border-radius: 15px;
                padding: 25px;
                margin-bottom: 30px;
                border: 1px solid #e0e8f0;
            }

            .trust-title {
                text-align: center;
                color: #333;
                font-size: 20px;
                font-weight: 600;
                margin: 0 0 20px 0;
            }

            .trust-badges-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }

            .trust-badge {
                display: flex;
                align-items: center;
                gap: 12px;
                background: white;
                padding: 15px;
                border-radius: 10px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                transition: transform 0.2s;
            }

            .trust-badge:hover {
                transform: translateY(-2px);
            }

            .trust-icon {
                font-size: 24px;
                flex-shrink: 0;
            }

            .trust-content {
                flex: 1;
            }

            .trust-badge-title {
                font-weight: 600;
                color: #333;
                font-size: 14px;
                margin-bottom: 2px;
            }

            .trust-badge-description {
                font-size: 12px;
                color: #666;
                line-height: 1.3;
            }

            .trust-note {
                text-align: center;
                padding: 15px;
                background: rgba(255,255,255,0.7);
                border-radius: 8px;
                border: 1px solid #e0e8f0;
            }

            .trust-note p {
                margin: 0;
                font-size: 14px;
                color: #555;
            }

            /* Mini Trust Badges */
            .mini-trust-badges {
                margin: 20px 0;
                padding: 15px 0;
                border-top: 1px solid #e0e0e0;
            }

            .mini-trust-items {
                display: flex;
                justify-content: center;
                gap: 20px;
                flex-wrap: wrap;
            }

            .mini-trust-item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 13px;
                color: #666;
                padding: 8px 12px;
                background: #f8f9fa;
                border-radius: 20px;
            }

            .mini-trust-icon {
                font-size: 14px;
            }

            /* Footer Trust Badges */
            .footer-trust-badges {
                border-top: 1px solid #e0e0e0;
                padding: 20px 0;
                margin-bottom: 20px;
            }

            .footer-trust-content {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
            }

            .footer-trust-items {
                display: flex;
                justify-content: center;
                gap: 30px;
                flex-wrap: wrap;
            }

            .footer-trust-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: #666;
            }

            .footer-trust-icon {
                font-size: 16px;
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .trust-badges-grid {
                    grid-template-columns: 1fr;
                }

                .trust-badge {
                    padding: 12px;
                }

                .mini-trust-items {
                    gap: 15px;
                }

                .mini-trust-item {
                    font-size: 12px;
                    padding: 6px 10px;
                }

                .footer-trust-items {
                    gap: 20px;
                }

                .footer-trust-item {
                    font-size: 13px;
                }
            }

            @media (max-width: 480px) {
                .trust-badges-section {
                    padding: 20px 15px;
                }

                .trust-title {
                    font-size: 18px;
                }

                .mini-trust-items {
                    justify-content: space-between;
                    gap: 10px;
                }

                .footer-trust-items {
                    flex-direction: column;
                    align-items: center;
                    gap: 15px;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

// Initialize trust badges
document.addEventListener('DOMContentLoaded', () => {
    new TrustBadges();
});

}
