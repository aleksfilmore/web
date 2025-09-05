// Blog Management Helper for Dashboard
class BlogManager {
    constructor() {
        this.blogPosts = [];
        this.loadBlogData();
    }
    
    async loadBlogData() {
        // Get existing blog posts
        const existingPosts = [
            {
                title: "How I Got Into Writing The Worst Boyfriends Ever",
                url: "/blog/how-i-got-into-writing-the-worst-boyfriends-ever.html",
                date: "2024-12-15",
                type: "HTML",
                status: "Published"
            },
            {
                title: "Anatomy of a Ghost",
                url: "/blog/anatomy-of-a-ghost.html", 
                date: "2024-12-10",
                type: "HTML",
                status: "Published"
            },
            {
                title: "Red Flag Field Guide",
                url: "/blog/red-flag-field-guide.html",
                date: "2024-12-05", 
                type: "HTML",
                status: "Published"
            },
            {
                title: "Why I Stopped Dating Apps",
                url: "/blog/why-i-stopped-dating-apps.html",
                date: "2024-12-01",
                type: "HTML", 
                status: "Published"
            }
        ];
        
        this.blogPosts = existingPosts;
        this.updateBlogUI();
    }
    
    updateBlogUI() {
        const container = document.getElementById('blog-posts-list');
        if (!container) return;
        
        container.innerHTML = this.blogPosts.map(post => `
            <div class="bg-slate-800 border border-slate-700 rounded-lg p-4 flex justify-between items-center">
                <div>
                    <h4 class="font-medium text-slate-200">${post.title}</h4>
                    <p class="text-sm text-slate-400">${post.date} • ${post.type} • ${post.status}</p>
                </div>
                <div class="flex space-x-2">
                    <a href="${post.url}" target="_blank" class="text-blue-400 hover:text-blue-300 text-sm">View</a>
                    <a href="/admin/#/collections/blog" class="text-green-400 hover:text-green-300 text-sm">Edit in CMS</a>
                </div>
            </div>
        `).join('');
    }
}

// Initialize blog manager
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('blog-posts-list')) {
        window.blogManager = new BlogManager();
    }
});
