// Image Optimization and Lazy Loading
class ImageOptimizer {
    constructor() {
        this.observers = new Map();
        this.loaded = new Set();
        this.webpSupported = null;
        this.connectionSpeed = 'fast';
        
        this.init();
    }

    async init() {
        await this.detectWebPSupport();
        this.detectConnectionSpeed();
        this.setupLazyLoading();
        this.optimizeExistingImages();
        this.preloadCriticalImages();
    }

    async detectWebPSupport() {
        return new Promise(resolve => {
            const webP = new Image();
            webP.onload = webP.onerror = () => {
                this.webpSupported = (webP.height === 2);
                resolve(this.webpSupported);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    detectConnectionSpeed() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            const effectiveType = connection.effectiveType;
            
            if (effectiveType === 'slow-2g' || effectiveType === '2g') {
                this.connectionSpeed = 'slow';
            } else if (effectiveType === '3g') {
                this.connectionSpeed = 'medium';
            } else {
                this.connectionSpeed = 'fast';
            }
        }
    }

    setupLazyLoading() {
        // Create intersection observer for lazy loading
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px',
                threshold: 0.1
            });

            this.observers.set('lazy', observer);
            
            // Observe all images with data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                observer.observe(img);
            });
        } else {
            // Fallback for browsers without Intersection Observer
            this.loadAllImages();
        }
    }

    optimizeExistingImages() {
        const images = document.querySelectorAll('img:not([data-optimized])');
        
        images.forEach(img => {
            this.optimizeImage(img);
        });
    }

    optimizeImage(img) {
        if (img.dataset.optimized) return;

        const originalSrc = img.src || img.dataset.src;
        if (!originalSrc) return;

        // Add responsive attributes
        if (!img.loading) {
            img.loading = 'lazy';
        }

        // Add size optimization based on display size
        if (!img.sizes && img.dataset.sizes) {
            img.sizes = img.dataset.sizes;
        }

        // Add WebP source if supported
        if (this.webpSupported && !img.dataset.webpApplied) {
            this.addWebPSource(img);
        }

        // Optimize based on connection speed
        if (this.connectionSpeed === 'slow') {
            this.applySlowConnectionOptimization(img);
        }

        img.dataset.optimized = 'true';
    }

    addWebPSource(img) {
        // Temporarily disable WebP optimization until WebP versions are available
        return;
        
        // Only apply to actual image files
        if (!img.src.match(/\.(jpg|jpeg|png)$/i)) return;

        const picture = document.createElement('picture');
        const webpSource = document.createElement('source');
        
        // Generate WebP version URL
        const webpSrc = this.getWebPUrl(img.src);
        webpSource.srcset = webpSrc;
        webpSource.type = 'image/webp';
        
        // Insert picture element
        img.parentNode.insertBefore(picture, img);
        picture.appendChild(webpSource);
        picture.appendChild(img);
        
        img.dataset.webpApplied = 'true';
    }

    getWebPUrl(originalUrl) {
        // If using a CDN or image service, modify URL for WebP
        // For now, we'll assume WebP versions exist with .webp extension
        return originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }

    applySlowConnectionOptimization(img) {
        // Use lower quality versions for slow connections
        if (img.dataset.lowSrc) {
            img.src = img.dataset.lowSrc;
        }
        
        // Remove high-res sources
        const picture = img.closest('picture');
        if (picture) {
            const sources = picture.querySelectorAll('source');
            sources.forEach(source => {
                if (source.media && source.media.includes('min-width')) {
                    source.remove();
                }
            });
        }
    }

    loadImage(img) {
        if (this.loaded.has(img)) return;

        const src = img.dataset.src;
        if (!src) return;

        // Create new image for preloading
        const imageLoader = new Image();
        
        imageLoader.onload = () => {
            img.src = src;
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');
            this.loaded.add(img);
            
            // Trigger custom event
            img.dispatchEvent(new CustomEvent('imageLoaded', { 
                detail: { src, optimized: true }
            }));
        };

        imageLoader.onerror = () => {
            img.classList.add('lazy-error');
            console.warn('Failed to load image:', src);
        };

        img.classList.add('lazy-loading');
        imageLoader.src = src;
    }

    loadAllImages() {
        // Fallback method for browsers without Intersection Observer
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.loadImage(img);
        });
    }

    preloadCriticalImages() {
        // Preload above-the-fold images
        const criticalImages = document.querySelectorAll('img[data-critical]');
        
        criticalImages.forEach(img => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = img.src || img.dataset.src;
            
            if (this.webpSupported && img.dataset.webpSrc) {
                link.href = img.dataset.webpSrc;
            }
            
            document.head.appendChild(link);
        });
    }

    // Public method to optimize new images added dynamically
    optimizeNewImages(container = document) {
        const newImages = container.querySelectorAll('img:not([data-optimized])');
        
        newImages.forEach(img => {
            this.optimizeImage(img);
            
            if (img.dataset.src && this.observers.has('lazy')) {
                this.observers.get('lazy').observe(img);
            }
        });
    }

    // Method to convert existing images to lazy loading
    convertToLazyLoading(selector = 'img') {
        const images = document.querySelectorAll(selector);
        
        images.forEach(img => {
            if (!img.dataset.src && img.src) {
                img.dataset.src = img.src;
                img.src = this.createPlaceholder(img);
                img.classList.add('lazy');
                
                if (this.observers.has('lazy')) {
                    this.observers.get('lazy').observe(img);
                }
            }
        });
    }

    createPlaceholder(img) {
        // Create a tiny placeholder image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 1;
        canvas.height = 1;
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 1, 1);
        
        return canvas.toDataURL();
    }

    // Add CSS for loading states
    addOptimizationStyles() {
        if (document.querySelector('#image-optimization-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'image-optimization-styles';
        styles.textContent = `
            /* Lazy loading states */
            img.lazy {
                transition: opacity 0.3s;
            }

            img.lazy-loading {
                opacity: 0.5;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
            }

            img.lazy-loaded {
                opacity: 1;
            }

            img.lazy-error {
                opacity: 0.3;
                background: #f5f5f5;
                position: relative;
            }

            img.lazy-error::after {
                content: '⚠️ Image failed to load';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255,255,255,0.9);
                padding: 10px;
                border-radius: 4px;
                font-size: 12px;
                color: #666;
            }

            @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }

            /* Responsive images */
            img {
                max-width: 100%;
                height: auto;
            }

            /* Picture element fallback */
            picture {
                display: block;
            }

            picture img {
                width: 100%;
                height: auto;
            }
        `;
        document.head.appendChild(styles);
    }
}

// Initialize image optimizer
document.addEventListener('DOMContentLoaded', () => {
    window.imageOptimizer = new ImageOptimizer();
    window.imageOptimizer.addOptimizationStyles();
});

// Auto-optimize images added to the page dynamically
const originalAppendChild = Element.prototype.appendChild;
Element.prototype.appendChild = function(child) {
    const result = originalAppendChild.call(this, child);
    
    if (window.imageOptimizer && (child.tagName === 'IMG' || child.querySelector?.('img'))) {
        setTimeout(() => window.imageOptimizer.optimizeNewImages(child), 0);
    }
    
    return result;
};
