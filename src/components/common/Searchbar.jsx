/**
 * SearchBar — rewritten to fix 90 API calls on page load.
 *
 * OLD behaviour (broken):
 *   - On mount: fired listRestaurants + up to 8×listMenuItems = 9 API calls
 *   - This happened on EVERY page because Navbar is always mounted
 *   - Tapping the bar kept dropdown inline, never navigated to search page
 *
 * NEW behaviour:
 *   - On mount: ZERO API calls — nothing is fetched until user types
 *   - Tap/focus on mobile → navigate to /restaurants?q= (dedicated search page)
 *   - On desktop (showResults=true): debounce 400ms then ONE /api/restaurants/search call
 *   - Results: restaurants + dishes from a single backend call
 *   - Location-aware: passes user coords to sort by distance
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MapPin, Search, Utensils, X } from "lucide-react";

import { searchRestaurantsAndDishes } from "../../services/foodService.js";
import { useUserLocation } from "../../hooks/useUserLocation.js";

const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect fill='%23f1f5f9' width='120' height='120'/%3E%3C/svg%3E";

const getThumb = (url) => {
  if (!url) return FALLBACK_IMG;
  if (url.includes("cloudinary.com")) {
    const parts = url.split("/upload/");
    if (parts.length === 2)
      return `${parts[0]}/upload/c_fill,w_80,h_80,q_auto,f_auto/${parts[1]}`;
  }
  return url;
};

const SearchBar = ({
  placeholder = "Search for dishes or restaurants...",
  value,
  onChange,
  showResults = true,
  className = "",
}) => {
  const navigate = useNavigate();
  const { lat, lng, ready: locationReady } = useUserLocation();

  const [internalQuery, setInternalQuery] = useState("");
  const [results, setResults] = useState({ restaurants: [], dishes: [] });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  const query = value !== undefined ? value : internalQuery;

  const hasResults = results.restaurants.length > 0 || results.dishes.length > 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced search — fires ONE API call after 400ms idle
  useEffect(() => {
    const q = query.trim();
    if (!q || q.length < 2) {
      setResults({ restaurants: [], dishes: [] });
      setOpen(false);
      return;
    }

    if (!showResults) return; // Mobile: handled by navigation, not dropdown

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchRestaurantsAndDishes(
          q,
          locationReady && lat ? { lat, lng, radius: 3 } : {},
        );
        setResults(data);
        setOpen(true);
      } catch {
        setResults({ restaurants: [], dishes: [] });
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query, lat, lng, locationReady, showResults]);

  const handleChange = (e) => {
    const val = e.target.value;
    if (onChange) {
      onChange(e);
    } else {
      setInternalQuery(val);
    }
  };

  const handleClear = useCallback(() => {
    if (onChange) onChange({ target: { value: "" } });
    else setInternalQuery("");
    setResults({ restaurants: [], dishes: [] });
    setOpen(false);
  }, [onChange]);

  // Mobile tap — navigate to search page instead of showing inline dropdown
  const handleFocus = () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && showResults) {
      const q = query.trim();
      navigate(q ? `/restaurants?q=${encodeURIComponent(q)}` : "/restaurants");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/restaurants?q=${encodeURIComponent(q)}`);
  };

  const handleDishClick = (dish) => {
    navigate(`/dish/${encodeURIComponent(dish.name)}`);
    setOpen(false);
    handleClear();
  };

  const handleRestaurantClick = (restaurant) => {
    navigate(`/restaurant/${restaurant.id}`);
    setOpen(false);
    handleClear();
  };

  return (
    <div ref={containerRef} className={`isolate w-full max-w-md mx-auto relative z-[90] ${className}`}>
      <form onSubmit={handleSubmit}>
        {loading ? (
          <Loader2 className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 animate-spin text-[#ff6b5f]" />
        ) : (
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#ff6b5f]" />
        )}

        <input
          type="search"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoComplete="off"
          className={`relative z-[91] h-14 w-full rounded-2xl border border-white/80 bg-white pl-12 pr-10 text-[15px] font-semibold text-slate-900 shadow-lg shadow-indigo-950/10 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#ff6b5f] md:h-auto md:border-2 md:border-purple-300 md:py-2 md:pl-11 md:shadow-none md:focus:ring-indigo-500`}
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Desktop dropdown — only shown when showResults=true and has data */}
      {showResults && open && hasResults && (
        <div className="absolute left-0 right-0 z-[99] mt-2 max-h-96 w-full overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-indigo-950/20">

          {results.dishes.length > 0 && (
            <div>
              <div className="border-b border-slate-100 bg-indigo-50 px-4 py-2">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Dishes</p>
              </div>
              {results.dishes.map((dish) => (
                <button
                  key={`d-${dish.id}`}
                  type="button"
                  onClick={() => handleDishClick(dish)}
                  className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-indigo-50"
                >
                  <div className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                    {dish.imageUrl ? (
                      <img src={getThumb(dish.imageUrl)} alt={dish.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <Utensils className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-900">{dish.name}</p>
                    <p className="truncate text-xs font-medium text-slate-500">
                      {dish.restaurantName}
                      {dish.price > 0 && <span className="ml-2 font-bold text-indigo-600">₹{Math.floor(dish.price)}</span>}
                      {dish.distance != null && <span className="ml-2 text-slate-400">{dish.distance} km</span>}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.restaurants.length > 0 && (
            <div className={results.dishes.length > 0 ? "border-t border-slate-100" : ""}>
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Restaurants</p>
              </div>
              {results.restaurants.map((r) => (
                <button
                  key={`r-${r.id}`}
                  type="button"
                  onClick={() => handleRestaurantClick(r)}
                  className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-indigo-50"
                >
                  <div className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                    {r.imageUrl ? (
                      <img src={getThumb(r.imageUrl)} alt={r.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <MapPin className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-900">{r.name}</p>
                    <p className="truncate text-xs font-medium text-slate-500">
                      {r.cuisine} • {r.city}
                      {r.distance != null && <span className="ml-2 text-slate-400">{r.distance} km</span>}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchBar);
