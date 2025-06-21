const fs = require('fs');
const path = require('path');

const stateFile = process.env.STATE_FILE || '/var/state/state.json';

async function updateColors() {
    const raw = fs.readFileSync(stateFile, 'utf8');
    const state = JSON.parse(raw);

    const cardEntries = Object.entries(state.cards);

    for (const [cardId, card] of cardEntries) {
        try {
            const res = await fetch(`https://api.scryfall.com/cards/${cardId}`);
            if (!res.ok) throw new Error(`Card not found: ${cardId}`);
            const data = await res.json();

            const colorIdentity = Array.isArray(data.color_identity)
                ? data.color_identity
                : [];
            card.colorIdentity = colorIdentity;

            console.log(
                `✔ Updated ${card.name}: [${colorIdentity.join(',')}]`
            );
        } catch (err) {
            console.error(
                `✖ Failed for ${card.name} (${cardId}):`,
                err.message
            );
        }
    }

    fs.writeFileSync(stateFile, JSON.stringify(state, null, 4), 'utf8');
    console.log('✅ Done updating colorIdentity for all cards.');
}

updateColors();
