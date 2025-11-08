import React, { useState } from "react";
import { Star } from "lucide-react";
import ordersData from "../../assets/data/orderdata"; 
import cart from "../../assets/logos/cart.png";
import SearchBar from "../../components/common/Searchbar.jsx";

export default function Orders() {
  const [search, setSearch] = useState("");
  const hasOrders = ordersData && ordersData.length > 0;

  // Filter orders by search
  const filteredOrders = ordersData.filter(order =>
    order.name.toLowerCase().includes(search.toLowerCase()) ||
    order.restaurant.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 sm:pl-80 sm:pr-10 px-2 py-8 flex flex-col items-center">
      

       
          <div className="w-full max-w-2xl mb-8">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for restaurants or dishes..."
        />
      </div>

      {hasOrders ? (
        // Show orders in grid
        <div className="grid grid-cols-1 pl-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 overflow-y-auto w-full max-w-7xl pb-4 scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-transparent">
          {filteredOrders.length > 0 ? filteredOrders.map((order) => (
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
          )) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <img src={cart} alt="No Orders" className="w-60 mb-4 opacity-50" />
              <h2 className="text-2xl font-semibold text-indigo-900">No Orders Found</h2>
              <p className="text-gray-500 mb-6">Try a different search.</p>
            </div>
          )}
        </div>
      ) : (
        // Empty state (no orders)
        <div className="flex flex-col items-center justify-center h-[70vh] text-center">
          <img
            src={cart}
            alt="No Orders"
            className="w-60 mb-4 opacity-50"
          />
          <h2 className="text-2xl font-semibold text-indigo-900 ">
            No Orders Yet
          </h2>
          <p className="text-gray-500 mb-6">
            You haven’t placed any orders yet. Start exploring restaurants now!
          </p>
          
      
        </div>
      )}
    </div>
  );
}
