import React, { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { deleteReview, getMyReviews } from "../../services/reviewService";

const Stars = ({ rating }) => (
  <div className="flex items-center gap-1 text-amber-500">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star key={index} className={`h-4 w-4 ${index < rating ? "fill-current" : ""}`} />
    ))}
  </div>
);

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadReviews = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMyReviews();
      setReviews(data);
    } catch (requestError) {
      setError(requestError.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleDelete = async (reviewId) => {
    try {
      setMessage("");
      setError("");
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((review) => review.id !== reviewId));
      setMessage("Review deleted successfully.");
    } catch (requestError) {
      setError(requestError.message || "Failed to delete review");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-slate-900">Your Reviews</h1>
          <p className="mt-2 text-sm text-slate-500">Track the feedback you have shared across restaurants.</p>
        </div>

        {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        {loading ? (
          <div className="rounded-3xl bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm">Loading reviews...</div>
        ) : reviews.length ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Link to={`/restaurant/${review.restaurant?.id}`} className="text-xl font-semibold text-indigo-900 hover:underline">
                      {review.restaurant?.name || "Restaurant"}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(review.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>

                <div className="mt-4">
                  <Stars rating={review.rating} />
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-700">{review.comment || "No written comment added."}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm">
            You have not posted any reviews yet. Visit a restaurant page to add one.
          </div>
        )}
      </div>
    </div>
  );
}
