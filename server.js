import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.GEMINI_API_KEY;
let ai = null;

if (API_KEY) {
    try {
        ai = new GoogleGenAI({ apiKey: API_KEY });
        console.log('[GEMINI] Gemini API client initialized for ZENITH System.');
    } catch (e) {
        console.error('[GEMINI] Failed to initialize client:', e.message);
    }
} else {
    console.warn('[GEMINI] No GEMINI_API_KEY set — running on fallback quest generator only.');
}

const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '{}');
    try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch { return {}; }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Convert weight input string into lbs
function getWeightInLbs(weightInput) {
    if (!weightInput) return 160;
    const match = String(weightInput).match(/\d+(\.\d+)?/);
    if (!match) return 160;
    let val = parseFloat(match[0]);
    if (String(weightInput).toLowerCase().includes('kg')) val *= 2.20462;
    return Math.max(80, Math.min(400, val));
}

// Calculate Weight & Age Rep Scaling Factor
function getWeightScaleFactor(weightInput) {
    const lbs = getWeightInLbs(weightInput);
    return Math.min(1.3, Math.max(0.65, 160 / lbs));
}

// Shared Gemini call used by both prompt & daily quest endpoints
async function askGeminiForQuest({ sport, goal, mentor, level, weight, age, promptText }) {
    if (!ai) return null;

    const querySubject = promptText || `${sport || 'Basketball'} training focused on ${goal || 'Vertical & Rim Attacks'}`;
    const userWeightLbs = getWeightInLbs(weight);

    const prompt = `You are an elite athletic & anime training mentor (${mentor || 'Izuku Midoriya'}). Create a custom workout quest for: "${querySubject}". ` +
        `Player Biometrics -> Age: ${age || 18}, Weight: ${userWeightLbs} lbs, Level: ${level || 1}, Sport Focus: ${sport || 'Basketball'}, Target Goal: ${goal || 'Vertical Leap'}. ` +
        `Respond ONLY with raw JSON, no markdown code fences, no commentary, in exactly this shape: ` +
        `{"title": "Custom Title based on Quiz Goal", "description": "In-character mentor line matching user sport", ` +
        `"workout": "Title\\n- Task 1\\n- Task 2", "tasks": ["Task 1 with reps", "Task 2 with reps"], "rewardXp": 140}`;

    try {
        const resp = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt });
        const raw = (resp.text || resp.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
        const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

        const match = cleaned.match(/\{[\s\S]*\}/);
        const jsonText = match ? match[0] : cleaned;

        const parsed = JSON.parse(jsonText);

        if (!parsed.title || !Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
            console.error('[GEMINI] Response missing required fields:', jsonText.slice(0, 300));
            return null;
        }

        if (!parsed.workout) parsed.workout = `${parsed.title}\n` + parsed.tasks.map(t => `- ${t}`).join('\n');
        if (!parsed.rewardXp) parsed.rewardXp = 100 + (Number(level) || 1) * 20;

        return parsed;
    } catch (e) {
        console.error('[GEMINI] Quest generation failed, using fallback:', e.message);
        return null;
    }
}

// Fallback Mentor Quest Generator with Weight & Age Tailoring
function generateFallbackQuest(mentor = 'Izuku Midoriya', sport = 'Basketball', goal = 'Vertical Leap', level = 1, weight = '175 lbs', age = 18) {
    const xpReward = 100 + (level * 20);
    const m = (mentor || 'Izuku Midoriya').toLowerCase();
    const s = (sport || 'Basketball').toLowerCase();
    const g = (goal || 'Vertical').toLowerCase();
    const wFactor = getWeightScaleFactor(weight);

    if (m.includes('curry') || g.includes('shooting') || s.includes('shooting')) {
        const swishes = Math.round(40 * (1 + (level - 1) * 0.04) * wFactor * 0.5);
        const threes = Math.round(40 * (1 + (level - 1) * 0.04) * wFactor * 0.5);
        const combos = Math.round(50 * (1 + (level - 1) * 0.04) * wFactor * 0.5);
        return {
            title: `[CURRY FLUIDITY] Splash Range & Form Precision - Lvl ${level}`,
            description: `"${mentor}: Distance doesn't matter if your mechanics and footwork are pristine. Focus on quick release!"`,
            workout: `[QUEST BRIEFING]: Precision Shooting & Dribble Controls\n- ${swishes} Form Shooting Swishes\n- ${threes} Catch-and-Shoot 3-Pointers\n- ${combos} Crossover Combo Dribbles\n- 25 Free Throws`,
            tasks: [
                `${swishes} Form Shooting Swishes (inside paint)`,
                `${threes} Catch-and-Shoot 3-Pointers`,
                `${combos} Crossover Combo Dribbles`,
                `25 Free Throws`
            ],
            rewardXp: xpReward
        };
    }

    if (m.includes('lebron') || g.includes('vertical') || s.includes('plyometrics')) {
        const depthJumps = Math.round(12 * (1 + (level - 1) * 0.04) * wFactor * 0.5);
        const rimAttacks = Math.round(15 * (1 + (level - 1) * 0.04) * wFactor * 0.5);
        const squats = Math.round(15 * (1 + (level - 1) * 0.04) * wFactor * 0.5);
        return {
            title: `[KING'S DOMAIN] Explosive Rim Attack & Power - Lvl ${level}`,
            description: `"${mentor}: Greatness requires relentless conditioning and peak physical dominance."`,
            workout: `[QUEST BRIEFING]: Power & Vertical Force\n- ${depthJumps} Depth Jumps into Explosive Max Vertical Jumps\n- ${rimAttacks} Heavy Rim Attack Drives\n- ${squats} Bulgarian Split Squats\n- 4 Reps x 40 Yard Shuttle Sprints`,
            tasks: [
                `${depthJumps} Depth Jumps into Explosive Max Vertical Jumps`,
                `${rimAttacks} Heavy Rim Attack Drives`,
                `${squats} Bulgarian Split Squats`,
                `4 Reps x 40 Yard Shuttle Sprints`
            ],
            rewardXp: xpReward
        };
    }

    // Default Bodyweight / Deku Fallback
    const pushups = Math.round(35 * (1 + (level - 1) * 0.04) * wFactor * 0.5);
    const situps = Math.round(35 * (1 + (level - 1) * 0.04) * wFactor * 0.5);
    const squats = Math.round(40 * (1 + (level - 1) * 0.04) * wFactor * 0.5);

    return {
        title: `[ESSENTIAL CONDITIONING] Tailored for ${sport} - Lvl ${level}`,
        description: `"${mentor}: Execute the physical conditioning protocol calibrated for your body biometrics. PLUS ULTRA!"`,
        workout: `[QUEST BRIEFING]: Scaled Protocol\n- ${pushups} Push-ups\n- ${situps} Sit-ups\n- ${squats} Bodyweight Squats\n- 20 Vertical Box Jumps`,
        tasks: [
            `${pushups} Push-ups (Mass-Scaled)`,
            `${situps} Sit-ups (Mass-Scaled)`,
            `${squats} Bodyweight Squats (Mass-Scaled)`,
            `20 Vertical Box Jumps`
        ],
        rewardXp: xpReward
    };
}

function sendJson(res, status, data) {
    res.writeHead(status, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
    const pathname = parsedUrl.pathname;

    if (req.method === 'OPTIONS') return sendJson(res, 204, {});

    // --- API ROUTES ---

    // Auth Login & Signup
    if ((pathname === '/api/login' || pathname === '/api/signup') && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            try {
                const { username, password, age = 18, height = '', weight = '' } = JSON.parse(body || '{}');
                if (!username || !password) return sendJson(res, 400, { success: false, message: 'Player name and password required.' });

                const users = loadUsers();

                if (pathname === '/api/login') {
                    const user = users[username];
                    if (!user) return sendJson(res, 400, { success: false, message: 'Player not found. Please Register first.' });
                    if (user.password && user.password !== password) return sendJson(res, 401, { success: false, message: 'Invalid Passcode.' });

                    return sendJson(res, 200, {
                        success: true,
                        username: user.username,
                        level: user.level || 1,
                        xp: user.xp || 0,
                        streak: user.streak || 1,
                        statPoints: user.statPoints !== undefined ? user.statPoints : 3,
                        stats: user.stats || { str: 10, agi: 10, end: 10, sho: 10, drb: 10, jmp: 10 },
                        age: user.age || 18,
                        height: user.height || '',
                        weight: user.weight || '',
                        quiz: user.quiz || {}
                    });
                } else { // Signup
                    if (users[username]) return sendJson(res, 400, { success: false, message: 'Player name already taken! Use Login.' });

                    const newUser = {
                        username, password,
                        age: Number(age) || 18, height, weight,
                        level: 1, xp: 0, streak: 1, statPoints: 3,
                        stats: { str: 10, agi: 10, end: 10, sho: 10, drb: 10, jmp: 10 },
                        quiz: { sport: 'Basketball', goal: 'Vertical Leap and Rim Attacks', age, height, weight }
                    };
                    users[username] = newUser;
                    saveUsers(users);

                    return sendJson(res, 200, { success: true, ...newUser });
                }
            } catch (err) {
                return sendJson(res, 500, { success: false, message: err.message });
            }
        });
        return;
    }

    // Save Progress
    if (pathname === '/api/save' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                const { username } = data;
                if (!username) return sendJson(res, 400, { success: false, message: 'Username required.' });

                const users = loadUsers();
                users[username] = { ...users[username], ...data };
                saveUsers(users);

                return sendJson(res, 200, { success: true, message: 'Progress Saved.' });
            } catch (err) {
                return sendJson(res, 500, { success: false, message: err.message });
            }
        });
        return;
    }

    // AI Generator from Prompt
    if (pathname === '/api/generate-from-prompt' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', async () => {
            try {
                const { promptText, username, level = 1, weight = '175 lbs', age = 18, sport = 'Basketball', goal = 'Vertical' } = JSON.parse(body || '{}');
                
                let questData = await askGeminiForQuest({
                    promptText, sport, goal, mentor: 'Izuku Midoriya', level, weight, age
                });

                if (!questData) questData = generateFallbackQuest('Izuku Midoriya', sport, goal, level, weight, age);
                return sendJson(res, 200, { success: true, ...questData });
            } catch (err) {
                return sendJson(res, 500, { success: false, message: err.message });
            }
        });
        return;
    }

    // Generate Daily Quest
    if ((pathname === '/api/generate-daily-quest' || pathname === '/api/generate-quest') && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', async () => {
            try {
                const { username, mentor = 'Izuku Midoriya', sport = 'Basketball', goal = 'Vertical', level = 1, weight = '175 lbs', age = 18 } = JSON.parse(body || '{}');
                
                let questData = await askGeminiForQuest({
                    sport, goal, mentor, level, weight, age
                });

                if (!questData) questData = generateFallbackQuest(mentor, sport, goal, level, weight, age);

                return sendJson(res, 200, { success: true, ...questData });
            } catch (err) {
                const fb = generateFallbackQuest('Izuku Midoriya', 'Basketball', 'Vertical', 1, '175 lbs', 18);
                return sendJson(res, 200, { success: true, ...fb });
            }
        });
        return;
    }

    // --- STATIC FILE SERVING ---
    let reqPath = pathname === '/' ? 'index.html' : pathname.substring(1);
    let filePath = path.join(__dirname, reqPath);
    
    // Fallback to public / Public if not in root
    if (!fs.existsSync(filePath)) {
        if (fs.existsSync(path.join(__dirname, 'public', reqPath))) {
            filePath = path.join(__dirname, 'public', reqPath);
        } else if (fs.existsSync(path.join(__dirname, 'Public', reqPath))) {
            filePath = path.join(__dirname, 'Public', reqPath);
        }
    }

    const ext = path.extname(filePath);
    let cType = 'text/html';
    if (ext === '.js') cType = 'text/javascript';
    else if (ext === '.css') cType = 'text/css';
    else if (ext === '.json') cType = 'application/json';
    else if (ext === '.png') cType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') cType = 'image/jpeg';
    else if (ext === '.ico') cType = 'image/x-icon';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - File Not Found</h1>');
        } else {
            res.writeHead(200, { 'Content-Type': cType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`⚡ ZENITH System Server running at http://localhost:${PORT}`);
});
