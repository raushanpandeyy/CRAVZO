import React, { useEffect, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  Clock3,
  IndianRupee,
  Star,
  Smartphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import SearchBar from "../../components/common/Searchbar.jsx";
import {
  biryaniplate, burger, cake, dosa, momos,
  chinese, indianthali, rolls, parathe, Chaat,
  icecream, Snacks, southindian, salad, northindian,
} from "../../assets/images/foodimages.js";
import { getNearbyRestaurants, listRestaurants } from "../../services/foodService.js";

const HeroSection = lazy(() => import("./HeroSection.jsx"));
const Citywise = lazy(() => import("./Citywise.jsx"));
const DishCarousel = lazy(() => import("./DishesGallery.jsx"));

const getOptimizedRestaurantImage = (
  url,
  width = 450
) => {
  if (!url) {
    return "https://via.placeholder.com/400x300?text=No+Image";
  }

  if (url.includes("cloudinary.com")) {
    const parts = url.split("/upload/");

    if (parts.length === 2) {
      return `${parts[0]}/upload/c_fill,w_${width},q_auto,f_auto/${parts[1]}`;
    }
  }

  return url;
};

const categories = [
  { name: "Burger", image: burger, to: "/dish/Burger" },
  { name: "Dosa", image: dosa, to: "/dish/Dosa" },
  { name: "Biryani", image: biryaniplate, to: "/dish/Biryani" },
  { name: "Momos", image: momos, to: "/dish/Momos" },
  { name: "Desserts", image: cake, to: "/dish/Cake" },
  { name: "Chinese", image: chinese, to: "/dish/Chinese" },
  { name: "Thali", image: indianthali, to: "/dish/Thali" },
  { name: "Rolls", image: rolls, to: "/dish/Rolls" },
  { name: "Paratha", image: parathe, to: "/dish/Paratha" },
  { name: "Chaat", image: Chaat, to: "/dish/Chaat" },
  { name: "Ice Cream", image: icecream, to: "/dish/Ice%20Cream" },
  { name: "Snacks", image: Snacks, to: "/dish/Snacks" },
  { name: "South Indian", image: southindian, to: "/dish/South%20Indian" },
  { name: "Salad", image: salad, to: "/dish/Salad" },
  { name: "North Indian", image: northindian, to: "/dish/North%20Indian" },
];

const getRestaurantMeta = (restaurant, index) => ({
  rating: restaurant.rating || (4.2 + (index % 5) * 0.1).toFixed(1),
  deliveryTime: restaurant.deliveryTime || `${25 + (index % 4) * 5}-${35 + (index % 4) * 5} min`,
  priceForTwo: restaurant.priceForTwo || `Rs.${250 + (index % 5) * 50} for two`,
});

const formatDistance = (distance) => {
  if (distance === undefined || distance === null || Number.isNaN(Number(distance))) {
    return null;
  }
  return `${Number(distance).toFixed(1)} km away`;
};

const MobileSectionHeader = ({ title, subtitle }) => (
  <div className="flex items-end justify-between px-4">
    <div>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#ff6b5f]">{subtitle}</p>
      <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">{title}</h2>
    </div>
  </div>
);

// CSS duplicates and leak protection image component
const LazyImage = ({ src, alt, className, width = 450 }) => {
  return (
    <img
      src={getOptimizedRestaurantImage(src, width)}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
};

const MobileRestaurantCard = ({ restaurant, index }) => {
  const meta = getRestaurantMeta(restaurant, index);
  const distance = formatDistance(restaurant.distance);

  return (
    <Link
      to={`/restaurant/${restaurant.id}`}
      className="block overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-md shadow-slate-200/80"
    >
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <LazyImage
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="h-full w-full object-cover transition duration-500"
          width={400}
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-indigo-950 shadow">
          Open now
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-black text-white">
          <Star className="h-3.5 w-3.5 fill-white" />
          {meta.rating}
        </div>
      </div>

      <div className="p-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black text-slate-950">{restaurant.name}</h3>
          <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-500">
            {restaurant.cuisine || "Fresh meals"} • {restaurant.location || restaurant.city || "Near you"}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-extrabold text-slate-700">
          <span className="flex items-center gap-1">
            <Clock3 className="h-4 w-4 text-indigo-700" />
            {meta.deliveryTime}
          </span>
          <span className="flex items-center gap-1">
            <IndianRupee className="h-4 w-4 text-indigo-700" />
            {meta.priceForTwo}
          </span>
          {distance ? <span className="text-slate-500">{distance}</span> : null}
        </div>
      </div>
    </Link>
  );
};

const MobileNearbyMiniCard = ({ restaurant, index }) => {
  const dish = restaurant.menuPreview?.[0];
  const dishImage = dish?.imageUrl || restaurant.imageUrl;
  const deliveryTime = restaurant.deliveryTime || `${20 + (index % 4) * 5}-${30 + (index % 4) * 5} min`;
  const price = dish?.price ? Math.floor(Number(dish.price)) : null;

  return (
    <Link
      to={`/restaurant/${restaurant.id}`}
      className="min-w-[120px] snap-start rounded-xl bg-white shadow-sm transition-all duration-200 active:scale-95 overflow-hidden"
    >
      <div className="relative h-20 w-full overflow-hidden rounded-xl">
        <LazyImage
          src={getOptimizedRestaurantImage(dishImage, 200)}
          alt={dish?.name || restaurant.name}
          className="h-full w-full object-cover"
          width={150}
        />
        {price && (
          <span className="absolute bottom-1 right-1 rounded-md bg-indigo-950 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
            ₹{price}
          </span>
        )}
      </div>
      <div className="px-2 py-1.5">
        <p className="line-clamp-1 text-[11px] font-extrabold text-slate-800">{restaurant.name}</p>
        <p className="mt-0.5 text-[10px] font-semibold text-indigo-600">{deliveryTime}</p>
      </div>
    </Link>
  );
};

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [featureEnabled, setFeatureEnabled] = useState(false);

  useEffect(() => {
    const cachedRestaurants = localStorage.getItem("cravzoHomeRestaurants");
    const cachedFeatured = localStorage.getItem("cravzoFeaturedRestaurants");
    const enabled = localStorage.getItem("cravzoFeatureEnabled") === "true";

    setFeatureEnabled(enabled);

    if (cachedRestaurants) {
      try {
        setRestaurants(JSON.parse(cachedRestaurants));
        setLoading(false);
      } catch {}
    }
    if (cachedFeatured) {
      try {
        setFeaturedRestaurants(JSON.parse(cachedFeatured));
      } catch {}
    }

    if (enabled) {
      const handleStorageChange = () => {
        const updated = localStorage.getItem("cravzoFeaturedRestaurants");
        const featEnabled = localStorage.getItem("cravzoFeatureEnabled") === "true";
        setFeatureEnabled(featEnabled);
        if (updated) {
          try {
            setFeaturedRestaurants(JSON.parse(updated));
          } catch {}
        }
      };
      window.addEventListener("storage", handleStorageChange);
      window.addEventListener("cravzoFeatureUpdate", handleStorageChange);
      return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("cravzoFeatureUpdate", handleStorageChange);
      };
    }
  }, []);

  const ComponentLoader = () => <div className="animate-pulse bg-slate-200 h-40 rounded-2xl m-4" />;

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await listRestaurants({ page: 1, limit: 20 });
        const restaurantData = Array.isArray(data) ? data : (data?.data || []);
        setRestaurants(restaurantData);
        localStorage.setItem("cravzoHomeRestaurants", JSON.stringify(restaurantData));
      } catch (error) {
        console.error("Failed to load restaurants", error);
      } finally {
        setLoading(false);
      }
    };

    if (!navigator.geolocation) {
      setLocationError(true);
      loadRestaurants();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const res = await getNearbyRestaurants(lat, lng);
          const restaurantData = Array.isArray(res) ? res : (res?.data || []);
          if (restaurantData.length > 0) {
            setRestaurants(restaurantData);
            localStorage.setItem("cravzoHomeRestaurants", JSON.stringify(restaurantData));
          } else {
            await loadRestaurants();
          }
        } catch (error) {
          console.error("Failed to load nearby restaurants", error);
          await loadRestaurants();
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Location error:", error.code, error.message);
        setLocationError(true);
        loadRestaurants();
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000,
      }
);
  }, []);

  // Auto-scroll featured restaurant every 5 seconds
  useEffect(() => {
    if (!featureEnabled || featuredRestaurants.length === 0) return;
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredRestaurants.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featureEnabled, featuredRestaurants.length]);

  return (
    <div className="bg-slate-50 md:bg-transparent">
      {/* DESKTOP HERO */}
      <div className="hidden md:block">
        <Suspense fallback={<ComponentLoader />}>
          <HeroSection />
        </Suspense>
      </div>

      {/* MOBILE APP BANNER - Small indigo button */}
      <div className="md:hidden">
        {!localStorage.getItem("cravzoAppBannerDismissed") && (
          <div className="absolute right-4 top-14 z-50">
            <button
              onClick={() => {
                const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (isIOS) {
                  alert("To install: Tap the share button in Safari, then scroll down and tap 'Add to Home Screen'");
                } else {
                  window.dispatchEvent(new CustomEvent("showInstallPrompt"));
                }
                localStorage.setItem("cravzoAppBannerDismissed", "1");
              }}
              className="flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-extrabold text-white shadow"
            >
              <Smartphone className="h-3 w-3" />
              App
            </button>
          </div>
        )}
      </div>

      {/* MOBILE VIEW */}
      <div className="md:hidden">
        <div className="bg-gradient-to-b from-indigo-950 via-indigo-900 to-white px-4 pt-20 pb-4">
          <div className="max-w-md mx-auto">
            <SearchBar />
          </div>
        </div>

        {/* Featured Restaurant - Auto-scrolling */}
        {(featureEnabled && featuredRestaurants.length > 0) && (
          <div className="bg-white px-4 pt-3 pb-2">
            <div className="relative flex gap-2.5 overflow-hidden rounded-xl">
              {loading ? (
                <div className="flex gap-2.5 overflow-hidden rounded-xl">
                  <div className="min-w-[280px] h-28 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                </div>
              ) : (
                <>
                  <button onClick={() => setFeaturedIndex((p) => (p - 1 + featuredRestaurants.length) % featuredRestaurants.length)} className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 shadow">
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  {featuredRestaurants.slice(featuredIndex, featuredIndex + 3).map((restaurant, i) => (
                    <Link
                      key={`${restaurant.id}-${i}-${featuredIndex}`}
                      to={`/restaurant/${restaurant.id}`}
                      className="min-w-[280px] h-28 rounded-xl bg-slate-50 overflow-hidden shrink-0 active:scale-98 transition-transform flex items-center"
                    >
                      <div className="w-28 h-full shrink-0">
                        <LazyImage
                          src={getOptimizedRestaurantImage(restaurant.imageUrl, 300)}
                          alt={restaurant.name}
                          className="h-full w-full object-cover"
                          width={200}
                        />
                      </div>
                      <div className="flex-1 px-3 py-2 flex flex-col justify-center min-w-0">
                        <p className="line-clamp-2 text-sm font-black text-slate-900">{restaurant.name}</p>
                        <p className="mt-1 text-xs font-semibold text-indigo-600">{restaurant.cuisine || "Multi-cuisine"}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{restaurant.city || restaurant.location}</p>
                        <p className="mt-1 text-[10px] font-extrabold text-emerald-600">Open Now</p>
                      </div>
                    </Link>
                  ))}
                  <button onClick={() => setFeaturedIndex((p) => (p + 1) % featuredRestaurants.length)} className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 shadow">
                    <ChevronRight className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {featuredRestaurants.slice(0, Math.min(5, featuredRestaurants.length)).map((_, i) => (
                      <span key={i} className={`h-1.5 rounded-full transition-all ${i === featuredIndex ? 'w-4 bg-indigo-600' : 'w-1.5 bg-slate-300'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Ad Banner Space - subtle, only shows when restaurants load */}
        {!loading && restaurants.length > 0 && (
          <div className="bg-slate-50 px-4 pt-4 pb-2">
            <div className="h-16 flex items-center justify-center" />
          </div>
        )}

        {/* Mini Dish Cards Row */}
        <div className="bg-white px-4 pb-4">
          <div className="flex snap-x gap-2.5 overflow-x-auto [scrollbar-width:none]">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="min-w-[120px] rounded-xl bg-slate-100 animate-pulse h-32 shrink-0" />
              ))
            ) : restaurants.length ? (
              restaurants.slice(0, 15).map((restaurant, index) => (
                <div key={restaurant.id} className="animate-fade-in shrink-0" style={{ animationDelay: `${index * 80}ms` }}>
                  <MobileNearbyMiniCard restaurant={restaurant} index={index} />
                </div>
              ))
            ) : (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="min-w-[120px] rounded-xl bg-slate-100 animate-pulse h-32 shrink-0" />
              ))
            )}
          </div>
        </div>

        <section className="bg-white py-5">
          <MobileSectionHeader title="Eat what you love" subtitle="Categories" />
          <div className="mt-4 flex gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {categories.map((category) => (
              <Link key={category.name} to={category.to} className="min-w-[78px] text-center">
                <span className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-indigo-50 shadow-sm">
                  <img src={category.image} alt={category.name} className="h-16 w-16 object-contain" loading="lazy" />
                </span>
                <span className="mt-2 block text-xs font-black text-slate-800">{category.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-6">
          <MobileSectionHeader title="Nearby Restaurants" subtitle="Fast delivery" />
          <div className="mt-4 space-y-4 px-4">
            {loading ? (
              <div className="rounded-3xl bg-white p-5 text-sm font-bold text-slate-500 shadow-sm">
                Finding great restaurants near you...
              </div>
            ) : restaurants.length === 0 ? (
              <div className="rounded-3xl bg-white p-5 text-sm font-bold text-slate-500 shadow-sm">
                No nearby restaurants found
              </div>
            ) : (
              restaurants.map((restaurant, index) => (
                <MobileRestaurantCard key={restaurant.id} restaurant={restaurant} index={index} />
              ))
            )}
          </div>
        </section>
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden pt-32 md:block">
        <SearchBar />

        <section className="max-w-[1200px] mx-auto px-3 md:px-4 py-6 md:py-8">
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg md:text-2xl font-bold text-indigo-900">Nearby Restaurants</h2>
            <p className="text-xs md:text-sm text-slate-600">Based on your location</p>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : restaurants.length === 0 ? (
            <p>No nearby restaurants found</p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-5">
              {restaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  to={`/restaurant/${restaurant.id}`}
                  className="group overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <LazyImage
                    src={getOptimizedRestaurantImage(
  restaurant.imageUrl,
  450
)}
                    alt={restaurant.name}
                    className="h-24 md:h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                    width={500}
                  />
                  <div className="p-2 md:p-5">
                    <h3 className="text-xs md:text-lg font-bold text-slate-900 line-clamp-1">{restaurant.name}</h3>
                    <p className="mt-1 text-[10px] md:text-sm text-slate-500 line-clamp-1">{restaurant.location}</p>
                    <p className="mt-1 text-[10px] md:text-sm text-indigo-700 font-medium line-clamp-1">{restaurant.cuisine}</p>
                    <p className="mt-1 text-[9px] md:text-xs text-gray-600">{restaurant.distance} km</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <Suspense fallback={<ComponentLoader />}>
          <Citywise />
          <DishCarousel />
        </Suspense>
      </div>
    </div>
  );
};

export default Home;
