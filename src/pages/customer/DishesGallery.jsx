// Replaced Swiper (86KB) with native CSS scroll — same visual, zero JS cost.
// Uses CSS animation for auto-scroll on desktop, native touch-scroll on mobile.
import React, { useRef } from 'react';
import { useNavigate } from "react-router-dom";

import foodItems from '../../assets/data/FoodData.js';
import foodItems1 from '../../assets/data/FoodData1.js';

const getOptimizedThumb = (url) => {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/q_auto,f_auto,c_fill,w_100,h_100/');
};

const DishRow = ({ items, direction = 'left' }) => {
  const navigate = useNavigate();
  const openDish = (name) => navigate(`/dish/${encodeURIComponent(name)}`);

  // Duplicate items for seamless infinite scroll illusion
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden w-full">
      <div
        className={`flex gap-4 ${direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right'}`}
        style={{ width: 'max-content' }}
      >
        {doubled.map((dish, index) => (
          <button
            key={`${dish.id}-${index}`}
            type="button"
            onClick={() => openDish(dish.name)}
            className="flex flex-col items-center shrink-0 p-2 rounded-xl hover:bg-indigo-50 transition-colors active:scale-95"
          >
            <img
              src={getOptimizedThumb(dish.img)}
              alt={dish.name}
              loading="lazy"
              decoding="async"
              width={100}
              height={100}
              className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] object-cover rounded-full border-2 border-indigo-100"
            />
            <p className="mt-2 text-xs sm:text-sm font-semibold text-indigo-800 text-center max-w-[80px] truncate">
              {dish.name}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

const DishCarousel = () => (
  <div className="w-full max-w-[1200px] mx-auto py-6 px-4 bg-gray-100 overflow-hidden">
    <h2 className="text-2xl font-bold mb-4 text-center text-indigo-800">Popular Dishes</h2>
    <div className="space-y-4">
      <DishRow items={foodItems} direction="left" />
      <DishRow items={foodItems1} direction="right" />
    </div>
  </div>
);

export default DishCarousel;
