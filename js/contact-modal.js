// Contact Modal Component
// V2 Design - Emotional Realism Aesthetic

class ContactModal {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        // Create modal HTML
        this.createModal();
        // Bind event listeners
        this.bindEvents();
    }

    createModal() {
        const modalHTML = `
            <div id="contact-modal" class="fixed inset-0 z-[9999] hidden items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-[#010300]/90 backdrop-blur-sm transition-opacity duration-300" id="contact-modal-backdrop"></div>
                
                <!-- Modal Container -->
                <div class="relative bg-[#010300] border-2 border-[#f0e8c9]/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 opacity-0" id="contact-modal-container">
                    <!-- Close Button -->
                    <button type="button" class="absolute top-4 right-4 z-10 text-[#f0e8c9]/60 hover:text-[#fd0009] transition-colors p-2 rounded-full hover:bg-[#f0e8c9]/5" id="contact-modal-close" aria-label="Close modal">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>

                    <!-- Modal Content -->
                    <div class="p-6 sm:p-8">
                        <!-- Header -->
                        <div class="mb-6 text-center">
                            <h2 id="contact-modal-title" class="font-display font-bold text-2xl sm:text-3xl mb-2 text-[#f0e8c9]">
                                Get in Touch
                            </h2>
                            <p class="text-[#bfb9a3] text-sm sm:text-base italic" style="font-family: 'Playfair Display', serif;">
                                "A real human hits reply. Revolutionary, I know."
                            </p>
                        </div>

                        <!-- Form -->
                        <form id="contact-modal-form" class="space-y-4">
                            <!-- Name & Email Row -->
                            <div class="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label for="modal-name" class="block text-sm font-semibold mb-2 text-[#f0e8c9]">Name *</label>
                                    <input 
                                        type="text" 
                                        id="modal-name" 
                                        name="name"
                                        class="w-full px-4 py-3 bg-[#f0e8c9]/5 border border-[#f0e8c9]/20 rounded-lg text-[#f0e8c9] placeholder-[#bfb9a3]/50 focus:border-[#fd0009] focus:ring-1 focus:ring-[#fd0009] transition-all outline-none" 
                                        placeholder="Your name"
                                        required
                                    >
                                </div>
                                <div>
                                    <label for="modal-email" class="block text-sm font-semibold mb-2 text-[#f0e8c9]">Email *</label>
                                    <input 
                                        type="email" 
                                        id="modal-email" 
                                        name="email"
                                        class="w-full px-4 py-3 bg-[#f0e8c9]/5 border border-[#f0e8c9]/20 rounded-lg text-[#f0e8c9] placeholder-[#bfb9a3]/50 focus:border-[#fd0009] focus:ring-1 focus:ring-[#fd0009] transition-all outline-none" 
                                        placeholder="your@email.com"
                                        required
                                    >
                                </div>
                            </div>
                            
                            <!-- Subject -->
                            <div>
                                <label for="modal-subject" class="block text-sm font-semibold mb-2 text-[#f0e8c9]">Subject *</label>
                                <select 
                                    name="subject" 
                                    id="modal-subject" 
                                    class="w-full px-4 py-3 bg-[#f0e8c9]/5 border border-[#f0e8c9]/20 rounded-lg text-[#f0e8c9] focus:border-[#fd0009] focus:ring-1 focus:ring-[#fd0009] transition-all outline-none" 
                                    required
                                >
                                    <option value="">What's this about?</option>
                                    <option value="press">Press & Media Inquiry</option>
                                    <option value="podcast">Podcast Interview</option>
                                    <option value="speaking">Speaking Engagement</option>
                                    <option value="collaboration">Collaboration/Partnership</option>
                                    <option value="review">Book Review Request</option>
                                    <option value="reader">Reader Question/Feedback</option>
                                    <option value="other">Other/General Inquiry</option>
                                </select>
                            </div>

                            <!-- Message -->
                            <div>
                                <label for="modal-message" class="block text-sm font-semibold mb-2 text-[#f0e8c9]">Message *</label>
                                <textarea 
                                    id="modal-message" 
                                    name="message"
                                    rows="5"
                                    class="w-full px-4 py-3 bg-[#f0e8c9]/5 border border-[#f0e8c9]/20 rounded-lg text-[#f0e8c9] placeholder-[#bfb9a3]/50 focus:border-[#fd0009] focus:ring-1 focus:ring-[#fd0009] transition-all outline-none resize-y" 
                                    placeholder="Tell me what's on your mind..."
                                    required
                                ></textarea>
                            </div>

                            <!-- Newsletter Opt-in -->
                            <div class="flex items-start space-x-3 p-4 bg-[#fd0009]/5 border border-[#fd0009]/20 rounded-lg">
                                <input 
                                    type="checkbox" 
                                    id="modal-newsletter-opt-in" 
                                    name="newsletter_opt_in"
                                    class="mt-1 w-4 h-4 text-[#fd0009] bg-[#f0e8c9]/5 border-[#f0e8c9]/30 rounded focus:ring-[#fd0009] focus:ring-2"
                                >
                                <label for="modal-newsletter-opt-in" class="text-sm text-[#f0e8c9]/90">
                                    <strong class="text-[#fd0009]">Subscribe to my newsletter</strong> — Weekly dating disasters, book updates, and survival tips. (You can unsubscribe anytime, but why would you?)
                                </label>
                            </div>

                            <!-- Submit Button -->
                            <div class="flex flex-col sm:flex-row gap-3 pt-2">
                                <button 
                                    type="submit" 
                                    id="contact-modal-submit"
                                    class="flex-1 bg-[#fd0009] hover:bg-[#fd0009]/90 text-[#f0e8c9] font-display font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#fd0009]/30"
                                >
                                    Send Message
                                </button>
                                <button 
                                    type="button" 
                                    id="contact-modal-cancel"
                                    class="sm:w-auto px-6 py-3 bg-transparent border-2 border-[#f0e8c9]/20 text-[#f0e8c9] font-display font-semibold rounded-lg hover:bg-[#f0e8c9]/5 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>

                            <!-- Status Message -->
                            <div id="contact-modal-status" class="hidden p-4 rounded-lg"></div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Insert modal into body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('contact-modal');
    }

    bindEvents() {
        // Close button
        document.getElementById('contact-modal-close')?.addEventListener('click', () => this.close());
        
        // Cancel button
        document.getElementById('contact-modal-cancel')?.addEventListener('click', () => this.close());
        
        // Backdrop click
        document.getElementById('contact-modal-backdrop')?.addEventListener('click', () => this.close());
        
        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Form submission
        document.getElementById('contact-modal-form')?.addEventListener('submit', (e) => this.handleSubmit(e));

        // Bind all trigger buttons with class 'contact-modal-trigger'
        document.querySelectorAll('.contact-modal-trigger').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.open();
            });
        });
    }

    open() {
        if (!this.modal) return;
        
        this.isOpen = true;
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        
        // Trigger animation
        setTimeout(() => {
            const container = document.getElementById('contact-modal-container');
            container?.classList.remove('scale-95', 'opacity-0');
            container?.classList.add('scale-100', 'opacity-100');
        }, 10);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Focus first input
        setTimeout(() => {
            document.getElementById('modal-name')?.focus();
        }, 300);
    }

    close() {
        if (!this.modal) return;
        
        const container = document.getElementById('contact-modal-container');
        container?.classList.remove('scale-100', 'opacity-100');
        container?.classList.add('scale-95', 'opacity-0');

        setTimeout(() => {
            this.modal.classList.remove('flex');
            this.modal.classList.add('hidden');
            this.isOpen = false;
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            // Reset form
            document.getElementById('contact-modal-form')?.reset();
            this.hideStatus();
        }, 300);
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const name = formData.get('name');
        const subject = formData.get('subject');
        const message = formData.get('message');
        const newsletter_opt_in = formData.get('newsletter_opt_in') === 'on';
        
        const submitButton = document.getElementById('contact-modal-submit');
        const originalText = submitButton.textContent;
        
        // Show loading state
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;
        
        try {
            // Try local API first, fallback to Netlify function
            let response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, subject, message, newsletter_opt_in })
            }).catch(() => null);

            // Fallback
            if (!response || !response.ok) {
                response = await fetch('/.netlify/functions/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, name, subject, message, newsletter_opt_in })
                });
            }

            const result = await response.json();

            if (response.ok) {
                this.showStatus('success', 'Message sent successfully! I'll get back to you soon.');
                
                // Close modal after 2 seconds
                setTimeout(() => {
                    this.close();
                }, 2000);
            } else {
                throw new Error(result.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            this.showStatus('error', `Failed to send message: ${error.message}. Please try emailing aleksfilmore@gmail.com directly.`);
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    showStatus(type, message) {
        const statusEl = document.getElementById('contact-modal-status');
        if (!statusEl) return;

        statusEl.className = `p-4 rounded-lg ${type === 'success' ? 'bg-[#c7ff41]/10 border border-[#c7ff41]/30 text-[#c7ff41]' : 'bg-[#fd0009]/10 border border-[#fd0009]/30 text-[#fd0009]'}`;
        statusEl.textContent = message;
        statusEl.classList.remove('hidden');
    }

    hideStatus() {
        const statusEl = document.getElementById('contact-modal-status');
        if (statusEl) {
            statusEl.classList.add('hidden');
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.contactModal = new ContactModal();
    });
} else {
    window.contactModal = new ContactModal();
}

// Convenience function for programmatic opening
window.openContactModal = function() {
    window.contactModal?.open();
};
