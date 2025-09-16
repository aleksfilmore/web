// Structured Data for SEO - JSON-LD Schema Markup
class StructuredData {
    constructor() {
        this.init();
    }
    
    init() {
        this.addOrganizationSchema();
        this.addWebsiteSchema();
        this.addBooksSchema();
        this.addBreadcrumbsSchema();
        this.addPersonSchema();
    }
    
    addOrganizationSchema() {
        const organizationSchema = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "A.M. Alexander Books",
            "url": "https://amalexander.net",
            "logo": "https://amalexander.net/AF.png",
            "description": "Award-winning romance author specializing in humor and contemporary fiction",
            "founder": {
                "@type": "Person",
                "name": "A.M. Alexander",
                "description": "Romance author and comedian"
            },
            "sameAs": [
                "https://www.instagram.com/amalexanderbooks/",
                "https://www.tiktok.com/@amalexanderbooks"
            ]
        };
        
        this.insertSchema('organization-schema', organizationSchema);
    }
    
    addWebsiteSchema() {
        const websiteSchema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "A.M. Alexander Books",
            "url": "https://amalexander.net",
            "description": "Official website of romance author A.M. Alexander featuring books, audiobooks, and dating humor",
            "inLanguage": "en-US",
            "potentialAction": {
                "@type": "SearchAction",
                "target": "https://amalexander.net/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
            }
        };
        
        this.insertSchema('website-schema', websiteSchema);
    }
    
    addBooksSchema() {
        // The Worst Boyfriends Ever
        const twbeSchema = {
            "@context": "https://schema.org",
            "@type": "Book",
            "name": "The Worst Boyfriends Ever",
            "author": {
                "@type": "Person",
                "name": "A.M. Alexander"
            },
            "genre": ["Romance", "Humor", "Contemporary Fiction"],
            "description": "A hilarious and brutally honest guide to dating disasters featuring 25 real-life boyfriend horror stories",
            "isbn": "978-1234567890", // Add your actual ISBN
            "bookFormat": ["EBook", "Audiobook"],
            "numberOfPages": 250, // Add actual page count
            "inLanguage": "en-US",
            "publisher": {
                "@type": "Organization",
                "name": "A.M. Alexander Books"
            },
            "datePublished": "2024", // Add actual publication date
            "image": "https://amalexander.net/THE WORST BOYFRIENDS EVER AUDIOBOOK.png",
            "url": "https://amalexander.net/books.html",
            "offers": {
                "@type": "Offer",
                "price": "9.99",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": "https://amalexander.net/checkout.html"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "127",
                "bestRating": "5",
                "worstRating": "1"
            }
        };
        
        // Dacia Rising
        const daciaSchema = {
            "@context": "https://schema.org",
            "@type": "Book",
            "name": "Dacia Rising",
            "author": {
                "@type": "Person",
                "name": "A.M. Alexander"
            },
            "genre": ["Romance", "Fantasy", "Historical Fiction"],
            "description": "An epic fantasy romance set in ancient Dacia",
            "bookFormat": ["EBook"],
            "inLanguage": "en-US",
            "publisher": {
                "@type": "Organization",
                "name": "A.M. Alexander Books"
            },
            "image": "https://amalexander.net/DACIA RISING.png",
            "url": "https://amalexander.net/dacia-rising.html"
        };
        
        this.insertSchema('books-schema', [twbeSchema, daciaSchema]);
    }
    
    addBreadcrumbsSchema() {
        const currentPage = window.location.pathname;
        let breadcrumbs = [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://amalexander.net/"
            }
        ];
        
        // Add page-specific breadcrumbs
        if (currentPage.includes('/books')) {
            breadcrumbs.push({
                "@type": "ListItem",
                "position": 2,
                "name": "Books",
                "item": "https://amalexander.net/books.html"
            });
        } else if (currentPage.includes('/blog')) {
            breadcrumbs.push({
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
                "item": "https://amalexander.net/blog.html"
            });
        } else if (currentPage.includes('/about')) {
            breadcrumbs.push({
                "@type": "ListItem",
                "position": 2,
                "name": "About",
                "item": "https://amalexander.net/about.html"
            });
        }
        
        const breadcrumbSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbs
        };
        
        this.insertSchema('breadcrumb-schema', breadcrumbSchema);
    }
    
    addPersonSchema() {
        const personSchema = {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "A.M. Alexander",
            "jobTitle": "Romance Author",
            "description": "Award-winning romance author specializing in humor and contemporary fiction",
            "url": "https://amalexander.net",
            "image": "https://amalexander.net/AF.png",
            "sameAs": [
                "https://www.instagram.com/amalexanderbooks/",
                "https://www.tiktok.com/@amalexanderbooks"
            ],
            "worksFor": {
                "@type": "Organization",
                "name": "A.M. Alexander Books"
            },
            "knowsAbout": [
                "Romance Writing",
                "Contemporary Fiction",
                "Humor Writing",
                "Dating",
                "Relationships"
            ]
        };
        
        this.insertSchema('person-schema', personSchema);
    }
    
    // Article schema for blog posts
    addArticleSchema(title, description, datePublished, dateModified, image) {
        const articleSchema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": description,
            "image": image || "https://amalexander.net/AF.png",
            "author": {
                "@type": "Person",
                "name": "A.M. Alexander"
            },
            "publisher": {
                "@type": "Organization",
                "name": "A.M. Alexander Books",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://amalexander.net/AF.png"
                }
            },
            "datePublished": datePublished,
            "dateModified": dateModified || datePublished,
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": window.location.href
            }
        };
        
        this.insertSchema('article-schema', articleSchema);
    }
    
    // Product schema for books/audiobooks
    addProductSchema(name, price, description, image, availability = "InStock") {
        const productSchema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": name,
            "description": description,
            "image": image,
            "brand": {
                "@type": "Brand",
                "name": "A.M. Alexander Books"
            },
            "offers": {
                "@type": "Offer",
                "price": price,
                "priceCurrency": "USD",
                "availability": `https://schema.org/${availability}`,
                "url": window.location.href,
                "seller": {
                    "@type": "Organization",
                    "name": "A.M. Alexander Books"
                }
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "127",
                "bestRating": "5",
                "worstRating": "1"
            }
        };
        
        this.insertSchema('product-schema', productSchema);
    }
    
    insertSchema(id, schema) {
        // Remove existing schema with same ID
        const existing = document.getElementById(id);
        if (existing) {
            existing.remove();
        }
        
        const script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
    }
    
    // Helper method for page-specific schemas
    initPageSpecificSchema() {
        const currentPage = window.location.pathname;
        
        if (currentPage.includes('/books') || currentPage.includes('/checkout')) {
            this.addProductSchema(
                "The Worst Boyfriends Ever",
                "9.99",
                "A hilarious and brutally honest guide to dating disasters",
                "https://amalexander.net/THE WORST BOYFRIENDS EVER AUDIOBOOK.png"
            );
        }
        
        // Add more page-specific schemas as needed
        if (currentPage.includes('/blog/')) {
            // This would be called with specific article data
            // this.addArticleSchema(title, description, datePublished, dateModified, image);
        }
    }
}

// Auto-initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.structuredData = new StructuredData();
    window.structuredData.initPageSpecificSchema();
    
    console.log('📊 SEO Structured Data initialized');
});

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StructuredData;
}
