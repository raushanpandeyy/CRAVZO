import React, { useState } from 'react';
import { lazy, Suspense } from "react";

const Chat = lazy(() =>
  import("../../components/Chat.jsx")
);

const RiderChatPage = () => {
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#F4F7FB] px-4 pt-4 pb-24 md:pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Rider Support Chat</h1>
          <p className="text-gray-600 mb-6">
            Get help with deliveries, navigation, or any delivery-related questions from our rider support team.
          </p>

          {/* Chat will be opened by default */}
          <Suspense fallback={<div className="text-center mt-8">Loading chat...</div>}>
            <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
          </Suspense>

          {!isChatOpen && (
            <div className="text-center mt-8">
              <button
                onClick={() => setIsChatOpen(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Open Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiderChatPage;
