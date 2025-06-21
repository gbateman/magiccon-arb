import './App.css';

import React, { useEffect, useState } from 'react';

import Card from './Card';
import CardInput from './CardInput';
import DropdownMenu from './DropdownMenu';
import PriceInput from './PriceInput';
import Papa from 'papaparse';

interface CardState {
    name: string;
    imageUri: string;
    prices: { [key: string]: number };
    colorIdentity: string[];
}

interface State {
    storeIds: string[];
    cards: { [key: string]: CardState };
}

interface CardInfo {
    uuid: string;
    name: string;
    imageUri: string;
}

const App: React.FC = () => {
    const [state, setState] = useState<State>({});
    const [error, setError] = useState<string | null>(null);

    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

    const [editingCardId, setEditingCardId] = useState<string | null>(null);
    const [editingStoreId, setEditingStoreId] = useState<string | null>(null);

    const [addingCard, setAddingCard] = useState<boolean>(false);

    const [searchQuery, setSearchQuery] = useState('');

    const [minPrice, setMinPrice] = useState<number | null>(7);

    const [sortMode, setSortMode] = useState<'alpha' | 'color'>('alpha');

    useEffect(() => {
        const fetchState = async () => {
            try {
                const response = await fetch('/state');
                if (!response.ok) {
                    throw new Error('Server response was not ok');
                }
                const data = await response.json();
                if (typeof data.state === 'object') {
                    setState(data.state);
                } else {
                    throw new Error('Invalid data format');
                }
            } catch (error) {
                setError(error.message);
            }
        };

        fetchState();
    }, []);

    // Callback to handle selection from DropdownMenu
    const handleSelectStore = (storeId: string | null) => {
        if (storeId === 'Best Price') {
            setSelectedStoreId(null);
        } else {
            setSelectedStoreId(storeId);
        }
    };

    const handleCardClick = (cardId: string) => {
        if (selectedStoreId) {
            setEditingCardId(cardId);
            setEditingStoreId(selectedStoreId);
            return;
        }

        const prices = state.cards[cardId]?.prices ?? {};
        const entries = Object.entries(prices);
        if (entries.length === 0) return;

        const [bestStore] = entries.reduce(
            (best, current) => (current[1] > best[1] ? current : best),
            ['', -1]
        );

        if (!bestStore) return;

        setEditingCardId(cardId);
        setEditingStoreId(bestStore);
    };

    const handleConfirmPrice = async (price: number) => {
        if (!editingCardId || !editingStoreId) return;

        setEditingCardId(null);
        setEditingStoreId(null);

        try {
            const response = await fetch('/set-price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cardId: editingCardId,
                    storeId: editingStoreId,
                    price,
                }),
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            if (typeof data.state === 'object') {
                setState(data.state);
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleCancelEditingPrice = () => {
        setEditingCardId(null);
        setEditingStoreId(null);
    };

    const handleAddCard = async () => {
        console.log('Add Card');
        setAddingCard(true);
    };

    const handleConfirmCard = async (cardInfo: CardInfo) => {
        console.log('Confirmed Card:', cardInfo);
        setAddingCard(false);
        try {
            const response = await fetch('/add-card', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cardId: cardInfo.uuid,
                    name: cardInfo.name,
                    imageUri: cardInfo.imageUri,
                }),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            if (typeof data.state === 'object') {
                setState(data.state);
            } else {
                throw new Error('Invalid data format');
            }

            if (selectedStoreId) {
                setEditingCardId(cardInfo.uuid);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleCancelAddingCard = async () => {
        console.log('Cancel Adding Card');
        setAddingCard(false);
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImportCSVClick = () => {
        if (!selectedStoreId) {
            alert('Please select a store before importing a CSV.');
            return;
        }
        fileInputRef.current?.click();
    };

    const handleCSVUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        const parsed = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            transform: (value) => value.trim().replace(/^['"]|['"]$/g, ''),
        });

        if (parsed.errors.length > 0) {
            console.error('CSV parse error:', parsed.errors);
            alert('There was a problem parsing the CSV.');
            return;
        }

        const rows = parsed.data as { card_name: string; price: string }[];

        const cardsToAdd = [];
        const pricesToSet = [];

        for (const row of rows) {
            const name = row.card_name;
            const price = parseFloat(row.price);
            if (!name || isNaN(price)) {
                console.warn('Invalid row skipped:', row);
                continue;
            }

            try {
                const scryfallRes = await fetch(
                    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(`unique:cards sort:usd is:typical "${name}"`)}`
                );
                const scryfallJson = await scryfallRes.json();
                const card = scryfallJson.data?.[0];
                if (!card) {
                    console.warn(`No result for: ${name}`);
                    continue;
                }

                const uuid = card.id;
                const actualName = card.name;
                const imageUri =
                    card.image_uris?.png ||
                    card.card_faces?.[0]?.image_uris?.png;
                const colorIdentity = Array.isArray(card.color_identity)
                    ? card.color_identity
                    : [];

                const alreadyAdded = Object.values(state.cards).some(
                    (c) => c.name.toLowerCase() === actualName.toLowerCase()
                );

                if (!alreadyAdded) {
                    cardsToAdd.push({
                        cardId: uuid,
                        name: actualName,
                        imageUri,
                        colorIdentity,
                    });
                }

                pricesToSet.push({
                    cardId: uuid,
                    storeId: selectedStoreId,
                    price,
                });
            } catch (err) {
                console.error(`Error importing ${name}:`, err);
            }
        }

        try {
            if (cardsToAdd.length > 0) {
                const addRes = await fetch('/add-card', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cardsToAdd),
                });
                if (!addRes.ok) throw new Error('Batch add failed');
            }

            if (pricesToSet.length > 0) {
                const priceRes = await fetch('/set-price', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pricesToSet),
                });
                if (!priceRes.ok) throw new Error('Batch price set failed');
            }

            const updated = await fetch('/state');
            const updatedJson = await updated.json();
            if (typeof updatedJson.state === 'object') {
                setState(updatedJson.state);
            }
        } catch (err) {
            console.error('Error during batch import:', err);
        }
    };

    const getColorSortValue = (colorIdentity: string[]): number => {
        if (!colorIdentity || colorIdentity.length === 0) return 6; // colorless
        if (colorIdentity.length > 1) return 5; // multicolor

        const order = { W: 0, U: 1, B: 2, R: 3, G: 4 };
        return order[colorIdentity[0]] ?? 5;
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (editingCardId) {
        return (
            <PriceInput
                initialPrice={
                    editingCardId && editingStoreId
                        ? state.cards[editingCardId].prices[editingStoreId]
                        : undefined
                }
                onSubmit={handleConfirmPrice}
                onCancel={handleCancelEditingPrice}
            />
        );
    }

    if (addingCard) {
        return (
            <CardInput
                onSubmit={handleConfirmCard}
                onCancel={handleCancelAddingCard}
            />
        );
    }

    return (
        <div className="container">
            <h1>Pick Store</h1>
            <DropdownMenu
                initialSelection={selectedStoreId}
                options={[
                    'Best Price',
                    ...((state.storeIds && state.storeIds) || []),
                ]}
                onSelect={handleSelectStore}
            />
            <div className="button-container">
                <button onClick={handleAddCard} className="button">
                    Add Card
                </button>
                <button onClick={handleImportCSVClick} className="button">
                    Import CSV
                </button>
                <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleCSVUpload}
                />
            </div>
            <h1>Filter</h1>
            <input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
            />
            <input
                type="number"
                placeholder="Min price"
                value={minPrice ?? ''}
                onChange={(e) => {
                    const val = e.target.value;
                    setMinPrice(val === '' ? null : parseFloat(val));
                }}
                className="price-filter-input"
            />
            <div style={{ marginBottom: '1em' }}>
                <label style={{ marginRight: '1em' }}>
                    <input
                        type="radio"
                        name="sortMode"
                        value="alpha"
                        checked={sortMode === 'alpha'}
                        onChange={() => setSortMode('alpha')}
                    />{' '}
                    Alphabetical
                </label>
                <label>
                    <input
                        type="radio"
                        name="sortMode"
                        value="color"
                        checked={sortMode === 'color'}
                        onChange={() => setSortMode('color')}
                    />{' '}
                    By color identity
                </label>
            </div>
            <h1>Cards</h1>
            <table className="card-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Store</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {state.cards &&
                        Object.entries(state.cards)
                            .filter(([, cardState]) => {
                                const matchesName = cardState.name
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase());
                                const storePrice = selectedStoreId
                                    ? cardState.prices[selectedStoreId] ?? -1
                                    : Object.values(cardState.prices).reduce(
                                          (a, b) => Math.max(a, b),
                                          -1
                                      );

                                const matchesMinPrice =
                                    minPrice == null || storePrice >= minPrice;

                                return matchesName && matchesMinPrice;
                            })
                            .sort(([, a], [, b]) => {
                                if (sortMode === 'color') {
                                    const colorA = getColorSortValue(
                                        a.colorIdentity
                                    );
                                    const colorB = getColorSortValue(
                                        b.colorIdentity
                                    );
                                    if (colorA !== colorB)
                                        return colorA - colorB;
                                }
                                return a.name.localeCompare(b.name);
                            })
                            .map(([cardId, cardState]) => {
                                let store = '';
                                let price: number | undefined;

                                if (selectedStoreId) {
                                    store = selectedStoreId;
                                    price = cardState.prices[selectedStoreId];
                                } else {
                                    const entries = Object.entries(
                                        cardState.prices
                                    );
                                    if (entries.length === 0) return null;
                                    [store, price] = entries.reduce(
                                        (best, current) =>
                                            current[1] > best[1]
                                                ? current
                                                : best,
                                        ['', -1]
                                    );
                                }

                                return (
                                    <tr
                                        key={cardId}
                                        onClick={() => handleCardClick(cardId)}
                                        style={{
                                            cursor: selectedStoreId
                                                ? 'pointer'
                                                : 'default',
                                        }}
                                    >
                                        <td>{cardState.name}</td>
                                        <td className="truncate" title={store}>
                                            {store}
                                        </td>
                                        <td>
                                            {price != null
                                                ? `$${price.toFixed(2)}`
                                                : ''}
                                        </td>
                                    </tr>
                                );
                            })}
                </tbody>
            </table>
        </div>
    );
};

export default App;
