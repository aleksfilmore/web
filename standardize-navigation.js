#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of main pages to update
const mainPages = [
    'index.html',
    'audiobook.html', 
    'shop.html',
    'reviews.html',
    'about.html',
    'contact.html',
    'checkout.html',
    'dacia-rising.html',
    'blog.html',
    'newsletter.html',
    'privacy.html',
    'terms.html',
    'cookies.html',
    'bad-date-bingo.html'
];

// Standard navigation component
const standardNav = `    <!-- Standardized Navigation -->
    <nav class="fixed top-0 w-full bg-charcoal/90 backdrop-blur-sm border-b border-bone/10 z-50">
        <div class="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div class="flex items-center justify-between">
                <!-- Brand Logo -->
                <div class="font-display font-bold text-lg sm:text-xl">
                    <a href="index.html" class="text-bone hover:text-red-flag transition-colors">Aleks Filmore</a>
                </div>
                
                <!-- Desktop Navigation -->
                <div class="hidden md:flex items-center space-x-6 lg:space-x-8">
                    
                    <a href="audiobook.html" class="nav-link hover-underline-slide">Audiobook</a>
                    <a href="shop.html" class="nav-link hover-underline-slide">Shop</a>
                    <a href="reviews.html" class="nav-link hover-underline-slide">Reviews</a>
                    <a href="bad-date-bingo.html" class="nav-link hover-underline-slide">Bingo Game</a>
                    <a href="about.html" class="nav-link hover-underline-slide">About</a>
                    <a href="contact.html" class="nav-link hover-underline-slide">Contact</a>
                    <a href="dacia-rising.html" class="nav-link hover-underline-slide text-sm opacity-75 hover:opacity-100">Dacia Rising</a>
                    <a href="midway.html" class="text-xs opacity-50 hover:opacity-100 transition-opacity">
                        <svg class="premium-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 3C8 3 8 9 12 9s4-6 12-6"/>
                            <path d="M12 21c4 0 4-6 0-6s-4 6 0 6"/>
                            <path d="M3 12c0-4 6-4 6 0s-6 4-6 0"/>
                            <path d="M21 12c0-4-6-4-6 0s6 4 6 0"/>
                            <circle cx="12" cy="12" r="2"/>
                        </svg>
                    </a>
                </div>
                
                <!-- Mobile Menu Toggle -->
                <div class="md:hidden">
                    <button id="mobile-menu-toggle" class="text-bone hover:text-red-flag transition-colors" aria-controls="mobile-menu" aria-expanded="false" aria-label="Toggle menu">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Mobile Menu -->
        <div id="mobile-menu" class="hidden md:hidden bg-charcoal/95 backdrop-blur-sm border-t border-bone/10">
            <div class="px-4 py-6 space-y-4">
                
                <a href="audiobook.html" class="block text-lg nav-link">Audiobook</a>
                <a href="shop.html" class="block text-lg nav-link">Shop</a>
                <a href="reviews.html" class="block text-lg nav-link">Reviews</a>
                <a href="bad-date-bingo.html" class="block text-lg nav-link">Bingo Game</a>
                <a href="about.html" class="block text-lg nav-link">About</a>
                <a href="contact.html" class="block text-lg nav-link">Contact</a>
                <a href="dacia-rising.html" class="block nav-link opacity-75">Dacia Rising</a>
                <a href="midway.html" class="block text-sm nav-link opacity-50">
                    <svg class="premium-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 3C8 3 8 9 12 9s4-6 12-6"/>
                        <path d="M12 21c4 0 4-6 0-6s-4 6 0 6"/>
                        <path d="M3 12c0-4 6-4 6 0s-6 4-6 0"/>
                        <path d="M21 12c0-4-6-4-6 0s6 4 6 0"/>
                        <circle cx="12" cy="12" r="2"/>
                    </svg>
                    Hall of Red Flags
                </a>
            </div>
        </div>
    </nav>`;

// Standard footer component
const standardFooter = `    <!-- Standardized Footer -->
    <footer class="relative bg-gradient-to-b from-charcoal/80 to-charcoal border-t border-bone/20 py-12 sm:py-16 overflow-hidden">
        <!-- Background Elements -->
        <div class="absolute inset-0 pointer-events-none">
            <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-flag/30 to-transparent"></div>
            <div class="absolute bottom-0 right-0 w-32 h-32 bg-glitch-lime/5 rounded-full blur-3xl"></div>
            <div class="absolute top-0 left-0 w-24 h-24 bg-dusty-blush/5 rounded-full blur-2xl"></div>
        </div>
        
        <div class="container mx-auto px-4 sm:px-6 relative z-10">
            <!-- Main Footer Content -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-8 sm:gap-12 mb-12 sm:mb-16">
                <!-- Brand Section -->
                <div class="col-span-2 md:col-span-2">
                    <div class="mb-6">
                        <h4 class="font-display font-bold text-xl sm:text-2xl mb-4 text-bone">
                            Aleks Filmore
                        </h4>
                        <p class="text-bone/70 text-sm sm:text-base leading-relaxed mb-6">
                            Honest to a fault, funny on purpose. Red flags processed in Brussels, delivered worldwide.
                        </p>
                    </div>
                    
                    <!-- Social Links -->
                    <div class="flex items-center gap-4">
                        <a href="https://instagram.com/aleksfilmore" 
                           target="_blank" 
                           class="group p-3 bg-bone/5 hover:bg-red-flag/20 rounded-full transition-all duration-300 hover:scale-110">
                            <svg class="w-5 h-5 text-bone/60 group-hover:text-red-flag transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.017 0C8.396 0 7.939.016 6.71.078 5.481.14 4.65.301 3.927.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.301 4.863.14 5.694.078 6.923.016 8.152 0 8.609 0 12.017s.016 3.865.078 5.094c.062 1.229.223 2.06.552 2.783.306.789.717 1.459 1.384 2.126s1.337 1.078 2.126 1.384c.723.329 1.554.49 2.783.552 1.229.062 1.686.078 5.094.078s3.865-.016 5.094-.078c1.229-.062 2.06-.223 2.783-.552.789-.306 1.459-.717 2.126-1.384s1.078-1.337 1.384-2.126c.329-.723.49-1.554.552-2.783.062-1.229.078-1.686.078-5.094s-.016-3.865-.078-5.094c-.062-1.229-.223-2.06-.552-2.783-.306-.789-.717-1.459-1.384-2.126S19.65.935 18.861.63C18.138.301 17.307.14 16.078.078 14.849.016 14.392 0 12.017 0zM12.017 2.17c3.291 0 3.683.013 4.947.072 1.194.055 1.843.249 2.274.413.572.222.98.487 1.41.916.43.43.694.838.916 1.41.164.431.358 1.08.413 2.274.059 1.264.072 1.656.072 4.947s-.013 3.683-.072 4.947c-.055 1.194-.249 1.843-.413 2.274-.222.572-.487.98-.916 1.41-.43.43-.838.694-1.41.916-.431.164-1.08.358-2.274.413-1.264.059-1.656.072-4.947.072s-3.683-.013-4.947-.072c-1.194-.055-1.843-.249-2.274-.413-.572-.222-.98-.487-1.41-.916-.43-.43-.694-.838-.916-1.41-.164-.431-.358-1.08-.413-2.274-.059-1.264-.072-1.656-.072-4.947s.013-3.683.072-4.947c.055-1.194.249-1.843.413-2.274.222-.572.487-.98.916-1.41.43-.43.838-.694 1.41-.916.431-.164 1.08-.358 2.274-.413 1.264-.059 1.656-.072 4.947-.072z"/>
                                <path d="M12.017 5.838A6.179 6.179 0 1 0 18.196 12 6.179 6.179 0 0 0 12.017 5.838zM12.017 16A4 4 0 1 1 16.017 12a4 4 0 0 1-4 4z"/>
                                <circle cx="18.406" cy="5.594" r="1.44"/>
                            </svg>
                        </a>
                        <a href="https://tiktok.com/@aleksfilmore" 
                           target="_blank" 
                           class="group p-3 bg-bone/5 hover:bg-red-flag/20 rounded-full transition-all duration-300 hover:scale-110">
                            <svg class="w-5 h-5 text-bone/60 group-hover:text-red-flag transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                            </svg>
                        </a>
                        <a href="mailto:aleksfilmore@gmail.com" 
                           class="group p-3 bg-bone/5 hover:bg-red-flag/20 rounded-full transition-all duration-300 hover:scale-110">
                            <svg class="w-5 h-5 text-bone/60 group-hover:text-red-flag transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                        </a>
                    </div>
                </div>
                
                <!-- Books Column -->
                <div class="col-span-1">
                    <h4 class="font-display font-semibold text-base sm:text-lg mb-4 sm:mb-6 text-bone">
                        Books
                    </h4>
                    <ul class="space-y-2 sm:space-y-3">
                        <li><a href="audiobook.html" class="text-bone/70 hover:text-red-flag transition-colors text-sm sm:text-base">Audiobook</a></li>
                        <li><a href="audiobook.html" class="text-bone/70 hover:text-red-flag transition-colors text-sm sm:text-base">Audiobook</a></li>
                        <li><a href="dacia-rising.html" class="text-bone/70 hover:text-red-flag transition-colors text-sm sm:text-base">Dacia Rising</a></li>
                    </ul>
                </div>
                
                <!-- Shop Column -->
                <div class="col-span-1">
                    <h4 class="font-display font-semibold text-base sm:text-lg mb-4 sm:mb-6 text-bone">
                        Shop
                    </h4>
                    <ul class="space-y-2 sm:space-y-3">
                        <li><a href="shop.html" class="text-bone/70 hover:text-red-flag transition-colors text-sm sm:text-base">Signed Paperbacks</a></li>
                        <li><a href="checkout.html" class="text-bone/70 hover:text-red-flag transition-colors text-sm sm:text-base">Order Books</a></li>
                        <li><a href="reviews.html" class="text-bone/70 hover:text-red-flag transition-colors text-sm sm:text-base">Reviews</a></li>
                    </ul>
                </div>
                
                <!-- Connect Column -->
                <div class="col-span-1">
                    <h4 class="font-display font-semibold text-base sm:text-lg mb-4 sm:mb-6 text-bone">
                        Connect
                    </h4>
                    <ul class="space-y-2 sm:space-y-3">
                        <li><a href="about.html" class="text-bone/70 hover:text-red-flag transition-colors text-sm sm:text-base">About</a></li>
                        <li><a href="contact.html" class="text-bone/70 hover:text-red-flag transition-colors text-sm sm:text-base">Contact</a></li>
                        <li><a href="newsletter.html" class="text-bone/70 hover:text-red-flag transition-colors text-sm sm:text-base">Newsletter</a></li>
                    </ul>
                </div>
            </div>
            
            <!-- Bottom Footer -->
            <div class="border-t border-bone/10 pt-8 sm:pt-12">
                <div class="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <p class="text-bone/60 text-xs sm:text-sm text-center sm:text-left">
                        © 2024 Aleks Filmore. All rights reserved. Bad decisions documented since 2023.
                    </p>
                    <div class="flex items-center space-x-4 sm:space-x-6">
                        <a href="privacy.html" class="text-bone/60 hover:text-red-flag transition-colors text-xs sm:text-sm">Privacy</a>
                        <a href="terms.html" class="text-bone/60 hover:text-red-flag transition-colors text-xs sm:text-sm">Terms</a>
                        <a href="cookies.html" class="text-bone/60 hover:text-red-flag transition-colors text-xs sm:text-sm">Cookies</a>
                    </div>
                </div>
            </div>
        </div>
    </footer>`;

// Mobile menu behavior is centralized in /js/mobile-menu.js; do not inject inline scripts here.
const mobileMenuScript = '';

function updateNavigationInFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File not found: ${filePath}`);
            return;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Mark current page in navigation
        const currentPage = path.basename(filePath);
        let customNav = standardNav;
        
        // Highlight current page in navigation
    if (currentPage === 'audiobook.html') {
            customNav = customNav.replace('href="audiobook.html" class="nav-link hover-underline-slide"', 'href="audiobook.html" class="nav-link hover-underline-slide text-red-flag"');
            customNav = customNav.replace('href="audiobook.html" class="block text-lg nav-link"', 'href="audiobook.html" class="block text-lg nav-link text-red-flag"');
        } else if (currentPage === 'shop.html') {
            customNav = customNav.replace('href="shop.html" class="nav-link hover-underline-slide"', 'href="shop.html" class="nav-link hover-underline-slide text-red-flag"');
            customNav = customNav.replace('href="shop.html" class="block text-lg nav-link"', 'href="shop.html" class="block text-lg nav-link text-red-flag"');
        } else if (currentPage === 'reviews.html') {
            customNav = customNav.replace('href="reviews.html" class="nav-link hover-underline-slide"', 'href="reviews.html" class="nav-link hover-underline-slide text-red-flag"');
            customNav = customNav.replace('href="reviews.html" class="block text-lg nav-link"', 'href="reviews.html" class="block text-lg nav-link text-red-flag"');
        } else if (currentPage === 'bad-date-bingo.html') {
            customNav = customNav.replace('href="bad-date-bingo.html" class="nav-link hover-underline-slide"', 'href="bad-date-bingo.html" class="nav-link hover-underline-slide text-red-flag"');
            customNav = customNav.replace('href="bad-date-bingo.html" class="block text-lg nav-link"', 'href="bad-date-bingo.html" class="block text-lg nav-link text-red-flag"');
        } else if (currentPage === 'about.html') {
            customNav = customNav.replace('href="about.html" class="nav-link hover-underline-slide"', 'href="about.html" class="nav-link hover-underline-slide text-red-flag"');
            customNav = customNav.replace('href="about.html" class="block text-lg nav-link"', 'href="about.html" class="block text-lg nav-link text-red-flag"');
        } else if (currentPage === 'contact.html') {
            customNav = customNav.replace('href="contact.html" class="nav-link hover-underline-slide"', 'href="contact.html" class="nav-link hover-underline-slide text-red-flag"');
            customNav = customNav.replace('href="contact.html" class="block text-lg nav-link"', 'href="contact.html" class="block text-lg nav-link text-red-flag"');
        } else if (currentPage === 'dacia-rising.html') {
            customNav = customNav.replace('href="dacia-rising.html" class="nav-link hover-underline-slide text-sm opacity-75 hover:opacity-100"', 'href="dacia-rising.html" class="nav-link hover-underline-slide text-sm opacity-100 text-red-flag"');
            customNav = customNav.replace('href="dacia-rising.html" class="block nav-link opacity-75"', 'href="dacia-rising.html" class="block nav-link text-red-flag"');
        }
        
        // Replace navigation - look for existing nav tags and replace them
        const navRegex = /<!--[^>]*navigation[^>]*-->\s*<nav[^>]*>[\s\S]*?<\/nav>(?:\s*<!--[^>]*-->\s*<script>[\s\S]*?<\/script>)?/gi;
        
        if (navRegex.test(content)) {
            content = content.replace(navRegex, customNav + mobileMenuScript);
            console.log(`Updated navigation in ${filePath}`);
        } else {
            console.log(`No navigation found to replace in ${filePath}`);
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        
    } catch (error) {
        console.error(`Error updating ${filePath}:`, error.message);
    }
}

// Update main pages
console.log('Updating navigation consistency across pages...');
mainPages.forEach(page => {
    const filePath = path.join(__dirname, page);
    updateNavigationInFile(filePath);
});

console.log('Navigation standardization complete!');
