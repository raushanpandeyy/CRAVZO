import React from "react";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";

const formatPrice = (value) => {
  if (typeof value === "number") {
    return `Rs ${value.toFixed(0)}`;
  }

  return value || "Rs 0";
};

const DishCard = ({ dish }) => {
  if (!dish) {
    return null;
  }

  const destination = dish.restaurantId ? `/restaurant/${dish.restaurantId}` : `/dish/${encodeURIComponent(dish.name)}`;

  return (
    <Link
      to={destination}
      className="flex h-full flex-col overflow-hidden rounded-2xl bg-indigo-900 text-white shadow-lg transition-all duration-300 hover:scale-[1.02]"
    >
      <div>
        <img
          src={dish.imageUrl || dish.image}
          alt={dish.name || "Dish"}
          className="h-40 w-full object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col space-y-2 p-4">
        <h2 className="text-lg font-semibold">{dish.name}</h2>
        <p className="text-sm text-gray-300">{dish.restaurantName || dish.restaurant || "Cravzo kitchen"}</p>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-lg font-bold text-orange-300">{formatPrice(dish.price)}</p>
          <div className="flex items-center">
            <Star className="mr-1 h-4 w-4 text-yellow-400" />
            <span className="text-sm">{dish.rating ?? "4.5"}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="text-xs text-gray-300">{dish.date || "Fresh picks available"}</p>
          <span className="rounded-lg border border-indigo-400 bg-white px-4 py-2 text-sm font-semibold text-indigo-900 transition hover:bg-indigo-50">
            View Dish
          </span>
        </div>
      </div>
    </Link>
  );
};

export default DishCard;
