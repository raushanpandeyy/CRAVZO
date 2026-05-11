import React, { useEffect, useState, lazy, Suspense } from "react";
import { Link, useParams } from "react-router-dom";

import { listRestaurants } from "../../services/foodService.js";
const DishCard = lazy(() =>
  import("./DishCard.jsx")
);


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
            <Suspense fallback={<p className="text-slate-600">Loading dishes...</p>}>
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {dishCards.map((dish) => (
      <DishCard key={dish.id} dish={dish} />
    ))}
  </div>
</Suspense>
          </section>
        </>
      )}
    </div>
  );
};

export default DishPage;
