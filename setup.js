#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎪 Setting up Aleks Filmore Website E-commerce...\n');

// Create necessary directories
const directories = [
    'data',
    'audio',
    'public/images',
    'logs'
];

directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✓ Created directory: ${dir}`);
    } else {
        console.log(`- Directory exists: ${dir}`);
    }
});

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✓ Created .env file from template');
    console.log('⚠️  Please edit .env with your actual API keys');
} else if (fs.existsSync(envPath)) {
    console.log('- .env file already exists');
} else {
    console.log('❌ Could not create .env file');
}

// Create .gitignore if it doesn't exist
const gitignorePath = path.join(__dirname, '.gitignore');
const gitignoreContent = `
# Dependencies
node_modules/
npm-debug.log*

# Environment variables
.env

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed

# Data files (purchases, user data)
data/
audio/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Temporary files
tmp/
temp/
`;

if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, gitignoreContent.trim());
    console.log('✓ Created .gitignore file');
} else {
    console.log('- .gitignore file already exists');
}

// Create a sample audio directory structure
const audioStructure = `
# Audio File Structure
Place your audiobook files in the /audio directory with these names:

- intro.mp3
- chapter-01.mp3
- chapter-02.mp3
- chapter-03.mp3
- ... (up to chapter-25.mp3)
- bonus-epilogue.mp3

Files should be in MP3 format for web compatibility.
Make sure they're properly encoded for streaming.
`;

const audioReadmePath = path.join(__dirname, 'audio', 'README.md');
if (!fs.existsSync(audioReadmePath)) {
    fs.writeFileSync(audioReadmePath, audioStructure.trim());
    console.log('✓ Created audio directory guide');
}

console.log('\n🚀 Setup complete! Next steps:');
console.log('1. Run "npm install" to install dependencies');
console.log('2. Edit .env with your Stripe API keys and email config');
console.log('3. Add your audiobook MP3 files to the /audio directory');
console.log('4. Run "npm run dev" to start the development server');
console.log('5. Visit http://localhost:3000 to test your site');

console.log('\n📚 Documentation:');
console.log('- Stripe setup: https://stripe.com/docs/checkout');
console.log('- Email config: https://nodemailer.com/usage/using-gmail/');
console.log('- Audio encoding: Use 128kbps MP3 for web streaming');

console.log('\n🎯 Ready to sell some audiobooks!');
