const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const STATS_FILE = path.join(__dirname, 'stats.json');

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});

app.use(bodyParser.json());

app.post('/stats', (req, res) => {
    const stats = req.body;

    let allStats = [];

    if (fs.existsSync(STATS_FILE)) {
        const raw = fs.readFileSync(STATS_FILE, 'utf8');
        if (raw.trim() !== "") {
            allStats = JSON.parse(raw);
        }
    }

    const index = allStats.findIndex(entry => entry.userId === stats.userId);

    if (index !== -1) {
        // ✅ Cumul des stats
        const existing = allStats[index];

        allStats[index] = {
            username: stats.username,
            userId: stats.userId,
            kills: existing.kills + stats.kills,
            deaths: existing.deaths + stats.deaths,
            playtime: stats.playtime // pas cumulé, affichage direct
        };
    } else {
        // Nouveau joueur → ajout
        allStats.push(stats);
    }

    fs.writeFileSync(STATS_FILE, JSON.stringify(allStats, null, 2));
    res.status(200).send('OK');
});

app.get('/stats', (req, res) => {
    if (!fs.existsSync(STATS_FILE)) return res.json([]);
    const raw = fs.readFileSync(STATS_FILE, 'utf8');
    const entries = raw.trim() === "" ? [] : JSON.parse(raw);
    res.json(entries);
});

app.post('/event', (req, res) => {
    const { userId, event } = req.body;

    let allStats = [];

    if (fs.existsSync(STATS_FILE)) {
        const raw = fs.readFileSync(STATS_FILE, 'utf8');
        if (raw.trim() !== "") {
            allStats = JSON.parse(raw);
        }
    }

    const index = allStats.findIndex(entry => entry.userId === userId);
    if (index !== -1) {
        if (event === "kill") {
            allStats[index].kills += 1;
        } else if (event === "death") {
            allStats[index].deaths += 1;
        }
        fs.writeFileSync(STATS_FILE, JSON.stringify(allStats, null, 2));
        res.status(200).send('OK');
    } else {
        res.status(404).send("User not found");
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
