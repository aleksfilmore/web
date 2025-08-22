// Send Gabriela her audiobook access immediately
require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendGabrielaAccess() {
    console.log('Sending audiobook access to Gabriela...');
    
    const sessionId = 'cs_live_a1kFfhwvk2D8t5RM6FhLezcwSlk3Ay4jOanee7vqHlBHAyBAdDxxU1RiBR';
    const customerEmail = 'gabi3000_6@yahoo.com';
    
    // Generate access token
    const accessToken = Buffer.from(`${customerEmail}:${sessionId}:${Date.now()}`).toString('base64');
    const accessUrl = `https://aleksfilmore.com/audiobook-player?token=${accessToken}`;
    
    console.log('Access URL:', accessUrl);
    
    // Send email
    try {
        await resend.emails.send({
            from: 'aleks@aleksfilmore.com',
            to: customerEmail,
            subject: '🎧 Your Audiobook Access is Ready! (Issue Resolved)',
            html: `
                <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', sans-serif; background-color: #0E0F10; color: #F7F3ED; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1 style="color: #FF3B3B; font-size: 28px; margin: 0;">🚩 Your Audiobook is Ready!</h1>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, rgba(247,243,237,0.05) 0%, rgba(247,243,237,0.1) 100%); border: 1px solid rgba(247,243,237,0.1); border-radius: 16px; padding: 30px; margin-bottom: 30px;">
                        <h2 style="color: #F7F3ED; margin: 0 0 15px 0;">Sorry for the technical delay!</h2>
                        <p style="color: rgba(247,243,237,0.8); margin: 0 0 25px 0;">
                            Your payment went through successfully, but there was a technical issue with our email system. Your audiobook access is now ready!
                        </p>
                        
                        <div style="text-align: center;">
                            <a href="${accessUrl}" style="
                                background-color: #FF3B3B;
                                color: #F7F3ED;
                                padding: 15px 30px;
                                border-radius: 8px;
                                text-decoration: none;
                                font-weight: 600;
                                display: inline-block;
                                margin: 10px 0;
                            ">🎧 Start Listening Now</a>
                        </div>
                        
                        <p style="color: rgba(247,243,237,0.6); font-size: 14px; text-align: center;">
                            Bookmark this link for future access to your audiobook.
                        </p>
                    </div>
                    
                    <div style="border-top: 1px solid rgba(247,243,237,0.1); padding-top: 20px; font-size: 14px; color: rgba(247,243,237,0.6);">
                        <p>• This link is unique to you and never expires</p>
                        <p>• Stream on any device with an internet connection</p>
                        <p>• Need help? Reply to this email</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; color: rgba(247,243,237,0.6); font-size: 12px;">
                        <p>Thanks for your patience! Happy listening! 🏳️‍🌈</p>
                        <p>- Aleks</p>
                    </div>
                </div>
            `
        });
        
        console.log('✅ Email sent successfully to Gabriela!');
        console.log('Customer service issue resolved.');
        
    } catch (error) {
        console.error('❌ Error sending email:', error);
        console.log('📧 MANUAL EMAIL NEEDED:');
        console.log('To:', customerEmail);
        console.log('Subject: Your Audiobook Access is Ready!');
        console.log('Access URL:', accessUrl);
    }
}

sendGabrielaAccess();
