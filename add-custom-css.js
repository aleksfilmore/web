const fs = require('fs');
const path = require('path');

// List of HTML files that need custom.css
const htmlFiles = [
    'audiobook.html',
    'books.html', 
    'blog.html',
    'about.html',
    'contact.html',
    'shop.html',
    'checkout.html',
    'dacia-rising.html',
    'reviews.html',
    'newsletter.html',
    'privacy.html',
    'terms.html',
    'midway.html',
    '404.html',
    'checkout-success.html',
    'order-confirmation.html',
    'audiobook-player.html',
    'bad-date-bingo.html'
];

// Add the new blog post file too
htmlFiles.push('blog/how-i-got-into-writing-the-worst-boyfriends-ever.html');

const cssLinkToAdd = '    <link rel="stylesheet" href="css/custom.css">';
const cssLinkToAddBlog = '    <link rel="stylesheet" href="../css/custom.css">';

htmlFiles.forEach(filename => {
    const filePath = path.join(__dirname, filename);
    
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if custom.css is already referenced
        if (content.includes('custom.css')) {
            console.log(`${filename}: Already has custom.css reference`);
            return;
        }
        
        // Determine the correct CSS link based on file location
        const isInBlogFolder = filename.includes('blog/');
        const linkToAdd = isInBlogFolder ? cssLinkToAddBlog : cssLinkToAdd;
        
        // Look for tailwind.min.css and add custom.css after it
        if (content.includes('tailwind.min.css')) {
            const tailwindPattern = /(\s*<link rel="stylesheet" href="[^"]*tailwind\.min\.css">\s*)/;
            const match = content.match(tailwindPattern);
            
            if (match) {
                const replacement = match[1] + '\n' + linkToAdd + '\n';
                content = content.replace(tailwindPattern, replacement);
                
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`${filename}: Added custom.css reference`);
            } else {
                console.log(`${filename}: Could not find tailwind.min.css pattern`);
            }
        } else {
            console.log(`${filename}: Does not contain tailwind.min.css`);
        }
    } else {
        console.log(`${filename}: File not found`);
    }
});

console.log('Finished adding custom.css references to HTML files');
