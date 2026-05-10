import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock3, MapPin, Search, Star, Store } from "lucide-react";

import { listRestaurants } from "../../services/foodService.js";

const RestaurantListingPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await listRestaurants();
        setRestaurants(data);
      } catch (requestError) {
        console.error("Failed to load restaurants", requestError);
        setError("Restaurants load nahi ho paaye. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, []);

  const trimmedQuery = query.trim().toLowerCase();
  const suggestions = ["Biryani", "Pizza", "Burger", "Dosa", "Momos", "Cake"];
  const filteredRestaurants = trimmedQuery
    ? restaurants.filter((restaurant) => {
        const menuMatch = restaurant.menuPreview?.some((item) =>
          item.name.toLowerCase().includes(trimmedQuery),
        );

        return (
          restaurant.name.toLowerCase().includes(trimmedQuery) ||
          (restaurant.location || "").toLowerCase().includes(trimmedQuery) ||
          (restaurant.cuisine || "").toLowerCase().includes(trimmedQuery) ||
          menuMatch
        );
      })
    : [];

  return (
    <section className="mx-auto max-w-[1200px] bg-slate-50 px-4 pb-28 pt-28 md:bg-white md:pb-12 md:pt-32">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Explore</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Restaurants</h1>
        </div>
        <Store className="hidden h-10 w-10 text-indigo-700 md:block" />
      </div>

      <div className="sticky top-20 z-30 -mx-4 bg-slate-50 px-4 pb-4 pt-1 md:static md:mx-0 md:bg-white md:px-0">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#ff6b5f]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search restaurant or dish"
            className="h-14 w-full rounded-2xl border border-slate-100 bg-white pl-12 pr-4 text-sm font-bold text-slate-900 shadow-md shadow-slate-200/80 outline-none transition-all duration-200 placeholder:text-slate-400 focus:ring-2 focus:ring-[#ff6b5f]"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setQuery(item)}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-slate-700 shadow-sm transition-all duration-200 active:scale-95"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-slate-600">Loading restaurants...</p>
      ) : error ? (
        <p className="text-rose-600">{error}</p>
      ) : !trimmedQuery ? (
        <div className="rounded-3xl bg-white px-5 py-8 text-center shadow-sm md:mt-4">
          <p className="text-sm font-bold text-slate-500">Search for a restaurant or dish to see results.</p>
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <p className="rounded-3xl bg-white p-5 text-sm font-bold text-slate-500 shadow-sm">
          No restaurants found for "{query}".
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRestaurants.map((restaurant, index) => {
            const featuredDish = restaurant.menuPreview?.find((item) =>
              item.name.toLowerCase().includes(trimmedQuery),
            ) || restaurant.menuPreview?.[0];

            return (
            <Link
              key={restaurant.id}
              to={`/restaurant/${restaurant.id}`}
              className="group flex gap-3 rounded-3xl border border-slate-100 bg-white p-3 shadow-md shadow-slate-200/70 transition-all duration-200 active:scale-95 hover:shadow-md md:block md:overflow-hidden md:p-0"
            >
              <img
                src={featuredDish?.imageUrl || restaurant.imageUrl}
                alt={restaurant.name}
                className="h-24 w-28 shrink-0 rounded-2xl object-cover transition duration-500 md:h-52 md:w-full md:rounded-none md:group-hover:scale-105"
              />
              <div className="min-w-0 flex-1 p-1 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-black text-slate-950 md:text-xl">{restaurant.name}</h2>
                    <p className="mt-1 truncate text-xs font-bold text-indigo-700 md:text-sm">{restaurant.cuisine}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 md:px-3 md:text-xs">
                    Open
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 md:mt-3 md:text-sm">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="line-clamp-1">{restaurant.location}</span>
                </p>
                <div className="mt-2 flex items-center gap-3 text-[11px] font-extrabold text-slate-700 md:text-xs">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {(4.2 + (index % 5) * 0.1).toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5 text-indigo-700" />
                    {25 + (index % 4) * 5}-{35 + (index % 4) * 5} min
                  </span>
                </div>
                {featuredDish ? (
                  <p className="mt-2 truncate text-xs font-bold text-slate-500 md:mt-4">
                    Try {featuredDish.name}
                  </p>
                ) : null}
              </div>
            </Link>
          );
          })}
        </div>
      )}
    </section>
  );
};

export default RestaurantListingPage;
