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
    console.log(req.body);
    const cardId = req.body.cardId;
    const name = req.body.name;
    const imageUri = req.body.imageUri;

    fs.readFile(stateFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Error reading file' });
        }

        const state = JSON.parse(data);

        if (cardId in state.cards) {
            console.error('Card already present in state', cardId, state.cards);
            return res
                .status(500)
                .json({ error: 'Card already present in state' });
        }

        state.cards[cardId] = { name, imageUri, prices: {} };

        const newFileContents = JSON.stringify(state, null, 4);

        fs.writeFile(stateFile, newFileContents, 'utf8', (err) => {
            if (err) {
                console.error('Error writing to file:', err);
                return res.status(500).json({ error: 'Error writing to file' });
            }

            res.json({ state: state });
        });
    });
});

app.post('/set-price', (req, res) => {
    console.log(req.body);
    const storeId = req.body.storeId;
    const cardId = req.body.cardId;
    const price = req.body.price;

    fs.readFile(stateFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Error reading file' });
        }

        const state = JSON.parse(data);

        if (!(cardId in state.cards)) {
            console.error('Card not found:', cardId, JSON.stringify(state));
            return res.status(500).json({ error: 'Card not found' });
        }

        const cardState = state.cards[cardId];

        cardState.prices[storeId] = price;

        const newFileContents = JSON.stringify(state, null, 4);

        fs.writeFile(stateFile, newFileContents, 'utf8', (err) => {
            if (err) {
                console.error('Error writing to file:', err);
                return res.status(500).json({ error: 'Error writing to file' });
            }

            res.json({ state: state });
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('State file:', stateFile);
});
