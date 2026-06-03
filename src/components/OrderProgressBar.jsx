import React from "react";
import {
  CheckCircle2,
  ChefHat,
  Clock,
  Package,
  Bike,
  XCircle,
} from "lucide-react";

// The ordered pipeline of statuses
const STATUS_STEPS = [
  {
    key: "PENDING",
    label: "Order Placed",
    sublabel: "Waiting for restaurant",
    icon: Clock,
  },
  {
    key: "ACCEPTED",
    label: "Accepted",
    sublabel: "Restaurant confirmed",
    icon: CheckCircle2,
  },
  {
    key: "PREPARING",
    label: "Preparing",
    sublabel: "Being cooked",
    icon: ChefHat,
  },
  {
    key: "READY_FOR_PICKUP",
    label: "Ready",
    sublabel: "Waiting for rider",
    icon: Package,
  },
  {
    key: "OUT_FOR_DELIVERY",
    label: "On the way",
    sublabel: "Rider picked up",
    icon: Bike,
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    sublabel: "Enjoy your meal!",
    icon: CheckCircle2,
  },
];

const isCancelled = (status) =>
  status === "CANCELLED" || status === "REJECTED";

const getActiveIndex = (status) => {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
};

const OrderProgressBar = ({ status }) => {
  if (isCancelled(status)) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <p className="text-sm font-black text-red-700">
            Order {status === "REJECTED" ? "Rejected" : "Cancelled"}
          </p>
          <p className="text-xs text-red-500">
            {status === "REJECTED"
              ? "This order was rejected by the restaurant."
              : "This order has been cancelled."}
          </p>
        </div>
      </div>
    );
  }

  const activeIndex = getActiveIndex(status);

  return (
    <div className="rounded-2xl bg-indigo-50 p-4">
      <p className="mb-4 text-xs font-black uppercase tracking-[0.15em] text-indigo-700">
        Order Status
      </p>

      {/* Steps */}
      <div className="relative flex items-start justify-between gap-1">
        {/* Progress line behind icons */}
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-indigo-100" />
        <div
          className="absolute left-0 top-4 h-0.5 bg-indigo-600 transition-all duration-700 ease-in-out"
          style={{
            width:
              activeIndex === 0
                ? "0%"
                : `${(activeIndex / (STATUS_STEPS.length - 1)) * 100}%`,
          }}
        />

        {STATUS_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;
          const isPending = index > activeIndex;

          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-1 flex-col items-center gap-1.5"
            >
              {/* Circle icon */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isDone
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : isActive
                    ? "border-indigo-600 bg-white text-indigo-600 shadow-md shadow-indigo-200"
                    : "border-slate-200 bg-white text-slate-300"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "animate-pulse" : ""}`} />
              </div>

              {/* Label — only show for active and adjacent */}
              <div className="flex flex-col items-center text-center">
                <p
                  className={`text-[10px] font-black leading-tight ${
                    isDone
                      ? "text-indigo-600"
                      : isActive
                      ? "text-indigo-900"
                      : "text-slate-300"
                  }`}
                >
                  {step.label}
                </p>
                {isActive && (
                  <p className="mt-0.5 text-[9px] font-semibold text-indigo-500 leading-tight">
                    {step.sublabel}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active status banner */}
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5">
        <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
        <p className="text-xs font-black text-white">
          {STATUS_STEPS[activeIndex]?.label} —{" "}
          {STATUS_STEPS[activeIndex]?.sublabel}
        </p>
      </div>
    </div>
  );
};

export default OrderProgressBar;
