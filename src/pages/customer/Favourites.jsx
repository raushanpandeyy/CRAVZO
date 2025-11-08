import React, { useState } from "react";
import { Heart } from "lucide-react";

export default function Favorites() {
  const [selected, setSelected] = useState("RESTAURANTS");

  const [favoriteRestaurants, setFavoriteRestaurants] = useState([
    { id: 1, name: "Biryani Blues", location: "Dwarka Sector 12", image: "https://i.ibb.co/zJ75Xsc/res1.jpg", rating: 4.4 },
    { id: 2, name: "Burger Singh", location: "Uttam Nagar", image: "https://i.ibb.co/Zh0S8zh/res2.jpg", rating: 4.2 }
  ]);

  const [favoriteDishes, setFavoriteDishes] = useState([
    { id: 101, name: "Chicken Biryani", restaurant: "Biryani Blues", price: "₹210", image: "https://i.ibb.co/nbXfY9t/biryani.jpg", rating: 4.6 },
    { id: 102, name: "Cheese Burger", restaurant: "Burger Singh", price: "₹150", image: "https://i.ibb.co/Gs3Ck0f/burger.jpg", rating: 4.3 }
  ]);

  const removeRestaurant = (id) => {
    setFavoriteRestaurants(favoriteRestaurants.filter((r) => r.id !== id));
  };

  const removeDish = (id) => {
    setFavoriteDishes(favoriteDishes.filter((d) => d.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-100 sm:pl-84 px-6 py-10 flex flex-col">

      <h1 className="text-3xl font-bold text-indigo-900 mb-6">Your Favorites</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setSelected("RESTAURANTS")}
          className={`px-5 py-2 rounded-xl font-semibold transition 
            ${selected === "RESTAURANTS" ? "bg-indigo-900 text-white scale-[1.02]" : "bg-white border border-indigo-300 text-indigo-900 hover:bg-indigo-50"}`}
        >
          Restaurants
        </button>

        <button
          onClick={() => setSelected("DISHES")}
          className={`px-5 py-2 rounded-xl font-semibold transition 
            ${selected === "DISHES" ? "bg-indigo-900 text-white scale-[1.02]" : "bg-white border border-indigo-300 text-indigo-900 hover:bg-indigo-50"}`}
        >
          Dishes
        </button>
      </div>

      {/* Restaurant Cards */}
      {selected === "RESTAURANTS" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {favoriteRestaurants.length === 0 && (
            <p className="text-indigo-900 text-lg">No favorite restaurants yet.</p>
          )}

          {favoriteRestaurants.map((res) => (
            <div key={res.id} className="relative bg-indigo-900 text-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-all duration-300">

              {/* Heart Button */}
              <button
                onClick={() => removeRestaurant(res.id)}
                className="absolute top-3 right-3 bg-white p-1 rounded-full"
              >
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
              </button>

              <img src={res.image} alt={res.name} className="w-full h-40 object-cover" />

              <div className="p-4 space-y-2">
                <h2 className="text-lg font-semibold">{res.name}</h2>
                <p className="text-sm text-gray-300">{res.location}</p>

                <div className="text-sm">⭐ {res.rating}</div>

                <button className="mt-3 w-full bg-white text-indigo-900 px-4 py-2 rounded-lg border-2 border-indigo-300 hover:bg-indigo-50 transition">
                  Explore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dish Cards */}
      {selected === "DISHES" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {favoriteDishes.length === 0 && (
            <p className="text-indigo-900 text-lg">No favorite dishes yet.</p>
          )}

          {favoriteDishes.map((dish) => (
            <div key={dish.id} className="relative bg-indigo-900 text-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-all duration-300">

              {/* Heart Button */}
              <button
                onClick={() => removeDish(dish.id)}
                className="absolute top-3 right-3 bg-white p-1 rounded-full"
              >
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
              </button>

              <img src={dish.image} alt={dish.name} className="w-full h-40 object-cover" />

              <div className="p-4 space-y-2">
                <h2 className="text-lg font-semibold">{dish.name}</h2>
                <p className="text-sm text-gray-300">{dish.restaurant}</p>

                <div className="flex justify-between items-center mt-3">
                  <p className="text-lg font-bold text-corral">{dish.price}</p>
                  <span>⭐ {dish.rating}</span>
                </div>

                <button className="mt-3 w-full bg-white text-indigo-900 px-4 py-2 rounded-lg border-2 border-indigo-300 hover:bg-indigo-50 transition">
                  Order Again
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

