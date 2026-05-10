import React, { useState } from "react";
import { Send } from "lucide-react";

export default function Contacts() {
  const [messages, setMessages] = useState([
    { text: "Hi 👋, how can we help you?", sender: "support", time: "10:00 AM" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMsg = {
      text: input,
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([...messages, newMsg]);
    setInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          text: "Our team will get back to you shortly.",
          sender: "support",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1000);
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-indigo-950 text-white md:h-screen">
      {/* Left Sidebar (Desktop Only) */}
      <div className="hidden md:flex w-1/3 bg-indigo-900 flex-col border-r border-indigo-800">
        <div className="p-4 font-semibold text-lg">Chats</div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 hover:bg-indigo-800 cursor-pointer">
            <p className="font-medium">Support</p>
            <p className="text-sm text-gray-300">Tap to chat</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="p-4 bg-indigo-900 text-lg font-semibold flex items-center justify-between">
          <span>Cravzo Support</span>
          <span className="text-sm text-green-400">● Online</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-[70%] ${
                  msg.sender === "user"
                    ? "bg-indigo-600"
                    : "bg-gray-800"
                }`}
              >
                <p>{msg.text}</p>
                <p className="text-[10px] text-gray-300 text-right mt-1">
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 bg-indigo-900 flex items-center gap-2 sticky bottom-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-full bg-gray-800 outline-none"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-indigo-600 p-3 rounded-full hover:bg-indigo-700"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
