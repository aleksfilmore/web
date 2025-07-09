document.addEventListener('DOMContentLoaded', () => {
    try {
        // Mugshot Gallery Builder
        const mugshotData = [
            { name: "The Gambler", charge: "Maxed my card on 'a sure-thing tournament.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/THE%20GAMBLER.png" },
            { name: "The Ghoster", charge: "Evaporated for ten days, re-materialised with 'u up?'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Ghoster.png" },
            { name: "The Party Animal", charge: "Hijacked the karaoke mic—shirtless Viking helmet.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Party%20Animal.png" },
            { name: "The Pet-Obsessed", charge: "Cancelled plans because the dog 'needed support.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Pet-Obsessed.png" },
            { name: "The Crier", charge: "Burst into tears when I declined tiramisu.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Crier.png" },
            { name: "The Liar", charge: "Swore his family owned a secret Dalí.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Liar.png" },
            { name: "The Kinkster", charge: "Produced 37 clothespins and a rubber chicken.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Kinkster.png" },
            { name: "The Human Sloth", charge: "Considered charging his phone 'too much effort.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Human%20Sloth.png" },
            { name: "The Fitness Fanatic", charge: "Did burpees over the picnic blanket.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Fitness%20Fanatic.png" },
            { name: "The Perfectionist", charge: "Handed me a spreadsheet of my flaws.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Perfectionist.png" },
            { name: "The Hoarder", charge: "Stored newspapers in the bathtub.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Hoarder.png" },
            { name: "The Narcissist", charge: "Stole my moisturizer for his 'dewy glow.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Narcissist.png" },
            { name: "The Late One", charge: "Turned up 58 minutes late, blamed 'traffic.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Late%20One.png" },
            { name: "The Competitive", charge: "Trash-talked children at mini golf.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Competitive.png" },
            { name: "The Conspiracist", charge: "Explained chem-trails between courses.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Conspiracist.png" },
            { name: "The Wizard", charge: "Tried to banish a spider with Latin chants.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Wizard.png" },
            { name: "The Planner", charge: "Scheduled 'spontaneous fun' in Google Calendar.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Planner.png" },
            { name: "The Polyamorist", charge: "Color-coded lovers in iCal; I was 'Tuesday, 4 p.m.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Polyamorist.png" },
            { name: "The Apologizer", charge: "Prefaced every sentence with 'I’m sorry.'", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20Apologizer.png" },
            { name: "The One Who Got Away", charge: "Perfect, kind, emotionally available—terrified me so much I ghosted myself.", img: "https://raw.githubusercontent.com/aleksfilmore/web/main/mugs/The%20One%20Who%20Got%20Away.png" }
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
    } catch (error) {
        console.error("An error occurred while initializing the page:", error);
    }
});
