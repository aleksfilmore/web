const fs = require('fs');

// Files to update - restore CDN
const htmlFiles = [
    './admin.html',
    './order-confirmation.html', 
    './index.html',
    './contact.html',
    './checkout.html',
    './checkout-success.html',
    './newsletter.html',
    './midway.html',
    './books.html',
    './blog.html',
    './audiobook.html',
    './audiobook-player.html',
    './audiobook-player-premium.html',
    './audiobook-player-FINAL-LOCKED.html',
    './about.html',
    './404.html',
    './reviews.html',
    './shop.html',
    './privacy.html',
    './terms.html',
    './blog/why-i-stopped-dating-apps.html',
    './blog/red-flag-field-guide.html',
    './blog/anatomy-of-a-ghost.html'
];

function restoreCDN() {
    console.log('🔄 Restoring Tailwind CDN...');
    
    let updatedCount = 0;
    
    htmlFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            try {
                let content = fs.readFileSync(filePath, 'utf8');
                
                // Replace local CSS with CDN script
                const localLink = '<link rel="stylesheet" href="/css/tailwind.min.css">';
                const localLinkBlog = '<link rel="stylesheet" href="../css/tailwind.min.css">';
                const cdnScript = '<script src="https://cdn.tailwindcss.com"></script>';
                
                let updated = false;
                
                if (content.includes(localLink)) {
                    content = content.replace(localLink, cdnScript);
                    updated = true;
                }
                
                if (content.includes(localLinkBlog)) {
                    content = content.replace(localLinkBlog, cdnScript);
                    updated = true;
                }
                
                if (updated) {
                    fs.writeFileSync(filePath, content, 'utf8');
                    console.log(`✅ Restored CDN: ${filePath}`);
                    updatedCount++;
                } else {
                    console.log(`⏭️  No local CSS found in: ${filePath}`);
                }
                
            } catch (error) {
                console.error(`❌ Error updating ${filePath}:`, error.message);
            }
        } else {
            console.log(`⚠️  File not found: ${filePath}`);
        }
    });
    
    console.log(`\n🎉 Restored CDN in ${updatedCount} files!`);
    console.log('🌐 Your site should now work properly again!');
}

restoreCDN();
