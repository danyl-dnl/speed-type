// --- 1. FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyD5uPzZrN6Rxjidtz7M6LlAiNhw9nVJP3Q",
  authDomain: "speed-type-407bd.firebaseapp.com",
  databaseURL: "https://speed-type-407bd-default-rtdb.firebaseio.com/",
  projectId: "speed-type-407bd",
  storageBucket: "speed-type-407bd.firebasestorage.app",
  messagingSenderId: "353699668484",
  appId: "1:353699668484:web:d7bad1dc022cb582a10b51",
  measurementId: "G-KNCG5RDJ8N"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// --- 2. GAME VARIABLES ---
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

// --- 3. FLOW CONTROL ---

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
    
    // Reset Game State
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
    quote.split('').forEach(char => {
        const span = document.createElement('span');
        span.innerText = char;
        quoteDisplay.appendChild(span);
    });
    quoteInput.value = '';
}

// --- 4. TYPING LOGIC ---

quoteInput.addEventListener('input', () => {
    if (isGameSaved) return;

    const arrayQuote = quoteDisplay.querySelectorAll('span');
    const arrayValue = quoteInput.value.split('');
    
    if (!isPlaying && arrayValue.length > 0) {
        isPlaying = true;
        startTime = new Date();
        startTimer();
    }

    let correctChars = 0;

    arrayQuote.forEach((span, i) => {
        const char = arrayValue[i];
        if (char == null) {
            span.className = '';
        } else if (char === span.innerText) {
            span.className = 'correct';
            correctChars++;
        } else {
            span.className = 'incorrect';
        }
    });

    const isFinished = Array.from(arrayQuote).every(s => s.classList.contains('correct'));
    if (isFinished && arrayValue.length === arrayQuote.length) {
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
    
    saveToFirebase(currentPlayer, finalWpm, finalAcc);
}

function closeResult() {
    document.getElementById('result-overlay').style.display = 'none';
    document.querySelector('.leaderboard-section').scrollIntoView({ behavior: 'smooth' });
}

// --- 5. FIREBASE OPERATIONS ---

function saveToFirebase(name, wpm, acc) {
    if (!name) name = "Anonymous";
    
    const scoreData = {
        username: name,
        speed: parseInt(wpm),
        accuracy: acc,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    database.ref('leaderboard/').push(scoreData)
        .then(() => console.log("Score Saved"))
        .catch((e) => console.error(e));
}

// --- LEADERBOARD ---
database.ref('leaderboard/').orderByChild('speed').limitToLast(5).on('value', (snapshot) => {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = "";
    let entries = [];
    
    snapshot.forEach(child => {
        const data = child.val();
        if (data) entries.push(data);
    });
    
    entries.sort((a, b) => b.speed - a.speed);
    
    entries.forEach((data, index) => {
        const li = document.createElement('li');
        const displayName = data.username ? data.username.toUpperCase() : "UNKNOWN";
        const displayAcc = data.accuracy || "100%";
        
        // --- UI STRUCTURE ---
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

    if (entries.length === 0) {
        list.innerHTML = "<li style='justify-content:center; color:#666; padding: 20px;'>No scores yet. Start typing!</li>";
    }
});

// --- 6. PARTICLES ---
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