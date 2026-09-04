/* ============================================================
   ZENITH — Professional Athletic & Anime Training System
   Solo Leveling Arise System UI Logic
   app.js
   ============================================================ */

/* ---------------------------------------------------------
   GLOBAL STATE
--------------------------------------------------------- */
let state = {
    username: '',
    password: '',
    rank: 'E-Rank',
    level: 1,
    xp: 0,
    xpMax: 100,
    streak: 1,
    statPoints: 3,
    stats: {
        str: 10,
        agi: 10,
        end: 10,
        sho: 10,
        drb: 10,
        jmp: 10
    },
    age: 18,
    height: '6ft 0in',
    weight: '175 lbs',
    activeTitle: 'E-Rank Trainee',
    voiceEnabled: true,
    quiz: {
        sports: ['Basketball'],
        goals: ['Vertical Leap and Rim Attacks'],
        age: 18,
        height: '6ft 0in',
        weight: '175 lbs'
    },
    activeQuest: null,
    lastCompletedDate: null,
    savedWorkoutImages: {}, // Map of workoutId -> image dataUrl / path
    customQuests: []        // Array of custom generated workouts (permanently stored)
};

let countdownTimerInterval = null;

/* ---------------------------------------------------------
   HOLOGRAM COACHES & THREE.JS STATE
--------------------------------------------------------- */
const HOLOGRAM_COACHES = {
    steph: {
        id: 'steph',
        name: 'COACH SPLASH',
        color: 0x00f3ff,
        greeting: "Welcome trainee. Let me guide your form, footwork, and range precision."
    },
    kobe: {
        id: 'kobe',
        name: 'COACH MAMBA',
        color: 0xfbbf24,
        greeting: "No shortcuts today. Mid-range footwork and relentless mental discipline."
    },
    kyrie: {
        id: 'kyrie',
        name: 'COACH HANDLES',
        color: 0x60a5fa,
        greeting: "Let's get shifty. High-speed ball control and creative rim finishes."
    }
};

let currentCoachId = 'steph';
let coachChatHistory = [];
let threeRenderer = null, threeScene = null, threeCamera = null, hologramMesh = null, particleSystem = null;

/* ---------------------------------------------------------
   APPROVED MENTOR CATALOG WITH IMAGE BANNERS
--------------------------------------------------------- */
const MENTOR_CATALOG = [
    {
        id: 'steph_shooting',
        mentor: 'Steph Curry',
        avatar: 'SC',
        photo: 'steph_swish.png',
        category: 'Shooting & Range Precision',
        title: 'Splash Range 3PT & Form Mastery',
        description: 'Pristine mechanics, quick-release footwork, and deep range perimeter shooting.',
        duration: '14 Days Protocol',
        tag: 'Precision',
        keywords: ['basketball', 'shooting', 'precision'],
        baseTasks: [
            { name: 'Form Shooting Swishes (inside paint)', baseReps: 40 },
            { name: 'Catch-and-Shoot 3-Pointers', baseReps: 40 },
            { name: 'Crossover to Pull-Up Jumpers', baseReps: 25 },
            { name: 'Consecutive Free Throws', baseReps: 20 }
        ]
    },
    {
        id: 'gojo_infinity',
        mentor: 'Gojo Satoru',
        avatar: 'GS',
        photo: 'gojo_upperbody.png',
        category: 'Core & Upper Body Power',
        title: 'Limitless Upper Body & Core Control',
        description: 'Shirtless buff stance — master chest, shoulder, and infinite core stability.',
        duration: '10 Days Protocol',
        tag: 'Upper Body & Core',
        keywords: ['calisthenics', 'chest', 'upper body', 'strength'],
        baseTasks: [
            { name: 'Hollow Body Holds (Secs)', baseReps: 45, isDuration: true },
            { name: 'Single-Leg Balance Tibialis Raises', baseReps: 25 },
            { name: 'Dragon Flag Negative Extensions', baseReps: 10 },
            { name: 'V-Up Core Tuck Crunches', baseReps: 30 }
        ]
    },
    {
        id: 'lebron_power',
        mentor: 'LeBron James',
        avatar: 'LJ',
        photo: 'lebron_dunk.png',
        category: 'Vertical Power & Rim Attack',
        title: "King's Rim Attack & Explosive Power",
        description: 'Relentless conditioning, depth jumps, and unstoppable power driving force.',
        duration: '21 Days Protocol',
        tag: 'Vertical Power',
        keywords: ['basketball', 'vertical', 'plyometrics', 'rim attacks'],
        baseTasks: [
            { name: 'Depth Jumps into Max Explosive Vertical Jumps', baseReps: 12 },
            { name: 'Heavy Rim Attack Drives', baseReps: 15 },
            { name: 'Bulgarian Split Squats (per leg)', baseReps: 15 },
            { name: 'Suicide Shuttle Sprint Reps', baseReps: 6 }
        ]
    },
    {
        id: 'kyrie_handles',
        mentor: 'Kyrie Irving',
        avatar: 'KI',
        photo: 'kyrie_dribble.png',
        category: 'Ball Handling & Ankle Breaker',
        title: 'Wizardry Handles & Shiftiness',
        description: 'High-speed dribble combos, rhythm changes, and elite acrobatics.',
        duration: '14 Days Protocol',
        tag: 'Agility & Dribble',
        keywords: ['basketball', 'ball handling', 'dribble', 'agility'],
        baseTasks: [
            { name: 'Stationary Two-Ball Dribble Burnout (Secs)', baseReps: 45, isDuration: true },
            { name: 'Between-the-Legs to Crossover Combos', baseReps: 50 },
            { name: 'In-and-Out Hesitation Drives', baseReps: 30 },
            { name: 'English Layup Finishing (Both Hands)', baseReps: 20 }
        ]
    },
    {
        id: 'might_guy_eightgates',
        mentor: 'Might Guy',
        avatar: 'MG',
        photo: 'steph_swish.png',
        category: 'Eight Gates Calisthenics',
        title: 'Gate of Opening: Taijutsu Conditioning',
        description: 'Unrelenting physical spirit, push-up pyramids, and dynamic plyometrics.',
        duration: '30 Days Protocol',
        tag: 'Stamina & Strength',
        keywords: ['calisthenics', 'plyometrics', 'stamina'],
        baseTasks: [
            { name: 'Explosive Clapping Push-ups', baseReps: 25 },
            { name: 'Bodyweight Deep Squats', baseReps: 50 },
            { name: 'High-Knee Sprint Burnouts (Secs)', baseReps: 60, isDuration: true },
            { name: 'Plank Hold (Secs)', baseReps: 60, isDuration: true }
        ]
    },
    {
        id: 'deku_oneforall',
        mentor: 'Izuku Midoriya',
        avatar: 'IM',
        photo: 'gojo_upperbody.png',
        category: 'Full Body Power & Calisthenics',
        title: 'One For All: Full Body Full Cowl',
        description: 'Scale bodyweight strength through mass scaling and high-intensity output.',
        duration: '28 Days Protocol',
        tag: 'Full Body',
        keywords: ['calisthenics', 'stamina', 'full body'],
        baseTasks: [
            { name: 'Standard Push-ups', baseReps: 35 },
            { name: 'Sit-up Core Rotations', baseReps: 35 },
            { name: 'Jump Squats', baseReps: 30 },
            { name: 'Vertical Box Jumps', baseReps: 20 }
        ]
    }
];

/* ---------------------------------------------------------
   DYNAMIC SVG BANNER GENERATOR (PER-USER PERSISTENCE)
--------------------------------------------------------- */
function generateWorkoutBannerSVG(title, category, neonColor = '#00f3ff') {
    const svgText = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300">
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#030712"/>
                <stop offset="50%" stop-color="#0e121b"/>
                <stop offset="100%" stop-color="#1e3a8a"/>
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        <rect width="600" height="300" fill="url(#bg)"/>
        <circle cx="500" cy="80" r="140" fill="${neonColor}" opacity="0.15" filter="url(#glow)"/>
        <polygon points="50,40 550,40 500,260 100,260" fill="none" stroke="${neonColor}" stroke-width="2" opacity="0.4"/>
        <text x="50%" y="40%" font-family="Orbitron, sans-serif" font-size="28" font-weight="900" fill="${neonColor}" text-anchor="middle" filter="url(#glow)">${title.substring(0, 24).toUpperCase()}</text>
        <text x="50%" y="65%" font-family="Rajdhani, sans-serif" font-size="20" font-weight="700" fill="#f0f9ff" text-anchor="middle">${category.toUpperCase()}</text>
        <rect x="200" y="220" width="200" height="30" rx="6" fill="${neonColor}" opacity="0.2"/>
        <text x="50%" y="240" font-family="Orbitron, sans-serif" font-size="14" font-weight="700" fill="${neonColor}" text-anchor="middle">ZENITH SYSTEM VERIFIED</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgText);
}

/* ---------------------------------------------------------
   WEB AUDIO API SYNTHESIZER
--------------------------------------------------------- */
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playClickSound() {
    if (!state.voiceEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
}

function playTaskCompleteSound() {
    if (!state.voiceEnabled) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, now);
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.15);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(659.25, now + 0.1);
        gain2.gain.setValueAtTime(0.25, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.3);
    } catch (e) {}
}

function playLevelUpSound() {
    if (!state.voiceEnabled) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + (i * 0.08));
            gain.gain.setValueAtTime(0.3, now + (i * 0.08));
            gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.08) + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + (i * 0.08));
            osc.stop(now + (i * 0.08) + 0.25);
        });
    } catch (e) {}
}

function playGateClearedSound() {
    if (!state.voiceEnabled) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
    } catch (e) {}
}

/* ---------------------------------------------------------
   MATHEMATICAL FORMULAS & HELPER FUNCTIONS
--------------------------------------------------------- */
function parseWeightToLbs(weightStr) {
    if (!weightStr) return 160;
    const str = String(weightStr).toLowerCase();
    const match = str.match(/\d+(\.\d+)?/);
    if (!match) return 160;
    let val = parseFloat(match[0]);
    if (str.includes('kg')) val *= 2.20462;
    return Math.max(80, Math.min(400, val));
}

function getWeightFactor(weightStr) {
    const lbs = parseWeightToLbs(weightStr);
    return Math.min(1.3, Math.max(0.65, 160 / lbs));
}

function getAgeFactor(ageNum) {
    const age = Number(ageNum) || 18;
    if (age < 16) return 0.9;
    if (age > 45) return 0.85;
    return 1.0;
}

function calculateScaledReps(baseReps, level = 1, weightStr = '175 lbs', ageNum = 18, isDuration = false) {
    const wFactor = getWeightFactor(weightStr);
    const aFactor = getAgeFactor(ageNum);
    const lvlMultiplier = 1 + (level - 1) * 0.04;
    const intensityScalar = 0.5;
    
    let raw = baseReps * lvlMultiplier * wFactor * aFactor * intensityScalar;
    
    if (isDuration) {
        const sec = Math.round(raw / 15) * 15;
        return Math.max(10, sec);
    }
    
    if (raw >= 25) return Math.max(5, Math.round(raw / 5) * 5);
    if (raw >= 10) return Math.max(5, Math.round(raw / 5) * 5);
    return Math.max(2, Math.round(raw / 2) * 2);
}

function calculateRankLetter(level) {
    if (level >= 30) return { letter: '👑', label: 'ZENITH MONARCH' };
    if (level >= 25) return { letter: 'S', label: 'S-RANK' };
    if (level >= 20) return { letter: 'A', label: 'A-RANK' };
    if (level >= 15) return { letter: 'B', label: 'B-RANK' };
    if (level >= 10) return { letter: 'C', label: 'C-RANK' };
    if (level >= 5)  return { letter: 'D', label: 'D-RANK' };
    return { letter: 'E', label: 'E-RANK' };
}

function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ---------------------------------------------------------
   DOM INITIALIZATION & EVENT HANDLERS
--------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    setupAuthListeners();
    setupDashboardListeners();
    setupQuizListeners();
    setupStatListeners();
    setupBottomGenerators();
    
    const savedUser = localStorage.getItem('zenith_current_user');
    if (savedUser) {
        try {
            state = { ...state, ...JSON.parse(savedUser) };
            showDashboard();
        } catch (e) {
            showAuth();
        }
    } else {
        showAuth();
    }
}

function showAuth() {
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('dashboard-container').style.display = 'none';
}

function showDashboard() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'block';
    renderDashboard();
    initThreeHologram();
    startCountdownTimer();
}

/* ---------------------------------------------------------
   AUTHENTICATION HANDLERS
--------------------------------------------------------- */
function setupAuthListeners() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    document.getElementById('toggle-to-signup').addEventListener('click', () => {
        playClickSound();
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    });

    document.getElementById('toggle-to-login').addEventListener('click', () => {
        playClickSound();
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        playClickSound();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success) {
                state.username = data.username;
                state.password = password;
                state.level = data.level || 1;
                state.xp = data.xp || 0;
                state.streak = data.streak || 1;
                state.statPoints = data.statPoints !== undefined ? data.statPoints : 3;
                state.stats = data.stats || state.stats;
                state.age = data.age || 18;
                state.height = data.height || '6ft 0in';
                state.weight = data.weight || '175 lbs';
                state.quiz = data.quiz || state.quiz;
                state.savedWorkoutImages = data.savedWorkoutImages || {};
                state.customQuests = data.customQuests || [];
                
                saveLocalUser();
                showDashboard();
            } else {
                alert(data.message || 'Login failed.');
            }
        } catch (err) {
            state.username = username;
            state.password = password;
            saveLocalUser();
            showDashboard();
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        playClickSound();
        const username = document.getElementById('signup-username').value.trim();
        const password = document.getElementById('signup-password').value;
        const age = Number(document.getElementById('signup-age').value) || 18;
        const height = document.getElementById('signup-height').value.trim() || '6ft 0in';
        const weight = document.getElementById('signup-weight').value.trim() || '175 lbs';

        state.username = username;
        state.password = password;
        state.age = age;
        state.height = height;
        state.weight = weight;

        try {
            await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, age, height, weight })
            });
        } catch (err) {}

        saveLocalUser();
        showDashboard();
        openOnboardingQuiz();
    });
}

/* ---------------------------------------------------------
   DASHBOARD & UI RENDERERS
--------------------------------------------------------- */
function renderDashboard() {
    document.getElementById('display-player-name').textContent = state.username || 'TRAINEE';
    const rankInfo = calculateRankLetter(state.level);
    state.rank = rankInfo.label;
    
    document.getElementById('rank-letter').textContent = rankInfo.letter;
    document.getElementById('display-player-title').textContent = `${rankInfo.label} Trainee`;
    document.getElementById('display-biometrics').textContent = `Age: ${state.age} | Height: ${state.height} | Weight: ${state.weight}`;

    state.xpMax = state.level * 100;
    document.getElementById('player-level-val').textContent = state.level;
    document.getElementById('streak-count').textContent = `🔥 ${state.streak} DAY STREAK`;
    
    const pct = Math.min(100, Math.round((state.xp / state.xpMax) * 100));
    document.getElementById('xp-bar-fill').style.width = `${pct}%`;
    document.getElementById('xp-ratio-text').textContent = `${state.xp} / ${state.xpMax} XP`;

    document.getElementById('stat-str').textContent = state.stats.str;
    document.getElementById('stat-agi').textContent = state.stats.agi;
    document.getElementById('stat-end').textContent = state.stats.end;
    document.getElementById('stat-sho').textContent = state.stats.sho;
    document.getElementById('stat-drb').textContent = state.stats.drb;
    document.getElementById('stat-jmp').textContent = state.stats.jmp;

    document.getElementById('available-stat-points').textContent = state.statPoints;
    const statBadge = document.getElementById('stat-points-badge');
    if (state.statPoints > 0) {
        statBadge.style.display = 'inline-block';
        statBadge.textContent = `+${state.statPoints} POINTS`;
    } else {
        statBadge.style.display = 'none';
    }

    document.getElementById('voice-status-text').textContent = state.voiceEnabled ? 'ON' : 'OFF';

    if (!state.activeQuest) {
        generatePersonalizedDailyQuest();
    } else {
        renderActiveQuest();
    }
    renderFilteredMentorCards();
    checkDailyLockStatus();
}

/* ---------------------------------------------------------
   FILTERED WORKOUT CARDS DISPLAY (2-COLUMN GRID)
--------------------------------------------------------- */
function renderFilteredMentorCards() {
    const container = document.getElementById('mentor-cards-container');
    container.innerHTML = '';

    const selectedSports = state.quiz.sports || ['Basketball'];
    const selectedGoals = state.quiz.goals || ['Vertical Leap and Rim Attacks'];
    const targetKeywords = [...selectedSports, ...selectedGoals].map(s => String(s).toLowerCase());

    // Combine standard mentor catalog with permanently stored custom workouts
    const fullCatalog = [...MENTOR_CATALOG, ...state.customQuests];

    const scoredCatalog = fullCatalog.map(prog => {
        let score = 0;
        if (prog.keywords) {
            prog.keywords.forEach(kw => {
                targetKeywords.forEach(tk => {
                    if (tk.includes(kw) || kw.includes(tk)) score += 2;
                });
            });
        }
        return { program: prog, score };
    });

    scoredCatalog.sort((a, b) => b.score - a.score);

    let displayList = scoredCatalog.map(item => item.program);
    const unlockBanner = document.getElementById('streak-unlock-banner');

    if (state.streak < 7) {
        displayList = displayList.slice(0, 4);
        unlockBanner.textContent = `⚡ STREAK PROGRESS: ${state.streak}/7 DAYS (7-Day Streak Unlocks Full Catalog)`;
        unlockBanner.style.color = 'var(--gold-glow)';
    } else {
        unlockBanner.textContent = `⚡ 7-DAY STREAK ACHIEVED! FULL CATALOG UNLOCKED (${fullCatalog.length} PROGRAMS)`;
        unlockBanner.style.color = 'var(--green-success)';
    }

    displayList.forEach(program => {
        const card = document.createElement('div');
        card.className = 'hunter-card';
        
        const firstEx = program.baseTasks ? program.baseTasks[0] : { baseReps: 30, name: 'Exercise', isDuration: false };
        const previewReps = calculateScaledReps(firstEx.baseReps, state.level, state.weight, state.age, firstEx.isDuration);
        const unit = firstEx.isDuration ? 'secs' : 'reps';

        // Check if image banner exists in state.savedWorkoutImages or default photo
        const photoUrl = state.savedWorkoutImages[program.id] || program.photo || generateWorkoutBannerSVG(program.title, program.category);

        card.innerHTML = `
            <img src="${photoUrl}" alt="${program.title}" class="hunter-card-photo" onerror="this.src='steph_swish.png';">
            <div class="hunter-card-header">
                <div class="mentor-avatar">${program.avatar || 'AZ'}</div>
                <div class="mentor-info">
                    <h3>${program.mentor}</h3>
                    <div class="category-badge">${program.category}</div>
                </div>
            </div>
            <div class="hunter-card-body">
                <h4 style="font-family: 'Orbitron'; font-size: 0.95rem; color: #fff; margin-bottom: 6px;">${program.title}</h4>
                <p>${program.description}</p>
                <div class="card-tags">
                    <span class="card-tag">${program.tag || 'Arise'}</span>
                    <span class="card-tag">${program.duration || '14 Days'}</span>
                    <span class="card-tag" style="border-color: var(--cyan-glow); color: var(--cyan-glow);">
                        Scaled: ${previewReps} ${unit}
                    </span>
                </div>
            </div>
            <button class="btn-primary btn-enroll-program" data-id="${program.id}" style="padding: 8px; font-size: 0.85rem;">
                ⚡ SELECT PROGRAM
            </button>
        `;
        container.appendChild(card);
    });

    document.querySelectorAll('.btn-enroll-program').forEach(btn => {
        btn.addEventListener('click', (e) => {
            playClickSound();
            const progId = e.currentTarget.dataset.id;
            const fullCatalog = [...MENTOR_CATALOG, ...state.customQuests];
            const prog = fullCatalog.find(p => p.id === progId);
            if (prog) {
                setQuestFromProgram(prog);
            }
        });
    });
}

function setQuestFromProgram(program) {
    const tasks = (program.baseTasks || []).map(t => {
        const scaled = calculateScaledReps(t.baseReps, state.level, state.weight, state.age, t.isDuration);
        const unit = t.isDuration ? 'Secs' : 'Reps';
        return {
            text: `${scaled} ${unit} - ${t.name}`,
            done: false
        };
    });

    state.activeQuest = {
        title: `[QUEST]: ${program.title.toUpperCase()}`,
        description: `"${program.mentor}: Complete this protocol calibrated for your body biometrics."`,
        tasks: tasks.length > 0 ? tasks : [
            { text: '30 Reps - Bodyweight Explosive Squats', done: false },
            { name: '45 Secs - Plank Core Hold', done: false }
        ],
        xpReward: 100 + (state.level * 20)
    };

    saveLocalUser();
    renderActiveQuest();
}

function generatePersonalizedDailyQuest() {
    let chosenProg = MENTOR_CATALOG[0];
    const sports = state.quiz.sports || [];
    const goals = state.quiz.goals || [];
    const combined = [...sports, ...goals].join(' ').toLowerCase();

    if (combined.includes('chest') || combined.includes('upper body') || combined.includes('gojo')) {
        chosenProg = MENTOR_CATALOG.find(p => p.id === 'gojo_infinity') || MENTOR_CATALOG[1];
    } else if (combined.includes('vertical') || combined.includes('rim')) {
        chosenProg = MENTOR_CATALOG.find(p => p.id === 'lebron_power') || MENTOR_CATALOG[2];
    } else if (combined.includes('handling') || combined.includes('dribble')) {
        chosenProg = MENTOR_CATALOG.find(p => p.id === 'kyrie_handles') || MENTOR_CATALOG[3];
    } else if (combined.includes('shooting')) {
        chosenProg = MENTOR_CATALOG.find(p => p.id === 'steph_shooting') || MENTOR_CATALOG[0];
    }

    setQuestFromProgram(chosenProg);
}

function renderActiveQuest() {
    if (!state.activeQuest) return;

    document.getElementById('active-quest-title').textContent = state.activeQuest.title;
    document.getElementById('active-quest-desc').textContent = state.activeQuest.description;
    document.getElementById('active-quest-xp').textContent = `+${state.activeQuest.xpReward} XP`;

    const tasksList = document.getElementById('active-quest-tasks-list');
    tasksList.innerHTML = '';

    const isLocked = state.lastCompletedDate === getTodayDateString();

    state.activeQuest.tasks.forEach((task, idx) => {
        const item = document.createElement('div');
        item.className = `task-item ${task.done ? 'completed' : ''}`;
        item.innerHTML = `
            <input type="checkbox" class="task-checkbox" data-idx="${idx}" ${task.done ? 'checked' : ''} ${isLocked ? 'disabled' : ''}>
            <span>${task.text}</span>
        `;
        tasksList.appendChild(item);
    });

    document.querySelectorAll('.task-checkbox').forEach(box => {
        box.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            state.activeQuest.tasks[idx].done = e.target.checked;
            if (e.target.checked) playTaskCompleteSound();
            saveLocalUser();
            renderActiveQuest();
        });
    });
}

/* ---------------------------------------------------------
   DAILY MIDNIGHT (12:00 AM) LOCK CHECK & COUNTDOWN
--------------------------------------------------------- */
function checkDailyLockStatus() {
    const isLocked = state.lastCompletedDate === getTodayDateString();
    const submitBtn = document.getElementById('btn-complete-quest');
    const lockBanner = document.getElementById('quest-lock-banner');

    if (isLocked) {
        submitBtn.disabled = true;
        submitBtn.textContent = '🔒 QUEST COMPLETED TODAY (LOCKED)';
        lockBanner.style.display = 'block';
    } else {
        submitBtn.disabled = false;
        submitBtn.textContent = '🏆 SUBMIT & CLAIM DAILY QUEST REWARD';
        lockBanner.style.display = 'none';
    }
}

function startCountdownTimer() {
    if (countdownTimerInterval) clearInterval(countdownTimerInterval);

    countdownTimerInterval = setInterval(() => {
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const diffMs = tomorrow - now;
        if (diffMs <= 0) {
            state.lastCompletedDate = null;
            checkDailyLockStatus();
            return;
        }

        const hrs = String(Math.floor(diffMs / (1000 * 60 * 60))).padStart(2, '0');
        const mins = String(Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        const secs = String(Math.floor((diffMs % (1000 * 60)) / 1000)).padStart(2, '0');

        const timerText = document.getElementById('countdown-timer-text');
        if (timerText) {
            timerText.textContent = `UNLOCKS IN: ${hrs}:${mins}:${secs}`;
        }
    }, 1000);
}

/* ---------------------------------------------------------
   THREE.JS 3D HOLOGRAM STAGE & LIVE COACH CHAT
--------------------------------------------------------- */
function initThreeHologram() {
    const canvas = document.getElementById('hologram-canvas');
    if (!canvas || threeRenderer) return;

    try {
        const width = canvas.clientWidth || 300;
        const height = canvas.clientHeight || 280;

        threeScene = new THREE.Scene();
        threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        threeCamera.position.z = 5;

        threeRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        threeRenderer.setSize(width, height);
        threeRenderer.setPixelRatio(window.devicePixelRatio);

        // Hologram Mesh
        const geometry = new THREE.IcosahedronGeometry(1.2, 2);
        const material = new THREE.MeshBasicMaterial({
            color: HOLOGRAM_COACHES[currentCoachId].color,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        hologramMesh = new THREE.Mesh(geometry, material);
        threeScene.add(hologramMesh);

        // Floating Particles
        const particleGeo = new THREE.BufferGeometry();
        const particleCount = 150;
        const posArray = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 6;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particleMat = new THREE.PointsMaterial({
            size: 0.04,
            color: 0x00f3ff,
            transparent: true,
            opacity: 0.6
        });
        particleSystem = new THREE.Points(particleGeo, particleMat);
        threeScene.add(particleSystem);

        function animate() {
            requestAnimationFrame(animate);
            if (hologramMesh) {
                hologramMesh.rotation.y += 0.01;
                hologramMesh.rotation.x += 0.005;
            }
            if (particleSystem) {
                particleSystem.rotation.y -= 0.003;
            }
            threeRenderer.render(threeScene, threeCamera);
        }
        animate();
    } catch (e) {}

    setupCoachChatListeners();
}

function updateCoachHologramColor() {
    if (hologramMesh) {
        hologramMesh.material.color.setHex(HOLOGRAM_COACHES[currentCoachId].color);
    }
}

function setupCoachChatListeners() {
    document.querySelectorAll('.coach-select-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            playClickSound();
            document.querySelectorAll('.coach-select-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentCoachId = e.currentTarget.dataset.coach;
            updateCoachHologramColor();

            const coach = HOLOGRAM_COACHES[currentCoachId];
            appendCoachChatMessage(coach.name, coach.greeting);
        });
    });

    const sendBtn = document.getElementById('btn-send-coach-chat');
    const inputEl = document.getElementById('coach-chat-input');

    const handleSend = async () => {
        const msg = inputEl.value.trim();
        if (!msg) return;
        playClickSound();
        appendUserChatMessage(msg);
        inputEl.value = '';

        try {
            const res = await fetch('/api/coach-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coachId: currentCoachId,
                    message: msg
                })
            });
            const data = await res.json();
            const coach = HOLOGRAM_COACHES[currentCoachId];
            if (data.success) {
                appendCoachChatMessage(coach.name, data.reply);
            } else {
                appendCoachChatMessage(coach.name, "Let's stay focused on your physical training output. What drill are we running next?");
            }
        } catch (err) {
            const coach = HOLOGRAM_COACHES[currentCoachId];
            appendCoachChatMessage(coach.name, "Keep working hard. Precision and repetition lead to mastery!");
        }
    };

    sendBtn.addEventListener('click', handleSend);
    inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
}

function appendUserChatMessage(text) {
    const chatLog = document.getElementById('coach-chat-log');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg user';
    msgDiv.textContent = text;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function appendCoachChatMessage(name, text) {
    const chatLog = document.getElementById('coach-chat-log');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg coach';
    msgDiv.innerHTML = `<strong>${name}:</strong> ${text}`;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

/* ---------------------------------------------------------
   STACKED BOTTOM GENERATORS (AI & MANUAL - PERMANENTLY STORED)
--------------------------------------------------------- */
function setupBottomGenerators() {
    // AI Text Generator Button
    document.getElementById('btn-generate-ai-quest').addEventListener('click', async () => {
        playClickSound();
        const promptInput = document.getElementById('custom-prompt-input').value.trim();
        if (!promptInput) return;

        const statusEl = document.getElementById('ai-gen-status');
        statusEl.textContent = '⚡ GENERATING & SAVING WORKOUT...';

        try {
            const res = await fetch('/api/generate-from-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    promptText: promptInput,
                    username: state.username,
                    level: state.level,
                    weight: state.weight,
                    age: state.age
                })
            });
            const data = await res.json();
            if (data.success) {
                statusEl.textContent = '✨ WORKOUT PERMANENTLY SAVED TO CATALOG!';
                setTimeout(() => statusEl.textContent = '', 3000);

                const newId = 'custom_ai_' + Date.now();
                const bannerSvg = generateWorkoutBannerSVG(data.title || promptInput, 'AI Custom');
                state.savedWorkoutImages[newId] = bannerSvg;

                const newProg = {
                    id: newId,
                    mentor: 'AI System Mentor',
                    avatar: 'AI',
                    photo: bannerSvg,
                    category: 'AI Generated',
                    title: data.title || promptInput.toUpperCase(),
                    description: data.description || '"System AI: Custom protocol generated for your biometrics."',
                    duration: 'Custom Protocol',
                    tag: 'AI Custom',
                    keywords: [promptInput.toLowerCase()],
                    baseTasks: (data.tasks || []).map(t => ({ name: t, baseReps: 25, isDuration: false }))
                };

                state.customQuests.push(newProg);
                setQuestFromProgram(newProg);
                saveLocalUser();
                renderFilteredMentorCards();
            }
        } catch (err) {
            statusEl.textContent = '⚡ Saved local fallback workout.';
            setTimeout(() => statusEl.textContent = '', 3000);
        }
    });

    // Manual Creator Button
    document.getElementById('btn-create-manual-workout').addEventListener('click', () => {
        playClickSound();
        const title = document.getElementById('manual-title').value.trim();
        const mentor = document.getElementById('manual-mentor').value.trim() || 'Custom Coach';
        const category = document.getElementById('manual-category').value.trim() || 'Manual Training';
        const duration = document.getElementById('manual-duration').value.trim() || '14 Days';
        const tasksStr = document.getElementById('manual-tasks').value.trim();

        if (!title || !tasksStr) {
            alert('Please enter a workout title and task list!');
            return;
        }

        const taskItems = tasksStr.split(',').map(t => ({
            name: t.trim(),
            baseReps: 25,
            isDuration: t.toLowerCase().includes('sec') || t.toLowerCase().includes('min')
        }));

        const newId = 'custom_manual_' + Date.now();
        const bannerSvg = generateWorkoutBannerSVG(title, category, '#3b82f6');
        state.savedWorkoutImages[newId] = bannerSvg;

        const newProg = {
            id: newId,
            mentor: mentor,
            avatar: mentor.substring(0, 2).toUpperCase(),
            photo: bannerSvg,
            category: category,
            title: title,
            description: `"${mentor}: Manual training protocol created."`,
            duration: duration,
            tag: 'Manual Custom',
            keywords: [category.toLowerCase(), title.toLowerCase()],
            baseTasks: taskItems
        };

        state.customQuests.push(newProg);
        setQuestFromProgram(newProg);
        saveLocalUser();
        renderFilteredMentorCards();

        document.getElementById('manual-title').value = '';
        document.getElementById('manual-mentor').value = '';
        document.getElementById('manual-category').value = '';
        document.getElementById('manual-duration').value = '';
        document.getElementById('manual-tasks').value = '';

        alert('✨ Manual Workout Permanently Saved to Catalog!');
    });
}

/* ---------------------------------------------------------
   DASHBOARD LISTENERS & QUEST SUBMISSION
--------------------------------------------------------- */
function setupDashboardListeners() {
    document.getElementById('voice-toggle-btn').addEventListener('click', () => {
        state.voiceEnabled = !state.voiceEnabled;
        playClickSound();
        saveLocalUser();
        renderDashboard();
    });

    document.getElementById('trigger-quiz-btn').addEventListener('click', () => {
        playClickSound();
        openOnboardingQuiz();
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        playClickSound();
        localStorage.removeItem('zenith_current_user');
        showAuth();
    });

    document.getElementById('btn-complete-quest').addEventListener('click', () => {
        playClickSound();
        if (!state.activeQuest) return;

        if (state.lastCompletedDate === getTodayDateString()) {
            alert('Today\'s quest is already completed! Next day quest unlocks at 12:00 AM midnight.');
            return;
        }

        const allDone = state.activeQuest.tasks.every(t => t.done);
        if (!allDone) {
            alert('Complete all task checkboxes before submitting quest!');
            return;
        }

        const xpEarned = state.activeQuest.xpReward || (100 + state.level * 20);
        state.xp += xpEarned;
        state.streak += 1;
        state.lastCompletedDate = getTodayDateString();

        if (state.xp >= state.xpMax) {
            state.xp -= state.xpMax;
            state.level += 1;
            state.statPoints += 3;
            state.xpMax = state.level * 100;
            
            playLevelUpSound();
            openLevelUpModal();
        } else {
            playTaskCompleteSound();
        }

        saveLocalUser();
        renderDashboard();
    });

    document.getElementById('btn-simulate-gate').addEventListener('click', () => {
        playGateClearedSound();
        openGateClearedModal();
    });
}

/* ---------------------------------------------------------
   STAT POINT ALLOCATOR LISTENERS
--------------------------------------------------------- */
function setupStatListeners() {
    document.querySelectorAll('.btn-add-stat').forEach(btn => {
        btn.addEventListener('click', (e) => {
            playClickSound();
            if (state.statPoints <= 0) return;
            const statKey = e.currentTarget.dataset.stat;
            if (state.stats[statKey] !== undefined) {
                state.stats[statKey] += 1;
                state.statPoints -= 1;
                saveLocalUser();
                renderDashboard();
            }
        });
    });
}

/* ---------------------------------------------------------
   ONBOARDING QUIZ MODAL FLOW (QUIZ LLM GENERATION)
--------------------------------------------------------- */
function openOnboardingQuiz() {
    document.getElementById('onboarding-quiz-modal').style.display = 'flex';
    showQuizStep(1);
}

function closeOnboardingQuiz() {
    document.getElementById('onboarding-quiz-modal').style.display = 'none';
}

function showQuizStep(stepNum) {
    document.querySelectorAll('.quiz-step').forEach((step, idx) => {
        if (idx + 1 === stepNum) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    document.querySelectorAll('.stepper-dot').forEach((dot, idx) => {
        if (idx + 1 === stepNum) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function setupQuizListeners() {
    document.querySelectorAll('#quiz-step-1 .quiz-option-card').forEach(card => {
        card.addEventListener('click', (e) => {
            playClickSound();
            e.currentTarget.classList.toggle('selected');
        });
    });

    document.getElementById('btn-quiz-next-1').addEventListener('click', () => {
        playClickSound();
        const selectedEls = document.querySelectorAll('#quiz-step-1 .quiz-option-card.selected');
        const sports = Array.from(selectedEls).map(el => el.dataset.sport);
        state.quiz.sports = sports.length > 0 ? sports : ['Basketball'];
        showQuizStep(2);
    });

    document.getElementById('btn-quiz-next-2').addEventListener('click', () => {
        playClickSound();
        state.age = Number(document.getElementById('quiz-age').value) || 18;
        state.height = document.getElementById('quiz-height').value.trim() || '6ft 0in';
        state.weight = document.getElementById('quiz-weight').value.trim() || '175 lbs';
        state.quiz.age = state.age;
        state.quiz.height = state.height;
        state.quiz.weight = state.weight;
        showQuizStep(3);
    });

    document.querySelectorAll('#quiz-step-3 .quiz-option-card').forEach(card => {
        card.addEventListener('click', (e) => {
            playClickSound();
            e.currentTarget.classList.toggle('selected');
        });
    });

    document.getElementById('btn-finish-quiz').addEventListener('click', async () => {
        playLevelUpSound();
        const selectedEls = document.querySelectorAll('#quiz-step-3 .quiz-option-card.selected');
        const goals = Array.from(selectedEls).map(el => el.dataset.goal);
        state.quiz.goals = goals.length > 0 ? goals : ['Vertical Leap and Rim Attacks'];

        closeOnboardingQuiz();

        // Trigger Quiz LLM Workout Generation tailored to biometrics (Age/Weight/Goals)
        try {
            const res = await fetch('/api/generate-daily-quest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: state.username,
                    sport: state.quiz.sports.join(', '),
                    goal: state.quiz.goals.join(', '),
                    level: state.level,
                    weight: state.weight,
                    age: state.age
                })
            });
            const data = await res.json();
            if (data.success && data.tasks) {
                state.activeQuest = {
                    title: data.title || '[QUIZ CUSTOM QUEST]: BIOMETRIC PROTOCOL',
                    description: data.description || '"Mentor: Protocol calibrated for your exact age and biometrics."',
                    tasks: data.tasks.map(t => ({ text: t, done: false })),
                    xpReward: data.rewardXp || (100 + state.level * 20)
                };
            } else {
                generatePersonalizedDailyQuest();
            }
        } catch (err) {
            generatePersonalizedDailyQuest();
        }

        saveLocalUser();
        renderDashboard();
    });
}

/* ---------------------------------------------------------
   MODAL DIALOGS (LEVEL UP & BREAKTHROUGH RAID)
--------------------------------------------------------- */
function openLevelUpModal() {
    document.getElementById('popup-new-level').textContent = state.level;
    document.getElementById('level-up-modal').style.display = 'flex';
}

document.getElementById('btn-close-level-up').addEventListener('click', () => {
    playClickSound();
    document.getElementById('level-up-modal').style.display = 'none';
});

function openGateClearedModal() {
    document.getElementById('gate-cleared-modal').style.display = 'flex';
}

document.getElementById('btn-close-gate').addEventListener('click', () => {
    playClickSound();
    state.xp += 250;
    if (state.xp >= state.xpMax) {
        state.xp -= state.xpMax;
        state.level += 1;
        state.statPoints += 3;
        state.xpMax = state.level * 100;
        playLevelUpSound();
    }
    document.getElementById('gate-cleared-modal').style.display = 'none';
    saveLocalUser();
    renderDashboard();
});

/* ---------------------------------------------------------
   LOCAL STORAGE & SERVER SYNC
--------------------------------------------------------- */
function saveLocalUser() {
    localStorage.setItem('zenith_current_user', JSON.stringify(state));

    if (state.username) {
        fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: state.username,
                level: state.level,
                xp: state.xp,
                streak: state.streak,
                statPoints: state.statPoints,
                stats: state.stats,
                age: state.age,
                height: state.height,
                weight: state.weight,
                quiz: state.quiz,
                activeQuest: state.activeQuest,
                lastCompletedDate: state.lastCompletedDate,
                savedWorkoutImages: state.savedWorkoutImages,
                customQuests: state.customQuests
            })
        }).catch(() => {});
    }
}
