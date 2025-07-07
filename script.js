document.addEventListener('DOMContentLoaded', () => {
    try {
        // Reviews Marquee
        const reviews = [
            { stars: 5, quote: "Whether you’ve dated these types, been these types, or just enjoy peeking into other people’s chaotic love lives, this book delivers.", reviewer: "T." },
            { stars: 5, quote: "Reading about these 25 types of guys to avoid made me uncomfortably examine my own behavior.", reviewer: "L." },
            { stars: 5, quote: "Funny, relatable, and painfully spot-on at times.", reviewer: "V." },
            { stars: 5, quote: "This book is so entertaining—probably because most of us can relate to a lot of it!", reviewer: "T." },
            { stars: 5, quote: "Perfect for anyone who’s survived love gone wrong and lived to laugh about it.", reviewer: "C." },
            { stars: 3, quote: "Made me laugh and showed the funny side of dating different kinds of guys.", reviewer: "M." },
            { stars: 5, quote: "A red-flag detector when dating a man—couldn’t stop laughing.", reviewer: "T." },
            { stars: 5, quote: "If you’re in the mood for something campy and light, go for it.", reviewer: "R." },
            { stars: 5, quote: "The same issues appear in all types of relationships—I even recognized a few of my past partners.", reviewer: "N." },
            { stars: 5, quote: "A hilariously raw and painfully honest LGBTQ+ memoir that turns romantic disasters into healing gold.", reviewer: "G." }
        ];
        const reviewTrack = document.querySelector('.marquee-track');
        if (reviewTrack) {
            const fullTrackContent = [...reviews, ...reviews].map(r => `<span><span class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span> "${r.quote}" – ${r.reviewer}</span>`).join('');
            reviewTrack.innerHTML = fullTrackContent;
        }

        // Modal Logic
        const secretChapterModal = document.getElementById('secret-chapter-modal');
        const openSecretChapterBtn = document.getElementById('open-secret-chapter-modal');
        
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
        }
        setupModal(secretChapterModal, openSecretChapterBtn);
        
    } catch (error) {
        console.error("Error initializing page:", error);
    }
});
