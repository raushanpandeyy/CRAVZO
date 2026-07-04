import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

import SearchBar from '../../components/common/Searchbar.jsx';
import {veggieImage} from '../../assets/images/foodimages.js';
import {restaurant} from '../../assets/images/restaurant.js';
import {biryaniplate} from '../../assets/images/foodimages.js';
import {dosa} from '../../assets/images/foodimages.js';
import {gulabjamun} from '../../assets/images/foodimages.js';
import {cake} from '../../assets/images/foodimages.js';

const rotatingImageStyles =
  "animate-spin-slow w-40 md:w-60 drop-shadow-xl hover:scale-110 transition-transform duration-300";

const HeroSection = () => {
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  return (
    <div className="bg-indigo-900 min-h-screen flex flex-col items-center justify-center px-4 md:px-6 py-10 pt-32 relative overflow-hidden">

      {/* Background Blur */}
      <div className="absolute top-10 left-10 w-60 md:w-96 h-60 md:h-96 bg-purple-500 rounded-full blur-3xl opacity-30 z-0" />
      <div className="absolute bottom-10 right-10 w-60 md:w-96 h-60 md:h-96 bg-pink-500 rounded-full blur-3xl opacity-30 z-0" />

      {/* Floating Images */}
      <img
  src={dosa}
  loading="lazy"
  decoding="async"
  alt="Dosa"
  className={`${rotatingImageStyles} absolute top-40 left-20 z-10 hidden md:block`}
/>

<img
  src={biryaniplate}
  loading="lazy"
  decoding="async"
  alt="Biryani Plate"
  className={`${rotatingImageStyles} absolute bottom-20 left-40 z-10 hidden md:block`}
/>

<img
  src={gulabjamun}
  loading="lazy"
  decoding="async"
  alt="Gulab Jamun"
  className={`${rotatingImageStyles} absolute top-40 right-20 z-10 hidden md:block`}
/>

<img
  src={cake}
  loading="lazy"
  decoding="async"
  alt="Cake"
  className={`${rotatingImageStyles} absolute bottom-20 right-40 z-10 hidden md:block`}
/>
      {/* Heading */}
      <div className="text-2xl md:text-6xl text-white font-bold text-center mb-8 z-10 px-2">
        <p>Dodago! Partner of your cravings....</p>
      </div>

      {/* Search */}
      <div className="relative z-40 flex flex-col items-center mb-8 w-full max-w-md">
        <SearchBar
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* 🔥 CARDS SECTION */}
      <div className="relative flex flex-col md:flex-row gap-6 items-center justify-center z-10 w-full max-w-5xl">

        {/* FOOD CARD */}
        <div
          onClick={() => navigate("/dishes")}
          className="relative w-full max-w-xs md:w-[300px] h-[260px] md:h-[400px] rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
        >
          <div
            className="w-full h-full bg-cover bg-center transform group-hover:scale-110 transition duration-500"
            style={{ backgroundImage: `url(${veggieImage})` }}
          />

          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition" />

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <button className="bg-white text-indigo-900 px-6 py-2 rounded-full font-semibold shadow-md">
              Dishes
            </button>
          </div>
        </div>

        {/* RESTAURANT CARD */}
        <div
          onClick={() => navigate("/restaurants")}
          className="relative w-full max-w-xs md:w-[300px] h-[260px] md:h-[400px] rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
        >
          <div
            className="w-full h-full bg-cover bg-center transform group-hover:scale-110 transition duration-500"
            style={{ backgroundImage: `url(${restaurant})` }}
          />

          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition" />

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <button className="bg-white text-indigo-900 px-6 py-2 rounded-full font-semibold shadow-md">
              Restaurants
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HeroSection;

