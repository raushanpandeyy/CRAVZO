import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

<<<<<<< HEAD
import { getFavorites, removeFavorite } from "../../services/favoriteService.js";
=======
import { getFavorites, removeFavorite } from "../../services/favoriteService";
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadFavorites = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch (requestError) {
      setError(requestError.message || "Failed to load favorites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemove = async (restaurantId) => {
    try {
      setMessage("");
      setError("");
      await removeFavorite(restaurantId);
      setFavorites((prev) => prev.filter((favorite) => favorite.restaurantId !== restaurantId));
      setMessage("Restaurant removed from favorites.");
    } catch (requestError) {
      setError(requestError.message || "Failed to remove favorite");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-slate-900">Your Favorite Restaurants</h1>
          <p className="mt-2 text-sm text-slate-500">Quickly jump back to the restaurants you liked most.</p>
        </div>

        {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        {loading ? (
          <div className="rounded-3xl bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm">Loading favorites...</div>
        ) : favorites.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="overflow-hidden rounded-3xl bg-white shadow-sm">
                <div className="relative">
                  <img
                    src={favorite.restaurant.imageUrl}
                    alt={favorite.restaurant.name}
                    className="h-52 w-full object-cover"
                  />
                  <button
                    onClick={() => handleRemove(favorite.restaurantId)}
                    className="absolute right-4 top-4 rounded-full bg-white p-2 shadow"
                  >
                    <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
                  </button>
                </div>

                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{favorite.restaurant.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">{favorite.restaurant.location}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${favorite.restaurant.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {favorite.restaurant.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-indigo-700">{favorite.restaurant.cuisine}</p>
                  <p className="text-sm text-slate-500 line-clamp-2">{favorite.restaurant.description || "No description available yet."}</p>

                  <Link
                    to={`/restaurant/${favorite.restaurantId}`}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Explore Restaurant
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm">
            No favorite restaurants yet. Add some from a restaurant page and they will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
