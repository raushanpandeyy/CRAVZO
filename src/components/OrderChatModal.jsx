import React, { lazy, Suspense } from "react";
import { X } from "lucide-react";

const Chat = lazy(() => import("./Chat.jsx"));

const closedOrderStatuses = ["DELIVERED", "CANCELLED", "REJECTED"];

const isOrderChatClosed = (order) => closedOrderStatuses.includes(order?.status);

const OrderChatModal = ({
  order,
  onClose,
  title = "Order Chat",
  subtitle,
  participantName,
  disabled,
  disabledReason,
}) => {
  if (!order) return null;

  const isDisabled = disabled ?? isOrderChatClosed(order);

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/55 p-3 sm:items-center sm:justify-center sm:p-6">
      <div className="w-full max-w-lg rounded-3xl bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Order #{order.id?.slice?.(-6) || "chat"}</p>
            <h2 className="text-xl font-black text-slate-950">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
            aria-label="Close order chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <Suspense fallback={<div className="flex h-[520px] items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">Loading chat...</div>}>
          <Chat
            isOpen
            onClose={onClose}
            mode="order"
            orderId={order.id}
            title={title}
            subtitle={subtitle || order.status?.replaceAll?.("_", " ")}
            participantName={participantName}
            disabled={isDisabled}
            disabledReason={disabledReason || "This order is complete, so rider and restaurant chat is closed."}
            variant="panel"
          />
        </Suspense>
      </div>
    </div>
  );
};

export default OrderChatModal;
