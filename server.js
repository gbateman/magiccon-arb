const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 1337;
const stateFile = process.env.STATE_FILE || '/var/state/state.json';
const imagesDir = process.env.IMAGES_DIR || '/var/state/images';

// Middleware to parse JSON bodies
app.use(express.json());

// Serve the static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve the static files from the images directory
app.use('/images', express.static(imagesDir));

// Serve the index.html file for any unknown paths (for single-page applications)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/state', (req, res) => {
    fs.readFile(stateFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Error reading file' });
        }

        const state = JSON.parse(data);

        res.json({ state: state });
    });
});

app.post('/add-card', (req, res) => {
    const cards = Array.isArray(req.body) ? req.body : [req.body]; // Support single or batch

    fs.readFile(stateFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Error reading file' });
        }

        const state = JSON.parse(data);

        for (const card of cards) {
            const { cardId, name, imageUri, colorIdentity } = card;
            if (!state.cards[cardId]) {
                state.cards[cardId] = { name, imageUri, prices: {}, colorIdentity };
            } else {
                console.log(`Card ${cardId} already exists, skipping`);
            }
        }

        const newFileContents = JSON.stringify(state, null, 4);
        fs.writeFile(stateFile, newFileContents, 'utf8', (err) => {
            if (err) {
                console.error('Error writing to file:', err);
                return res.status(500).json({ error: 'Error writing to file' });
            }
            res.json({ state });
        });
    });
});


app.post('/set-price', (req, res) => {
    const prices = Array.isArray(req.body) ? req.body : [req.body]; // Support single or batch

    fs.readFile(stateFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Error reading file' });
        }

        const state = JSON.parse(data);

        for (const { cardId, storeId, price } of prices) {
            if (!state.cards[cardId]) {
                console.warn(`Card ${cardId} not found, skipping`);
                continue;
            }

            state.cards[cardId].prices[storeId] = price;
        }

        const newFileContents = JSON.stringify(state, null, 4);
        fs.writeFile(stateFile, newFileContents, 'utf8', (err) => {
            if (err) {
                console.error('Error writing to file:', err);
                return res.status(500).json({ error: 'Error writing to file' });
            }
            res.json({ state });
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('State file:', stateFile);
});
