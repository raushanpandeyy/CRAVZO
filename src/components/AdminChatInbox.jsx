import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, RefreshCw, UserRound } from "lucide-react";

import { getAdminChatRooms, getCustomerSupportRoom } from "../services/chatService.js";

const Chat = lazy(() => import("./Chat.jsx"));

const roomLabel = (room) => {
  if (room.type === "SUPPORT") {
    return room.supportUser?.name || "Support user";
  }

  return `Order #${room.orderId?.slice?.(-6) || "chat"}`;
};

const roomSubtitle = (room) => {
  if (room.type === "SUPPORT") {
    return [room.supportUser?.role, room.supportUser?.phone || room.supportUser?.email].filter(Boolean).join(" • ");
  }

  return [room.order?.customer?.name, room.order?.rider?.name || "No rider", room.order?.restaurant?.name].filter(Boolean).join(" • ");
};

const AdminChatInbox = () => {
  const [type, setType] = useState("SUPPORT");
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedTitle = useMemo(() => (selectedRoom ? roomLabel(selectedRoom) : "Select a chat"), [selectedRoom]);
  const selectedSubtitle = useMemo(() => (selectedRoom ? roomSubtitle(selectedRoom) : "Admin support inbox"), [selectedRoom]);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAdminChatRooms(type);
      setRooms(data);
      setSelectedRoom((currentRoom) => {
        if (currentRoom && data.some((room) => room.id === currentRoom.id)) {
          return data.find((room) => room.id === currentRoom.id);
        }

        return data[0] || null;
      });
    } catch (requestError) {
      setError(requestError.message || "Failed to load chat inbox");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Chat Inbox</h2>
          <p className="text-sm text-slate-500">Live support and order chats with Socket.IO.</p>
        </div>
        <div className="flex gap-2">
          {["SUPPORT", "ORDER_RIDER"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setType(item)}
              className={`rounded-full px-4 py-2 text-xs font-bold ${
                type === item ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {item === "SUPPORT" ? "Support" : "Orders"}
            </button>
          ))}
          <button
            type="button"
            onClick={loadRooms}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700"
            aria-label="Refresh chats"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="max-h-[520px] overflow-y-auto rounded-2xl border border-slate-200">
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => setSelectedRoom(room)}
              className={`flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left last:border-b-0 ${
                selectedRoom?.id === room.id ? "bg-indigo-50" : "bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                {room.type === "SUPPORT" ? <UserRound className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-bold text-slate-900">{roomLabel(room)}</p>
                  <span className="shrink-0 text-[11px] text-slate-500">
                    {new Date(room.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="truncate text-xs text-slate-500">{roomSubtitle(room) || "No participant details"}</p>
                <p className="mt-1 truncate text-sm text-slate-600">
                  {room.latestMessage?.text || (room.latestMessage?.imageUrl ? "Photo attachment" : "No messages yet")}
                </p>
              </div>
            </button>
          ))}

          {!rooms.length ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              {loading ? "Loading chats..." : "No chats found yet."}
            </div>
          ) : null}
        </div>

        {selectedRoom ? (
          <Suspense fallback={<div className="flex h-[520px] items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">Loading chat...</div>}>
            <Chat
              isOpen
              onClose={() => setSelectedRoom(null)}
              roomId={selectedRoom.id}
              title={selectedTitle}
              subtitle={selectedSubtitle}
              participantName={selectedTitle}
              variant="panel"
            />
          </Suspense>
        ) : (
          <div className="flex h-[520px] items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500">
            Select a chat to start.
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminChatInbox;
