import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Store } from "lucide-react";

import { listRestaurants } from "../../services/foodService.js";

const RestaurantListingPage = () => {
  const [restaurants, setRestaurants] = useState([]);
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

  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-12 pt-32">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Explore</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Restaurants</h1>
        </div>
        <Store className="hidden h-10 w-10 text-indigo-700 md:block" />
      </div>

      {loading ? (
        <p className="text-slate-600">Loading restaurants...</p>
      ) : error ? (
        <p className="text-rose-600">{error}</p>
      ) : restaurants.length === 0 ? (
        <p className="text-slate-600">No restaurants found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              to={`/restaurant/${restaurant.id}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <img
                src={restaurant.imageUrl}
                alt={restaurant.name}
                className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">{restaurant.name}</h2>
                    <p className="mt-1 text-sm font-medium text-indigo-700">{restaurant.cuisine}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    Open
                  </span>
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="line-clamp-1">{restaurant.location}</span>
                </p>
                {restaurant.menuPreview?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {restaurant.menuPreview.slice(0, 3).map((item) => (
                      <span key={item.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {item.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default RestaurantListingPage;
