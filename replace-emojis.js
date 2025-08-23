const fs = require('fs');
const path = require('path');

// Premium icon mappings
const iconReplacements = {
    '📧': `<svg class="premium-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
    </svg>`,
    
    '📱': `<svg class="premium-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>`,
    
    '🎵': `<svg class="premium-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
    </svg>`,
    
    '📚': `<svg class="premium-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>`,
    
    '📖': `<svg class="premium-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>`,
    
    '⭐': `<svg class="premium-icon filled colored-blush" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>`,
    
    '🌟': `<svg class="premium-icon filled colored-lime" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>`,
    
    '✨': `<svg class="premium-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5L12 3z"/>
        <path d="M8 3h4l-2 5z"/>
        <path d="M16 21h4l-2-5z"/>
    </svg>`,
    
    '🎁': `<svg class="premium-icon colored-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,12 20,22 4,22 4,12"/>
        <rect width="20" height="5" x="2" y="7"/>
        <line x1="12" y1="22" x2="12" y2="7"/>
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>`,
    
    '💌': `<svg class="premium-icon colored-blush" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
    </svg>`,
    
    '🎉': `<svg class="premium-icon colored-lime" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8 2v4l-3 2v4h18V8l-3-2V2"/>
        <path d="M16 4V2"/>
        <path d="M12 4V2"/>
        <path d="M8 4V2"/>
        <path d="M8 22l8-10H8l8-10"/>
    </svg>`,
    
    '🎯': `<svg class="premium-icon colored-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
    </svg>`,
    
    '💰': `<svg class="premium-icon colored-lime" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
        <path d="M12 18V6"/>
    </svg>`,
    
    '🎪': `<svg class="premium-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 3C8 3 8 9 12 9s4-6 12-6"/>
        <path d="M12 21c4 0 4-6 0-6s-4 6 0 6"/>
        <path d="M3 12c0-4 6-4 6 0s-6 4-6 0"/>
        <path d="M21 12c0-4-6-4-6 0s6 4 6 0"/>
        <circle cx="12" cy="12" r="2"/>
    </svg>`,
    
    '🔮': `<svg class="premium-icon colored-blush" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 3h12l4 6-10 12L2 9l4-6z"/>
        <path d="M11 3 8 9l4 12 4-12-3-6"/>
        <path d="M2 9h20"/>
    </svg>`,
    
    '🔥': `<svg class="premium-icon colored-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>`,
    
    '🏳️‍🌈': `<svg class="premium-icon colored-lime" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
        <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>`,
    
    '💎': `<svg class="premium-icon filled colored-blush" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1">
        <path d="M6 3h12l4 6-10 12L2 9l4-6z"/>
    </svg>`,
    
    '💪': `<svg class="premium-icon colored-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
    </svg>`,
    
    '✅': `<svg class="premium-icon filled colored-lime" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polyline points="20,6 9,17 4,12"/>
    </svg>`,
    
    '❌': `<svg class="premium-icon colored-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`,
    
    '⚠️': `<svg class="premium-icon colored-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`
};

// Files to process
const filesToProcess = [
    'about.html',
    'admin.html',
    'audiobook.html',
    'blog.html',
    'books.html',
    'checkout.html',
    'checkout-success.html',
    'contact.html',
    'cookies.html',
    'dacia-rising.html',
    'midway.html',
    'newsletter.html',
    'newsletter-template.html',
    'order-confirmation.html',
    'privacy.html',
    'reviews.html',
    'shop.html',
    'terms.html',
    'js/cart-abandonment.js',
    'js/mobile-cta.js',
    'js/trust-badges.js',
    'netlify/functions/webhook.js'
];

function replaceEmojisInFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        return false;
    }

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Add premium icons script to HTML files
        if (filePath.endsWith('.html') && !content.includes('premium-icons.js')) {
            const scriptTag = '    <script src="/js/premium-icons.js" defer></script>';
            
            if (content.includes('</head>')) {
                content = content.replace('</head>', `${scriptTag}\n</head>`);
                modified = true;
            }
        }

        // Replace emojis with icons
        for (const [emoji, iconSvg] of Object.entries(iconReplacements)) {
            const regex = new RegExp(emoji.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g');
            const oldContent = content;
            content = content.replace(regex, iconSvg);
            if (content !== oldContent) {
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Updated: ${filePath}`);
            return true;
        } else {
            console.log(`⚪ No changes needed: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

function main() {
    console.log('🎨 Starting premium icon replacement...\n');
    
    let updatedCount = 0;
    
    for (const file of filesToProcess) {
        if (replaceEmojisInFile(file)) {
            updatedCount++;
        }
    }
    
    console.log(`\n🎉 Premium icon replacement complete!`);
    console.log(`📊 Updated ${updatedCount} files`);
    console.log(`🎯 Premium aesthetic achieved!`);
}

if (require.main === module) {
    main();
}

module.exports = { replaceEmojisInFile, iconReplacements };
