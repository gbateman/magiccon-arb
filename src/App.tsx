import './App.css';

import React, { useEffect, useState } from 'react';

import Card from './Card';
import DropdownMenu from './DropdownMenu';
import PriceInput from './PriceInput';

interface CardState {
    name: string;
    image_uri: string;
    prices: { [key: string]: number };
}

interface State {
    [key: string]: CardState;
}

const App: React.FC = () => {
    const [storeId, setStoreId] = useState<string>({});
    const [state, setState] = useState<State>({});
    const [error, setError] = useState<string | null>(null);

    const storeIds = ['Face 2 Face Games', 'Mana Trust'];
    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

    const [editingCardId, setEditingCardId] = useState<string | null>(null);

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

    const handleCardClick = async (cardId: string) => {
        console.log('Clicked:', cardId);
        if (selectedStoreId) {
            setEditingCardId(cardId);
        }
    };

    const handleConfirmPrice = async (price: number) => {
        console.log('Confirmed Price:', price);
        setEditingCardId(null);
        try {
            const response = await fetch('/set-price', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cardId: editingCardId,
                    storeId: selectedStoreId,
                    price,
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
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleCancelEditingPrice = async () => {
        console.log('Cancel Editing Price');
        setEditingCardId(null);
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (editingCardId) {
        return (
            <PriceInput
                initialPrice={state[editingCardId].prices[selectedStoreId]}
                onSubmit={handleConfirmPrice}
                onCancel={handleCancelEditingPrice}
            />
        );
    }

    return (
        <div className="container">
            <h1>Pick Store</h1>
            <DropdownMenu
                initialSelection={selectedStoreId}
                options={['Best Price', ...storeIds]}
                onSelect={handleSelectStore}
            />
            <h1>Cards</h1>
            <div className="cards">
                {Object.entries(state)
                    .sort(([cardIdA, cardStateA], [cardIdB, cardStateB]) =>
                        cardStateA.name > cardStateB.name ? 1 : -1
                    )
                    .map(([cardId, cardState]) => {
                        let storeId;
                        let price;
                        if (selectedStoreId) {
                            storeId = selectedStoreId;
                            price = cardState.prices[selectedStoreId];
                        } else {
                            [storeId, price] = Object.entries(
                                cardState.prices
                            ).reduce((maxEntry, currentEntry) =>
                                currentEntry[1] > maxEntry[1]
                                    ? currentEntry
                                    : maxEntry
                            );
                        }
                        return (
                            <Card
                                key={cardId}
                                imageUri={cardState.imageUri}
                                storeId={storeId}
                                price={price}
                                onClick={() => handleCardClick(cardId)}
                            />
                        );
                    })}
            </div>
        </div>
    );
};

export default App;
