// src/components/SearchBar.jsx
import React from "react";

const SearchBar = ({ placeholder = "Search for restaurants or dishes...", value, onChange }) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="
          w-full
          bg-white
          px-4
          py-2

          border-2
          border-purple-300
          rounded-xl
          text-gray-900
          focus:outline-none
          focus:ring-2
          focus:ring-indigo-500
          placeholder-gray-400
          placeholder-indigo-800
          transition
          duration-200
        "
      />
    </div>
  );
};

export default SearchBar;
