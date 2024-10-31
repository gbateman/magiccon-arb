import './Card.css';

import React from 'react';

interface CardProps {
    imageUri: string;
    overlayNumber: number;
    overlayText: string;
    onClick?: () => void; // Optional onClick prop;
}

const Card: React.FC<CardProps> = ({ imageUri, storeId, price, onClick }) => {
    return (
        <div className="card-overlay-container" onClick={onClick}>
            <img src={imageUri} alt="Card" className="card-image" />
            <div className="overlay-store-id">{storeId}</div>
            <div className="overlay-price">{price}</div>
        </div>
    );
};

export default Card;
