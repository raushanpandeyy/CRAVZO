import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react"; // Loader icon add kiya

import { listRestaurants } from "../../services/foodService.js";


const getOptimizedImage = (
  url,
  width = 120,
  height = 120
) => {
  if (!url) return "";

  if (url.includes("cloudinary.com")) {
    const parts = url.split("/upload/");

    if (parts.length === 2) {
      return `${parts[0]}/upload/c_fill,w_${width},h_${height},q_auto,f_auto/${parts[1]}`;
    }
  }

  return url;
};

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const SearchBar = ({ placeholder = "Search for restaurants or dishes...", value, onChange, showResults = true }) => {
  const [internalQuery, setInternalQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false); // UI fallback ke liye loading state
  const navigate = useNavigate();

  const query = value ?? internalQuery;

  
  useEffect(() => {
    let isMounted = true;
    const loadRestaurants = async () => {
      setLoading(true);
      try {
        const data = await listRestaurants();
        if (isMounted) setRestaurants(data);
      } catch (error) {
        console.error("Failed to load search data", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRestaurants();
    return () => { isMounted = false; }; // Memory leak protection
  }, []);

  // OPTIMIZATION 2: Debounced Search Queries (Agar aap future me Backend API search lagate hain)
  
  const filtered = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    return restaurants
      .filter((restaurant) => {
        const nameMatch = restaurant.name?.toLowerCase().includes(cleanQuery);
        const locationMatch = (restaurant.location || "").toLowerCase().includes(cleanQuery);
        const menuMatch = restaurant.menuPreview?.some((item) =>
          item.name?.toLowerCase().includes(cleanQuery)
        );

        return nameMatch || locationMatch || menuMatch;
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

  const handleClear = useCallback(() => {
    if (onChange) {
      onChange({ target: { value: "" } });
    } else {
      setInternalQuery("");
    }
  }, [onChange]);

  return (
    <div className="isolate w-full max-w-md mx-auto relative z-[90]">
      
      {loading ? (
        <Loader2 className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 animate-spin text-[#ff6b5f]" />
      ) : (
        <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#ff6b5f]" />
      )}

      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="relative z-[91] h-14 w-full rounded-2xl border border-white/80 bg-white pl-12 pr-4 text-[15px] font-semibold text-slate-900 shadow-lg shadow-indigo-950/10 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#ff6b5f] md:h-auto md:border-2 md:border-purple-300 md:px-4 md:py-2 md:pl-11 md:shadow-none md:focus:ring-indigo-500"
      />

      {/* Results Dropdown */}
      {showResults && filtered.length > 0 && (
        <div className="absolute left-0 right-0 z-[99] mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-indigo-950/20 containment-intrinsic-size">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                navigate(`/restaurant/${item.id}`);
                handleClear();
              }}
              className="flex items-center gap-3 px-3 py-3 hover:bg-indigo-50 cursor-pointer transition-colors duration-150"
            >
              {/* Image Loading Optimization */}
              {item.imageUrl && (
                <img 
                  src={getOptimizedImage(item.imageUrl, 120, 120)} 
                  alt={item.name} 
                  loading="lazy" 
                  className="h-12 w-14 rounded-xl object-cover bg-slate-100" 
                />
              )}

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-extrabold text-slate-900">{item.name}</h3>
                <p className="truncate text-xs font-medium text-slate-500">{item.location}</p>
                <p className="truncate text-xs font-bold text-[#ff6b5f]">{item.cuisine}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchBar);
