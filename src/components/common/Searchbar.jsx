import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import { listRestaurants } from "../../services/foodService.js";

const SearchBar = ({ placeholder = "Search for restaurants or dishes...", value, onChange, showResults = true }) => {
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
    <div className="isolate w-full max-w-md mx-auto relative z-[90]">
      <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#ff6b5f]" />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="relative z-[91] h-14 w-full rounded-2xl border border-white/80 bg-white pl-12 pr-4 text-[15px] font-semibold text-slate-900 shadow-lg shadow-indigo-950/10 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#ff6b5f] md:h-auto md:border-2 md:border-purple-300 md:px-4 md:py-2 md:pl-11 md:shadow-none md:focus:ring-indigo-500"
      />

      {showResults && filtered.length > 0 ? (
        <div className="absolute left-0 right-0 z-[99] mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-indigo-950/20">
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
              className="flex items-center gap-3 px-3 py-3 hover:bg-indigo-50 cursor-pointer"
            >
              <img src={item.imageUrl} alt={item.name} className="h-12 w-14 rounded-xl object-cover" />

              <div className="min-w-0">
                <h3 className="truncate text-sm font-extrabold text-slate-900">{item.name}</h3>
                <p className="truncate text-xs font-medium text-slate-500">{item.location}</p>
                <p className="truncate text-xs font-bold text-[#ff6b5f]">{item.cuisine}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default SearchBar;
