import React, { useState, lazy, Suspense, useEffect } from 'react';
import { useSearchParams, useNavigate } from "react-router-dom";
import { MessageCircle, Package, Users } from "lucide-react";

const Chat = lazy(() =>
  import("../../components/Chat.jsx")
);

const RiderChatPage = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const roomId = searchParams.get("roomId") || "";
  const mode = searchParams.get("mode") || "";
  const orderId = searchParams.get("orderId") || "";

  useEffect(() => {
    if (mode === "order" && orderId) {
      setChatMode("order");
    } else if (mode === "support" || roomId) {
      setChatMode("support");
      setIsChatOpen(true);
    }
  }, [mode, orderId, roomId]);

  useEffect(() => {
    const loadActiveOrders = async () => {
      try {
        const { getRiderOrders } = await import("../../services/orderService.js");
        const rawOrders = await getRiderOrders();
        const orders = Array.isArray(rawOrders) ? rawOrders : [];
        const active = orders.filter(
          (o) => !o.isAvailable && !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status)
        );
        setActiveOrders(active);
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        setLoading(false);
      }
    };
    loadActiveOrders();
  }, []);

  const openSupportChat = () => {
    setChatMode("support");
    setSelectedOrder(null);
    setIsChatOpen(true);
    navigate("/rider-chat?mode=support", { replace: true });
  };

  const openCustomerChat = (order) => {
    setSelectedOrder(order);
    setChatMode("order");
    setIsChatOpen(true);
    navigate(`/rider-chat?mode=order&orderId=${order.id}`, { replace: true });
  };

  const canChatWithCustomer = (order) =>
    !order.isAvailable && !["DELIVERED", "CANCELLED", "REJECTED"].includes(order.status);

  return (
    <div className="min-h-screen bg-[#F4F7FB] px-4 pt-4 pb-24 md:pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>
          <p className="text-gray-600 mb-6">
            Chat with support team or contact customers for ongoing deliveries.
          </p>

          <div className="space-y-4">
            <button
              onClick={openSupportChat}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                <Users className="h-6 w-6" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-gray-900">Support Team</h3>
                <p className="text-sm text-gray-500">Chat with admin support</p>
              </div>
              <MessageCircle className="h-5 w-5 text-gray-400" />
            </button>

            {activeOrders.length > 0 && (
              <div className="pt-4">
                <h3 className="text-sm font-bold text-gray-500 mb-3">ONGOING DELIVERIES</h3>
                <div className="space-y-3">
                  {activeOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => openCustomerChat(order)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Package className="h-6 w-6" />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-bold text-gray-900">{order.customer?.name || "Customer"}</h3>
                        <p className="text-sm text-gray-500">
                          {order.restaurant?.name} - {order.status.replaceAll("_", " ")}
                        </p>
                      </div>
                      {canChatWithCustomer(order) ? (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                          <MessageCircle className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Closed</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-4 text-gray-500">Loading orders...</div>
            )}

            {!loading && activeOrders.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No ongoing deliveries</p>
              </div>
            )}
          </div>
        </div>

        {isChatOpen && chatMode === "support" && (
          <Suspense fallback={<div className="text-center mt-8">Loading chat...</div>}>
            <div className="mt-6">
              <Chat
                isOpen={isChatOpen}
                onClose={() => { setIsChatOpen(false); setChatMode(null); }}
                variant="panel"
                mode="support"
                roomId=""
                title="Support Team"
                subtitle="Rider support chat"
              />
            </div>
          </Suspense>
        )}

        {isChatOpen && chatMode === "order" && selectedOrder && (
          <Suspense fallback={<div className="text-center mt-8">Loading chat...</div>}>
            <div className="mt-6">
              <Chat
                isOpen={isChatOpen}
                onClose={() => { setIsChatOpen(false); setChatMode(null); setSelectedOrder(null); }}
                variant="panel"
                mode="order"
                orderId={selectedOrder.id}
                title="Customer Chat"
                subtitle={selectedOrder.customer?.name || "Customer"}
                participantName={selectedOrder.customer?.name || "Customer"}
                disabled={!canChatWithCustomer(selectedOrder)}
                disabledReason="Chat closes after delivery or cancellation."
              />
            </div>
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default RiderChatPage;
