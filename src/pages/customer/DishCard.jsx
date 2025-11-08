import React from "react";
import { useNavigate } from "react-router-dom";

const DishCard = ({ dish }) => {
  const navigate = useNavigate();
  return (
     <div
              key={order.id}
              className="bg-indigo-900 text-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-all duration-300 flex flex-col"
            >
              {/* Image at the top */}
              <div>
                <img
                  src={order.image}
                  alt={order.name}
                  className="w-full h-40 object-cover"
                />
              </div>

              <div className="p-4 space-y-2 flex-1 flex flex-col">
                <h2 className="text-lg font-semibold">{order.name}</h2>
                <p className="text-sm text-gray-300">{order.restaurant}</p>

                <div className="flex justify-between items-center mt-3">
                  <p className="text-lg font-bold text-corral">{order.price}</p>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-sm">{order.rating}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 mt-auto">
                  <p className="text-xs text-gray-300">{order.date}</p>
                  <button className="bg-white text-indigo-900 font-semibold px-4 py-2 border-2 border-indigo-400 rounded-lg hover:bg-indigo-50 transition">
                    Order Again
                  </button>
                </div>
              </div>
            </div>
  );
};

export default DishCard;
