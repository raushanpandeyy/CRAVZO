import React, { useState } from "react";
import { Star, X, Bike, UtensilsCrossed, CheckCircle2 } from "lucide-react";
import { saveReview } from "../services/reviewService.js";

// Star rating picker
const StarPicker = ({ value, onChange, size = "h-7 w-7" }) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => onChange(i + 1)}
        className="transition-transform active:scale-90"
        aria-label={`Rate ${i + 1} stars`}
      >
        <Star
          className={`${size} ${
            i < value ? "fill-amber-400 text-amber-400" : "text-slate-200"
          } transition-colors`}
        />
      </button>
    ))}
  </div>
);

const DELIVERY_LABELS = ["Terrible", "Bad", "Okay", "Good", "Excellent"];
const RESTAURANT_LABELS = ["Terrible", "Bad", "Okay", "Good", "Excellent"];

const OrderFeedbackModal = ({ order, onClose, onSubmitted }) => {
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!restaurantRating) return;
    setSaving(true);
    setError("");

    try {
      await saveReview({
        restaurantId: order.restaurant?.id,
        rating: restaurantRating,
        comment: comment.trim() || null,
      });

      // Mark this order's feedback as submitted in localStorage
      const submitted = JSON.parse(
        localStorage.getItem("cravzo_feedback_submitted") || "[]"
      );
      if (!submitted.includes(order.id)) {
        submitted.push(order.id);
        localStorage.setItem(
          "cravzo_feedback_submitted",
          JSON.stringify(submitted)
        );
      }

      setDone(true);
      setTimeout(() => {
        onSubmitted?.();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to submit feedback. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white px-8 py-10 shadow-2xl text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Thanks for the feedback!</h2>
          <p className="text-sm text-slate-500">Your review helps others discover great food.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 px-3 pb-3 sm:items-center sm:p-6">
      <div className="w-full max-w-md overflow-y-auto max-h-[90vh] rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 bg-indigo-600 px-5 pt-5 pb-5 rounded-t-3xl">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-indigo-200">
              Rate your experience
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              {order.restaurant?.name || "Restaurant"}
            </h2>
            <p className="mt-1 text-sm text-indigo-200">
              Order delivered on{" "}
              {new Date(order.updatedAt || order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Delivery Rating */}
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                <Bike className="h-4 w-4 text-indigo-700" />
              </div>
              <p className="text-sm font-black text-slate-900">Delivery Experience</p>
            </div>
            <StarPicker value={deliveryRating} onChange={setDeliveryRating} />
            {deliveryRating > 0 && (
              <p className="mt-2 text-xs font-semibold text-amber-600">
                {DELIVERY_LABELS[deliveryRating - 1]}
              </p>
            )}
          </div>

          {/* Restaurant Rating */}
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                <UtensilsCrossed className="h-4 w-4 text-indigo-700" />
              </div>
              <p className="text-sm font-black text-slate-900">Food & Restaurant</p>
            </div>
            <StarPicker value={restaurantRating} onChange={setRestaurantRating} />
            {restaurantRating > 0 && (
              <p className="mt-2 text-xs font-semibold text-amber-600">
                {RESTAURANT_LABELS[restaurantRating - 1]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-black text-slate-900 mb-2">
              Add a comment <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="How was the food? How was the delivery? Tell others..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {comment.length}/300
            </p>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving || !restaurantRating}
            className="w-full rounded-2xl bg-indigo-600 py-3.5 text-sm font-black text-white transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "Submitting..." : "Submit Feedback"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-xs text-slate-400 hover:text-slate-600 transition"
          >
            Skip for now — remind me later
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderFeedbackModal;
