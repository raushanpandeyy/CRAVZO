// src/components/DishCarousel.jsx
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';
import foodItems from '../../assets/data/FoodData.js';
import foodItems1 from '../../assets/data/FoodData1.js';





const DishCarousel = () => {
  return (
    <div className="w-full max-w-[1200px] mx-auto py-6 px-4 bg-gray-100">
      <h2 className="text-2xl font-bold mb-4 text-center text-indigo-800">Popular Dishes</h2>
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
    <div className="bg-gray-100  p-2 flex flex-col items-center transition-transform hover:scale-105 duration-300">
      <img src={dish.img} alt={dish.name} className="w-[100px] h-[100px] object-cover rounded-full" />
      <p className="mt-2 text-md font-medium text-indigo-800">{dish.name}</p>
    </div>
  </SwiperSlide>
))}
      </Swiper>
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
    <div className="bg-gray-100  p-2 flex flex-col items-center transition-transform hover:scale-105 duration-300">
      <img src={dish.img} alt={dish.name} className="w-[100px] h-[100px] object-cover rounded-full" />
      <p className="mt-2 text-md font-medium text-indigo-800">{dish.name}</p>
    </div>
  </SwiperSlide>
))}
      </Swiper>
    </div>
  );
};

export default DishCarousel;


