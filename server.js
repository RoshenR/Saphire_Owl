const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const STATS_FILE = path.join(__dirname, 'stats.json');

// Middleware pour accepter les requêtes depuis n'importe quelle origine
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});

app.use(bodyParser.json());

// Convertit "01h:30m:00s" -> 5400 (secondes)
function parsePlaytimeToSeconds(str) {
    const parts = str.match(/(\d+)h:(\d+)m:(\d+)s/);
    if (!parts) return 0;
    const [, h, m, s] = parts.map(Number);
    return h * 3600 + m * 60 + s;
}

// Convertit 5400 -> "01h:30m:00s"
function formatSecondsToPlaytime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}h:${String(minutes).padStart(2, '0')}m:${String(seconds).padStart(2, '0')}s`;
}

// Route POST /stats : ajoute ou met à jour un joueur
app.post('/stats', (req, res) => {
    const stats = req.body;

    let allStats = [];

    // Lire le fichier s'il existe
    if (fs.existsSync(STATS_FILE)) {
        const raw = fs.readFileSync(STATS_FILE, 'utf8');
        if (raw.trim() !== "") {
            allStats = JSON.parse(raw);
        }
    }

    const index = allStats.findIndex(entry => entry.userId === stats.userId);

    if (index !== -1) {
        // Joueur déjà existant → cumul
        const existing = allStats[index];
        const totalPlaytime = parsePlaytimeToSeconds(existing.playtime) + parsePlaytimeToSeconds(stats.playtime);

        allStats[index] = {
            username: stats.username,
            userId: stats.userId,
            kills: existing.kills + stats.kills,
            deaths: existing.deaths + stats.deaths,
            playtime: formatSecondsToPlaytime(totalPlaytime)
        };
    } else {
        // Nouveau joueur
        allStats.push(stats);
    }

    // Écrire les données dans le fichier
    fs.writeFileSync(STATS_FILE, JSON.stringify(allStats, null, 2));
    res.status(200).send('OK');
});

// Route GET /stats : récupère toutes les stats
app.get('/stats', (req, res) => {
    if (!fs.existsSync(STATS_FILE)) return res.json([]);
    const raw = fs.readFileSync(STATS_FILE, 'utf8');
    const entries = raw.trim() === "" ? [] : JSON.parse(raw);
    res.json(entries);
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
