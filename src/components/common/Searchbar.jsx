import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

<<<<<<< HEAD
import { listRestaurants } from "../../services/foodService.js";
=======
import { listRestaurants } from "../../services/foodService";
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

const SearchBar = ({ placeholder = "Search for restaurants or dishes...", value, onChange }) => {
  const [internalQuery, setInternalQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const navigate = useNavigate();

  const query = value ?? internalQuery;

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await listRestaurants();
        setRestaurants(data);
      } catch (error) {
        console.error("Failed to load search data", error);
      }
    };

    loadRestaurants();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return [];
    }

    return restaurants
      .filter((restaurant) => {
        const searchableMenu = restaurant.menuPreview?.some((item) =>
          item.name.toLowerCase().includes(query.toLowerCase()),
        );

        return (
          restaurant.name.toLowerCase().includes(query.toLowerCase()) ||
          (restaurant.location || "").toLowerCase().includes(query.toLowerCase()) ||
          searchableMenu
        );
      })
      .slice(0, 6);
  }, [query, restaurants]);

  const handleChange = (event) => {
    if (onChange) {
      onChange(event);
    } else {
      setInternalQuery(event.target.value);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full bg-white px-4 py-2 border-2 border-purple-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {filtered.length > 0 ? (
        <div className="absolute w-full bg-white border mt-1 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                navigate(`/restaurant/${item.id}`);
                if (onChange) {
                  onChange({ target: { value: "" } });
                } else {
                  setInternalQuery("");
                }
              }}
              className="flex items-center gap-3 px-3 py-2 hover:bg-indigo-100 cursor-pointer"
            >
              <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />

              <div>
                <h3 className="text-sm font-semibold text-gray-800">{item.name}</h3>
                <p className="text-xs text-gray-500">{item.location}</p>
                <p className="text-xs text-yellow-600">{item.cuisine}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default SearchBar;
