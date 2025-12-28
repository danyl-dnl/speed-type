// --- 1. GAME VARIABLES ---
const quotes = [

    "Technology plays an important role in how we study, work, and share information today. Students attend online classes, professionals send emails, and teams collaborate using digital tools. Typing accurately, even with small details like the @ symbol, helps improve communication and efficiency.",

    "Many websites ask users to create an account using an email address such as user@email.com. While typing words is easy, entering symbols correctly requires attention and practice. Developing this skill improves confidence and reduces mistakes during everyday computer use.",

    "Time management is essential in both education and professional life. Deadlines, schedules, and targets like 90% completion require focus and accuracy. Practicing typing with a few symbols helps users stay prepared for real-world digital tasks.",

    "Many teams now communicate through digital platforms instead of face-to-face meetings. Clear typing helps ideas flow smoothly without confusion or delays. Using simple symbols such as & in messages is common and should be practiced regularly.",

];

let currentPlayer = "";
let timer = 60;
let isPlaying = false;
let interval = null;
let startTime = null;
let totalCharsBeforeCurrentQuote = 0;
let isGameSaved = false;

// DOM Elements
const quoteDisplay = document.getElementById('quote-display');
const quoteInput = document.getElementById('quote-input');
const wpmDisplay = document.getElementById('wpm');
const accDisplay = document.getElementById('accuracy');
const timerDisplay = document.getElementById('timer');

// Initialize Leaderboard on Load
document.addEventListener('DOMContentLoaded', () => {
    updateLeaderboardUI();
});

// --- 2. FLOW CONTROL ---

function showNameEntry() {
    wpmDisplay.innerText = "0";
    accDisplay.innerText = "100%";
    timerDisplay.innerText = "60";
    quoteDisplay.innerText = "Waiting for participant...";
    document.getElementById('name-modal').style.display = 'flex';
    document.getElementById('username-input').value = "";
    document.getElementById('username-input').focus();
    
    clearInterval(interval);
    isPlaying = false;
}

function startGame() {
    const nameInput = document.getElementById('username-input');
    const name = nameInput.value.trim();
    if (name === "") return alert("Please enter a name!");
    
    currentPlayer = name;
    document.getElementById('name-modal').style.display = 'none';
    
    timer = 60;
    timerDisplay.innerText = "60";
    wpmDisplay.innerText = "0";
    accDisplay.innerText = "100%";
    isPlaying = false;
    isGameSaved = false;
    startTime = null;
    totalCharsBeforeCurrentQuote = 0;
    
    clearInterval(interval);
    renderNextQuote();
    quoteInput.disabled = false;
    quoteInput.value = "";
    quoteInput.focus();
}

function renderNextQuote() {
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteDisplay.innerHTML = '';
    
    // Split quote into words to create word-groups
    quote.split(' ').forEach((word, index, arr) => {
        // Create Word container
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        
        // Add letters to word
        word.split('').forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.innerText = char;
            wordSpan.appendChild(charSpan);
        });
        
        quoteDisplay.appendChild(wordSpan);

        // Add Space (except after last word)
        if (index < arr.length - 1) {
            const spaceSpan = document.createElement('span');
            spaceSpan.className = 'space';
            spaceSpan.innerHTML = '&nbsp;'; // Non-breaking space for visual
            quoteDisplay.appendChild(spaceSpan);
        }
    });
    
    quoteInput.value = '';
}

// --- 3. TYPING LOGIC (WORD BY WORD) ---

quoteInput.addEventListener('input', () => {
    if (isGameSaved) return;

    // Split input by spaces to get array of words typed
    const inputWords = quoteInput.value.split(' ');
    
    if (!isPlaying && quoteInput.value.length > 0) {
        isPlaying = true;
        startTime = new Date();
        startTimer();
    }

    // Get all DOM elements
    const quoteWordSpans = quoteDisplay.querySelectorAll('.word');
    const quoteSpaceSpans = quoteDisplay.querySelectorAll('.space');
    
    let allWordsCorrect = true;

    // LOOP 1: Check Words
    quoteWordSpans.forEach((wordSpan, i) => {
        const typedWord = inputWords[i] || ''; 
        const charSpans = wordSpan.querySelectorAll('span');
        
        const isWordCompleted = i < inputWords.length - 1;

        // Check chars inside this word
        let isWordRefect = true;
        charSpans.forEach((charSpan, j) => {
            const typedChar = typedWord[j];
            const targetChar = charSpan.innerText;

            if (typedChar == null) {
                // Not typed yet
                charSpan.className = '';
                isWordRefect = false;
                if (isWordCompleted) charSpan.className = 'incorrect';
            } else if (typedChar === targetChar) {
                charSpan.className = 'correct';
            } else {
                charSpan.className = 'incorrect';
                isWordRefect = false;
            }
        });

        if (!isWordRefect) allWordsCorrect = false;
    });

    // LOOP 2: Check Spaces
    quoteSpaceSpans.forEach((spaceSpan, i) => {
        // If we have typed past this space (inputWords length > i + 1)
        if (i < inputWords.length - 1) {
            spaceSpan.className = 'space correct';
        } else {
            spaceSpan.className = 'space'; // Default (invisible/waiting)
        }
    });

    // CHECK FINISH:
    const lastWordIdx = quoteWordSpans.length - 1;
    const lastTyped = inputWords[lastWordIdx];
    const lastTarget = quoteWordSpans[lastWordIdx].innerText;
    
    if (inputWords.length === quoteWordSpans.length && 
        lastTyped === lastTarget && 
        allWordsCorrect) {
        
        totalCharsBeforeCurrentQuote += quoteInput.value.length;
        renderNextQuote();
    }
    
    calculateStats();
});

function calculateStats() {
    if (!startTime) return;
    
    const timeElapsed = (new Date() - startTime) / 60000;
    const totalChars = totalCharsBeforeCurrentQuote + quoteInput.value.length;
    const wpm = timeElapsed > 0 ? Math.round((totalChars / 5) / timeElapsed) : 0;
    
    const currentCorrect = quoteDisplay.querySelectorAll('.correct').length;
    const currentTypedLength = quoteInput.value.length;
    
    let accuracy = 100;
    if (currentTypedLength > 0) {
        accuracy = Math.round((currentCorrect / currentTypedLength) * 100);
    }
    
    wpmDisplay.innerText = wpm;
    accDisplay.innerText = accuracy + "%";
}

function startTimer() {
    clearInterval(interval);
    interval = setInterval(() => {
        timer--;
        timerDisplay.innerText = timer;
        if (timer <= 0) finishGame();
    }, 1000);
}

function finishGame() {
    clearInterval(interval);
    quoteInput.disabled = true;
    isPlaying = false;
    
    if (isGameSaved) return;
    isGameSaved = true;

    const finalWpm = parseInt(wpmDisplay.innerText) || 0;
    const finalAcc = accDisplay.innerText;
    
    document.getElementById('final-wpm-display').innerText = finalWpm;
    document.getElementById('final-acc-display').innerText = finalAcc;
    document.getElementById('participant-congrats').innerText = `Great job, ${currentPlayer}!`;
    document.getElementById('result-overlay').style.display = 'flex';
    
    saveToLocalStorage(currentPlayer, finalWpm, finalAcc);
}

function closeResult() {
    document.getElementById('result-overlay').style.display = 'none';
    document.querySelector('.leaderboard-section').scrollIntoView({ behavior: 'smooth' });
}

// --- 4. LOCAL STORAGE OPERATIONS ---

function saveToLocalStorage(name, wpm, acc) {
    if (!name) name = "Anonymous";
    let leaderboard = JSON.parse(localStorage.getItem('excel_leaderboard')) || [];
    leaderboard.push({
        username: name,
        speed: wpm,
        accuracy: acc,
        timestamp: Date.now()
    });
    leaderboard.sort((a, b) => b.speed - a.speed);
    if (leaderboard.length > 5) {
        leaderboard = leaderboard.slice(0, 5);
    }
    localStorage.setItem('excel_leaderboard', JSON.stringify(leaderboard));
    updateLeaderboardUI();
}

function updateLeaderboardUI() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = "";
    const leaderboard = JSON.parse(localStorage.getItem('excel_leaderboard')) || [];

    leaderboard.forEach((data, index) => {
        const li = document.createElement('li');
        const displayName = data.username ? data.username.toUpperCase() : "UNKNOWN";
        const displayAcc = data.accuracy || "100%";
        
        li.innerHTML = `
            <div style="flex: 2; display: flex; align-items: center; gap: 15px;">
                <span style="color: #f3b03d; font-weight: 800; min-width: 40px; text-align: left;">#${index + 1}</span>
                <span style="color: white; font-weight: 600; text-transform: uppercase;">${displayName}</span>
            </div>
            <span style="flex: 1; text-align: center; color: #ccc;">${displayAcc}</span>
            <span style="flex: 1; text-align: right; color: #f3b03d; font-weight: 800;">${data.speed} WPM</span>
        `;
        
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.justifyContent = "space-between";
        li.style.padding = "15px 10px";
        li.style.borderBottom = "1px solid #252525";
        
        list.appendChild(li);
    });

    if (leaderboard.length === 0) {
        list.innerHTML = "<li style='justify-content:center; color:#666; padding: 20px;'>No scores yet. Start typing!</li>";
    }
}

function clearLeaderboard() {
    if(confirm("Are you sure you want to RESET the leaderboard?")) {
        localStorage.removeItem('excel_leaderboard');
        updateLeaderboardUI();
    }
}

// --- 5. PARTICLES ---
(async () => {
  await tsParticles.load("tsparticles", {
    particles: {
      number: { value: 60, density: { enable: true, value_area: 800 } },
      color: { value: "#f3b03d" },
      shape: { type: "circle" },
      opacity: { value: 0.5, random: true },
      size: { value: 3, random: true },
      line_linked: { enable: true, distance: 150, color: "#f3b03d", opacity: 0.2, width: 1 },
      move: { enable: true, speed: 1.5, direction: "none", random: false, straight: false, out_mode: "out", bounce: false }
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: { enable: true, mode: "grab" },
        onclick: { enable: true, mode: "push" },
        resize: true
      },
      modes: { grab: { distance: 140, line_linked: { opacity: 1 } } }
    },
    retina_detect: true
  });
})();