import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, Utensils, MapPin } from "lucide-react";

import { listRestaurants, listMenuItems } from "../../services/foodService.js";

const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect fill='%23f1f5f9' width='120' height='120'/%3E%3Ctext fill='%2394a3b8' font-family='Arial' font-size='12' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

const getOptimizedImage = (url, width = 120, height = 120) => {
  if (!url) return FALLBACK_IMG;
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

const SearchBar = ({ placeholder = "Search for dishes or restaurants...", value, onChange, showResults = true }) => {
  const [internalQuery, setInternalQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const query = value ?? internalQuery;

  useEffect(() => {
    let isMounted = true;
    
    const loadAllData = async () => {
      setLoading(true);
      try {
        const [restaurantData] = await Promise.all([
          listRestaurants({ page: 1, limit: 20 }),
        ]);
        
        if (isMounted) {
          const allRestaurants = Array.isArray(restaurantData) ? restaurantData : (restaurantData?.data || []);
          setRestaurants(allRestaurants);
          
          const allDishes = [];
          for (const restaurant of allRestaurants.slice(0, 8)) {
            try {
              const menuItems = await listMenuItems(restaurant.id);
              if (Array.isArray(menuItems)) {
                menuItems.forEach((item) => {
                  allDishes.push({
                    ...item,
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                    restaurantCity: restaurant.city,
                  });
                });
              }
            } catch (err) {}
          }
          setDishes(allDishes);
        }
      } catch (error) {
        console.error("Failed to load search data", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAllData();
    return () => { isMounted = false; };
  }, []);

  const filteredResults = React.useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery || cleanQuery.length < 2) return { dishes: [], restaurants: [] };

    const matchingDishes = dishes
      .filter((dish) => dish.name?.toLowerCase().includes(cleanQuery))
      .slice(0, 5)
      .map((dish) => ({ type: "dish", ...dish }));

    const matchingRestaurants = restaurants
      .filter((restaurant) => {
        const nameMatch = restaurant.name?.toLowerCase().includes(cleanQuery);
        const cuisineMatch = restaurant.cuisine?.toLowerCase().includes(cleanQuery);
        const cityMatch = restaurant.city?.toLowerCase().includes(cleanQuery);
        return nameMatch || cuisineMatch || cityMatch;
      })
      .slice(0, 5)
      .map((restaurant) => ({ type: "restaurant", ...restaurant }));

    return { dishes: matchingDishes, restaurants: matchingRestaurants };
  }, [query, dishes, restaurants]);

  const hasResults = filteredResults.dishes.length > 0 || filteredResults.restaurants.length > 0;

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

  const handleDishClick = (dish) => {
    navigate(`/dish/${encodeURIComponent(dish.name)}`);
    handleClear();
  };

  const handleRestaurantClick = (restaurant) => {
    navigate(`/restaurant/${restaurant.id}`);
    handleClear();
  };

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

      {showResults && hasResults && (
        <div className="absolute left-0 right-0 z-[99] mt-2 max-h-96 w-full overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-indigo-950/20">
          
          {filteredResults.dishes.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-indigo-50 border-b border-slate-100">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Dishes</p>
              </div>
              {filteredResults.dishes.map((dish) => (
                <div
                  key={`dish-${dish.id}`}
                  onClick={() => handleDishClick(dish)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors duration-150 border-b border-slate-50 last:border-b-0"
                >
                  <div className="h-12 w-14 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                    {dish.imageUrl ? (
                      <img 
                        src={getOptimizedImage(dish.imageUrl, 120, 120)} 
                        alt={dish.name} 
                        loading="lazy" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <Utensils className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-extrabold text-slate-900">{dish.name}</h3>
                    <p className="truncate text-xs font-medium text-slate-500">
                      {dish.restaurantName}
                      {dish.price && <span className="text-indigo-600 font-bold ml-2">₹{Math.floor(Number(dish.price))}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredResults.restaurants.length > 0 && (
            <div className={filteredResults.dishes.length > 0 ? "border-t border-slate-100" : ""}>
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Restaurants</p>
              </div>
              {filteredResults.restaurants.map((restaurant) => (
                <div
                  key={`restaurant-${restaurant.id}`}
                  onClick={() => handleRestaurantClick(restaurant)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors duration-150 border-b border-slate-50 last:border-b-0"
                >
                  <div className="h-12 w-14 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                    {restaurant.imageUrl ? (
                      <img 
                        src={getOptimizedImage(restaurant.imageUrl, 120, 120)} 
                        alt={restaurant.name} 
                        loading="lazy" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <MapPin className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-extrabold text-slate-900">{restaurant.name}</h3>
                    <p className="truncate text-xs font-medium text-slate-500">{restaurant.cuisine} • {restaurant.city}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchBar);