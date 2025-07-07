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
            const fullTrackContent = [...reviews, ...reviews, ...reviews].map(r => `<span><span class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span> "${r.quote}" – ${r.reviewer}</span>`).join('');
            reviewTrack.innerHTML = fullTrackContent;
        }

        // Mugshot Gallery
        const mugshotData = [
            { name: "The Gambler", charge: "Maxed my card on 'a sure-thing tournament.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/THE%20GAMBLER.png" }, { name: "The Ghoster", charge: "Evaporated for ten days, re-materialised with 'u up?'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Ghoster.png" }, { name: "The Party Animal", charge: "Hijacked the karaoke mic—shirtless Viking helmet.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Party%20Animal.png" }, { name: "The Pet-Obsessed", charge: "Cancelled plans because the dog 'needed support.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Pet-Obsessed.png" }, { name: "The Crier", charge: "Burst into tears when I declined tiramisu.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Crier.png" }, { name: "The Liar", charge: "Swore his family owned a secret Dalí.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Liar.png" }, { name: "The Kinkster", charge: "Produced 37 clothespins and a rubber chicken.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Kinkster.png" }, { name: "The Human Sloth", charge: "Considered charging his phone 'too much effort.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Human%20Sloth.png" }, { name: "The Fitness Fanatic", charge: "Did burpees over the picnic blanket.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Fitness%20Fanatic.png" }, { name: "The Perfectionist", charge: "Handed me a spreadsheet of my flaws.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Perfectionist.png" }, { name: "The Hoarder", charge: "Stored newspapers in the bathtub.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Hoarder.png" }, { name: "The Narcissist", charge: "Stole my moisturizer for his 'dewy glow.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Narcissist.png" }, { name: "The Late One", charge: "Turned up 58 minutes late, blamed 'traffic.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Late%20One.png" }, { name: "The Competitive", charge: "Trash-talked children at mini golf.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Competitive.png" }, { name: "The Conspiracist", charge: "Explained chem-trails between courses.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Conspiracist.png" }, { name: "The Wizard", charge: "Tried to banish a spider with Latin chants.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Wizard.png" }, { name: "The Planner", charge: "Scheduled 'spontaneous fun' in Google Calendar.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Planner.png" }, { name: "The Polyamorist", charge: "Color-coded lovers in iCal; I was 'Tuesday, 4 p.m.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Polyamorist.png" }, { name: "The Apologizer", charge: "Prefaced every sentence with 'I’m sorry.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Apologizer.png" }, { name: "The One Who Got Away", charge: "Perfect, kind, emotionally available—terrified me so much I ghosted myself.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20One%20Who%20Got%20Away.png" }
    ];
    const gallery = document.querySelector('.mugshot-gallery');
    if (gallery) {
        mugshotData.forEach(data => {
            const card = document.createElement('div');
            card.className = 'mugshot-card';
            card.innerHTML = `<img src="${data.img}" alt="${data.name}" loading="lazy" class="mugshot-card-img"><div class="mugshot-overlay"><h3>${data.name}</h3><p class="mugshot-charge">${data.charge}</p></div>`;
            card.addEventListener('click', () => card.classList.toggle('is-revealed'));
            gallery.appendChild(card);
        });
    }

    // Modal Logic
    function setupModal(modal, openBtn) {
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

    const secretChapterModal = document.getElementById('secret-chapter-modal');
    const openSecretChapterBtn = document.getElementById('open-secret-chapter-modal');
    setupModal(secretChapterModal, openSecretChapterBtn);

    const contactModal = document.getElementById('contact-modal');
    const openContactBtn = document.getElementById('open-contact-modal');
    setupModal(contactModal, openContactBtn);

    const cookieBanner = document.getElementById('cookie-banner'), acceptBtn = document.getElementById('accept-cookies');
    if(cookieBanner && !localStorage.getItem('cookies_accepted')) { cookieBanner.classList.add('show'); }
    if(acceptBtn) acceptBtn.addEventListener('click', () => {
        localStorage.setItem('cookies_accepted', 'true');
        cookieBanner.classList.remove('show');
    });

    } catch (error) {
        console.error("Error initializing page:", error);
    }
});
