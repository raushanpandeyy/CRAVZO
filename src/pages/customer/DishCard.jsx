import React, { useState } from "react";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import ShareButton from "../../components/ShareButton.jsx";
import { getShareUrl, getShareText } from "../../utils/share.js";

const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f1f5f9' width='400' height='300'/%3E%3Ctext fill='%2394a3b8' font-family='Arial' font-size='18' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

const formatPrice = (value) => {
  if (typeof value === "number") {
    return `Rs ${value.toFixed(0)}`;
  }

  return value || "Rs 0";
};

const DishCard = ({ dish }) => {
  const [imgError, setImgError] = useState(false);

  if (!dish) {
    return null;
  }

  const destination = dish.restaurantId ? `/restaurant/${dish.restaurantId}` : `/dish/${encodeURIComponent(dish.name)}`;
  const imgSrc = imgError ? FALLBACK_IMG : (dish.imageUrl || dish.image || FALLBACK_IMG);

  return (
    <Link
      to={destination}
      className="flex h-full flex-col overflow-hidden rounded-2xl bg-indigo-900 text-white shadow-lg transition-all duration-300 hover:scale-[1.02]"
    >
      <div>
        <img
          src={imgSrc}
          alt={dish.name || "Dish"}
          onError={() => setImgError(true)}
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
          <div className="flex items-center gap-1">
            <ShareButton
              url={getShareUrl.dish(dish.name)}
              text={getShareText.dish(dish.name, dish.restaurantName || dish.restaurant)}
              className="text-gray-300 hover:bg-white/10"
              iconSize={16}
            />
            <span className="rounded-lg border border-indigo-400 bg-white px-4 py-2 text-sm font-semibold text-indigo-900 transition hover:bg-indigo-50">
              View Dish
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DishCard;
