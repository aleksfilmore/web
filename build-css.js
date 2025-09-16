const fs = require('fs');
const path = require('path');

// Simple Tailwind CSS builder using standalone CLI + static file copying for Vercel
const { execSync } = require('child_process');

// Copy directory recursively
function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

async function buildCSS() {
    console.log('🎨 Building Tailwind CSS and preparing static files...');
    
    try {
        // Create a simple input CSS file
        const inputCSS = `
/* Tailwind CSS */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* Custom styles */
.btn-primary {
    background: linear-gradient(to right, #9333ea, #2563eb);
    color: white;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 9999px;
    transition: all 0.3s;
}

.btn-primary:hover {
    background: linear-gradient(to right, #7c3aed, #1d4ed8);
    transform: scale(1.05);
}

.card {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    transition: all 0.3s;
}

.text-gradient {
    background: linear-gradient(to right, #9333ea, #2563eb);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}
        `;
        
        // Write input file
        fs.writeFileSync('./temp-input.css', inputCSS);
        
        // Build using project tailwind dependency (no binary download)
        if (!fs.existsSync('./css')) fs.mkdirSync('./css', { recursive: true });
        try {
            // Force v3 CLI to avoid experimental v4 output differences
            execSync(`npx tailwindcss@3.4.10 -i ./temp-input.css -c ./tailwind.config.js -o ./css/tailwind.min.css --minify`, { stdio: 'inherit' });
        } catch (cliError) {
            if (cliError.message && cliError.message.includes('EEXIST')) {
                console.log('ℹ️ Directory exists, ignoring.');
            } else {
                console.log('⚠️ tailwind build failed, creating fallback minimal CSS');
                const fallbackCSS = generateFallbackCSS();
                fs.writeFileSync('./css/tailwind.min.css', fallbackCSS);
            }
        }
        
        // Clean up temp file
        if (fs.existsSync('./temp-input.css')) {
            fs.unlinkSync('./temp-input.css');
        }
        
        console.log('✅ Tailwind CSS built successfully!');
        console.log(`📁 Output: ./css/tailwind.min.css`);
        
        // Show file size
        const stats = fs.statSync('./css/tailwind.min.css');
        const fileSizeInKB = (stats.size / 1024).toFixed(2);
        console.log(`📊 File size: ${fileSizeInKB} KB`);
        
        // Now copy all static files for Vercel deployment
        console.log('📁 Copying static files for Vercel...');
        
        // Create public directory for Vercel output
        const publicDir = './public';
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }
        
        // Files and directories to copy to public
        const filesToCopy = [
            '*.html',
            'css/**/*',
            'js/**/*',
            'api/**/*',
            'assets/**/*',
            'audio/**/*',
            'blog/**/*',
            'DaciaRising/**/*',
            '*.png',
            '*.jpg',
            '*.jpeg',
            '*.gif',
            '*.svg',
            '*.ico',
            '*.pdf',
            '*.mp3',
            '*.txt',
            '*.xml',
            'robots.txt',
            'sitemap.xml'
        ];
        
        // Copy root HTML files
        const htmlFiles = fs.readdirSync('.').filter(file => file.endsWith('.html'));
        htmlFiles.forEach(file => {
            fs.copyFileSync(file, path.join(publicDir, file));
            console.log(`  ✓ Copied ${file}`);
        });
        
        // Copy directories and files
    const dirsToCopy = ['css', 'js', 'assets', 'audio', 'blog', 'DaciaRising'];
        dirsToCopy.forEach(dir => {
            if (fs.existsSync(dir)) {
                const destDir = path.join(publicDir, dir);
                copyDirectory(dir, destDir);
                console.log(`  ✓ Copied ${dir}/`);
            }
        });
        
        // Copy other static files in root (images, media, etc.)
        const staticFiles = fs.readdirSync('.').filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.pdf', '.mp3', '.txt', '.xml'].includes(ext);
        });
        staticFiles.forEach(file => {
            fs.copyFileSync(file, path.join(publicDir, file));
            console.log(`  ✓ Copied ${file}`);
        });

        // Copy ONLY blog-related data needed client-side
        const dataSrcDir = path.join('.', 'data');
        const dataDestDir = path.join(publicDir, 'data');
        if (fs.existsSync(dataSrcDir)) {
            if (!fs.existsSync(dataDestDir)) fs.mkdirSync(dataDestDir, { recursive: true });
            const allowedFiles = ['blog-index.json', 'content-calendar.json'];
            allowedFiles.forEach(f => {
                const srcPath = path.join(dataSrcDir, f);
                if (fs.existsSync(srcPath)) {
                    fs.copyFileSync(srcPath, path.join(dataDestDir, f));
                    console.log(`  ✓ Copied data/${f}`);
                }
            });
            const blogPostsSrc = path.join(dataSrcDir, 'blog-posts');
            if (fs.existsSync(blogPostsSrc)) {
                copyDirectory(blogPostsSrc, path.join(dataDestDir, 'blog-posts'));
                console.log('  ✓ Copied data/blog-posts/');
            }
        }
        
        console.log('✅ Static files copied to public/ directory');
        
    } catch (error) {
        console.error('❌ Error building CSS:', error.message);
        
        // Create fallback CSS
        console.log('🔧 Creating fallback CSS...');
        const fallbackCSS = generateFallbackCSS();
        
        if (!fs.existsSync('./css')) {
            fs.mkdirSync('./css', { recursive: true });
        }
        
        fs.writeFileSync('./css/tailwind.min.css', fallbackCSS);
        console.log('✅ Fallback CSS created successfully!');
    }
}

function generateFallbackCSS() {
    return `
/* Minimal Tailwind-like CSS - Generated Fallback */
*,::before,::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}
::before,::after{--tw-content:''}
html{line-height:1.5;-webkit-text-size-adjust:100%;tab-size:4;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif}
body{margin:0;line-height:inherit}

/* Utilities */
.container{width:100%;max-width:1200px;margin:0 auto;padding:0 1rem}
.flex{display:flex}
.grid{display:grid}
.hidden{display:none}
.w-full{width:100%}
.h-full{height:100%}
.max-w-7xl{max-width:80rem}
.mx-auto{margin-left:auto;margin-right:auto}
.px-4{padding-left:1rem;padding-right:1rem}
.py-16{padding-top:4rem;padding-bottom:4rem}
.text-center{text-align:center}
.text-white{color:#fff}
.text-gray-600{color:#4b5563}
.text-gray-800{color:#1f2937}
.bg-white{background-color:#fff}
.bg-gray-100{background-color:#f3f4f6}
.rounded-lg{border-radius:0.5rem}
.rounded-full{border-radius:9999px}
.shadow-lg{box-shadow:0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -2px rgba(0,0,0,0.05)}
.transition-all{transition-property:all;transition-timing-function:cubic-bezier(0.4,0,0.2,1);transition-duration:150ms}

/* Custom Components */
.btn-primary {
    background: linear-gradient(to right, #9333ea, #2563eb);
    color: white;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 9999px;
    transition: all 0.3s;
    border: none;
    cursor: pointer;
    display: inline-block;
    text-decoration: none;
}

.btn-primary:hover {
    background: linear-gradient(to right, #7c3aed, #1d4ed8);
    transform: scale(1.05);
}

.btn-secondary {
    background-color: #e5e7eb;
    color: #374151;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 9999px;
    transition: all 0.3s;
    border: none;
    cursor: pointer;
    display: inline-block;
    text-decoration: none;
}

.btn-secondary:hover {
    background-color: #d1d5db;
}

.card {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    transition: all 0.3s;
}

.card:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.text-gradient {
    background: linear-gradient(to right, #9333ea, #2563eb);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

/* Responsive utilities */
@media (min-width: 768px) {
    .md\\:text-5xl{font-size:3rem;line-height:1}
    .md\\:px-6{padding-left:1.5rem;padding-right:1.5rem}
}

@media (min-width: 1024px) {
    .lg\\:text-6xl{font-size:3.75rem;line-height:1}
    .lg\\:px-8{padding-left:2rem;padding-right:2rem}
}
`;
}

buildCSS();
