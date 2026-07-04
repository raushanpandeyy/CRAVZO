import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, Heart, MapPin, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { addFavorite, checkIsFavorite, removeFavorite } from "../../services/favoriteService.js";
import { getRestaurantById } from "../../services/foodService.js";
import { getRestaurantReviews, saveReview } from "../../services/reviewService.js";
import ShareButton from "../../components/ShareButton.jsx";
import { getShareUrl, getShareText } from "../../utils/share.js";
import { Skeleton, SkeletonRow } from "../../components/Skeleton.jsx";
import { getCloudinaryUrl } from "../../utils/cloudinary.js";


const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f1f5f9' width='400' height='300'/%3E%3Ctext fill='%2394a3b8' font-family='Arial' font-size='18' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

const _restaurantCache = new Map();

const getOptimizedImage = (
  url,
  width = 600,
  height = 400
) => {
  if (!url) return FALLBACK_IMG;
  if (url.includes("cloudinary.com")) return getCloudinaryUrl(url, { width, height });
  return url;
};

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
  const [selectedSizes, setSelectedSizes] = useState({});
  const [selectedSideDishes, setSelectedSideDishes] = useState({});
  const [loading, setLoading] = useState(true);
  // Fix 4: isFavorite is a simple boolean, not a module-level flag, so initialize as false
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("dodagoCart");
    if (stored) {
      try {
        const parsedCart = JSON.parse(stored);
        // Ensure it's an array
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        } else {
          setCart([]);
          localStorage.removeItem("dodagoCart");
        }
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error);
        setCart([]);
        localStorage.removeItem("dodagoCart");
      }
    }

    const loadRestaurant = async () => {
      setLoading(true);
      setError("");
      setReviewForm({ rating: 5, comment: "" });

      const cached = _restaurantCache.get(id);
      if (cached) {
        setRestaurant(cached.restaurant || null);
        setReviews(cached.reviews || []);
        setIsFavorite(cached.isFavorite || false);
        const myReview = (cached.reviews || []).find((review) => review.user?.id === user?.id);
        if (myReview) {
          setReviewForm({ rating: myReview.rating, comment: myReview.comment || "" });
        }
        setLoading(false);
      }

      try {
        const [restaurantData, reviewData, isFav] = await Promise.all([
          getRestaurantById(id),
          getRestaurantReviews(id),
          user?.isLoggedIn ? checkIsFavorite(id).catch(() => false) : Promise.resolve(false),
        ]);

        _restaurantCache.set(id, { restaurant: restaurantData, reviews: reviewData, isFavorite: isFav });

        if (!cached) {
          setRestaurant(restaurantData);
          setReviews(reviewData);
          setIsFavorite(isFav);
        } else {
          setRestaurant(restaurantData);
          setReviews(reviewData);
          setIsFavorite(isFav);
        }

        const myReview = reviewData.find((review) => review.user?.id === user?.id);
        if (myReview) {
          setReviewForm({ rating: myReview.rating, comment: myReview.comment || "" });
        }
      } catch (requestError) {
        if (!cached) {
          console.error("Failed to load restaurant", requestError);
          setRestaurant(null);
          setError(requestError.message || "Failed to load restaurant");
        }
      } finally {
        if (!cached) setLoading(false);
      }
    };

    loadRestaurant();
  }, [id, user?.id, user?.isLoggedIn]);

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("dodagoCart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartChange"));
  };

  const getSizePrice = (dish, size) => {
    if (size && dish.sizes && dish.sizes.length > 0) {
      const entry = dish.sizes.find((s) => s.size === size);
      if (entry) return Number(entry.price);
    }
    return getPrice(dish.price);
  };

  const getPrice = (price) => {
    if (typeof price === "number") return price;
    return parseInt(price.toString().replace("Rs", "").replace("?", "").trim(), 10) || 0;
  };

  const addToCart = (dish) => {
    const size = (dish.sizes && dish.sizes.length > 0) ? (selectedSizes[dish.id] || dish.sizes[0].size) : null;
    const unitPrice = getSizePrice(dish, size);
    const chosenSideDishes = selectedSideDishes[dish.id] || [];
    const sideDishTotal = chosenSideDishes.reduce((sum, sd) => sum + Number(sd.price), 0);
    const effectivePrice = unitPrice + sideDishTotal;
    const cartKey = size ? `${dish.id}-${size}` : dish.id;
    const existing = safeCart.find((item) => item.cartKey === cartKey);
    if (existing) {
      increase(cartKey);
    } else {
      updateCart([
        ...safeCart,
        {
          ...dish,
          cartKey,
          quantity: 1,
          size,
          price: unitPrice,
          selectedSideDishes: chosenSideDishes,
          notes: "",
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
        },
      ]);
    }
  };

  const increase = (cartKey) => {
    updateCart(safeCart.map((item) => (item.cartKey === cartKey ? { ...item, quantity: item.quantity + 1 } : item)));
  };

  const decrease = (cartKey) => {
    updateCart(
      safeCart
        .map((item) => (item.cartKey === cartKey ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const safeCart = useMemo(() => Array.isArray(cart) ? cart : [], [cart]);

  // Memoize all cart totals — these were recalculating on every render including
  // re-renders triggered by hover, scroll, and unrelated state changes
  const { itemTotal, deliveryFee, packagingFee, taxes, grandTotal, cartItemCount } = useMemo(() => {
    const itemTotal = safeCart.reduce((acc, item) => acc + getPrice(item.price) * item.quantity, 0);
    const deliveryFee = itemTotal > 500 ? 0 : 40;
    const packagingFee = Math.round(itemTotal * 0.01);
    const taxes = Math.round(itemTotal * 0.18);
    const grandTotal = itemTotal + deliveryFee + packagingFee + taxes;
    const cartItemCount = safeCart.reduce((total, item) => total + Number(item.quantity || 0), 0);
    return { itemTotal, deliveryFee, packagingFee, taxes, grandTotal, cartItemCount };
  }, [safeCart]);

  const cartMap = useMemo(
    () => new Map(safeCart.map((item) => [item.cartKey || item.id, item])),
    [safeCart]
  );

  const goToCheckout = useCallback(() => {
    window.scrollTo(0, 0);
    navigate("/cart");
  }, [navigate]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return null;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const toggleFavorite = useCallback(async () => {
    if (!user?.isLoggedIn) {
      navigate("/signin");
      return;
    }

    try {
      setMessage("");
      setError("");
      if (isFavorite) {
        await removeFavorite(id);
        setIsFavorite(false);
        setMessage("Restaurant removed from favorites.");
      } else {
        await addFavorite(id);
        setIsFavorite(true);
        setMessage("Restaurant added to favorites.");
      }
    } catch (requestError) {
      setError(requestError.message || "Failed to update favorite");
    }
  }, [user?.isLoggedIn, navigate, isFavorite, id]);

  const handleSaveReview = useCallback(async () => {
    if (!user?.isLoggedIn) {
      navigate("/signin");
      return;
    }

    setSavingReview(true);
    setMessage("");
    setError("");

    try {
      const saved = await saveReview({
        restaurantId: id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });

      setReviews((prev) => {
        const filtered = prev.filter((r) => r.user?.id !== user?.id);
        return [...filtered, saved].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
      setMessage("Review saved successfully.");
    } catch (requestError) {
      setError(requestError.message || "Failed to save review");
    } finally {
      setSavingReview(false);
    }
  }, [user?.isLoggedIn, user?.id, navigate, id, reviewForm.rating, reviewForm.comment]);

  if (loading) {
    return (
      <div className="bg-slate-50 pb-32 md:pb-10">
        <div className="mx-auto max-w-7xl md:px-4 md:pt-32">
          <Skeleton className="mx-4 h-56 rounded-none md:mx-0 md:h-80 md:rounded-3xl" />
          <div className="relative z-10 mx-4 -mt-10 rounded-3xl bg-white p-5 shadow-xl md:mx-8 md:-mt-16 md:p-7">
            <Skeleton className="h-8 w-2/3 md:h-12" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-4 w-1/2" />
          </div>
          <div className="mt-7 px-4 md:px-0">
            <Skeleton className="mb-4 h-5 w-32" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return <div className="pt-24 text-center">Restaurant not found</div>;
  }

  const menuItems = restaurant.menuItems || [];
  const restaurantOpen = restaurant.isOpen !== false;

  return (
    <div className="bg-slate-50 pb-32 md:pb-10">
      <div className="mx-auto max-w-7xl md:px-4 md:pt-32">
        {message ? <div className="mx-4 mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 md:mx-0">{message}</div> : null}
        {error ? <div className="mx-4 mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 md:mx-0">{error}</div> : null}

        <section className="relative md:overflow-hidden md:rounded-3xl">
          <div className="relative h-56 w-full md:h-80">
            <img
              src={getOptimizedImage(
  restaurant.imageUrl,
  1200,
  500
)}
              alt={restaurant.name}
              width={1200}
              height={500}
              loading="eager"
              fetchPriority="high"
              className="h-full w-full object-cover"
              onError={(e) => { e.target.src = FALLBACK_IMG; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          </div>

          <div className="relative z-10 mx-4 -mt-10 rounded-3xl bg-white p-5 shadow-xl shadow-slate-300/60 md:mx-8 md:-mt-16 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{restaurant.name}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-700">
                  <span>{restaurant.cuisine || "Fresh meals"}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    {averageRating || "4.4"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ShareButton
                  url={getShareUrl.restaurant(restaurant.id)}
                  text={getShareText.restaurant(restaurant.name)}
                  className="bg-slate-50 text-slate-600 shadow-sm"
                />
                <button
                  onClick={toggleFavorite}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-600 shadow-sm transition-all duration-200 active:scale-95"
                  aria-label="Toggle favorite"
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
                </button>
              </div>
            </div>

            <p className="mt-3 flex items-start gap-2 text-sm font-medium leading-6 text-slate-500">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              {restaurant.location || restaurant.city || "Near you"}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1.5 text-xs font-black ${restaurantOpen ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {restaurantOpen ? "Open" : "Closed"}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-500">
                <Clock3 className="h-4 w-4 text-indigo-700" />
                {restaurant.openingTime || "25"} - {restaurant.closingTime || "35 min"}
              </span>
              {reviews.length ? <span className="text-xs font-bold text-slate-500">{reviews.length} reviews</span> : null}
            </div>

            {restaurant.description ? (
              <p className="mt-4 text-sm leading-6 text-slate-600">{restaurant.description}</p>
            ) : null}
          </div>
        </section>

        <div className="mt-7 flex flex-col gap-8 px-4 lg:flex-row md:px-0">
          <main className="flex-1 space-y-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#ff6b5f]">Menu</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Recommended for you</h2>
            </div>

            {menuItems.map((dish) => {
            const hasSizes = dish.sizes && dish.sizes.length > 0;
            const selectedSize = hasSizes ? (selectedSizes[dish.id] || dish.sizes[0].size) : null;
            const displayPrice = hasSizes ? getSizePrice(dish, selectedSize) : getPrice(dish.price);
            const cartKey = hasSizes ? `${dish.id}-${selectedSize}` : dish.id;
            const cartItem = cartMap.get(cartKey);

            return (
              <article
                key={dish.id}
                className="flex gap-4 rounded-3xl bg-white p-4 shadow-sm shadow-slate-200/70 transition-all duration-200 active:scale-[0.99] hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black text-slate-950">{dish.name}</h3>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">{formatCurrency(displayPrice)}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {hasSizes ? (
                      <div className="flex gap-1">
                        {dish.sizes.map((s) => (
                          <button
                            key={s.size}
                            onClick={() => setSelectedSizes((prev) => ({ ...prev, [dish.id]: s.size }))}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold border transition-all ${
                              selectedSize === s.size
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            }`}
                          >
                            {s.size}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">{dish.category || "Special"}</p>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                    {dish.description || "Freshly prepared and packed with care."}
                  </p>

                  {dish.sideDishes && dish.sideDishes.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {dish.sideDishes.map((sd) => {
                        const isSelected = (selectedSideDishes[dish.id] || []).some((s) => s.name === sd.name);
                        return (
                          <button
                            key={sd.name}
                            type="button"
                            onClick={() => {
                              const current = selectedSideDishes[dish.id] || [];
                              const updated = isSelected
                                ? current.filter((s) => s.name !== sd.name)
                                : [...current, sd];
                              setSelectedSideDishes((prev) => ({ ...prev, [dish.id]: updated }));
                            }}
                            className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-amber-700 border-amber-300 hover:bg-amber-50"
                            }`}
                          >
                            {sd.name} +Rs {Number(sd.price)}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="relative h-28 w-28 shrink-0">
                  <img
                    src={getOptimizedImage(dish.imageUrl || restaurant.imageUrl, 300, 200)}
                    alt={dish.name}
                    loading="lazy"
                    className="h-full w-full rounded-2xl object-cover"
                    onError={(e) => { e.target.src = FALLBACK_IMG; }}
                  />

                  <div className="absolute left-1 top-1 z-10">
                    <ShareButton
                      url={getShareUrl.dish(dish.name)}
                      text={getShareText.dish(dish.name, restaurant.name)}
                      className="bg-white/80 text-slate-600 shadow-sm backdrop-blur hover:bg-white"
                      iconSize={14}
                    />
                  </div>

                  {!cartItem ? (
                    <button
                      onClick={() => addToCart(dish)}
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-5 py-2 text-xs font-black text-indigo-700 shadow-lg shadow-slate-300 transition-all duration-200 active:scale-95"
                    >
                      Add
                    </button>
                  ) : (
                    <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-indigo-700 px-2 py-1.5 text-white shadow-lg">
                      <button onClick={() => decrease(cartKey)} className="rounded-full p-1 transition-all duration-200 active:scale-95" aria-label="Decrease item">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-5 text-center text-sm font-black">{cartItem.quantity}</span>
                      <button onClick={() => increase(cartKey)} className="rounded-full p-1 transition-all duration-200 active:scale-95" aria-label="Increase item">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          <section className="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70 md:p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Reviews</h2>
                <p className="mt-1 text-sm text-slate-500">See what customers are saying and leave your own feedback.</p>
              </div>
              <span className="rounded-2xl bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
                {averageRating || "New"} {averageRating ? "/ 5" : "reviews"}
              </span>
            </div>

            {user?.accountType === "customer" ? (
              <div className="mt-6 rounded-3xl bg-slate-50 p-4">
                <p className="font-bold text-slate-900">Your review</p>
                <div className="mt-3">
                  <Stars rating={reviewForm.rating} onSelect={(rating) => setReviewForm((prev) => ({ ...prev, rating }))} />
                </div>
                <textarea
                  value={reviewForm.comment}
                  onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                  rows="4"
                  className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Share your experience with this restaurant"
                />
                <button
                  onClick={handleSaveReview}
                  disabled={savingReview}
                  className="mt-4 w-full rounded-2xl bg-indigo-700 px-4 py-3 text-sm font-black text-white transition-all duration-200 active:scale-95 hover:bg-indigo-800 disabled:opacity-60"
                >
                  {savingReview ? "Saving..." : "Save Review"}
                </button>
              </div>
            ) : null}

            <div className="mt-6 space-y-4">
              {reviews.length ? (
                reviews.map((review) => (
                  <div key={review.id} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black text-slate-900">{review.user?.name || "Customer"}</p>
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
          </section>
        </main>

        <aside className="hidden lg:block lg:w-80">
          <div className="sticky top-32 rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/80">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-slate-950">
              <ShoppingBag className="h-5 w-5 text-indigo-700" />
              Cart ({cartItemCount})
            </h2>

            {safeCart.map((item) => (
              <div key={item.id} className="mb-3 flex justify-between gap-3 text-sm">
                <span className="font-semibold text-slate-600">{item.name} x {item.quantity}</span>
                <span className="font-bold text-slate-950">{formatCurrency(getPrice(item.price) * item.quantity)}</span>
              </div>
            ))}

            <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4">
              <div className="flex justify-between text-sm"><span>Item Total</span><span>{formatCurrency(itemTotal)}</span></div>
              <div className="flex justify-between text-sm"><span>Delivery</span><span>{deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}</span></div>
              <div className="flex justify-between text-sm"><span>Packaging</span><span>{formatCurrency(packagingFee)}</span></div>
              <div className="flex justify-between text-sm"><span>Taxes</span><span>{formatCurrency(taxes)}</span></div>
              <div className="border-t border-slate-200 pt-3 text-lg font-black">
                <div className="flex justify-between"><span>Total</span><span>{formatCurrency(grandTotal)}</span></div>
              </div>
            </div>

            <button onClick={goToCheckout} className="mt-4 w-full rounded-2xl bg-indigo-700 py-3 text-sm font-black text-white transition-all duration-200 active:scale-95 hover:bg-indigo-800">
              Checkout
            </button>
          </div>
        </aside>
        </div>
      </div>

      {cartItemCount > 0 ? (
        <div className="fixed inset-x-0 bottom-20 z-40 mx-auto w-[calc(100%-1.5rem)] max-w-md rounded-t-3xl rounded-b-2xl bg-white p-4 shadow-xl shadow-slate-900/20 lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">Cart total</p>
              <p className="text-xl font-black text-slate-950">{formatCurrency(grandTotal)}</p>
            </div>
            <p className="text-sm font-bold text-slate-500">{cartItemCount} items</p>
          </div>
          <div className="mb-3 grid grid-cols-3 gap-2 text-[11px] font-bold text-slate-500">
            <span>Items {formatCurrency(itemTotal)}</span>
            <span>Delivery {deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}</span>
            <span>Taxes {formatCurrency(taxes)}</span>
          </div>
          <button onClick={goToCheckout} className="w-full rounded-2xl bg-indigo-700 py-3 text-sm font-black text-white transition-all duration-200 active:scale-95">
            Checkout
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default RestaurantPage;
