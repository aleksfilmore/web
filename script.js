document.addEventListener('DOMContentLoaded', () => {
    // Announcement Bar
    const announcementItems = document.querySelectorAll('.announcement-item');
    if (announcementItems.length > 0) {
        let currentItemIndex = 0;
        announcementItems[currentItemIndex].classList.add('is-active');
        setInterval(() => {
            announcementItems[currentItemIndex].classList.remove('is-active');
            currentItemIndex = (currentItemIndex + 1) % announcementItems.length;
            announcementItems[currentItemIndex].classList.add('is-active');
        }, 5000);
    }

    // Marquee Builder
    const reviews = [
        { name: "Samantha", text: "“It’s wild, messy, and somehow still uplifting.”" },
        { name: "Gerald", text: "“If you've ever been ghosted, this helps you laugh through the heartbreak.”" },
        { name: "J.L.G.", text: "“Mixes sharp humor with gentle lessons on self‑respect.”" }
    ];
    const reviewTrack = document.querySelector('.marquee-track');
    if (reviewTrack) {
        const fullTrackContent = [...reviews, ...reviews, ...reviews, ...reviews].map((r, i) => `<span><img src="https://i.pravatar.cc/30?u=${i}" alt=""> ★★★★★ ${r.text} – ${r.name}</span>`).join('');
        reviewTrack.innerHTML = fullTrackContent;
    }

    // Mugshot Gallery Builder
    const mugshotData = [
        { name: "The Gambler", charge: "Maxed my card on 'a sure-thing tournament.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/THE%20GAMBLER.png" }, { name: "The Ghoster", charge: "Evaporated for ten days, re-materialised with 'u up?'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Ghoster.png" }, { name: "The Party Animal", charge: "Hijacked the karaoke mic—shirtless Viking helmet.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Party%20Animal.png" }, { name: "The Pet-Obsessed", charge: "Cancelled plans because the dog 'needed support.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Pet-Obsessed.png" }, { name: "The Crier", charge: "Burst into tears when I declined tiramisu.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Crier.png" }, { name: "The Liar", charge: "Swore his family owned a secret Dalí.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Liar.png" }, { name: "The Kinkster", charge: "Produced 37 clothespins and a rubber chicken.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Kinkster.png" }, { name: "The Human Sloth", charge: "Considered charging his phone 'too much effort.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Human%20Sloth.png" }, { name: "The Fitness Fanatic", charge: "Did burpees over the picnic blanket.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Fitness%20Fanatic.png" }, { name: "The Perfectionist", charge: "Handed me a spreadsheet of my flaws.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Perfectionist.png" }, { name: "The Hoarder", charge: "Stored newspapers in the bathtub.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Hoarder.png" }, { name: "The Narcissist", charge: "Stole my moisturizer for his 'dewy glow.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Narcissist.png" }, { name: "The Late One", charge: "Turned up 58 minutes late, blamed 'traffic.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Late%20One.png" }, { name: "The Competitive", charge: "Trash-talked children at mini golf.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Competitive.png" }, { name: "The Conspiracist", charge: "Explained chem-trails between courses.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Conspiracist.png" }, { name: "The Wizard", charge: "Tried to banish a spider with Latin chants.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Wizard.png" }, { name: "The Planner", charge: "Scheduled 'spontaneous fun' in Google Calendar.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Planner.png" }, { name: "The Polyamorist", charge: "Color-coded lovers in iCal; I was 'Tuesday, 4 p.m.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Polyamorist.png" }, { name: "The Apologizer", charge: "Prefaced every sentence with 'I’m sorry.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Apologizer.png" }, { name: "The One Who Got Away", charge: "Perfect, kind, emotionally available—terrified me so much I ghosted myself.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20One%20Who%20Got%20Away.png" }
    ];
    const gallery = document.querySelector('.mugshot-gallery');
    if (gallery) {
        mugshotData.forEach(data => {
            const card = document.createElement('div');
            card.className = 'mugshot-card';
            card.innerHTML = `
                <img src="${data.img}" alt="${data.name}" loading="lazy" class="mugshot-card-img">
                <div class="mugshot-overlay">
                    <h3>${data.name}</h3>
                    <p class="mugshot-charge">${data.charge}</p>
                </div>
            `;
            card.addEventListener('click', () => card.classList.toggle('is-revealed'));
            gallery.appendChild(card);
        });
    }

    // Quiz Logic
    const quizLogic = () => {
        const quizQuestions = [
            { question: "He needs your credit card for a 'sure-thing' poker tournament. You…", options: [{ text: "Hand it over—high-risk, high love!", score: 1 }, { text: "Ask when you’ll be repaid.", score: 2 }, { text: "Laugh and change your PIN.", score: 3 }] },
            { question: "His dog Daisy wedges herself between you at dinner. You…", options: [{ text: "Offer Daisy your chair.", score: 1 }, { text: "Scoot over; at least the lab’s cute.", score: 2 }, { text: "Realize you’re the third wheel.", score: 3 }] },
            { question: "He ghosts, then texts: 'Dropped my phone in a lake!' Your reply?", options: [{ text: "'Aww, glad you’re OK! See you soon?'", score: 1 }, { text: "'Phones swim worse than excuses.'", score: 2 }, { text: "Silence and a swift block.", score: 3 }] }
        ];
        const intro = document.getElementById('quiz-intro'), questions = document.getElementById('quiz-questions'), results = document.getElementById('quiz-results');
        const startBtn = document.getElementById('quiz-start-btn'), resetBtn = document.getElementById('quiz-reset-btn');
        if(!intro) return;
        let currentQuestionIndex = 0, totalScore = 0;
        
        function loadQuestion() {
            const q = quizQuestions[currentQuestionIndex];
            document.getElementById('current-question').textContent = q.question;
            const optionsElem = document.getElementById('quiz-options');
            optionsElem.innerHTML = '';
            q.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'button';
                btn.textContent = opt.text;
                btn.onclick = () => selectAnswer(opt.score);
                optionsElem.appendChild(btn);
            });
        }
        function selectAnswer(score) { totalScore += score; currentQuestionIndex++; (currentQuestionIndex < quizQuestions.length) ? loadQuestion() : showResult(); }
        function showResult() {
            questions.style.display = 'none'; results.style.display = 'block';
            let category = '', blurb = '';
            if (totalScore >= 8) { category = "Queen of Green Flags!"; blurb = "Your radar is impeccable."; }
            else if (totalScore >= 5) { category = "Seasoned Survivor"; blurb = "You've seen some things."; }
            else { category = "Red-Flag Rookie"; blurb = "Bless your heart!"; }
            document.getElementById('quiz-category').textContent = category;
            document.getElementById('quiz-blurb').textContent = blurb;
        }
        function startQuiz() {
            intro.style.display = 'none'; questions.style.display = 'block'; results.style.display = 'none';
            currentQuestionIndex = 0; totalScore = 0; loadQuestion();
        }
        startBtn.addEventListener('click', startQuiz);
        resetBtn.addEventListener('click', startQuiz);
    };
    quizLogic();

    // Bingo Logic
    const bingoLogic = () => {
        const bingoSquaresData = [ "Pawned family heirloom", "2 a.m. 'u up?' text", "Turned a date into a race", "Gave a date itinerary", "Dog needed 'emotional support'", "Brought weird kink items", "Sobbed over dessert", "Lied about owning a Dalí", "Bathtub full of newspapers", "Shirtless karaoke", "Lied about ex being dead", "Kept six toasters" ];
        const grid = document.querySelector('.bingo-grid'), message = document.getElementById('bingo-message'), resetBtn = document.getElementById('bingo-reset-btn');
        if(!grid) return;

        function initializeBingo() {
            grid.innerHTML = ''; message.style.display = 'none';
            bingoSquaresData.forEach(text => {
                const square = document.createElement('div');
                square.className = 'bingo-square';
                square.textContent = text;
                square.addEventListener('click', () => {
                    square.classList.toggle('is-checked');
                    checkBingo();
                });
                grid.appendChild(square);
            });
        }
        function checkBingo() {
            if (grid.querySelectorAll('.is-checked').length >= 4) {
                 message.style.display = 'block';
            } else {
                message.style.display = 'none';
            }
        }
        resetBtn.addEventListener('click', initializeBingo);
        initializeBingo();
    };
    bingoLogic();

    // Modal and Cookie Logic
    const contactModal = document.getElementById('contact-modal'), openBtn = document.getElementById('open-contact-modal'), closeBtn = document.getElementById('close-modal');
    if(openBtn) openBtn.addEventListener('click', (e) => { e.preventDefault(); contactModal.style.display = 'flex'; });
    if(closeBtn) closeBtn.addEventListener('click', () => { contactModal.style.display = 'none'; });
    window.addEventListener('click', (e) => { if (e.target === contactModal) { contactModal.style.display = 'none'; } });

    const cookieBanner = document.getElementById('cookie-banner'), acceptBtn = document.getElementById('accept-cookies');
    if(cookieBanner && !localStorage.getItem('cookies_accepted')) { cookieBanner.classList.add('show'); }
    if(acceptBtn) acceptBtn.addEventListener('click', () => {
        localStorage.setItem('cookies_accepted', 'true');
        cookieBanner.classList.remove('show');
    });
});
