document.addEventListener('DOMContentLoaded', () => {
    try {
        // Countdown Timer
        const countdownElement = document.getElementById('countdown');
        if(countdownElement) {
            let timeLeft = 59;
            setInterval(() => {
                timeLeft--;
                if (timeLeft < 0) timeLeft = 59;
                countdownElement.textContent = timeLeft < 10 ? "0" + timeLeft : timeLeft;
            }, 1000);
        }

        // Reviews Marquee
        const reviews = [
             { stars: 5, quote: "Whether you’ve dated these types, been these types, or just enjoy peeking into other people’s chaotic love lives, this book delivers.", reviewer: "T." },
            { stars: 5, quote: "Reading about these 25 types of guys to avoid made me uncomfortably examine my own behavior.", reviewer: "L." },
            { stars: 5, quote: "Funny, relatable, and painfully spot-on at times.", reviewer: "V." },
            { stars: 5, quote: "This book is so entertaining—probably because most of us can relate to a lot of it!", reviewer: "T." },
            { stars: 5, quote: "Perfect for anyone who’s survived love gone wrong and lived to laugh about it.", reviewer: "C." },
            { stars: 3, quote: "Made me laugh and showed the funny side of dating different kinds of guys.", reviewer: "M." },
            { stars: 5, quote: "A red-flag detector when dating a man—couldn’t stop laughing.", reviewer: "T." }
        ];
        const reviewTrack = document.querySelector('.reviews-marquee .marquee-track');
        if(reviewTrack) {
            const fullReviewList = [...reviews, ...reviews, ...reviews]; // Duplicate for seamless loop
            reviewTrack.innerHTML = fullReviewList.map(review => {
                const starIcons = '★'.repeat(review.stars) + '☆'.repeat(5 - review.stars);
                return `<div class="review-card"><p>"${review.quote}"</p><div class="reviewer">${starIcons} – ${review.reviewer}</div></div>`;
            }).join('');
        }

        // Modal Logic
        const secretChapterModal = document.getElementById('secret-chapter-modal');
        const openSecretChapterBtn = document.getElementById('open-secret-chapter-modal');
        const contactModal = document.getElementById('contact-modal');
        const openContactBtn = document.getElementById('open-contact-modal');

        function setupModal(modal, openBtn) {
            if(!modal || !openBtn) return;
            const closeBtn = modal.querySelector('.modal-close');
            openBtn.addEventListener('click', (e) => {
                e.preventDefault();
                modal.style.display = 'flex';
            });
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }
            window.addEventListener('click', (e) => { 
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
        setupModal(secretChapterModal, openSecretChapterBtn);
        setupModal(contactModal, openContactBtn);
        
    } catch (error) {
        console.error("Error initializing page:", error);
    }
});
