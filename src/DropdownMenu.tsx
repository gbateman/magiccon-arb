import React, { useState } from 'react';

// Define the component props, including the callback for selection change
interface DropdownMenuProps {
    initialSelection?: string;
    options: string[];
    onSelect: (selected: string | null) => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
    initialSelection,
    options,
    onSelect,
}) => {
    // State for selected option
    const [selectedOption, setSelectedOption] = useState<string | null>(
        initialSelection || options[0]
    );

    // Handle selection change and call the parent callback
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        setSelectedOption(value);
        onSelect(value); // Call the callback with the selected value
    };

    return (
        <div>
            <select
                id="dropdown"
                className="dropdown-menu"
                onChange={handleChange}
                value={selectedOption || ''}
            >
                <option value="" disabled>
                    Choose
                </option>
                {options.map((option, index) => (
                    <option key={index} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default DropdownMenu;
