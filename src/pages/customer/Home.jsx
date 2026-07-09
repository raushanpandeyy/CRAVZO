import React, { useEffect, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  Clock3,
  IndianRupee,
  Star,
  Smartphone,
} from "lucide-react";

import SearchBar from "../../components/common/Searchbar.jsx";
import {
  biryaniplate, burger, cake, dosa, momos,
  chinese, indianthali, rolls, parathe, Chaat,
  icecream, Snacks, southindian, salad, northindian,
} from "../../assets/images/foodimages.js";
import { getNearbyRestaurants, listRestaurants } from "../../services/foodService.js";
import { apiRequest } from "../../services/api.js";
import { useUserLocation } from "../../hooks/useUserLocation.js";
import { getCloudinaryUrl } from "../../utils/cloudinary.js";
import { getSafeImageUrl } from "../../utils/imageUrl.js";

const HeroSection = lazy(() => import("./HeroSection.jsx"));
const Citywise = lazy(() => import("./Citywise.jsx"));
const DishCarousel = lazy(() => import("./DishesGallery.jsx"));
import DishPromoCarousel from "../../components/DishPromoCarousel.jsx";

const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f1f5f9' width='400' height='300'/%3E%3Ctext fill='%2394a3b8' font-family='Arial' font-size='18' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

const getOptimizedImage = (url, width = 400) => {
  const safeUrl = getSafeImageUrl(url, FALLBACK_IMG);
  if (safeUrl === FALLBACK_IMG) return FALLBACK_IMG;
  if (safeUrl.includes("cloudinary.com")) return getCloudinaryUrl(safeUrl, { width });
  return safeUrl;
};

// Alias — same transform, kept for call-site clarity
const getOptimizedRestaurantImage = (url, width = 450) => getOptimizedImage(url, width);

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

const getDishFallbackImage = (dish, restaurant) => {
  const text = `${dish?.name || ""} ${dish?.category || ""} ${restaurant?.cuisine || ""}`.toLowerCase();

  if (text.includes("biryani")) return biryaniplate;
  if (text.includes("burger")) return burger;
  if (text.includes("dosa") || text.includes("idli") || text.includes("south")) return dosa;
  if (text.includes("momo")) return momos;
  if (text.includes("chinese") || text.includes("noodle") || text.includes("manchurian")) return chinese;
  if (text.includes("thali")) return indianthali;
  if (text.includes("roll")) return rolls;
  if (text.includes("paratha")) return parathe;
  if (text.includes("chaat")) return Chaat;
  if (text.includes("ice")) return icecream;
  if (text.includes("snack") || text.includes("fries")) return Snacks;
  if (text.includes("salad")) return salad;
  if (text.includes("cake") || text.includes("dessert") || text.includes("sweet")) return cake;
  if (text.includes("north")) return northindian;

  return getSafeImageUrl(restaurant?.imageUrl, FALLBACK_IMG);
};

const MobileSectionHeader = ({ title, subtitle }) => (
  <div className="flex items-end justify-between px-4">
    <div>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#ff6b5f]">{subtitle}</p>
      <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">{title}</h2>
    </div>
  </div>
);

// LCP Fix: Accept `priority` prop. When true, skip lazy loading and set
// fetchpriority="high" so the browser fetches this image immediately.
// CLS Fix: Forward explicit width/height HTML attributes so the browser
// reserves the correct space before CSS paints, eliminating layout shift.
const LazyImage = ({ src, alt, className, width = 450, height, priority = false }) => {
  const [imgError, setImgError] = useState(false);
  const imgSrc = imgError ? FALLBACK_IMG : getOptimizedRestaurantImage(src, width);
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : undefined}
      width={width}
      height={height}
      onError={() => setImgError(true)}
    />
  );
};

const MobileRestaurantCard = ({ restaurant, index }) => {
  const meta = getRestaurantMeta(restaurant, index);
  const distance = formatDistance(restaurant.distance);
  // LCP Fix: first visible card is the LCP element on mobile — load it eagerly
  const isLCP = index === 0;

  return (
    <Link
      to={`/restaurant/${restaurant.id}`}
      className="block overflow-hidden rounded-3xl border-2 border-indigo-200 bg-white shadow-md shadow-slate-200/80"
    >
      {/* CLS Fix: fixed aspect-ratio wrapper so browser reserves space before image loads */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <LazyImage
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="h-full w-full object-cover transition duration-500"
          width={400}
          height={176}
          priority={isLCP}
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

const PopularDishesSection = ({ restaurants }) => {
  const items = restaurants
    .flatMap((restaurant) =>
      (restaurant.menuPreview?.length ? restaurant.menuPreview : [null]).map((dish) => ({
        ...restaurant,
        dish,
      }))
    )
    .slice(0, 20);
  const row1 = items.slice(0, 10);
  const row2 = items.slice(10, 20);
  return (
    <section className="relative py-3 border-b border-indigo-100">
      <div className="px-4 mb-2">
        <h2 className="text-base font-bold text-indigo-700">Popular Dishes Nearby</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] snap-x snap-mandatory overscroll-x-contain">
        {row1.map((restaurant, index) => (
          <MobileNearbyMiniCard
            key={`${restaurant.id}-${restaurant.dish?.id || "restaurant"}-r1`}
            restaurant={restaurant}
            index={index}
          />
        ))}
      </div>
      <div className="mt-3 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] snap-x snap-mandatory overscroll-x-contain">
        {row2.map((restaurant, index) => (
          <MobileNearbyMiniCard
            key={`${restaurant.id}-${restaurant.dish?.id || "restaurant"}-r2`}
            restaurant={restaurant}
            index={index + 10}
          />
        ))}
      </div>
    </section>
  );
};

const MobileNearbyMiniCard = ({ restaurant, index }) => {
  const dish = restaurant.dish || restaurant.menuPreview?.[0];
  const dishImage = getSafeImageUrl(dish?.imageUrl, getDishFallbackImage(dish, restaurant));
  const deliveryTime = restaurant.deliveryTime || `${20 + (index % 4) * 5}-${30 + (index % 4) * 5} min`;
  const price = dish?.price ? `₹${Math.floor(Number(dish.price))}` : null;
  const dishName = dish?.name || restaurant.name;

  const labels = [dishName, deliveryTime].filter(Boolean);
  const [labelIndex, setLabelIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setLabelIndex((i) => (i + 1) % labels.length), 2000);
    return () => clearInterval(timer);
  }, [labels.length]);

  return (
    <div className="w-[100px] flex-shrink-0">
      <Link
        to={`/restaurant/${restaurant.id}`}
        className="relative aspect-square rounded-lg overflow-hidden shadow-sm block transition-all duration-200 active:scale-95"
      >
        <img
          src={dishImage}
          alt={dishName}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          width={100}
          height={100}
        />
      </Link>
      <p className="mt-1 text-sm font-extrabold text-indigo-500 text-center truncate leading-tight">
        {labels[labelIndex]}
      </p>
    </div>
  );
};

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" && window.innerWidth >= 768
  );

  // Shared location hook — no separate geolocation call, reuses sessionStorage cache
  const { lat, lng, ready: locationReady } = useUserLocation();

  useEffect(() => {
    const cachedRestaurants = localStorage.getItem("dodagoHomeRestaurants");
    if (cachedRestaurants) {
      try {
        setRestaurants(JSON.parse(cachedRestaurants));
        setLoading(false);
      } catch {}
    }
  }, []);

  const ComponentLoader = () => <div className="animate-pulse bg-slate-200 h-40 rounded-2xl m-4" />;

  // Restaurant fetch — uses shared location hook (no duplicate GPS call)
  // 3km radius when location available, fallback to latest 20 restaurants
  useEffect(() => {
    if (!locationReady) return; // wait for location resolution

    const load = async () => {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const limit = isMobile ? 10 : 20;

      try {
        let restaurantData = [];
        if (lat && lng) {
          const res = await getNearbyRestaurants(lat, lng, 3);
          restaurantData = Array.isArray(res) ? res : (res?.data || []);
          if (isMobile) restaurantData = restaurantData.slice(0, limit);
        }
        if (!restaurantData.length) {
          const res = await listRestaurants({ page: 1, limit });
          restaurantData = Array.isArray(res) ? res : (res?.data || []);
        }
        setRestaurants(restaurantData);
        const saveToCache = () => {
          try { localStorage.setItem("dodagoHomeRestaurants", JSON.stringify(restaurantData)); } catch {}
        };
        if (typeof requestIdleCallback !== "undefined") {
          requestIdleCallback(saveToCache, { timeout: 2000 });
        } else {
          setTimeout(saveToCache, 100);
        }
      } catch (err) {
        console.error("Failed to load restaurants", err);
      } finally {
        setLoading(false);
      }
    };

    const loadPromos = async () => {
      try {
        const res = await apiRequest("/api/public/home");
        if (res?.data?.promotions) setPromotions(res.data.promotions);
      } catch {}
    };

    loadPromos();

    load();
  }, [locationReady, lat, lng]);

  // Desktop detection — HeroSection images should NOT download on mobile
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="bg-slate-50 md:bg-transparent">
      {/* DESKTOP HERO — NOT rendered on mobile, saves 6 hidden image downloads (~200KB) */}
      {isDesktop && (
        <div>
          <Suspense fallback={<ComponentLoader />}>
            <HeroSection />
          </Suspense>
        </div>
      )}

      {/* MOBILE APP BANNER - Small indigo button
          CLS Fix: Use opacity/visibility instead of conditional render so
          no layout space is reserved or released — fixed positioned so no
          document flow impact anyway, but the sudden appearance was causing
          a repaint that Chrome scores as a shift. */}
      <div className="md:hidden">
        <div className="absolute right-4 top-14 z-50">
          <button
            onClick={() => {
              const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
              if (isIOS) {
                alert("To install: Tap the share button in Safari, then scroll down and tap 'Add to Home Screen'");
              } else {
                window.dispatchEvent(new CustomEvent("showInstallPrompt"));
              }
              localStorage.setItem("dodagoAppBannerDismissed", "1");
            }}
            className="flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-extrabold text-white shadow"
          >
            <Smartphone className="h-3 w-3" />
            App
          </button>
        </div>
      </div>

      {/* MOBILE VIEW */}
      <div className="md:hidden">

        {/* Dish Promotions — admin-controlled, 7s auto-slide carousel */}
        <DishPromoCarousel promotions={promotions} />

        <div className="px-4 pt-3 pb-1">
          <SearchBar
            placeholder="Search"
            className="border-2 border-[#ff6b5f] rounded-xl"
          />
        </div>

        {/* Categories - Eat what you love */}
        <section className="relative py-3 border-b border-indigo-100">
<div className="px-4 mb-2">
            <h2 className="text-base font-bold text-indigo-700">Eat what you love</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
            {categories.map((category) => (
              <Link key={category.name} to={category.to} className="min-w-[65px] text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl shadow-md">
                  <img src={category.image} alt={category.name} className="h-full w-full object-cover" loading="lazy" width={64} height={64} />
                </span>
                <span className="mt-1 block text-[10px] font-bold text-indigo-700">{category.name}</span>
              </Link>
            ))}
          </div>
        </section>
        {/* Popular Dishes Nearby */}
        {restaurants.length > 0 && <PopularDishesSection restaurants={restaurants} />}

        {/* Nearby Restaurants */}
        <section className="relative py-4">
          <div className="px-4 mb-3">
            <h2 className="text-base font-bold text-indigo-700">Nearby Restaurants</h2>
          </div>
          <div className="space-y-3 px-4">
            {loading ? (
              /* Skeleton placeholders — same height as real cards, prevents CLS */
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-3xl border-2 border-indigo-100 bg-white">
                  <div className="h-44 w-full animate-pulse bg-slate-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-5 w-2/3 animate-pulse rounded-lg bg-slate-100" />
                    <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-100" />
                    <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-100" />
                  </div>
                </div>
              ))
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                  <div className="h-52 w-full animate-pulse bg-slate-100" />
                  <div className="p-5 space-y-2">
                    <div className="h-5 w-2/3 animate-pulse rounded-lg bg-slate-100" />
                    <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <p>No nearby restaurants found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
              {restaurants.map((restaurant, idx) => (
                <Link
                  key={restaurant.id}
                  to={`/restaurant/${restaurant.id}`}
                  className="group overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* CLS Fix: fixed aspect container so grid doesn't reflow when images load */}
                  <div className="relative h-24 md:h-52 w-full overflow-hidden bg-slate-100">
                    <LazyImage
                      src={getOptimizedRestaurantImage(restaurant.imageUrl, 450)}
                      alt={restaurant.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      width={500}
                      height={208}
                      priority={idx === 0}
                    />
                  </div>
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
