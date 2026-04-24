import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../../components/common/Navbar.jsx";
import HeroSection from "./HeroSection.jsx";
import DishCarousel from "./DishesGallery.jsx";
import Citywise from "./Citywise.jsx";
import SearchBar from "../../components/common/Searchbar.jsx";
import { getNearbyRestaurants } from "../../services/foodService.js";

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          console.log("User Location:", lat, lng);

          const res = await getNearbyRestaurants(lat, lng);
          console.log("Nearby:", res);

          setRestaurants(Array.isArray(res) ? res : res?.data || []);
        } catch (error) {
          console.error("Failed to load nearby restaurants", error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Location error:", error);
        setLoading(false);
      }
    );
  }, []);

  return (
    <div>
      <Navbar />

      {/* Desktop Hero */}
      <div className="hidden md:block">
        <HeroSection />
      </div>

      <div className="pt-32">
        <SearchBar />

        {/* 🔥 Nearby Restaurants (Search ke neeche) */}
        <section className="max-w-[1200px] mx-auto px-3 md:px-4 py-6 md:py-8">
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg md:text-2xl font-bold text-indigo-900">
              Nearby Restaurants
            </h2>
            <p className="text-xs md:text-sm text-slate-600">
              Based on your location
            </p>
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
                    <h3 className="text-xs md:text-lg font-bold text-slate-900 line-clamp-1">
                      {restaurant.name}
                    </h3>

                    <p className="mt-1 text-[10px] md:text-sm text-slate-500 line-clamp-1">
                      {restaurant.location}
                    </p>

                    <p className="mt-1 text-[10px] md:text-sm text-indigo-700 font-medium line-clamp-1">
                      {restaurant.cuisine}
                    </p>

                    <p className="mt-1 text-[9px] md:text-xs text-gray-600">
                      {restaurant.distance} km
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 🌆 Cities We Deliver */}
        <Citywise />

        {/* 🍔 DishCarousel → ONLY DESKTOP */}
        <div className="hidden md:block">
          <DishCarousel />
        </div>
      </div>
    </div>
  );
};

export default Home;
