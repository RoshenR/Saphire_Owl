const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const STATS_FILE = path.join(__dirname, 'stats.json');

// Autorise les requêtes HTTP depuis l'extérieur (CORS)
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});

app.use(bodyParser.json());

// 🔁 Route POST /stats : enregistrement et cumul des stats
app.post('/stats', (req, res) => {
    const stats = req.body;

    let allStats = [];

    // Lecture du fichier existant
    if (fs.existsSync(STATS_FILE)) {
        const raw = fs.readFileSync(STATS_FILE, 'utf8');
        if (raw.trim() !== "") {
            allStats = JSON.parse(raw);
        }
    }

    // Vérifie si le joueur est déjà présent
    const index = allStats.findIndex(entry => entry.userId === stats.userId);

    if (index !== -1) {
        const previous = allStats[index];
        // Met à jour : cumul kills & deaths, MAJ playtime
        allStats[index] = {
            username: stats.username,
            userId: stats.userId,
            kills: previous.kills + stats.kills,
            deaths: previous.deaths + stats.deaths,
            playtime: stats.playtime
        };
    } else {
        // Nouveau joueur
        allStats.push({
            username: stats.username,
            userId: stats.userId,
            kills: stats.kills,
            deaths: stats.deaths,
            playtime: stats.playtime
        });
    }

    fs.writeFileSync(STATS_FILE, JSON.stringify(allStats, null, 2));
    res.status(200).send('OK');
});

// 📄 Route GET /stats : récupère toutes les stats
app.get('/stats', (req, res) => {
    if (!fs.existsSync(STATS_FILE)) return res.json([]);
    const raw = fs.readFileSync(STATS_FILE, 'utf8');
    const entries = raw.trim() === "" ? [] : JSON.parse(raw);
    res.json(entries);
});

// 🚀 Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
