const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('./'));

// Get high scores
app.get('/scores', (req, res) => {
    try {
        const scores = JSON.parse(fs.readFileSync('scores.json'));
        res.json(scores);
    } catch (error) {
        res.json({ highScores: [] });
    }
});

// Save new score
app.post('/scores', (req, res) => {
    try {
        let scores = { highScores: [] };
        if (fs.existsSync('scores.json')) {
            scores = JSON.parse(fs.readFileSync('scores.json'));
        }
        
        scores.highScores.push(req.body);
        scores.highScores.sort((a, b) => b.score - a.score);
        scores.highScores = scores.highScores.slice(0, 10); // Keep top 10
        
        fs.writeFileSync('scores.json', JSON.stringify(scores, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save score' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
