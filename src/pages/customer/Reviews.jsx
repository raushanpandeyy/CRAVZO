import React from 'react';
const reviewsData = [
  {
    restaurant: "Pizza Palace",
    dish: "Margherita Pizza",
    customer: "Rahul",
    rating: 4,
    comment: "Loved the cheese and crust!"
  },
  {
    restaurant: "Sushi World",
    dish: "Salmon Nigiri",
    customer: "Anjali",
    rating: 5,
    comment: "Fresh and delicious!"
  },
  {
    restaurant: "Burger Hub",
    dish: "Cheese Burger",
    customer: "Vikram",
    rating: 3,
    comment: "Good taste but small portion."
  }
];

const ReviewCard = ({ review }) => {
  return (
    <div className="border rounded-lg p-4 shadow-md mb-4">
      <h2 className="text-lg font-semibold">{review.restaurant}</h2>
      <h3 className="text-md font-medium">Dish: {review.dish}</h3>
      <p>Customer: {review.customer}</p>
      <p>Rating: {"⭐".repeat(review.rating)}</p>
      <p>Comment: {review.comment}</p>
    </div>
  );
};

export default function Reviews() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Customer Reviews</h1>
      {reviewsData.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        reviewsData.map((review, index) => (
          <ReviewCard key={index} review={review} />
        ))
      )}
    </div>
  );
}

