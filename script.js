document.addEventListener('DOMContentLoaded', () => {
    // Announcement Bar
    const announcementItems = document.querySelectorAll('.announcement-item');
    if (announcementItems.length > 0) {
        let currentItemIndex = 0;
        setInterval(() => {
            if (announcementItems[currentItemIndex]) {
                announcementItems[currentItemIndex].classList.remove('is-active');
            }
            currentItemIndex = (currentItemIndex + 1) % announcementItems.length;
            if (announcementItems[currentItemIndex]) {
                announcementItems[currentItemIndex].classList.add('is-active');
            }
        }, 5000);
    }
    
    // Countdown Timer
    const countdownElement = document.getElementById('countdown');
    if(countdownElement) {
        let timeLeft = 59;
        setInterval(() => {
            timeLeft--;
            if (timeLeft < 10) {
                countdownElement.textContent = "0" + timeLeft;
            } else {
                countdownElement.textContent = timeLeft;
            }
            if (timeLeft <= 0) timeLeft = 60;
        }, 1000);
    }

    // Reviews Carousel
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
        { stars: 5, quote: "A hilariously raw and painfully honest LGBTQ+ memoir that turns romantic disasters into healing gold.", reviewer: "G." },
        { stars: 5, quote: "Super easy to read, made me laugh a ton, and somehow still left me thinking.", reviewer: "H." },
        { stars: 5, quote: "Fun, engaging, and totally unputdownable.", reviewer: "E." },
        { stars: 5, quote: "Like swapping tales with a brutally honest friend—wild, messy, and uplifting.", reviewer: "S." },
        { stars: 5, quote: "Got to laugh and own the cringe—these are not failures at all!", reviewer: "F." },
        { stars: 5, quote: "What starts as a chuckle grows into a parade of laughing and rereading.", reviewer: "A." },
        { stars: 5, quote: "Made me feel better about the red-flag guys I have dated.", reviewer: "N." },
        { stars: 4, quote: "Feels like talking with a close friend who has a sense of humor—both entertaining and informative.", reviewer: "V." },
        { stars: 5, quote: "Great perspective on dating and relationships. Recommended!", reviewer: "G." },
        { stars: 5, quote: "Practical and heartfelt strategies for reclaiming self-worth and emotional strength.", reviewer: "Y." },
        { stars: 5, quote: "Easy, funny, super relatable, and witty.", reviewer: "F." },
        { stars: 5, quote: "Laughing, cringing, and nodding in recognition the whole way through.", reviewer: "D." },
        { stars: 5, quote: "A relatable page-turner—highly recommended.", reviewer: "A." },
        { stars: 5, quote: "Amazingly witty and funny, with just the right touch of drama.", reviewer: "M." },
        { stars: 5, quote: "A fun read that will make you laugh and maybe cry a little.", reviewer: "G." },
        { stars: 5, quote: "Equal parts cringe and catharsis—I devoured it.", reviewer: "A." },
        { stars: 5, quote: "Laugh-out-loud, heart-pumping, inspiring.", reviewer: "S." },
        { stars: 5, quote: "A brilliantly funny and perceptive read. Highly recommended!", reviewer: "J." },
        { stars: 5, quote: "Filmore’s sharp wit turns cringe scenarios into laughing moments.", reviewer: "J." }
    ];
    const reviewsCarousel = document.querySelector('.reviews-carousel');
    if(reviewsCarousel) {
        const fullReviewList = [...reviews, ...reviews]; // Duplicate for seamless loop
        fullReviewList.forEach(review => {
            const card = document.createElement('div');
            card.className = 'review-card';
            const starIcons = '★'.repeat(review.stars) + '☆'.repeat(5 - review.stars);
            card.innerHTML = `<p>"${review.quote}"</p><div class="reviewer">${starIcons} – ${review.reviewer}</div>`;
            reviewsCarousel.appendChild(card);
        });
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
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        window.addEventListener('click', (e) => { 
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    setupModal(secretChapterModal, openSecretChapterBtn);
    setupModal(contactModal, openContactBtn);

    // All other JS logic (Mugshots, Quiz, Bingo, Cookies) would go here
});
