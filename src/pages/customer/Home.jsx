import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock3,
  IndianRupee,
  Star,
} from "lucide-react";

import SearchBar from "../../components/common/Searchbar.jsx";
import biryani from "../../assets/images/foodimage/biryaniplate.png";
import burger from "../../assets/images/foodimage/burger.png";
import cake from "../../assets/images/foodimage/cake.png";
import dosa from "../../assets/images/foodimage/dosa.png";
import momos from "../../assets/images/foodimage/momos.png";
import pizza from "../../assets/images/foodimage/pizza.png";
import { getNearbyRestaurants, listRestaurants } from "../../services/foodService.js";
import Citywise from "./Citywise.jsx";
import DishCarousel from "./DishesGallery.jsx";
import HeroSection from "./HeroSection.jsx";

const categories = [
  { name: "Pizza", image: pizza, to: "/dish/Pizza" },
  { name: "Burger", image: burger, to: "/dish/Burger" },
  { name: "Dosa", image: dosa, to: "/dish/Dosa" },
  { name: "Biryani", image: biryani, to: "/dish/Biryani" },
  { name: "Momos", image: momos, to: "/dish/Momos" },
  { name: "Desserts", image: cake, to: "/dish/Cake" },
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

const MobileRestaurantCard = ({ restaurant, index }) => {
  const meta = getRestaurantMeta(restaurant, index);
  const distance = formatDistance(restaurant.distance);

  return (
    <Link
      to={`/restaurant/${restaurant.id}`}
      className="block overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-md shadow-slate-200/80"
    >
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="h-full w-full object-cover transition duration-500"
          loading="lazy"
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
  const meta = getRestaurantMeta(restaurant, index);
  const dishImage = dish?.imageUrl || restaurant.imageUrl;

  return (
    <Link
      to={`/restaurant/${restaurant.id}`}
      className="min-w-[160px] snap-start rounded-2xl bg-white shadow-md shadow-slate-200/80 transition-all duration-200 active:scale-95 hover:shadow-md"
    >
      <img
        src={dishImage}
        alt={dish?.name || restaurant.name}
        className="h-24 w-full rounded-t-2xl object-cover"
        loading="lazy"
      />
      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-black text-slate-950">{restaurant.name}</h3>
        <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">
          {dish?.name || restaurant.cuisine || "Fresh meals"}
        </p>
        <p className="mt-2 flex items-center gap-1 text-[11px] font-extrabold text-indigo-700">
          <Clock3 className="h-3.5 w-3.5" />
          {meta.deliveryTime}
        </p>
      </div>
    </Link>
  );
};

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFallbackRestaurants = async () => {
      try {
        const data = await listRestaurants({ page: 1, limit: 8 });
        setRestaurants(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load restaurants", error);
      } finally {
        setLoading(false);
      }
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const res = await getNearbyRestaurants(lat, lng);

          setRestaurants(Array.isArray(res) ? res : res?.data || []);
        } catch (error) {
          console.error("Failed to load nearby restaurants", error);
          await loadFallbackRestaurants();
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Location error:", error);
        loadFallbackRestaurants();
      },
    );
  }, []);

  return (
    <div className="bg-slate-50 md:bg-transparent">
      <div className="hidden md:block">
        <HeroSection />
      </div>

      <div className="md:hidden">
        <div className="relative z-30 bg-gradient-to-b from-indigo-950 via-indigo-900 to-slate-50 px-4 pb-7 pt-24">
          <div className="relative z-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-indigo-200">Cravzo quick bites</p>
            <h1 className="mt-2 max-w-xs text-3xl font-black leading-tight tracking-tight text-white">
              What are you craving today?
            </h1>
            <div className="mt-5">
              <SearchBar />
            </div>
          </div>
        </div>

        <section className="relative z-10 -mt-3 bg-slate-50 pb-5">
          <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-1 pt-5 [scrollbar-width:none]">
            {loading ? (
              <div className="min-w-[160px] rounded-2xl bg-white p-4 text-sm font-bold text-slate-500 shadow-sm">
                Finding nearby picks...
              </div>
            ) : restaurants.length ? (
              restaurants.slice(0, 6).map((restaurant, index) => (
                <MobileNearbyMiniCard key={restaurant.id} restaurant={restaurant} index={index} />
              ))
            ) : (
              <div className="min-w-[180px] rounded-2xl bg-white p-4 text-sm font-bold text-slate-500 shadow-sm">
                Nearby restaurants will appear here.
              </div>
            )}
          </div>
        </section>

        <section className="bg-white py-5">
          <MobileSectionHeader title="Eat what you love" subtitle="Categories" />
          <div className="mt-4 flex gap-3 overflow-x-auto px-4 [scrollbar-width:none]">
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
                  <img
                    src={restaurant.imageUrl}
                    alt={restaurant.name}
                    className="h-24 md:h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="p-2 md:p-5">
                    <h3 className="text-xs md:text-lg font-bold text-slate-900 line-clamp-1">{restaurant.name}</h3>

                    <p className="mt-1 text-[10px] md:text-sm text-slate-500 line-clamp-1">
                      {restaurant.location}
                    </p>

                    <p className="mt-1 text-[10px] md:text-sm text-indigo-700 font-medium line-clamp-1">
                      {restaurant.cuisine}
                    </p>

                    <p className="mt-1 text-[9px] md:text-xs text-gray-600">{restaurant.distance} km</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <Citywise />

        <div className="hidden md:block">
          <DishCarousel />
        </div>
      </div>
    </div>
  );
};

export default Home;
