import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { listRestaurants } from "../../services/foodService.js";
import DishCard from "./DishCard.jsx";

const DishPage = () => {
  const { dishName } = useParams();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const decodedDishName = decodeURIComponent(dishName || "");

  const dishCards = restaurants.flatMap((restaurant) =>
    (restaurant.menuPreview || []).map((dish) => ({
      ...dish,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      image: dish.imageUrl || restaurant.imageUrl,
    }))
  );

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const data = await listRestaurants({ dish: decodedDishName });
        setRestaurants(data);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [decodedDishName]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-12 pt-32">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Showing results for</p>
        <h1 className="mt-1 text-3xl font-bold capitalize text-slate-950">{decodedDishName}</h1>
      </div>

      {loading ? (
        <p className="text-slate-600">Loading...</p>
      ) : restaurants.length === 0 ? (
        <p className="text-slate-600">No restaurants found for {decodedDishName}.</p>
      ) : (
        <>
          {dishCards.length ? (
            <section className="mb-10">
              <h2 className="mb-4 text-xl font-bold text-slate-950">Matching dishes</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {dishCards.map((dish) => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-950">Restaurants serving {decodedDishName}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {restaurants.map((rest) => (
                <Link
                  key={rest.id}
                  to={`/restaurant/${rest.id}`}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <img src={rest.imageUrl} alt={rest.name} className="h-44 w-full object-cover" />
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-slate-950">{rest.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">{rest.location}</p>
                    <p className="mt-1 text-sm font-semibold text-indigo-700">{rest.cuisine}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default DishPage;
