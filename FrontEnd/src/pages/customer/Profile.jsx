import React from "react";

const Profile = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex justify-between items-center bg-indigo-800 text-white px-6 py-4">
        <h1 className="text-xl font-bold">CRAVZO</h1>
        <span className="text-lg">Customer Profile</span>
      </div>

      {/* Profile Section */}
      <div className="flex flex-col items-center mt-8">
        <div className="w-24 h-24 rounded-full bg-indigo-800 flex items-center justify-center text-white text-sm font-medium">
          Photo
        </div>
        <h2 className="mt-4 text-xl font-semibold text-indigo-800">Raushan</h2>
        <p className="text-gray-600">99 84 XX</p>
      </div>

      {/* Menu Buttons */}
      <div className="mt-8 space-y-4 px-8">
        <button className="w-full py-3 bg-white text-indigo-800 border-2 border-indigo-800 rounded-xl font-medium shadow">
          Payments
        </button>
        <button className="w-full py-3 bg-white text-indigo-800 border-2 border-indigo-800 rounded-xl font-medium shadow">
          Orders
        </button>
        <button className="w-full py-3 bg-white text-indigo-800 border-2 border-indigo-800 rounded-xl font-medium shadow">
          Address
        </button>
        <button className="w-full py-3 bg-white text-indigo-800 border-2 border-indigo-800 rounded-xl font-medium shadow">
          History
        </button>
        <button className="w-full py-3 bg-white text-indigo-800 border-2 border-indigo-800 rounded-xl font-medium shadow">
          Favorites
        </button>
      </div>
    </div>
  );
};

export default Profile;






