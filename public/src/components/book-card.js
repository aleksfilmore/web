/**
 * BookCard Web Component
 * 
 * Displays a book with cover, metadata, CTAs, and Schema.org JSON-LD
 * Usage: <book-card book-id="twbe"></book-card>
 * 
 * @fires book-click - When user clicks primary CTA
 * @fires book-view - When card enters viewport
 */

class BookCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['book-id', 'variant'];
  }

  connectedCallback() {
    this.render();
    this.setupIntersectionObserver();
    this.attachEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  getBookData(bookId) {
    const books = {
      'twbe': {
        id: 'twbe',
        title: 'The Worst Boyfriends Ever',
        subtitle: 'A queer dating memoir that turns wreckage into punchlines',
        author: 'Aleks Filmore',
        isbn: '979-8340447241',
        cover: '/The Worst Boyfriends Ever Web.jpg',
        coverAlt: 'The Worst Boyfriends Ever book cover - colorful teal design with rainbow elements',
        status: 'published',
        publishDate: '2025-01-15',
        genre: 'Memoir',
        rating: 4.7,
        reviewCount: 120,
        description: 'A darkly funny memoir told in short, surgical essays. Each story exposes a different archetype of emotional disaster - not to shame exes, but to trace patterns of why we stay too long, love too hard, and learn too late.',
        primaryCTA: {
          text: 'Buy on Amazon',
          url: 'https://a.co/d/1eaTrOP',
          track: 'amazon_twbe_card'
        },
        secondaryCTA: {
          text: 'Listen on Audible',
          url: 'https://www.audible.com/pd/The-Worst-Boyfriends-Ever-Audiobook/B0DJKDVL6L',
          track: 'audible_twbe_card'
        },
        badges: ['#1 Gay Fiction', '#1 Gay Humor', '#2 Gay Romance']
      },
      'aftertaste': {
        id: 'aftertaste',
        title: 'Aftertaste',
        subtitle: 'Peace looks like absence until it tastes like freedom',
        author: 'Aleks Filmore',
        isbn: null,
        cover: '/images/placeholder-aftertaste.png', // Placeholder until designed
        coverAlt: 'Aftertaste book cover - coming Spring 2026',
        status: 'coming-soon',
        publishDate: '2026-03-01',
        genre: 'Memoir',
        description: 'A meditation on what remains after heartbreak loses its drama. Grief meets grace; silence becomes a teacher. Minimalist prose, cinematic fragments, emotional precision.',
        primaryCTA: {
          text: 'Coming Spring 2026',
          url: '#',
          track: 'aftertaste_interest'
        },
        secondaryCTA: null,
        badges: ['Philosophy-Noir', 'Cinematic Minimalism']
      },
      'red-flag': {
        id: 'red-flag',
        title: 'Am I the Red Flag?',
        subtitle: 'The accountability arc',
        author: 'Aleks Filmore',
        isbn: null,
        cover: '/images/placeholder-red-flag.png', // Placeholder
        coverAlt: 'Am I the Red Flag? book cover - coming Late 2026',
        status: 'coming-soon',
        publishDate: '2026-11-01',
        genre: 'Memoir',
        description: 'The mirror flips. A philosophical, humorous self-interrogation of modern dating and queer accountability. Part memoir, part manifesto; equally funny and unnerving.',
        primaryCTA: {
          text: 'Coming Late 2026',
          url: '#',
          track: 'red_flag_interest'
        },
        secondaryCTA: null,
        badges: ['Self-Aware', 'Queer Realism']
      }
    };

    return books[bookId] || books['twbe'];
  }

  render() {
    const bookId = this.getAttribute('book-id') || 'twbe';
    const variant = this.getAttribute('variant') || 'default'; // default | compact | featured
    const book = this.getBookData(bookId);

    const styles = `
      <style>
        :host {
          display: block;
          font-family: 'Inter', sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        .book-card {
          background: rgba(240, 232, 201, 0.03);
          border: 1px solid rgba(240, 232, 201, 0.1);
          border-radius: 1rem;
          padding: 1.5rem;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .book-card:hover {
          border-color: rgba(240, 232, 201, 0.3);
          background: rgba(240, 232, 201, 0.05);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .book-card.featured {
          background: linear-gradient(135deg, rgba(74, 92, 122, 0.1), rgba(10, 17, 40, 0.1));
          border: 2px solid rgba(93, 173, 226, 0.3);
        }

        .cover-container {
          position: relative;
          width: 100%;
          aspect-ratio: 2/3;
          margin-bottom: 1.5rem;
          border-radius: 0.5rem;
          overflow: hidden;
          background: #1a1a1a;
        }

        .cover-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .book-card:hover .cover-image {
          transform: scale(1.05);
        }

        .status-badge {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: rgba(253, 0, 9, 0.9);
          color: #f0e8c9;
          padding: 0.375rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          backdrop-filter: blur(10px);
        }

        .status-badge.coming-soon {
          background: rgba(74, 92, 122, 0.9);
        }

        .badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.625rem;
          background: rgba(253, 0, 9, 0.15);
          color: #fd0009;
          border-radius: 0.25rem;
          font-weight: 500;
        }

        .book-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #f0e8c9;
          margin: 0 0 0.5rem 0;
          line-height: 1.2;
        }

        .subtitle {
          font-size: 0.875rem;
          color: #bfb9a3;
          margin: 0 0 1rem 0;
          font-style: italic;
          line-height: 1.4;
        }

        .rating {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .stars {
          color: #fd0009;
          font-weight: 600;
        }

        .review-count {
          color: #bfb9a3;
        }

        .description {
          font-size: 0.875rem;
          line-height: 1.6;
          color: #bfb9a3;
          margin: 0 0 1.5rem 0;
          flex: 1;
        }

        .cta-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .btn {
          padding: 0.875rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-family: 'Space Grotesk', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.875rem;
          text-align: center;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
          display: block;
        }

        .btn-primary {
          background: #fd0009;
          color: #f0e8c9;
        }

        .btn-primary:hover {
          background: #cc0007;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(253, 0, 9, 0.3);
        }

        .btn-primary:disabled {
          background: #4A5C7A;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          background: transparent;
          color: #f0e8c9;
          border: 2px solid #bfb9a3;
        }

        .btn-secondary:hover {
          border-color: #f0e8c9;
          background: rgba(240, 232, 201, 0.05);
        }

        @media (max-width: 768px) {
          .book-card {
            padding: 1rem;
          }

          .title {
            font-size: 1.25rem;
          }
        }
      </style>
    `;

    const ratingHTML = book.rating ? `
      <div class="rating">
        <span class="stars">${'★'.repeat(Math.round(book.rating))}${'☆'.repeat(5 - Math.round(book.rating))}</span>
        <span class="review-count">${book.rating} (${book.reviewCount}+ reviews)</span>
      </div>
    ` : '';

    const badgesHTML = book.badges ? `
      <div class="badges">
        ${book.badges.map(badge => `<span class="badge">${badge}</span>`).join('')}
      </div>
    ` : '';

    const secondaryCTAHTML = book.secondaryCTA ? `
      <a href="${book.secondaryCTA.url}" 
         class="btn btn-secondary" 
         data-track="${book.secondaryCTA.track}"
         target="_blank"
         rel="noopener noreferrer">
        ${book.secondaryCTA.text}
      </a>
    ` : '';

    const html = `
      ${styles}
      <article class="book-card ${variant}" itemscope itemtype="https://schema.org/Book">
        <div class="cover-container">
          <img 
            src="${book.cover}" 
            alt="${book.coverAlt}"
            class="cover-image"
            itemprop="image"
            loading="lazy"
          />
          <span class="status-badge ${book.status}">${book.status === 'published' ? 'Available Now' : 'Coming Soon'}</span>
        </div>

        ${badgesHTML}

        <div class="book-meta">
          <h3 class="title" itemprop="name">${book.title}</h3>
          <p class="subtitle">${book.subtitle}</p>
          
          ${ratingHTML}

          <p class="description" itemprop="description">${book.description}</p>

          <div class="cta-container">
            ${book.primaryCTA.url === '#' ? 
              `<button class="btn btn-primary" disabled data-track="${book.primaryCTA.track}">${book.primaryCTA.text}</button>` :
              `<a href="${book.primaryCTA.url}" 
                 class="btn btn-primary" 
                 data-track="${book.primaryCTA.track}"
                 target="_blank"
                 rel="noopener noreferrer">
                ${book.primaryCTA.text}
              </a>`
            }
            ${secondaryCTAHTML}
          </div>
        </div>

        <!-- Schema.org JSON-LD -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Book",
          "name": "${book.title}",
          "author": {
            "@type": "Person",
            "name": "${book.author}"
          },
          "genre": "${book.genre}",
          "description": "${book.description}",
          ${book.isbn ? `"isbn": "${book.isbn}",` : ''}
          ${book.rating ? `
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "${book.rating}",
            "reviewCount": "${book.reviewCount}",
            "bestRating": "5"
          },` : ''}
          "datePublished": "${book.publishDate}",
          "image": "${book.cover}",
          "url": "https://aleksfilmore.com/books/${book.id}"
        }
        </script>
      </article>
    `;

    this.shadowRoot.innerHTML = html;
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.trackView();
          observer.unobserve(this);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(this);
  }

  attachEventListeners() {
    const buttons = this.shadowRoot.querySelectorAll('[data-track]');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const trackId = button.getAttribute('data-track');
        this.trackClick(trackId, button.href || '#');
      });
    });
  }

  trackView() {
    const bookId = this.getAttribute('book-id') || 'twbe';
    this.dispatchEvent(new CustomEvent('book-view', {
      bubbles: true,
      detail: { bookId, timestamp: Date.now() }
    }));

    // Google Analytics
    if (window.gtag) {
      gtag('event', 'view_item', {
        items: [{ item_id: bookId, item_name: this.getBookData(bookId).title }]
      });
    }
  }

  trackClick(trackId, url) {
    const bookId = this.getAttribute('book-id') || 'twbe';
    this.dispatchEvent(new CustomEvent('book-click', {
      bubbles: true,
      detail: { bookId, trackId, url, timestamp: Date.now() }
    }));

    // Google Analytics
    if (window.gtag) {
      gtag('event', 'click', {
        event_category: 'Book CTA',
        event_label: trackId,
        value: bookId
      });
    }
  }
}

// Register the custom element
if (!customElements.get('book-card')) {
  customElements.define('book-card', BookCard);
}

export default BookCard;
