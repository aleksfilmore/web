const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };
    }

    try {
        const { email, name = '', subject = '', message = '', newsletter_opt_in = false } = JSON.parse(event.body);
        
        if (!email || !isValidEmail(email) || !message) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Email and message are required' 
                })
            };
        }

        console.log(`Contact form submission: ${email} - ${subject}`);

        // Send contact email via Resend (transactional)
        const FROM_EMAIL = process.env.FROM_EMAIL || 'Aleks Filmore <aleks@aleksfilmore.com>';
            const CONTACT_TO = String(process.env.CONTACT_TO_EMAIL || 'aleks@aleksfilmore.com');
            await resend.emails.send({
                from: FROM_EMAIL,
                to: CONTACT_TO,
            subject: `Contact Form: ${subject || 'New Message'}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>From:</strong> ${name || 'Anonymous'} (${email})</p>
                <p><strong>Subject:</strong> ${subject || 'No subject'}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <p><strong>Newsletter Opt-in:</strong> ${newsletter_opt_in ? 'Yes' : 'No'}</p>
                <hr>
                <p><small>Sent from aleksfilmore.com contact form</small></p>
            `,
            text: `
New Contact Form Submission
From: ${name || 'Anonymous'} (${email})
Subject: ${subject || 'No subject'}
Message: ${message}
Newsletter Opt-in: ${newsletter_opt_in ? 'Yes' : 'No'}
            `
        });

        // If they opted into newsletter, add them to MailerLite (best-effort)
        if (newsletter_opt_in) {
            try {
                // Use MailerLite API to add subscriber
                const response = await fetch(`https://connect.mailerlite.com/api/subscribers`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.MAILERLITE_API_TOKEN}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        fields: {
                            name: name || '',
                            source: 'contact_form',
                            signup_date: new Date().toISOString()
                        }
                    })
                });

                if (!response.ok) {
                    console.error('MailerLite subscription failed:', await response.text());
                }
            } catch (err) {
                console.error('Newsletter subscription error:', err);
                // Don't fail the contact form if newsletter signup fails
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Message sent successfully!' 
            })
        };
        
    } catch (error) {
        console.error('Contact form error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to send message' 
            })
        };
    }
};
