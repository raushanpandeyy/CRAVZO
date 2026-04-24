import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { listRestaurants } from "../../services/foodService.js";

const DishPage = () => {
  const { dishName } = useParams();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const data = await listRestaurants({ dish: dishName });
        setRestaurants(data);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [dishName]);

  return (
    <div className="px-6 py-4">
      <h1 className="text-2xl font-bold capitalize mb-4">{dishName} Restaurants</h1>

      {loading ? (
        <p>Loading...</p>
      ) : restaurants.length === 0 ? (
        <p>No restaurants found for {dishName}.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {restaurants.map((rest) => (
            <div key={rest.id} className="border p-4 rounded-lg shadow hover:shadow-lg transition">
              <img src={rest.imageUrl} alt={rest.name} className="w-full h-40 object-cover rounded" />
              <h2 className="text-lg font-semibold mt-2">{rest.name}</h2>
              <p className="text-sm text-gray-600">{rest.location}</p>
              <p className="text-sm text-green-600 font-bold mt-1">{rest.cuisine}</p>
              <Link to={`/restaurant/${rest.id}`} className="inline-block mt-3 text-indigo-700 font-semibold">
                Open Restaurant
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DishPage;
