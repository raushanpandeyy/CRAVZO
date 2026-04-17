import React, { useEffect, useMemo, useState } from "react";
import { Heart, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { addFavorite, getFavorites, removeFavorite } from "../../services/favoriteService";
import { getRestaurantById } from "../../services/foodService";
import { getRestaurantReviews, saveReview } from "../../services/reviewService";

const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(0)}`;

const Stars = ({ rating, onSelect = null }) => (
  <div className="flex items-center gap-1 text-amber-500">
    {Array.from({ length: 5 }).map((_, index) => {
      const filled = index < rating;
      return (
        <button
          key={index}
          type="button"
          onClick={onSelect ? () => onSelect(index + 1) : undefined}
          className={onSelect ? "cursor-pointer" : "cursor-default"}
        >
          <Star className={`h-4 w-4 ${filled ? "fill-current" : ""}`} />
        </button>
      );
    })}
  </div>
);

const RestaurantPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("cravzoCart"));
    if (stored) {
      setCart(stored);
    }

    const loadRestaurant = async () => {
      setLoading(true);
      setError("");
      setReviewForm({ rating: 5, comment: "" });

      try {
        const [restaurantData, reviewData, favorites] = await Promise.all([
          getRestaurantById(id),
          getRestaurantReviews(id),
          user?.isLoggedIn ? getFavorites().catch(() => []) : Promise.resolve([]),
        ]);

        setRestaurant(restaurantData);
        setReviews(reviewData);
        setFavoriteIds(favorites.map((favorite) => favorite.restaurantId));

        const myReview = reviewData.find((review) => review.user?.id === user?.id);
        if (myReview) {
          setReviewForm({
            rating: myReview.rating,
            comment: myReview.comment || "",
          });
        }
      } catch (requestError) {
        console.error("Failed to load restaurant", requestError);
        setRestaurant(null);
        setError(requestError.message || "Failed to load restaurant");
      } finally {
        setLoading(false);
      }
    };

    loadRestaurant();
  }, [id, user?.id, user?.isLoggedIn]);

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cravzoCart", JSON.stringify(newCart));
  };

  const getPrice = (price) => {
    if (typeof price === "number") return price;
    return parseInt(price.toString().replace("Rs", "").replace("?", "").trim(), 10) || 0;
  };

  const addToCart = (dish) => {
    const existing = cart.find((item) => item.id === dish.id);
    if (existing) {
      increase(dish.id);
    } else {
      updateCart([
        ...cart,
        {
          ...dish,
          quantity: 1,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
        },
      ]);
    }
  };

  const increase = (dishId) => {
    updateCart(cart.map((item) => (item.id === dishId ? { ...item, quantity: item.quantity + 1 } : item)));
  };

  const decrease = (dishId) => {
    updateCart(
      cart
        .map((item) => (item.id === dishId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const itemTotal = cart.reduce((acc, item) => acc + getPrice(item.price) * item.quantity, 0);
  const deliveryFee = itemTotal > 500 ? 0 : 40;
  const packagingFee = Math.round(itemTotal * 0.03);
  const taxes = Math.round(itemTotal * 0.18);
  const grandTotal = itemTotal + deliveryFee + packagingFee + taxes;

  const goToCheckout = () => {
    window.scrollTo(0, 0);
    navigate("/checkout");
  };

  const isFavorite = favoriteIds.includes(id);
  const averageRating = useMemo(() => {
    if (!reviews.length) return null;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const toggleFavorite = async () => {
    if (!user?.isLoggedIn) {
      navigate("/signin");
      return;
    }

    try {
      setMessage("");
      setError("");
      if (isFavorite) {
        await removeFavorite(id);
        setFavoriteIds((prev) => prev.filter((favoriteId) => favoriteId !== id));
        setMessage("Restaurant removed from favorites.");
      } else {
        await addFavorite(id);
        setFavoriteIds((prev) => [...prev, id]);
        setMessage("Restaurant added to favorites.");
      }
    } catch (requestError) {
      setError(requestError.message || "Failed to update favorite");
    }
  };

  const handleSaveReview = async () => {
    if (!user?.isLoggedIn) {
      navigate("/signin");
      return;
    }

    setSavingReview(true);
    setMessage("");
    setError("");

    try {
      await saveReview({
        restaurantId: id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });

      const refreshedReviews = await getRestaurantReviews(id);
      setReviews(refreshedReviews);
      setMessage("Review saved successfully.");
    } catch (requestError) {
      setError(requestError.message || "Failed to save review");
    } finally {
      setSavingReview(false);
    }
  };

  if (loading) {
    return <div className="pt-24 text-center">Loading restaurant...</div>;
  }

  if (!restaurant) {
    return <div className="pt-24 text-center">Restaurant not found</div>;
  }

  return (
    <div className="pt-32 max-w-7xl mx-auto p-4">
      {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="flex flex-col md:flex-row gap-8 items-center bg-gray-50 p-6 rounded-2xl shadow-sm mb-10">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold">{restaurant.name}</h1>
            <button onClick={toggleFavorite} className="rounded-full bg-white p-3 shadow-sm">
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-500"}`} />
            </button>
          </div>
          <p className="mt-3 text-slate-600">{restaurant.location}</p>
          <p className="mt-1 text-indigo-700 font-medium">{restaurant.cuisine}</p>
          <p className="mt-3 text-sm text-slate-600">{restaurant.description || "Fresh food delivered from this restaurant."}</p>
          <div className="mt-4 flex items-center gap-3 text-sm text-slate-600">
            <span className={`rounded-full px-3 py-1 font-semibold ${restaurant.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              {restaurant.isOpen ? "Open" : "Closed"}
            </span>
            {averageRating ? <span>{averageRating} / 5 from {reviews.length} reviews</span> : <span>No reviews yet</span>}
          </div>
        </div>

        <img src={restaurant.imageUrl} alt={restaurant.name} className="w-full md:w-1/2 h-64 object-cover rounded-xl" />
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1">
          {restaurant.menuItems.map((dish) => {
            const cartItem = cart.find((item) => item.id === dish.id);

            return (
              <div key={dish.id} className="flex justify-between mb-6 border-b pb-4 gap-4">
                <div>
                  <h3 className="font-bold">{dish.name}</h3>
                  <p>{formatCurrency(getPrice(dish.price))}</p>
                  <p>{dish.category}</p>
                  <p className="text-sm text-slate-500">{dish.description}</p>
                </div>

                <div>
                  <img src={dish.imageUrl || restaurant.imageUrl} className="w-24 h-24 rounded object-cover" />

                  {!cartItem ? (
                    <button onClick={() => addToCart(dish)} className="bg-indigo-600 text-white px-3 py-1 mt-2 rounded">
                      Add
                    </button>
                  ) : (
                    <div className="flex gap-2 mt-2 items-center">
                      <button onClick={() => decrease(dish.id)}>-</button>
                      <span>{cartItem.quantity}</span>
                      <button onClick={() => increase(dish.id)}>+</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Reviews</h2>
                <p className="mt-1 text-sm text-slate-500">See what customers are saying and leave your own feedback.</p>
              </div>
              {averageRating ? <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">Average {averageRating}/5</span> : null}
            </div>

            {user?.accountType === "customer" ? (
              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Your review</p>
                <div className="mt-3">
                  <Stars rating={reviewForm.rating} onSelect={(rating) => setReviewForm((prev) => ({ ...prev, rating }))} />
                </div>
                <textarea
                  value={reviewForm.comment}
                  onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                  rows="4"
                  className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3"
                  placeholder="Share your experience with this restaurant"
                />
                <button
                  onClick={handleSaveReview}
                  disabled={savingReview}
                  className="mt-4 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {savingReview ? "Saving..." : "Save Review"}
                </button>
              </div>
            ) : null}

            <div className="mt-6 space-y-4">
              {reviews.length ? (
                reviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{review.user?.name || "Customer"}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(review.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <Stars rating={review.rating} />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-700">{review.comment || "No written comment added."}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
                  No reviews yet. Be the first to review this restaurant.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:block lg:w-80">
          <div className="sticky top-32 bg-white p-4 rounded shadow">
            <h2 className="font-bold mb-4">Cart ({cart.length})</h2>

            {cart.map((item) => (
              <div key={item.id} className="flex justify-between mb-3">
                <span>{item.name} x {item.quantity}</span>
                <span>{formatCurrency(getPrice(item.price) * item.quantity)}</span>
              </div>
            ))}

            <hr className="my-2" />
            <div className="flex justify-between text-sm"><span>Item Total</span><span>{formatCurrency(itemTotal)}</span></div>
            <div className="flex justify-between text-sm"><span>Delivery</span><span>{deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}</span></div>
            <div className="flex justify-between text-sm"><span>Packaging</span><span>{formatCurrency(packagingFee)}</span></div>
            <div className="flex justify-between text-sm"><span>Taxes</span><span>{formatCurrency(taxes)}</span></div>
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(grandTotal)}</span></div>

            <button onClick={goToCheckout} className="w-full bg-indigo-600 text-white mt-4 py-2 rounded">
              Checkout
            </button>
          </div>
        </div>
      </div>

      <div className="lg:hidden mt-6 bg-white p-4 rounded shadow">
        <h2 className="font-bold mb-4">Cart ({cart.length})</h2>

        {cart.map((item) => (
          <div key={item.id} className="flex justify-between mb-3">
            <span>{item.name} x {item.quantity}</span>
            <span>{formatCurrency(getPrice(item.price) * item.quantity)}</span>
          </div>
        ))}

        <hr className="my-2" />
        <div className="flex justify-between text-sm"><span>Item Total</span><span>{formatCurrency(itemTotal)}</span></div>
        <div className="flex justify-between text-sm"><span>Delivery</span><span>{deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}</span></div>
        <div className="flex justify-between text-sm"><span>Packaging</span><span>{formatCurrency(packagingFee)}</span></div>
        <div className="flex justify-between text-sm"><span>Taxes</span><span>{formatCurrency(taxes)}</span></div>
        <hr className="my-2" />
        <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(grandTotal)}</span></div>

        <button onClick={goToCheckout} className="w-full bg-indigo-600 text-white mt-4 py-2 rounded">
          Checkout
        </button>
      </div>
    </div>
  );
};

export default RestaurantPage;
