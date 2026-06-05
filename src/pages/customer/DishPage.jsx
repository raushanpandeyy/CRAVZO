import React, { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";

import { listRestaurants } from "../../services/foodService.js";

const DishCard = lazy(() => import("./DishCard.jsx"));

const DishPage = () => {
  const { dishName } = useParams();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const decodedDishName = decodeURIComponent(dishName || "");

  // Fix: useMemo so dishCards isn't recomputed on every render
  const dishCards = useMemo(
    () =>
      restaurants.flatMap((restaurant) =>
        (restaurant.menuPreview || []).map((dish) => ({
          ...dish,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          image: dish.imageUrl || restaurant.imageUrl,
        }))
      ),
    [restaurants]
  );

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const data = await listRestaurants({ dish: decodedDishName });
        setRestaurants(Array.isArray(data) ? data : []);
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <p className="text-slate-600">No restaurants found for {decodedDishName}.</p>
      ) : dishCards.length === 0 ? (
        <p className="text-slate-600">No dishes found for {decodedDishName}.</p>
      ) : (
        // Fix: was rendering dishCards TWICE — once in "Matching dishes" section
        // and once in "Restaurants serving" section. Removed duplicate render.
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          }
        >
          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-950">
              {decodedDishName} near you
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {dishCards.map((dish) => (
                <DishCard key={`${dish.restaurantId}-${dish.id}`} dish={dish} />
              ))}
            </div>
          </section>
        </Suspense>
      )}
    </div>
  );
};

export default DishPage;
