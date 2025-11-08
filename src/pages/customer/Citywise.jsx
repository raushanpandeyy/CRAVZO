import React from 'react'
import cities from "../../assets/data/CityNames.js";

const Citywise = () => {
  return (
    
      <section className="p-6 text-center bg-gray-100">
      <h2 className="text-2xl text-indigo-800 font-bold mb-6">We Delivers Here........</h2>
      <div className="grid grid-cols-1 bg-gray-100 sm:grid-cols-3 gap-6">
        {cities.map((city) => (
          <div
            key={city.name}
            className="rounded-xl overflow-hidden hover:scale-105 transition-transform"
          >
            <img
              src={city.img}
              alt={city.name}
              className="w-full h-48 object-cover"
            />
            <h1 className="p-4 font-semibold bg-gray-100 text-indigo-800  text-lg">{city.name}</h1>
          </div>
        ))}
      </div>
    </section>
  
  )
}

export default Citywise
