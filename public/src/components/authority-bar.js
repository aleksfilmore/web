/**
 * AuthorityBar Web Component
 * 
 * Displays social proof: ratings, review count, Amazon rankings, retailer badges
 * Usage: <authority-bar variant="default"></authority-bar>
 * 
 * Variants:
 * - default: Full bar with all stats
 * - compact: Condensed version for sidebars
 * - minimal: Just rating and review count
 */

class AuthorityBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['variant', 'theme'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  getAuthorityData() {
    return {
      rating: 4.7,
      reviewCount: 120,
      rankings: [
        { position: '#1', category: 'Gay Fiction', platform: 'Amazon' },
        { position: '#1', category: 'Gay Humor', platform: 'Amazon' },
        { position: '#2', category: 'Gay Romance', platform: 'Amazon' }
      ],
      retailers: [
        { name: 'Amazon', logo: '/logos/Amazon.svg', url: 'https://a.co/d/1eaTrOP' },
        { name: 'Audible', logo: '/logos/Amazon.svg', url: 'https://www.audible.com/pd/The-Worst-Boyfriends-Ever-Audiobook/B0DJKDVL6L' },
        { name: 'Spotify', logo: '/logos/Spotify.svg', url: 'https://open.spotify.com/show/3MkwMuRw52OlPjxp9NSMYF' },
        { name: 'Kobo', logo: '/logos/Kobo.svg', url: 'https://www.kobo.com/us/en/audiobook/worst-boyfriends-ever-the' },
        { name: 'Barnes & Noble', logo: '/logos/BN.svg', url: 'https://www.barnesandnoble.com/w/the-worst-boyfriends-ever-aleks-filmore/1147815344' }
      ],
      disclaimer: 'Rankings based on peak positions in Amazon Kindle Store. Reviews are verified purchases across multiple platforms.'
    };
  }

  render() {
    const variant = this.getAttribute('variant') || 'default';
    const theme = this.getAttribute('theme') || 'dark'; // dark | light
    const data = this.getAuthorityData();

    const styles = `
      <style>
        :host {
          display: block;
          font-family: 'Inter', sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        .authority-bar {
          background: ${theme === 'dark' ? 'rgba(240, 232, 201, 0.03)' : '#f0e8c9'};
          border: 1px solid ${theme === 'dark' ? 'rgba(240, 232, 201, 0.1)' : 'rgba(1, 3, 0, 0.1)'};
          border-radius: 1rem;
          padding: ${variant === 'compact' ? '1rem' : '1.5rem'};
          color: ${theme === 'dark' ? '#f0e8c9' : '#010300'};
        }

        .authority-bar.minimal {
          padding: 1rem;
          display: inline-block;
        }

        .rating-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: ${variant === 'minimal' ? '0' : '1.5rem'};
          flex-wrap: wrap;
        }

        .rating-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .stars {
          color: #fd0009;
          font-size: ${variant === 'compact' ? '1.25rem' : '1.5rem'};
          font-weight: 700;
          letter-spacing: 0.1em;
        }

        .rating-value {
          font-size: ${variant === 'compact' ? '1.5rem' : '2rem'};
          font-weight: 700;
          font-family: 'Space Grotesk', sans-serif;
          color: ${theme === 'dark' ? '#f0e8c9' : '#010300'};
        }

        .review-count {
          color: ${theme === 'dark' ? '#bfb9a3' : '#4A5C7A'};
          font-size: ${variant === 'compact' ? '0.875rem' : '1rem'};
        }

        .rankings {
          display: grid;
          grid-template-columns: ${variant === 'compact' ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))'};
          gap: 0.75rem;
          margin-bottom: ${variant === 'default' ? '1.5rem' : '0'};
        }

        .ranking-badge {
          background: ${theme === 'dark' ? 'rgba(253, 0, 9, 0.1)' : 'rgba(253, 0, 9, 0.15)'};
          border: 1px solid ${theme === 'dark' ? 'rgba(253, 0, 9, 0.3)' : 'rgba(253, 0, 9, 0.4)'};
          padding: 0.75rem;
          border-radius: 0.5rem;
          text-align: center;
        }

        .ranking-position {
          font-size: 1.25rem;
          font-weight: 700;
          font-family: 'Space Grotesk', sans-serif;
          color: #fd0009;
          display: block;
          margin-bottom: 0.25rem;
        }

        .ranking-category {
          font-size: 0.75rem;
          color: ${theme === 'dark' ? '#bfb9a3' : '#4A5C7A'};
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .retailers {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid ${theme === 'dark' ? 'rgba(240, 232, 201, 0.1)' : 'rgba(1, 3, 0, 0.1)'};
        }

        .retailers-label {
          font-size: 0.875rem;
          color: ${theme === 'dark' ? '#bfb9a3' : '#4A5C7A'};
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .retailer-logos {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .retailer-link {
          display: block;
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }

        .retailer-link:hover {
          opacity: 1;
        }

        .retailer-logo {
          height: ${variant === 'compact' ? '20px' : '24px'};
          width: auto;
          filter: ${theme === 'dark' ? 'brightness(0) invert(1)' : 'none'};
        }

        .disclaimer {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid ${theme === 'dark' ? 'rgba(240, 232, 201, 0.1)' : 'rgba(1, 3, 0, 0.1)'};
          font-size: 0.75rem;
          color: ${theme === 'dark' ? '#bfb9a3' : '#4A5C7A'};
          font-style: italic;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .rankings {
            grid-template-columns: 1fr;
          }

          .retailers {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      </style>
    `;

    const ratingHTML = `
      <div class="rating-section">
        <div class="rating-display">
          <span class="stars">${'★'.repeat(Math.round(data.rating))}${'☆'.repeat(5 - Math.round(data.rating))}</span>
          <span class="rating-value">${data.rating}</span>
        </div>
        <span class="review-count">${data.reviewCount}+ verified reviews</span>
      </div>
    `;

    const rankingsHTML = variant !== 'minimal' ? `
      <div class="rankings">
        ${data.rankings.map(rank => `
          <div class="ranking-badge">
            <span class="ranking-position">${rank.position}</span>
            <span class="ranking-category">${rank.category}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    const retailersHTML = variant === 'default' ? `
      <div class="retailers">
        <span class="retailers-label">Available at:</span>
        <div class="retailer-logos">
          ${data.retailers.map(retailer => `
            <a href="${retailer.url}" 
               class="retailer-link" 
               target="_blank" 
               rel="noopener noreferrer"
               title="Buy on ${retailer.name}"
               data-track="retailer_${retailer.name.toLowerCase().replace(/\s+/g, '_')}">
              <img src="${retailer.logo}" 
                   alt="${retailer.name}" 
                   class="retailer-logo"
                   loading="lazy" />
            </a>
          `).join('')}
        </div>
      </div>
    ` : '';

    const disclaimerHTML = variant === 'default' && this.hasAttribute('show-disclaimer') ? `
      <div class="disclaimer">${data.disclaimer}</div>
    ` : '';

    const html = `
      ${styles}
      <div class="authority-bar ${variant}" itemscope itemtype="https://schema.org/AggregateRating">
        ${ratingHTML}
        ${rankingsHTML}
        ${retailersHTML}
        ${disclaimerHTML}
        
        <!-- Schema.org Microdata -->
        <meta itemprop="ratingValue" content="${data.rating}" />
        <meta itemprop="reviewCount" content="${data.reviewCount}" />
        <meta itemprop="bestRating" content="5" />
        <meta itemprop="worstRating" content="1" />
      </div>
    `;

    this.shadowRoot.innerHTML = html;
    this.attachEventListeners();
  }

  attachEventListeners() {
    const links = this.shadowRoot.querySelectorAll('[data-track]');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const trackId = link.getAttribute('data-track');
        this.trackRetailerClick(trackId, link.href);
      });
    });
  }

  trackRetailerClick(retailer, url) {
    this.dispatchEvent(new CustomEvent('retailer-click', {
      bubbles: true,
      detail: { retailer, url, timestamp: Date.now() }
    }));

    // Google Analytics
    if (window.gtag) {
      gtag('event', 'click', {
        event_category: 'Outbound Link',
        event_label: retailer,
        value: url
      });
    }
  }
}

// Register the custom element
if (!customElements.get('authority-bar')) {
  customElements.define('authority-bar', AuthorityBar);
}

export default AuthorityBar;
