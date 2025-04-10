const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

const STATS_FILE = path.join(__dirname, 'stats.json');

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

    // Cherche si le joueur existe déjà
    const index = allStats.findIndex(entry => entry.userId === stats.userId);

    if (index !== -1) {
        // Mise à jour
        allStats[index] = stats;
    } else {
        // Ajout
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

app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
