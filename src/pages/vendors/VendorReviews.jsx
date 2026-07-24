import React, { useEffect, useMemo, useState } from "react";
import { MessageSquareReply, RefreshCcw, Star } from "lucide-react";

import { SkeletonCard, SkeletonRow } from "../../components/Skeleton.jsx";
import { getRestaurantReviews, replyToReview } from "../../services/reviewService.js";
import { getMyRestaurant } from "../../services/vendorService.js";

const formatDate = (value) => {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const RatingStars = ({ rating = 0 }) => (
  <div className="flex items-center gap-1" aria-label={`${rating} star rating`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-4 w-4 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
      />
    ))}
  </div>
);

const VendorReviews = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [savingReviewId, setSavingReviewId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadReviews = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const restaurantData = await getMyRestaurant();
      setRestaurant(restaurantData);

      if (!restaurantData?.id) {
        setReviews([]);
        return;
      }

      const reviewData = await getRestaurantReviews(restaurantData.id);
      setReviews(Array.isArray(reviewData) ? reviewData : []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const summary = useMemo(() => {
    const total = reviews.length;
    const average = total
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / total
      : 0;
    const withComments = reviews.filter((review) => review.comment?.trim()).length;
    const replied = reviews.filter((review) => review.reply?.trim()).length;

    return {
      average: average ? average.toFixed(1) : "0.0",
      total,
      withComments,
      replied,
    };
  }, [reviews]);

  const handleReplyChange = (reviewId, value) => {
    setReplyDrafts((current) => ({ ...current, [reviewId]: value }));
  };

  const handleReplySubmit = async (review) => {
    const reply = (replyDrafts[review.id] ?? review.reply ?? "").trim();
    if (!reply) {
      setError("Reply text is required");
      return;
    }

    setSavingReviewId(review.id);
    setError("");
    setMessage("");

    try {
      const updatedReview = await replyToReview(review.id, reply, restaurant?.id);
      setReviews((current) => current.map((item) => (item.id === review.id ? updatedReview : item)));
      setReplyDrafts((current) => ({ ...current, [review.id]: "" }));
      setMessage("Reply posted successfully.");
    } catch (requestError) {
      setError(requestError.message || "Failed to post reply");
    } finally {
      setSavingReviewId("");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] px-4 py-4 md:px-6 md:py-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-950 text-white">
            <Star className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-black text-slate-950 md:text-4xl">Customer Reviews</h1>
            <p className="text-sm text-slate-500">
              {restaurant?.name ? `${restaurant.name} feedback and owner replies.` : "Feedback for your restaurant."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadReviews}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loading}
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error ? <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      {message ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div> : null}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : !restaurant ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-black text-slate-950">No restaurant profile found</p>
          <p className="mt-2 text-sm text-slate-500">Create your restaurant profile before collecting reviews.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">Average Rating</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-black text-slate-950">{summary.average}</span>
                <span className="pb-1 text-sm font-bold text-slate-400">/ 5</span>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">Total Reviews</p>
              <p className="mt-2 text-3xl font-black text-indigo-700">{summary.total}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">Written Comments</p>
              <p className="mt-2 text-3xl font-black text-emerald-700">{summary.withComments}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">Owner Replies</p>
              <p className="mt-2 text-3xl font-black text-amber-700">{summary.replied}</p>
            </div>
          </div>

          <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-950">Latest Feedback</h2>
                <p className="text-xs font-semibold text-slate-400">Reviews are sorted from newest to oldest.</p>
              </div>
              <MessageSquareReply className="h-5 w-5 text-slate-400" />
            </div>

            {reviews.length ? (
              <div className="space-y-4">
                {reviews.map((review) => {
                  const draftValue = replyDrafts[review.id] ?? review.reply ?? "";
                  const isSaving = savingReviewId === review.id;

                  return (
                    <article key={review.id} className="rounded-2xl border border-slate-100 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="font-black text-slate-950">{review.user?.name || "Customer"}</p>
                            <RatingStars rating={review.rating} />
                          </div>
                          <p className="mt-1 text-xs font-semibold text-slate-400">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>

                      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">
                        {review.comment?.trim() || "Customer left a rating without a written comment."}
                      </p>

                      {review.reply ? (
                        <div className="mt-4 rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-950">
                          <p className="font-black">Your reply</p>
                          <p className="mt-1 whitespace-pre-line leading-6">{review.reply}</p>
                          {review.replyDate ? <p className="mt-2 text-xs font-bold text-indigo-500">{formatDate(review.replyDate)}</p> : null}
                        </div>
                      ) : null}

                      <div className="mt-4">
                        <label className="text-xs font-black uppercase tracking-wide text-slate-400" htmlFor={`reply-${review.id}`}>
                          {review.reply ? "Update reply" : "Reply to customer"}
                        </label>
                        <textarea
                          id={`reply-${review.id}`}
                          value={draftValue}
                          onChange={(event) => handleReplyChange(review.id, event.target.value)}
                          rows={3}
                          maxLength={1000}
                          className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                          placeholder="Write a short, helpful reply"
                        />
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-slate-400">{draftValue.length}/1000</span>
                          <button
                            type="button"
                            onClick={() => handleReplySubmit(review)}
                            disabled={isSaving || !draftValue.trim()}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <MessageSquareReply className="h-4 w-4" />
                            {isSaving ? "Saving..." : "Post Reply"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-sm font-bold text-slate-400">No customer reviews yet.</div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default VendorReviews;
