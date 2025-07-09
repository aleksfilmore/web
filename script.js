document.addEventListener('DOMContentLoaded', () => {
    try {
        // Announcement Bar
        const announcementItems = document.querySelectorAll('.announcement-item');
        if (announcementItems.length > 1) {
            let currentItemIndex = 0;
            announcementItems[0].classList.add('is-active');
            setInterval(() => {
                announcementItems[currentItemIndex].classList.remove('is-active');
                currentItemIndex = (currentItemIndex + 1) % announcementItems.length;
                announcementItems[currentItemIndex].classList.add('is-active');
            }, 5000);
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
        if (reviewTrack) {
            const fullTrackContent = [...reviews, ...reviews, ...reviews].map(r => {
                const starIcons = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
                return `<div class="review-card"><p>"${r.quote}"</p><div class="reviewer">${starIcons} – ${r.reviewer}</div></div>`;
            }).join('');
            reviewTrack.innerHTML = fullTrackContent;
        }

        // Mugshot Gallery
        const mugshotData = [
            { name: "The Gambler", charge: "Maxed my card on 'a sure-thing tournament.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/THE%20GAMBLER.png" }, { name: "The Ghoster", charge: "Evaporated for ten days, re-materialised with 'u up?'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Ghoster.png" }, { name: "The Party Animal", charge: "Hijacked the karaoke mic—shirtless Viking helmet.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Party%20Animal.png" }, { name: "The Pet-Obsessed", charge: "Cancelled plans because the dog 'needed support.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Pet-Obsessed.png" }, { name: "The Crier", charge: "Burst into tears when I declined tiramisu.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Crier.png" }
        ];
        const gallery = document.querySelector('.mugshot-gallery');
        if (gallery) {
            mugshotData.forEach(data => {
                const card = document.createElement('div');
                card.className = 'mugshot-card';
                card.innerHTML = `<img src="${data.img}" alt="${data.name}" loading="lazy"><div class="mugshot-overlay"><h3>${data.name}</h3><p class="mugshot-charge">${data.charge}</p></div>`;
                card.addEventListener('click', () => card.classList.toggle('is-revealed'));
                gallery.appendChild(card);
            });
        }
        
        // Modal Logic
        function setupModal(modalId, openBtnId) {
            const modal = document.getElementById(modalId);
            const openBtn = document.getElementById(openBtnId);
            if (!modal || !openBtn) return;
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
        setupModal('secret-chapter-modal', 'open-secret-chapter-modal');
        setupModal('contact-modal', 'open-contact-modal');
        
        // Cookie Banner
        const cookieBanner = document.getElementById('cookie-banner'), acceptBtn = document.getElementById('accept-cookies');
        if(cookieBanner && !localStorage.getItem('cookies_accepted')) {
            cookieBanner.classList.add('show');
        }
        if(acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                localStorage.setItem('cookies_accepted', 'true');
                cookieBanner.classList.remove('show');
            });
        }

    } catch (error) {
        console.error("Error initializing page:", error);
    }
});
