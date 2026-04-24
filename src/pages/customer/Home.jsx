import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

<<<<<<< HEAD
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
=======
import Navbar from "../../components/common/Navbar";
import HeroSection from "./HeroSection";
import DishCarousel from "./DishesGallery";
import Citywise from "./Citywise";
import SearchBar from "../../components/common/Searchbar";
import { listRestaurants } from "../../services/foodService";

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await listRestaurants();
        setRestaurants(data);
      } catch (error) {
        console.error("Failed to load restaurants", error);
      }
    };

    loadRestaurants();
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
  }, []);

  return (
    <div>
      <Navbar />

<<<<<<< HEAD
      {/* Desktop Hero */}
=======
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
      <div className="hidden md:block">
        <HeroSection />
      </div>

      <div className="pt-32">
        <SearchBar />
<<<<<<< HEAD

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
=======
        <DishCarousel />

        <section className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-indigo-900">Popular Restaurants</h2>
              <p className="text-sm text-slate-600">Live data from the backend</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {restaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                to={`/restaurant/${restaurant.id}`}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <img
                  src={restaurant.imageUrl}
                  alt={restaurant.name}
                  className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-slate-900">{restaurant.name}</h3>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {restaurant.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{restaurant.location}</p>
                  <p className="mt-2 text-sm text-indigo-700 font-medium">{restaurant.cuisine}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <Citywise />
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594
      </div>
    </div>
  );
};

export default Home;
