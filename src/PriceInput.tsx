// PriceInput.tsx
import './PriceInput.css';

import React, { useEffect, useRef, useState } from 'react';

interface PriceInputProps {
    initialPrice?: number;
    onSubmit: (price: number) => void;
    onCancel: () => void;
}

const PriceInput: React.FC<PriceInputProps> = ({
    initialPrice,
    onSubmit,
    onCancel,
}) => {
    const [inputValue, setInputValue] = useState(
        (initialPrice && initialPrice.toString()) || ''
    );
    const inputRef = useRef<HTMLInputElement>(null); // Create a ref for the input

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus(); // Focus the input when the component is loaded
            inputRef.current.select(); // Highlight all text in the input
        }
    }, []);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const handleSubmit = () => {
        onSubmit(parseFloat(inputValue)); // Call submit callback with input value
        setInputValue(''); // Clear the input after submit
    };

    const handleCancel = () => {
        onCancel(); // Trigger the onCancel callback
        setInputValue(''); // Clear input when canceled
    };

    return (
        <div className="overlay">
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                className="input"
                placeholder="Price"
                ref={inputRef}
            />
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

export default PriceInput;
