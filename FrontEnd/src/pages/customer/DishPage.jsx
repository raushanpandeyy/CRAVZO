// src/pages/customer/DishPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const DishPage = () => {
  const { dishName } = useParams(); // URL se dish name le raha hai
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        // Example API endpoint - tum backend me query params handle karoge
        const response = await fetch(
          `http://localhost:5000/api/restaurants?dish=${dishName}`
        );
        const data = await response.json();
        setRestaurants(data);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [dishName]); // jab bhi dish change ho, naya data fetch ho

  return (
    <div className="px-6 py-4">
      <h1 className="text-2xl font-bold capitalize mb-4">
        {dishName} Restaurants
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : restaurants.length === 0 ? (
        <p>No restaurants found for {dishName}.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {restaurants.map((rest) => (
            <div
              key={rest.id}
              className="border p-4 rounded-lg shadow hover:shadow-lg transition"
            >
              <img
                src={rest.image}
                alt={rest.name}
                className="w-full h-40 object-cover rounded"
              />
              <h2 className="text-lg font-semibold mt-2">{rest.name}</h2>
              <p className="text-sm text-gray-600">{rest.address}</p>
              <p className="text-sm text-green-600 font-bold mt-1">
                ⭐ {rest.rating}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DishPage;

