import React, { useEffect, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  Clock3,
  IndianRupee,
  Star,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Zap,
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

const getOptimizedImage = (url, width = 400) => {
  if (!url) return "https://via.placeholder.com/400x200?text=No+Image";
  if (url.includes("cloudinary.com")) {
    const parts = url.split("/upload/");
    if (parts.length === 2) {
      return `${parts[0]}/upload/c_fill,w_${width},q_auto,f_avif/${parts[1]}`;
    }
  }
  return url;
};

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
      return `${parts[0]}/upload/c_fill,w_${width},q_auto,f_avif/${parts[1]}`;
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
      className="block overflow-hidden rounded-3xl border-2 border-indigo-200 bg-white shadow-md shadow-slate-200/80"
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
  const [currentAd, setCurrentAd] = useState(0);
  const [ads, setAds] = useState([]);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    const fetchFeaturedAndAds = async () => {
      try {
        const [featuredRes, adsRes] = await Promise.all([
          fetch(`${API_BASE}/api/public/featured-restaurants`, { credentials: "include" }),
          fetch(`${API_BASE}/api/public/ads`, { credentials: "include" }),
        ]);
        const featuredData = await featuredRes.json();
        const adsData = await adsRes.json();
        setFeaturedRestaurants(featuredData.data || []);
        setAds(adsData.data || []);
      } catch (err) {
        console.error("Failed to load featured/ads", err);
      }
    };

    fetchFeaturedAndAds();

    const handleUpdate = () => {
      fetchFeaturedAndAds();
    };
    window.addEventListener("cravzoFeatureUpdate", handleUpdate);
    window.addEventListener("cravzoAdsUpdate", handleUpdate);
    return () => {
      window.removeEventListener("cravzoFeatureUpdate", handleUpdate);
      window.removeEventListener("cravzoAdsUpdate", handleUpdate);
    };
  }, []);

  useEffect(() => {
    const cachedRestaurants = localStorage.getItem("cravzoHomeRestaurants");
    const enabled = localStorage.getItem("cravzoFeatureEnabled") === "true";

    setFeatureEnabled(enabled);

    if (cachedRestaurants) {
      try {
        setRestaurants(JSON.parse(cachedRestaurants));
        setLoading(false);
      } catch {}
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

  // Featured auto-scroll disabled - now swipeable

  // Auto-scroll ads every 4 seconds
  useEffect(() => {
    if (ads.length === 0) return;
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ads.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [ads.length]);

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
      <div className="md:hidden relative">
        {/* Gradient background from left and right */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 via-white to-indigo-100" />
        
        {/* Ad Space - Top of screen */}
        <div className="relative h-[30vh] max-h-[220px] w-full bg-slate-100">
          {ads.length > 0 ? (
            <a href={ads[currentAd]?.link || "#"} className="block h-full w-full">
              <img 
                src={getOptimizedImage(ads[currentAd]?.imageUrl, 400)} 
                alt="Advertisement" 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </a>
          ) : (
            <img 
              src="https://via.placeholder.com/400x200?text=Your+Ad+Here" 
              alt="Advertisement" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </div>

        {/* Search Bar - coral bold border */}
        <div className="relative px-4 py-3 -mt-6">
          <div className="bg-white rounded-lg shadow-lg">
            <SearchBar 
              placeholder="Search" 
              className="h-9 rounded-lg border-2 border-[#ff6b5f]"
            />
          </div>
        </div>

        {/* Categories - Eat what you love */}
        <section className="relative py-3 border-b border-indigo-100">
<div className="px-4 mb-2">
            <h2 className="text-base font-bold text-indigo-700">Eat what you love</h2>
            <p className="text-xs font-semibold text-indigo-400">Categories</p>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
            {categories.map((category) => (
              <Link key={category.name} to={category.to} className="min-w-[65px] text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-indigo-50 shadow-sm border-2 border-indigo-200">
                  <img src={category.image} alt={category.name} className="h-10 w-10 object-contain" loading="lazy" />
                </span>
                <span className="mt-1 block text-[9px] font-bold text-indigo-700">{category.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Restaurant - Swipeable cards with lightning icon */}
        {(featuredRestaurants.length > 0) && (
          <section className="relative py-3 border-b border-indigo-100">
            <div className="px-4 mb-2">
              <h2 className="text-base font-bold text-indigo-700">Featured Restaurants</h2>
              <p className="text-xs font-semibold text-indigo-400">Swipe to see more</p>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] pb-2 snap-x">
              {featuredRestaurants.slice(0, 7).map((restaurant) => (
                <Link
                  key={restaurant.id}
                  to={`/restaurant/${restaurant.id}`}
                  className="min-w-[110px] h-[135px] rounded-xl overflow-hidden shrink-0 active:scale-98 transition-transform flex flex-col border-2 border-indigo-200 snap-start"
                >
                  <div className="h-[85px] w-full overflow-hidden rounded-t-lg">
                    <LazyImage
                      src={getOptimizedRestaurantImage(restaurant.imageUrl, 150)}
                      alt={restaurant.name}
                      className="h-full w-full object-cover"
                      width={110}
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 bg-indigo-50 px-2 py-1.5 flex items-center justify-center gap-1">
                    <p className="text-xs font-bold text-indigo-700 text-center line-clamp-1">{restaurant.name}</p>
                    <Zap className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Nearby Restaurants */}
        <section className="relative py-4">
          <div className="px-4 mb-3">
            <h2 className="text-base font-bold text-indigo-700">Nearby Restaurants</h2>
            <p className="text-xs font-semibold text-indigo-400">Fast delivery</p>
          </div>
          <div className="space-y-3 px-4">
            {loading ? (
              <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-500">Loading...</div>
            ) : restaurants.length === 0 ? (
              <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-500">No nearby restaurants</div>
            ) : (
              restaurants.slice(0, 10).map((restaurant, index) => (
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
