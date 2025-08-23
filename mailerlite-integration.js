require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

class MailerLiteService {
    constructor() {
        this.apiKey = process.env.MAILERLITE_API_KEY;
        this.baseURL = 'https://connect.mailerlite.com/api';
        this.senderEmail = 'aleks@aleksfilmore.com';
        this.senderName = 'Aleks Filmore';
        this.headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    // Add subscriber to newsletter
    async addSubscriber(email, name = '', fields = {}) {
        try {
            const payload = {
                email: email,
                fields: {
                    name: name || '',
                    source: fields.source || 'website',
                    signup_date: new Date().toISOString(),
                    ...fields
                },
                groups: [], // We'll add to default group for now
                status: 'active'
            };

            console.log('MailerLite: Adding subscriber', email);
            
            const response = await axios.post(`${this.baseURL}/subscribers`, payload, { 
                headers: this.headers 
            });

            console.log('MailerLite: Subscriber added successfully');
            return {
                success: true,
                data: response.data,
                message: 'Subscriber added successfully'
            };
        } catch (error) {
            console.error('MailerLite subscription error:', error.response?.data || error.message);
            
            // Handle duplicate email error gracefully
            if (error.response?.status === 422 && error.response?.data?.message?.includes('already exists')) {
                return {
                    success: true,
                    data: null,
                    message: 'Email already subscribed'
                };
            }
            
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Get all subscribers for admin dashboard
    async getSubscribers(limit = 100, page = 1) {
        try {
            const response = await axios.get(`${this.baseURL}/subscribers`, {
                headers: this.headers,
                params: { 
                    limit: Math.min(limit, 1000), // MailerLite max is 1000
                    page: page
                }
            });

            return {
                success: true,
                data: response.data.data || [],
                meta: response.data.meta || {},
                total: response.data.meta?.total || 0,
                message: 'Subscribers retrieved successfully'
            };
        } catch (error) {
            console.error('MailerLite get subscribers error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                data: [],
                total: 0
            };
        }
    }

    // Get subscriber stats for admin dashboard
    async getStats() {
        try {
            // Get total subscribers count
            const subscribersResponse = await axios.get(`${this.baseURL}/subscribers`, {
                headers: this.headers,
                params: { limit: 1 }
            });

            // Get groups
            const groupsResponse = await axios.get(`${this.baseURL}/groups`, {
                headers: this.headers
            }).catch(() => ({ data: { data: [] } })); // Fallback if groups fail

            // Get campaigns for email count estimation
            const campaignsResponse = await axios.get(`${this.baseURL}/campaigns`, {
                headers: this.headers,
                params: { limit: 10 }
            }).catch(() => ({ data: { data: [] } })); // Fallback if campaigns fail

            const totalSubscribers = subscribersResponse.data.meta?.total || 0;
            const groups = groupsResponse.data.data || [];
            const campaigns = campaignsResponse.data.data || [];

            // Estimate monthly emails sent (approximate)
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthlyEmailsEstimate = campaigns.filter(campaign => {
                const campaignDate = new Date(campaign.created_at);
                return campaignDate.getMonth() === currentMonth && 
                       campaignDate.getFullYear() === currentYear;
            }).reduce((total, campaign) => {
                return total + (campaign.delivered_count || 0);
            }, 0);

            return {
                success: true,
                data: {
                    totalSubscribers: totalSubscribers,
                    activeSubscribers: totalSubscribers, // MailerLite doesn't separate this easily
                    groups: groups,
                    monthlyEmailsUsed: monthlyEmailsEstimate,
                    monthlyLimit: 12000,
                    campaigns: campaigns.length
                }
            };
        } catch (error) {
            console.error('MailerLite stats error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                data: {
                    totalSubscribers: 0,
                    activeSubscribers: 0,
                    groups: [],
                    monthlyEmailsUsed: 0,
                    monthlyLimit: 12000,
                    campaigns: 0
                }
            };
        }
    }

    // Create a newsletter group if it doesn't exist
    async createNewsletterGroup() {
        try {
            const response = await axios.post(`${this.baseURL}/groups`, {
                name: 'Newsletter Subscribers',
                type: 'default'
            }, { headers: this.headers });

            return {
                success: true,
                data: response.data,
                message: 'Newsletter group created successfully'
            };
        } catch (error) {
            console.error('MailerLite create group error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Send newsletter campaign (for future use)
    async sendCampaign(subject, content, groupIds = []) {
        try {
            const campaignData = {
                name: subject,
                type: 'regular',
                subject: subject,
                content: [{
                    type: 'text',
                    value: content
                }]
            };

            if (groupIds.length > 0) {
                campaignData.groups = groupIds;
            }

            const response = await axios.post(`${this.baseURL}/campaigns`, campaignData, { 
                headers: this.headers 
            });

            return {
                success: true,
                data: response.data,
                message: 'Campaign created successfully'
            };
        } catch (error) {
            console.error('MailerLite campaign error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Send welcome email with secret chapter PDF
    async sendWelcomeEmail(email, name = '') {
        try {
            console.log('MailerLite: Sending welcome email to', email);
            
            // Read the welcome email template
            const templatePath = path.join(__dirname, 'templates', 'welcome-email.html');
            let emailTemplate = fs.readFileSync(templatePath, 'utf8');
            
            // Replace placeholders in template
            emailTemplate = emailTemplate.replace('{{subscriber_name}}', name || 'Fellow Chaos Survivor');
            emailTemplate = emailTemplate.replace('{{current_year}}', new Date().getFullYear());
            
            // Prepare the email data
            const emailData = {
                to: [{
                    email: email,
                    name: name || ''
                }],
                from: {
                    email: this.senderEmail,
                    name: this.senderName
                },
                subject: "🎁 Your Secret Chapter is Here! (The One Too Chaotic for Print)",
                html: emailTemplate,
                text: this.generatePlainTextVersion(name),
                attachments: [
                    {
                        content: this.getSecretChapterBase64(),
                        filename: "Bonus Chapter - The Worst Boyfriends Ever.pdf",
                        type: "application/pdf",
                        disposition: "attachment"
                    }
                ]
            };

            // Send via MailerLite transactional API
            const response = await axios.post(`${this.baseURL}/emails`, emailData, {
                headers: {
                    ...this.headers,
                    'Content-Type': 'application/json'
                }
            });

            console.log('MailerLite: Welcome email sent successfully');
            return {
                success: true,
                data: response.data,
                message: 'Welcome email sent successfully'
            };
        } catch (error) {
            console.error('MailerLite welcome email error:', error.response?.data || error.message);
            
            // If MailerLite transactional fails, fall back to Resend for this email
            try {
                console.log('MailerLite: Falling back to Resend for welcome email');
                return await this.sendWelcomeEmailViaResend(email, name);
            } catch (fallbackError) {
                console.error('Both MailerLite and Resend failed for welcome email:', fallbackError);
                return {
                    success: false,
                    error: 'Failed to send welcome email via both services'
                };
            }
        }
    }

    // Fallback method to send welcome email via Resend
    async sendWelcomeEmailViaResend(email, name = '') {
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        try {
            // Read the welcome email template
            const templatePath = path.join(__dirname, 'templates', 'welcome-email.html');
            let emailTemplate = fs.readFileSync(templatePath, 'utf8');
            
            // Replace placeholders
            emailTemplate = emailTemplate.replace('{{subscriber_name}}', name || 'Fellow Chaos Survivor');
            emailTemplate = emailTemplate.replace('{{current_year}}', new Date().getFullYear());
            
            // Read the PDF file
            const pdfPath = path.join(__dirname, 'public', 'Bonus Chapter - The Worst Boyfriends Ever.pdf');
            const pdfBuffer = fs.readFileSync(pdfPath);
            
            const response = await resend.emails.send({
                from: `Aleks Filmore <${this.senderEmail}>`,
                to: [email],
                subject: "🎁 Your Secret Chapter is Here! (The One Too Chaotic for Print)",
                html: emailTemplate,
                text: this.generatePlainTextVersion(name),
                attachments: [{
                    filename: 'Bonus Chapter - The Worst Boyfriends Ever.pdf',
                    content: pdfBuffer,
                    content_type: 'application/pdf'
                }]
            });

            return {
                success: true,
                data: response,
                message: 'Welcome email sent via Resend'
            };
        } catch (error) {
            console.error('Resend welcome email error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Generate plain text version of welcome email
    generatePlainTextVersion(name = '') {
        return `
Hi ${name || 'Fellow Chaos Survivor'}!

🎉 Welcome to The Red Flag Report!

Thank you for joining the newsletter! As promised, your exclusive bonus chapter "The Straight" is attached to this email - the chapter that was too chaotic for print.

WANT MORE CHAOS?
- Get signed copies: https://aleksfilmore.com/shop.html#signed-copies
- Listen to the audiobook: https://aleksfilmore.com/audiobook.html
- Save with bundles: https://aleksfilmore.com/shop.html#bundles

LISTEN EVERYWHERE:
The audiobook is available on Spotify, Kobo, Barnes & Noble, Amazon, and more!

Follow me:
📱 Instagram: https://www.instagram.com/aleksfilmore
🎵 TikTok: https://www.tiktok.com/@aleksfilmore

I write for the beautifully broken, the hilariously heart-bruised, and anyone who's ever ugly-cried over a ghosting. Let's heal together, one bad ex at a time.

Cheers to surviving the worst!
Aleks

---
© 2025 Aleks Filmore. All rights reserved.
aleksfilmore.com

You're receiving this because you signed up for The Red Flag Report newsletter.
Unsubscribe: {unsubscribe_url}
        `.trim();
    }

    // Get secret chapter PDF as base64 (for MailerLite)
    getSecretChapterBase64() {
        try {
            const pdfPath = path.join(__dirname, 'public', 'Bonus Chapter - The Worst Boyfriends Ever.pdf');
            const pdfBuffer = fs.readFileSync(pdfPath);
            return pdfBuffer.toString('base64');
        } catch (error) {
            console.error('Error reading secret chapter PDF:', error);
            return null;
        }
    }

    // Enhanced addSubscriber method that also sends welcome email
    async addSubscriberWithWelcome(email, name = '', fields = {}) {
        try {
            // First add the subscriber
            const subscribeResult = await this.addSubscriber(email, name, fields);
            
            if (subscribeResult.success) {
                // Then send welcome email with secret chapter
                const welcomeResult = await this.sendWelcomeEmail(email, name);
                
                if (welcomeResult.success) {
                    console.log('MailerLite: Subscriber added and welcome email sent');
                    return {
                        success: true,
                        data: subscribeResult.data,
                        message: 'Subscriber added and welcome email sent successfully'
                    };
                } else {
                    console.log('MailerLite: Subscriber added but welcome email failed');
                    return {
                        success: true,
                        data: subscribeResult.data,
                        message: 'Subscriber added but welcome email failed',
                        warning: welcomeResult.error
                    };
                }
            } else {
                return subscribeResult;
            }
        } catch (error) {
            console.error('MailerLite addSubscriberWithWelcome error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Test API connection
    async testConnection() {
        try {
            const response = await axios.get(`${this.baseURL}/subscribers`, {
                headers: this.headers,
                params: { limit: 1 }
            });

            return {
                success: true,
                message: 'MailerLite API connection successful',
                data: {
                    totalSubscribers: response.data.meta?.total || 0
                }
            };
        } catch (error) {
            console.error('MailerLite connection test failed:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }
}

module.exports = MailerLiteService;
