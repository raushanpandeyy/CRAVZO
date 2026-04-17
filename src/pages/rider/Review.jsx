import React, { useState } from "react";
import { useLocation } from "react-router-dom";

const RiderReview = () => {
  const location = useLocation();

  // 🔥 Order data route se aayega
  const order = location.state?.order;

  const [customerRating, setCustomerRating] = useState(0);
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [customerReview, setCustomerReview] = useState("");
  const [restaurantReview, setRestaurantReview] = useState("");
  const [issue, setIssue] = useState("");

  // ❌ Agar order nahi hai toh review allowed nahi
  if (!order) {
    return (
      <div className="h-screen flex items-center justify-center">
        <h2 className="text-xl font-bold text-red-500">
          ❌ No order selected for review
        </h2>
      </div>
    );
  }

  const handleSubmit = () => {
    const reviewData = {
      orderId: order.id, // 🔥 IMPORTANT
      customerRating,
      restaurantRating,
      customerReview,
      restaurantReview,
      issue,
    };

    console.log("Submitted Review:", reviewData);
    alert("✅ Review Submitted Successfully!");
  };

  const StarRating = ({ rating, setRating }) => {
    return (
      <div className="flex gap-2 text-2xl">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setRating(star)}
            className={`cursor-pointer ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-2xl font-bold mb-2 text-center">
        Review Order #{order.id}
      </h1>

      <p className="text-center text-gray-500 mb-6">
        Customer: {order.customerName} | Restaurant: {order.restaurantName}
      </p>

      <div className="max-w-3xl mx-auto space-y-6">

        {/* CUSTOMER */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="font-semibold mb-3">👤 Customer Review</h2>
          <StarRating rating={customerRating} setRating={setCustomerRating} />
          <textarea
            placeholder="Write about customer..."
            className="w-full mt-4 p-3 border rounded-xl"
            value={customerReview}
            onChange={(e) => setCustomerReview(e.target.value)}
          />
        </div>

        {/* RESTAURANT */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="font-semibold mb-3">🍽️ Restaurant Review</h2>
          <StarRating rating={restaurantRating} setRating={setRestaurantRating} />
          <textarea
            placeholder="Restaurant feedback..."
            className="w-full mt-4 p-3 border rounded-xl"
            value={restaurantReview}
            onChange={(e) => setRestaurantReview(e.target.value)}
          />
        </div>

        {/* ISSUE */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="font-semibold mb-3">🚨 Issue (Optional)</h2>
          <textarea
            placeholder="Any issue?"
            className="w-full p-3 border rounded-xl"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-purple-700 text-white py-3 rounded-xl font-bold"
        >
          Submit Review
        </button>

      </div>
    </div>
  );
};

export default RiderReview;