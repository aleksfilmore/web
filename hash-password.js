// Quick password hash generator
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('=== Admin Password Hash Generator ===\n');

rl.question('Enter your desired admin password: ', async (password) => {
    if (!password || password.trim().length < 6) {
        console.log('❌ Password must be at least 6 characters long');
        rl.close();
        return;
    }
    
    console.log('\n🔄 Generating secure hash...\n');
    
    try {
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);
        
        console.log('✅ Password hash generated successfully!\n');
        console.log('=== COPY THIS VALUE TO NETLIFY ===');
        console.log('Variable Name: ADMIN_PASSWORD_HASH');
        console.log('Value:', hash);
        console.log('\n⚠️  Keep this hash secure - it\'s equivalent to your password!');
        
    } catch (error) {
        console.log('❌ Error generating hash:', error.message);
    }
    
    rl.close();
});
