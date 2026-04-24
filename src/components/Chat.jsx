import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X, User, Bot } from 'lucide-react';

const Chat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);

  // Load user and chat history
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("cravzoCurrentUser"));
    setUser(storedUser);

    if (storedUser) {
      const chatKey = `cravzoChat_${storedUser.accountType}_${storedUser.id || storedUser.email}`;
      const chatHistory = JSON.parse(localStorage.getItem(chatKey)) || [];
      setMessages(chatHistory);
    }
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save messages to localStorage
  const saveMessages = (updatedMessages) => {
    if (user) {
      const chatKey = `cravzoChat_${user.accountType}_${user.id || user.email}`;
      localStorage.setItem(chatKey, JSON.stringify(updatedMessages));
    }
  };

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !user) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      userType: user.accountType
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setNewMessage('');

    // Simulate auto-reply based on user role
    setTimeout(() => {
      const reply = getAutoReply(user.accountType);
      const replyMessage = {
        id: Date.now() + 1,
        text: reply,
        sender: 'support',
        timestamp: new Date().toISOString(),
        userType: user.accountType
      };
      const messagesWithReply = [...updatedMessages, replyMessage];
      setMessages(messagesWithReply);
      saveMessages(messagesWithReply);
    }, 1000);
  };

  // Get auto-reply based on user role
  const getAutoReply = (userType) => {
    const replies = {
      customer: [
        "Hi! How can I help you with your order today?",
        "Thanks for reaching out! Our support team will assist you shortly.",
        "Is there an issue with your recent order? Let me help you.",
        "We're here to make your food experience amazing! What can I do for you?"
      ],
      vendor: [
        "Hello! How can I assist you with your restaurant management?",
        "Need help with orders or menu management? I'm here to help!",
        "Restaurant support team is ready to assist you.",
        "How can we improve your vendor experience today?"
      ],
      rider: [
        "Hi rider! How can I help you with deliveries today?",
        "Need assistance with your current order? Let me know!",
        "Rider support is here to help you navigate smoothly.",
        "How can we make your delivery experience better?"
      ]
    };

    const roleReplies = replies[userType] || replies.customer;
    return roleReplies[Math.floor(Math.random() * roleReplies.length)];
  };

  // Get representative info based on user role
  const getRepresentativeInfo = (userType) => {
    const representatives = {
      customer: {
        name: "Customer Support",
        role: "Food Service Assistant",
        avatar: "👨‍💼",
        color: "bg-blue-500"
      },
      vendor: {
        name: "Vendor Support",
        role: "Restaurant Partner Manager",
        avatar: "👩‍🍳",
        color: "bg-green-500"
      },
      rider: {
        name: "Rider Support",
        role: "Delivery Coordinator",
        avatar: "🚴‍♂️",
        color: "bg-orange-500"
      }
    };

    return representatives[userType] || representatives.customer;
  };

  if (!isOpen) return null;

  const repInfo = user ? getRepresentativeInfo(user.accountType) : getRepresentativeInfo('customer');

  return (
    <div className="fixed bottom-20 right-4 w-80 h-96 bg-white rounded-lg shadow-2xl border z-50 flex flex-col">
      {/* Header */}
      <div className={`${repInfo.color} text-white p-4 rounded-t-lg flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
            {repInfo.avatar}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{repInfo.name}</h3>
            <p className="text-xs opacity-90">{repInfo.role}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start a conversation!</p>
            <p className="text-xs mt-1">We're here to help you.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  message.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.sender === 'support' && (
                  <div className="flex items-center gap-1 mb-1">
                    <Bot size={12} />
                    <span className="text-xs font-medium">{repInfo.name}</span>
                  </div>
                )}
                <p>{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-indigo-200' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
