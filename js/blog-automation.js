// Blog Automation System
// Handles automatic homepage updates and blog page management

class BlogAutomationSystem {
    constructor() {
        this.contentCalendarUrl = '/data/content-calendar.json';
        this.blogIndexUrl = '/data/blog-index.json';
        this.homepageSelector = '#homepage-blog-grid';
        this.blogPageSelector = '#blog-listing';
    }

    // Check if it's time to publish new content
    async checkPublishSchedule() {
        try {
            const response = await fetch(this.contentCalendarUrl);
            const calendar = await response.json();
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];

            // Find articles scheduled for today that haven't been published
            const articlesToPublish = calendar.contentCalendar.articles.filter(article => {
                const publishDate = article.publishDate;
                return publishDate === todayStr && article.status === 'scheduled';
            });

            if (articlesToPublish.length > 0) {
                console.log(`Found ${articlesToPublish.length} articles to publish today`);
                for (const article of articlesToPublish) {
                    await this.publishArticle(article);
                }
            }
        } catch (error) {
            console.error('Error checking publish schedule:', error);
        }
    }

    // Publish an article and update all necessary pages
    async publishArticle(article) {
        try {
            // Update blog index
            await this.updateBlogIndex(article);
            
            // Update content calendar status
            await this.updateContentCalendarStatus(article.slug, 'published');
            
            // Refresh homepage blog section
            await this.refreshHomepageBlog();
            
            // Refresh blog page
            await this.refreshBlogPage();
            
            console.log(`Successfully published: ${article.title}`);
        } catch (error) {
            console.error(`Error publishing article ${article.slug}:`, error);
        }
    }

    // Update blog-index.json with new article
    async updateBlogIndex(article) {
        try {
            const response = await fetch(this.blogIndexUrl);
            const blogIndex = await response.json();
            
            // Check if article already exists
            const existingIndex = blogIndex.posts.findIndex(post => post.slug === article.slug);
            
            const newPost = {
                id: article.slug,
                slug: article.slug,
                title: article.title,
                summary: this.generateSummary(article),
                publishedAt: new Date(article.publishDate + 'T12:00:00.000Z').toISOString(),
                date: article.publishDate,
                readTime: this.calculateReadTime(article.wordCount),
                tags: article.tags,
                featured: blogIndex.posts.length === 0, // First post is featured
                seoKeywords: [article.seoKeyword],
                status: 'published'
            };

            if (existingIndex !== -1) {
                // Update existing
                blogIndex.posts[existingIndex] = newPost;
            } else {
                // Add new post at the beginning
                blogIndex.posts.unshift(newPost);
            }

            // Update lastUpdated timestamp
            blogIndex.lastUpdated = new Date().toISOString();

            // Note: In a real implementation, this would send a POST request to update the file
            console.log('Blog index updated:', newPost);
            
        } catch (error) {
            console.error('Error updating blog index:', error);
        }
    }

    // Generate summary for article based on content
    generateSummary(article) {
        const summaries = {
            'toxic boyfriend signs': 'Complete survival guide to recognizing toxic partners before they destroy your life, based on 25 real relationship disasters.',
            'why do I attract toxic men': 'Psychology-focused deep dive into why smart women repeatedly attract toxic partners and how to break the destructive cycle.',
            'narcissist manipulation tactics': 'Educational exposé of narcissistic manipulation techniques with real examples that reads like a psychological thriller.',
            'dating after abusive relationship': 'Vulnerable healing journey with practical recovery steps for dating after trauma and rebuilding self-trust.',
            'friends don\'t like my boyfriend': 'The crucial role of friendship in relationship success and why your circle is your best red flag detection system.',
            'boyfriend financial red flags': 'Money and relationships through the lens of dating disasters that cost thousands in both cash and sanity.',
            'scary boyfriend behaviors': 'Halloween-themed exploration of genuinely terrifying relationship behaviors that are scarier than any horror movie.',
            'is there only one soulmate': 'Philosophical take on modern dating myths, finding contentment, and why being single can be your superpower.',
            'worst types of boyfriends': 'Humorous ranking system with detailed breakdowns of the most catastrophic boyfriend archetypes.',
            'learning from bad relationships': 'Reflective journey from disaster victim to dating wisdom guru, positioning hard-earned expertise through experience.'
        };
        
        return summaries[article.seoKeyword] || `Insightful article about ${article.title.toLowerCase()}.`;
    }

    // Calculate read time based on word count
    calculateReadTime(wordCount) {
        if (!wordCount) return '8 min read';
        const wordsPerMinute = 200;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return `${minutes} min read`;
    }

    // Update content calendar status
    async updateContentCalendarStatus(slug, status) {
        try {
            console.log(`Updating ${slug} status to ${status}`);
            // In a real implementation, this would update the content-calendar.json file
        } catch (error) {
            console.error('Error updating content calendar:', error);
        }
    }

    // Refresh homepage blog section
    async refreshHomepageBlog() {
        const homepageGrid = document.querySelector(this.homepageSelector);
        if (homepageGrid && typeof window.renderHomepageBlog === 'function') {
            await window.renderHomepageBlog();
            console.log('Homepage blog section refreshed');
        }
    }

    // Refresh blog page
    async refreshBlogPage() {
        const blogListing = document.querySelector(this.blogPageSelector);
        if (blogListing && typeof window.renderBlogListing === 'function') {
            await window.renderBlogListing();
            console.log('Blog page refreshed');
        }
    }

    // Get next article to be published
    async getNextArticle() {
        try {
            const response = await fetch(this.contentCalendarUrl);
            const calendar = await response.json();
            const now = new Date();
            
            const futureArticles = calendar.contentCalendar.articles
                .filter(article => new Date(article.publishDate) > now && article.status === 'scheduled')
                .sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate));
                
            return futureArticles[0] || null;
        } catch (error) {
            console.error('Error getting next article:', error);
            return null;
        }
    }

    // Initialize automation system
    init() {
        // Check for publications on page load
        this.checkPublishSchedule();
        
        // Set up periodic checks (every hour)
        setInterval(() => {
            this.checkPublishSchedule();
        }, 60 * 60 * 1000);
        
        console.log('Blog automation system initialized');
    }
}

// Social Media Integration
class SocialMediaScheduler {
    constructor() {
        this.platforms = ['instagram', 'tiktok', 'twitter'];
    }

    // Generate social media posts for new articles
    generateSocialPosts(article) {
        const posts = {
            instagram: {
                caption: this.generateInstagramPost(article),
                hashtags: this.generateHashtags(article.tags)
            },
            tiktok: {
                caption: this.generateTikTokPost(article),
                hashtags: this.generateHashtags(article.tags, 'tiktok')
            },
            twitter: {
                text: this.generateTwitterPost(article)
            }
        };
        
        return posts;
    }

    generateInstagramPost(article) {
        const hooks = {
            'toxic boyfriend signs': '🚩 Red flag alert! After surviving 25 toxic relationships, I can spot the warning signs from a mile away.',
            'why do I attract toxic men': '💭 Why do smart women keep attracting the wrong people? The psychology behind toxic attraction might surprise you.',
            'narcissist manipulation tactics': '🎭 The narcissist playbook is real, and it\'s terrifying. Here\'s what I wish I\'d known sooner.',
            'dating after abusive relationship': '💚 Healing after trauma isn\'t linear. Here\'s how I learned to trust my gut again.',
            'friends dont like my boyfriend': '👥 Your friends see what you cant. Why your circle is your best dating coach.',
            'boyfriend financial red flags': '💸 This dating disaster cost me $10,000 and my sanity. Don\'t make my mistakes.',
            'scary boyfriend behaviors': '🎃 These boyfriend behaviors are scarier than any horror movie. Halloween special!',
            'is there only one soulmate': '✨ Plot twist: I stopped believing in "The One" and found peace instead.',
            'worst types of boyfriends': '📊 Ranking my worst boyfriend archetypes by damage level. Which one have you dated?',
            'learning from bad relationships': '🦋 From dating disaster to relationship wisdom: what 25 bad boyfriends taught me about love.'
        };
        
        return hooks[article.seoKeyword] || `New blog post: ${article.title}`;
    }

    generateTikTokPost(article) {
        const hooks = {
            'toxic boyfriend signs': 'POV: You can spot toxic men from 3 dating profiles away because you survived 25 of them',
            'why do I attract toxic men': 'Why smart women keep dating terrible men (it\'s not what you think)',
            'narcissist manipulation tactics': 'The narcissist playbook they don\'t want you to know about',
            'dating after abusive relationship': 'Dating after trauma hits different. Here\'s how I learned to trust again.',
            'friends don\'t like my boyfriend': 'When your friends don\'t like your boyfriend (they\'re probably right)',
            'boyfriend financial red flags': 'This ex cost me $10k. Here are the financial red flags I missed.',
            'scary boyfriend behaviors': 'Boyfriend behaviors scarier than any horror movie',
            'is there only one soulmate': 'I stopped believing in soulmates and my life got so much better',
            'worst types of boyfriends': 'Ranking my worst ex-boyfriends by chaos level',
            'learning from bad relationships': 'What 25 terrible boyfriends taught me about love'
        };
        
        return hooks[article.seoKeyword] || `New story time: ${article.title}`;
    }

    generateTwitterPost(article) {
        const url = `https://aleksfilmore.com/blog/${article.slug}.html`;
        const hooks = {
            'toxic boyfriend signs': '🚩 After 25 toxic relationships, I wrote the survival guide I wish I\'d had.',
            'why do I attract toxic men': 'Why do smart people keep attracting toxic partners? The psychology is fascinating.',
            'narcissist manipulation tactics': 'The narcissist manipulation playbook, decoded from real experience.',
            'dating after abusive relationship': 'How I learned to trust my gut again after relationship trauma.',
            'friends don\'t like my boyfriend': 'Your friends see what you can\'t. Why your circle matters in dating.',
            'boyfriend financial red flags': 'Dating disasters that cost me $10,000. Learn from my expensive mistakes.',
            'scary boyfriend behaviors': '🎃 Halloween special: Boyfriend behaviors scarier than horror movies.',
            'is there only one soulmate': 'I stopped believing in "The One" and found peace instead.',
            'worst types of boyfriends': 'Ranking my worst boyfriend archetypes by damage level and recovery time.',
            'learning from bad relationships': '25 bad relationships taught me everything about love (and red flags).'
        };
        
        return `${hooks[article.seoKeyword] || article.title} ${url}`;
    }

    generateHashtags(tags, platform = 'instagram') {
        const baseHashtags = {
            instagram: ['#DatingAdvice', '#RedFlags', '#ToxicRelationships', '#SelfLove', '#RelationshipTips', '#Dating', '#Memoir', '#QueerAuthor'],
            tiktok: ['#DatingTips', '#RedFlag', '#Storytime', '#DatingFail', '#RelationshipAdvice', '#ToxicEx', '#DatingDisaster']
        };
        
        const tagHashtags = tags.map(tag => `#${tag.replace(/\s+/g, '')}`);
        
        return [...(baseHashtags[platform] || baseHashtags.instagram), ...tagHashtags].slice(0, 15);
    }
}

// Newsletter Integration
class NewsletterManager {
    constructor() {
        this.apiEndpoint = '/api/newsletter-update';
    }

    async notifySubscribers(article) {
        try {
            const emailContent = this.generateNewsletterContent(article);
            
            // In a real implementation, this would trigger newsletter send
            console.log('Newsletter content generated:', emailContent);
            
            // Could integrate with MailerLite, ConvertKit, etc.
            
        } catch (error) {
            console.error('Error sending newsletter:', error);
        }
    }

    generateNewsletterContent(article) {
        return {
            subject: `New Post: ${article.title}`,
            preview: `The latest disaster from my dating life...`,
            content: `
                <h2>${article.title}</h2>
                <p>New post is live! ${this.generateSummary(article)}</p>
                <a href="https://aleksfilmore.com/blog/${article.slug}.html">Read the full post →</a>
                <hr>
                <p><small>You're receiving this because you subscribed to updates from Aleks Filmore. 
                <a href="#">Unsubscribe</a> anytime.</small></p>
            `
        };
    }
}

// Initialize systems
if (typeof window !== 'undefined') {
    window.blogAutomation = new BlogAutomationSystem();
    window.socialScheduler = new SocialMediaScheduler();
    window.newsletterManager = new NewsletterManager();
    
    // Auto-initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        window.blogAutomation.init();
    });
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BlogAutomationSystem,
        SocialMediaScheduler,
        NewsletterManager
    };
}