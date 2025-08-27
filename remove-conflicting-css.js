const fs = require('fs');
const path = require('path');

// List of HTML files to check
const htmlFiles = [
    'about.html',
    'contact.html', 
    'checkout.html',
    'checkout-success.html',
    'dacia-rising.html',
    'midway.html',
    'newsletter.html',
    'privacy.html',
    'terms.html',
    '404.html',
    'audiobook-player.html',
    'bad-date-bingo.html',
    'order-confirmation.html',
    'cookies.html',
    'admin.html'
];

htmlFiles.forEach(filename => {
    const filePath = path.join(__dirname, filename);
    
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if file has embedded styles (contains :root)
        const hasEmbeddedStyles = content.includes(':root') && content.includes('--color-');
        
        // Check if file has custom.css link
        const hasCustomCSS = content.includes('css/custom.css');
        
        if (hasEmbeddedStyles && hasCustomCSS) {
            // Remove the custom.css link
            content = content.replace(/\s*<link rel="stylesheet" href="css\/custom\.css">\s*/g, '');
            content = content.replace(/\s*<!-- Custom CSS with variables -->\s*\n\s*<link rel="stylesheet" href="css\/custom\.css">\s*/g, '');
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`${filename}: Removed custom.css (has embedded styles)`);
        } else if (!hasEmbeddedStyles && !hasCustomCSS) {
            console.log(`${filename}: Needs custom.css added (no embedded styles)`);
        } else if (hasEmbeddedStyles && !hasCustomCSS) {
            console.log(`${filename}: Good - has embedded styles, no custom.css`);
        } else {
            console.log(`${filename}: Has custom.css but no embedded styles - keeping custom.css`);
        }
    } else {
        console.log(`${filename}: File not found`);
    }
});

console.log('Finished processing HTML files');
