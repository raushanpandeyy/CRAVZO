import React, { useEffect, useRef, useState } from "react";
import { Bot, ImagePlus, MessageCircle, Send, ShieldCheck, User, X } from "lucide-react";

import {
  getChatMessages,
  getOrderChatRoom,
  getSupportChatRoom,
  getVendorOrderChatRoom,
  sendChatMessage,
  uploadChatImage,
} from "../services/chatService.js";
import { joinChatRoom, leaveChatRoom, onSocketMessage, sendSocketMessage } from "../services/chatSocket.js";

const getRepresentativeInfo = (userType) => {
  const role = String(userType || "customer").toLowerCase();
  const representatives = {
    customer: {
      name: "Customer Support",
      role: "Food Service Assistant",
      icon: ShieldCheck,
      color: "bg-blue-500",
    },
    vendor: {
      name: "Vendor Support",
      role: "Restaurant Partner Manager",
      icon: ShieldCheck,
      color: "bg-green-500",
    },
    rider: {
      name: "Rider Support",
      role: "Delivery Coordinator",
      icon: ShieldCheck,
      color: "bg-orange-500",
    },
  };

  return representatives[role] || representatives.customer;
};

const normalizeRole = (role) => String(role || "").toLowerCase();

const Chat = ({
  isOpen,
  onClose,
  mode = "support",
  orderId = "",
  roomId = "",
  title,
  subtitle,
  participantName,
  disabled = false,
  disabledReason = "Chat is disabled for this order.",
  variant = "floating",
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const latestMessageAtRef = useRef("");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("cravzoCurrentUser"));
    setUser(storedUser);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;

    const loadRoom = async () => {
      setLoading(true);
      setError("");

      try {
        const nextRoom = roomId
          ? { id: roomId }
          : mode === "order"
            ? await getOrderChatRoom(orderId)
            : mode === "order-vendor"
              ? await getVendorOrderChatRoom(orderId)
              : await getSupportChatRoom();
        if (cancelled) return;

        setRoom(nextRoom);
        const initialMessages = await getChatMessages(nextRoom.id, { limit: 30 });
        if (cancelled) return;

        setMessages(initialMessages);
        latestMessageAtRef.current = initialMessages.at(-1)?.createdAt || "";
        await joinChatRoom(nextRoom.id);
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "Failed to load chat");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRoom();

    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, orderId, roomId]);

  useEffect(() => {
    if (!isOpen || !room?.id) return undefined;

    const unsubscribe = onSocketMessage(({ message }) => {
      if (message?.roomId === room.id) {
        appendMessage(message);
      }
    });

    return () => {
      unsubscribe();
      leaveChatRoom(room.id);
    };
  }, [isOpen, room?.id]);

  const repInfo =
    mode === "order" || mode === "order-vendor"
      ? {
          name: participantName || "Order Chat",
          role: subtitle || "Order conversation",
          icon: User,
          color: disabled ? "bg-slate-500" : mode === "order-vendor" ? "bg-emerald-600" : "bg-indigo-600",
        }
      : user
        ? getRepresentativeInfo(user.accountType || user.role)
        : getRepresentativeInfo("customer");

  const appendMessage = (message) => {
    setMessages((currentMessages) => {
      const nextMessages = currentMessages.some((entry) => entry.id === message.id)
        ? currentMessages
        : [...currentMessages, message];
      latestMessageAtRef.current = nextMessages.at(-1)?.createdAt || latestMessageAtRef.current;
      return nextMessages;
    });
  };

  const sendMessage = async ({ imageUrl = "" } = {}) => {
    if (disabled || sending || !room?.id || (!newMessage.trim() && !imageUrl)) return;

    setSending(true);
    setError("");

    try {
      const response = await sendSocketMessage({
        roomId: room.id,
        text: newMessage.trim(),
        imageUrl,
        clientId: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      });
      setNewMessage("");
      appendMessage(response.message);
    } catch (requestError) {
      try {
        const createdMessage = await sendChatMessage(room.id, {
          text: newMessage.trim(),
          imageUrl,
        });
        setNewMessage("");
        appendMessage(createdMessage);
      } catch (fallbackError) {
        setError(fallbackError.message || requestError.message || "Failed to send message");
      }
    } finally {
      setSending(false);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file || !room?.id) return;

    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setSending(true);
      setError("");

      try {
        const uploaded = await uploadChatImage(room.id, String(reader.result || ""));
        const response = await sendSocketMessage({
          roomId: room.id,
          text: newMessage.trim(),
          imageUrl: uploaded.url,
          clientId: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        });
        setNewMessage("");
        appendMessage(response.message);
      } catch (requestError) {
        setError(requestError.message || "Failed to upload image");
      } finally {
        setSending(false);
        event.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const RepIcon = repInfo.icon;
  const containerClass =
    variant === "panel"
      ? "w-full h-[520px] bg-white rounded-2xl border flex flex-col"
      : "fixed bottom-20 right-4 w-80 h-96 bg-white rounded-lg shadow-2xl border z-50 flex flex-col";

  return (
    <div className={containerClass}>
      <div className={`${repInfo.color} text-white p-4 rounded-t-lg flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <RepIcon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{title || repInfo.name}</h3>
            <p className="text-xs opacity-90">{subtitle || repInfo.role}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-full p-1 transition-colors hover:bg-white/20" aria-label="Close chat">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <div className="mt-8 text-center text-sm text-gray-500">Loading chat...</div>
        ) : messages.length === 0 ? (
          <div className="mt-8 text-center text-gray-500">
            <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start a conversation</p>
            <p className="mt-1 text-xs">{mode === "order" ? "Messages stay linked to this order." : "We're here to help you."}</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.sender?.id === user?.id;
            const SenderIcon = isMine ? User : Bot;

            return (
              <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs rounded-lg px-3 py-2 text-sm ${isMine ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                  {!isMine ? (
                    <div className="mb-1 flex items-center gap-1">
                      <SenderIcon size={12} />
                      <span className="text-xs font-medium">{message.sender?.name || repInfo.name}</span>
                      {message.sender?.role ? <span className="text-[10px] uppercase opacity-70">{normalizeRole(message.sender.role)}</span> : null}
                    </div>
                  ) : null}
                  {message.imageUrl ? <img src={message.imageUrl} alt="Chat attachment" className="mb-2 max-h-40 rounded-lg object-cover" /> : null}
                  {message.text ? <p>{message.text}</p> : null}
                  <p className={`mt-1 text-xs ${isMine ? "text-indigo-200" : "text-gray-500"}`}>
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="rounded-b-lg border-t bg-gray-50 p-4">
        {disabled ? (
          <div className="mb-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
            {disabledReason}
          </div>
        ) : null}
        {error ? <div className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</div> : null}
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || sending || !room?.id}
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Attach photo"
          >
            <ImagePlus size={16} />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && sendMessage()}
            placeholder={disabled ? "Chat closed" : "Type your message..."}
            disabled={disabled || sending || !room?.id}
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
          />
          <button
            onClick={() => sendMessage()}
            disabled={disabled || sending || !room?.id || !newMessage.trim()}
            className="rounded-lg bg-indigo-600 p-2 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
