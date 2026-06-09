import React from "react";
import { ArrowRight, MessageCircle, Star } from "lucide-react";
import { cart } from "../assets/images/logos.js";

const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(0)}`;

const riderChatClosedStatuses = ["DELIVERED", "CANCELLED", "REJECTED"];
const cancellableStatuses = ["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP"];

const statusBadgeClass = (status) => {
  switch (status) {
    case "DELIVERED": return "bg-emerald-600";
    case "CANCELLED":
    case "REJECTED": return "bg-red-600";
    case "OUT_FOR_DELIVERY": return "bg-blue-600";
    case "PENDING": return "bg-amber-500";
    default: return "bg-indigo-950";
  }
};

const OrderCard = React.memo(({ order, onSelect, onCancel, onChat, onFeedback, needsFeedback, canChatWithRider }) => (
  <div
    onClick={() => onSelect(order)}
    className="cursor-pointer group overflow-hidden rounded-[28px] border border-slate-100 bg-white text-left shadow-sm transition-all duration-200 active:scale-[0.99] hover:shadow-md sm:rounded-3xl"
  >
    <div className="relative h-32 overflow-hidden sm:h-40">
      <img
        src={order.restaurant?.imageUrl || cart}
        alt={order.restaurant?.name || "Order"}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-black text-white ${statusBadgeClass(order.status)}`}>
        {order.status.replace(/_/g, " ")}
      </span>
      {needsFeedback(order) && (
        <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950">
          Rate
        </span>
      )}
    </div>

    <div className="flex flex-col gap-3 p-4">
      <div>
        <h2 className="line-clamp-1 text-lg font-black text-slate-950">
          {order.restaurant?.name || "Restaurant"}
        </h2>
        <p className="mt-1 line-clamp-1 text-sm text-slate-500">
          {order.items?.map((item) => item.menuItem?.name).filter(Boolean).join(", ")}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
        <span className="font-black text-slate-950">{formatCurrency(order.totalAmount)}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-bold text-amber-600">{order.paymentMethod}</div>
        <div className="flex items-center gap-2">
          {cancellableStatuses.includes(order.status) ? (
            <button
              onClick={(event) => onCancel(event, order.id)}
              className="rounded-full bg-rose-600 px-3 py-2 text-xs font-bold text-white"
            >
              Cancel
            </button>
          ) : null}
          {canChatWithRider(order) ? (
            <button
              type="button"
              onClick={(event) => onChat(event, order)}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-2 text-xs font-bold text-white"
            >
              <MessageCircle className="h-4 w-4" />
              Rider
            </button>
          ) : null}
          {needsFeedback(order) ? (
            <button
              type="button"
              onClick={(event) => onFeedback(event, order)}
              className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-2 text-xs font-black text-amber-950"
            >
              <Star className="h-3.5 w-3.5" />
              Rate
            </button>
          ) : null}
          <span className="inline-flex items-center gap-1 text-xs font-black text-indigo-700">
            View <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  </div>
));

export default OrderCard;
