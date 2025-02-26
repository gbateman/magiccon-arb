import './App.css';

import React, { useEffect, useState } from 'react';

import Card from './Card';
import CardInput from './CardInput';
import DropdownMenu from './DropdownMenu';
import PriceInput from './PriceInput';

interface CardState {
    name: string;
    imageUri: string;
    prices: { [key: string]: number };
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

    const [addingCard, setAddingCard] = useState<boolean>(false);

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

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (editingCardId) {
        return (
            <PriceInput
                initialPrice={
                    state.cards[editingCardId].prices[selectedStoreId]
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
            </div>
            <h1>Cards</h1>
            <div className="cards">
                {state.cards &&
                    Object.entries(state.cards)
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
                                ).reduce(
                                    (maxEntry, currentEntry) =>
                                        currentEntry[1] > maxEntry[1]
                                            ? currentEntry
                                            : maxEntry,
                                    ['', -1]
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
