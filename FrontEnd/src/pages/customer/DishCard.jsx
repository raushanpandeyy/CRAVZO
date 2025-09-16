import React from "react";
import { useNavigate } from "react-router-dom";

const DishCard = ({ dish }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/dish/${dish.name}`)}
      className="cursor-pointer border rounded-lg p-4 hover:shadow-lg transition"
    >
      <img
        src={dish.image}
        alt={dish.name}
        className="w-full h-32 object-cover rounded"
      />
      <h3 className="mt-2 text-lg font-semibold">{dish.name}</h3>
    </div>
  );
};

export default DishCard;
