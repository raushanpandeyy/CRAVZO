import React from "react";

const Buttons = ({ children, onClick, variant = "primary", className = "" }) => {
    const baseStyle =
        "px-4 py-2 rounded-2xl font-medium transition duration-200 focus:outline-none";

    const variants = {
        primary: "bg-indigo-800 text-white hover:bg-indigo-700",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
        outline: "border border-indigo-800 text-indigo-800 hover:bg-indigo-50",
        danger: "bg-red-600 text-white hover:bg-red-700",
    };

    return (
        <button
            onClick={onClick}
            className={`${baseStyle} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

export default Buttons;
