import './Card.css';

import React from 'react';

interface CardProps {
    imageUri: string;
    storeId?: string;
    price?: number;
    onClick?: () => void; // Optional onClick prop;
}

const Card: React.FC<CardProps> = ({ imageUri, storeId, price, onClick }) => {
    return (
        <div className="card-overlay-container" onClick={onClick}>
            <img src={imageUri} alt="Card" className="card-image" />
            {storeId && <div className="overlay-store-id">{storeId}</div>}
            {price && <div className="overlay-price">{price}</div>}
        </div>
    );
};

export default Card;
