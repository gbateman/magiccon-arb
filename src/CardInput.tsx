// CardInput.tsx
import './CardInput.css';

import React, { useEffect, useRef, useState } from 'react';

import Card from './Card';

interface CardInfo {
    uuid: string;
    name: string;
    imageUri: string;
}

interface CardInputProps {
    initialCard?: number;
    onSubmit: (cardInfo: CardInfo) => void;
    onCancel: () => void;
}

const CardInput: React.FC<CardInputProps> = ({ onSubmit, onCancel }) => {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null); // Create a ref for the input

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus(); // Focus the input when the component is loaded
            inputRef.current.select(); // Highlight all text in the input
        }
    }, []);

    const [scryfallData, setScryfallData] = useState([]);

    const [currentTimeout, setCurrentTimeout] = useState(null);

    const fetchCards = async (query: string) => {
        try {
            const response = await fetch(
                `https://api.scryfall.com/cards/search?q=${encodeURIComponent(`(unique:cards sort:usd game:paper not:foil not:atypical) && (${query})`)}`
            );
            const data = await response.json();
            if (typeof data.data === 'object') {
                setScryfallData(data.data.slice(0, 6));
            } else if (data.code === 'not_found') {
                setScryfallData([]);
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            onCancel();
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
        if (event.target.value !== '') {
            const timeout = setTimeout(() => {
                fetchCards(event.target.value);
            }, 300);
            clearTimeout(currentTimeout);
            setCurrentTimeout(timeout);
        }
    };

    const handleSubmit = () => {
        if (scryfallData.length > 0) {
            const scryfallCardInfo = scryfallData[0];
            console.log(scryfallCardInfo);
            const uuid = scryfallCardInfo.id;
            const name = scryfallCardInfo.name;
            const imageUri =
                (scryfallCardInfo.image_uris &&
                    scryfallCardInfo.image_uris.png) ||
                scryfallCardInfo.card_faces[0].image_uris.png;
            onSubmit({ uuid, name, imageUri });
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSubmit();
        }
    };

    const handleCancel = () => {
        onCancel(); // Trigger the onCancel callback
        setInputValue(''); // Clear input when canceled
    };

    const handleCardClick = (cardInfo: CardInfo) => {
        onSubmit(cardInfo);
    };

    return (
        <div className="overlay">
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="input"
                placeholder="Card"
                ref={inputRef}
            />
            <div className="card-options">
                {scryfallData.map((scryfallCardInfo) => {
                    const uuid = scryfallCardInfo.id;
                    const name = scryfallCardInfo.name;
                    const imageUri =
                        (scryfallCardInfo.image_uris &&
                            scryfallCardInfo.image_uris.png) ||
                        scryfallCardInfo.card_faces[0].image_uris.png;
                    return (
                        <Card
                            key={uuid}
                            imageUri={imageUri}
                            onClick={() =>
                                handleCardClick({ uuid, name, imageUri })
                            }
                        />
                    );
                })}
            </div>
            <div className="button-container">
                <button onClick={handleSubmit} className="button">
                    Submit
                </button>
                <button onClick={handleCancel} className="button">
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default CardInput;
