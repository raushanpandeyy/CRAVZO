// src/components/DishCarousel.jsx
import React from 'react';
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules'; // Lazy module yahan se hata diya

import 'swiper/css';
import 'swiper/css/autoplay';
// ❌ 'swiper/css/lazy' ko delete kar diya hai

import foodItems from '../../assets/data/FoodData.js';
import foodItems1 from '../../assets/data/FoodData1.js';

// Cloudinary image ko exact 100x100px par resize aur compress karne ka absolute best tarika
const getOptimizedThumb = (url) => {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/q_auto,f_auto,c_fill,w_100,h_100/');
};

const DishCarousel = () => {
  const navigate = useNavigate();
  const openDish = (dishName) => navigate(`/dish/${encodeURIComponent(dishName)}`);

  return (
    <div className="w-full max-w-[1200px] mx-auto py-6 px-4 bg-gray-100">
      <h2 className="text-2xl font-bold mb-4 text-center text-indigo-800">Popular Dishes</h2>
      
      {/* FIRST CAROUSEL */}
      <Swiper
        modules={[Autoplay]}
        spaceBetween={16}
        slidesPerView={2.5}
        loop={true}
        autoplay={{ delay: 2000, disableOnInteraction: false }}
        breakpoints={{
          640: { slidesPerView: 3 },
          768: { slidesPerView: 4 },
          1024: { slidesPerView: 8 },
        }}
      >
        {foodItems.map((dish, index) => (
          <SwiperSlide key={index}>
            <button
              type="button"
              onClick={() => openDish(dish.name)}
              className="bg-gray-100 p-2 flex w-full flex-col items-center transition-transform hover:scale-105 duration-300"
            >
              <img
                src={getOptimizedThumb(dish.img)}
                alt={dish.name}
                loading="lazy" // Native browser lazy loading (Swiper v9+ ke liye recommended)
                decoding="async"
                className="w-[100px] h-[100px] object-cover rounded-full"
              />
              <p className="mt-2 text-md font-medium text-indigo-800">
                {dish.name}
              </p>
            </button>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* SECOND CAROUSEL */}
      <Swiper
        modules={[Autoplay]}
        spaceBetween={16}
        slidesPerView={2.5}
        loop={true}
        autoplay={{ delay: 2000, disableOnInteraction: false }}
        breakpoints={{
          640: { slidesPerView: 3 },
          768: { slidesPerView: 4 },
          1024: { slidesPerView: 8 },
        }}
      >
        {foodItems1.map((dish, index) => (
          <SwiperSlide key={index}>
            <button
              type="button"
              onClick={() => openDish(dish.name)}
              className="bg-gray-100 p-2 flex w-full flex-col items-center transition-transform hover:scale-105 duration-300"
            >
              <img 
                src={getOptimizedThumb(dish.img)}
                alt={dish.name} 
                loading="lazy"
                decoding="async"
                className="w-[100px] h-[100px] object-cover rounded-full" 
              />
              <p className="mt-2 text-md font-medium text-indigo-800">{dish.name}</p>
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default DishCarousel;

