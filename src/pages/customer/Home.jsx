import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
  }, []);

  return (
    <div>
      <Navbar />

      <div className="hidden md:block">
        <HeroSection />
      </div>

      <div className="pt-32">
        <SearchBar />
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
      </div>
    </div>
  );
};

export default Home;
