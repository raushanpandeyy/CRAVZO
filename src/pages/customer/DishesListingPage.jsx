import React from "react";
import { Link } from "react-router-dom";

import foodItems from "../../assets/data/FoodData.js";
import foodItems1 from "../../assets/data/FoodData1.js";

const uniqueDishes = [...foodItems, ...foodItems1].filter(
  (dish, index, allDishes) => allDishes.findIndex((item) => item.name === dish.name) === index
);

const DishesListingPage = () => (
  <section className="mx-auto max-w-[1200px] px-4 pb-12 pt-32">
    <div className="mb-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Explore</p>
      <h1 className="mt-1 text-3xl font-bold text-slate-950">Dishes</h1>
    </div>

    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {uniqueDishes.map((dish) => (
        <Link
          key={dish.name}
          to={`/dish/${encodeURIComponent(dish.name)}`}
          className="group flex min-h-48 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
        >
          <img
            src={dish.img}
            alt={dish.name}
            className="h-28 w-28 rounded-full object-cover transition duration-300 group-hover:scale-105"
          />
          <h2 className="mt-4 text-base font-bold text-slate-950">{dish.name}</h2>
          <p className="mt-1 text-sm text-indigo-700">Find restaurants</p>
        </Link>
      ))}
    </div>
  </section>
);

export default DishesListingPage;
