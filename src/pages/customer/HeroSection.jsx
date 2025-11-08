import React from 'react';
import { useState } from 'react';
import SearchBar from '../../components/common/Searchbar.jsx';
import veggieImage from '../../assets/images/foodimage/veggieImage.png';
import resturant from '../../assets/images/resturant/resturant.png';
import biryaniplate from '../../assets/images/foodimage/biryaniplate.png';
import dosa from '../../assets/images/foodimage/dosa.png';
import gulabjamun from '../../assets/images/foodimage/gulabjamun.png';
import cake from '../../assets/images/foodimage/cake.png';

const rotatingImageStyles = "animate-spin-slow w-50 md:w-60 drop-shadow-xl hover:scale-110 transition-transform duration-300";
const HeroSection = () => {
  const [searchText, setSearchText] = useState("");
  return (
    <div className="bg-indigo-900 min-h-screen flex flex-col items-center justify-center px-6 py-10 pt-24 relative overflow-hidden">
      {/* Blurred Background Circles */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-30 z-0" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500 rounded-full blur-3xl opacity-30 z-0" />

      {/* Random Positioned Floating Images */}
      <img src={dosa} alt="Dosa" className={`${rotatingImageStyles} absolute top-40 left-20 z-10`} />
      <img src={biryaniplate} alt="Biryani" className={`${rotatingImageStyles} absolute bottom-20 left-40 z-10`} />
      <img src={gulabjamun} alt="Gulabjamun" className={`${rotatingImageStyles} absolute top-50 right-25 z-10`} />
      <img src={cake} alt="Cake" className={`${rotatingImageStyles} absolute bottom-20 right-40 z-10`} />

      {/* Heading */}
      <div className="text-4xl md:text-6xl text-white font-bold text-center mb-10 z-10">
        <p>Cravzo! Partner of your cravings....</p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-center z-10 mb-10 w-full max-w-lg mx-auto">
  <SearchBar 
        value={searchText} 
        onChange={(e) => setSearchText(e.target.value)} 
      />
  
</div>


      {/* Center Cards */}
      <div className="relative flex flex-col md:flex-row gap-8 items-center z-10">
        {/* Food Card */}
        <div
          className={`${rotatingImageStyles} relative h-[400px] w-[300px] bg-cover bg-center rounded-xl overflow-hidden`}
          style={{ backgroundImage: `url(${veggieImage})` }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-end text-center p-4">
            <button className="bg-indigo-900 text-white px-6 py-4 rounded-full font-semibold hover:bg-indigo-500 transition drop-shadow-md">
              Dishes
            </button>
          </div>
        </div>

        {/* Restaurant Card */}
        <div
          className={`${rotatingImageStyles}relative h-[400px] w-[300px] bg-cover bg-center rounded-xl overflow-hidden`}
          style={{ backgroundImage: `url(${resturant})` }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-end text-center p-4">
            <button className="bg-indigo-900 text-white px-6 py-4 rounded-full font-semibold hover:bg-indigo-500 transition drop-shadow-md">
              Restaurants
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;



