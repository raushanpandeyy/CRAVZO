import React, { useState } from 'react';
import Chat from '../../components/Chat.jsx';

const ChatPage = () => {
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <div className="min-h-screen overflow-y-auto bg-[#F4F7FB] p-4 sm:px-8 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <h1 className="mb-3 text-2xl font-black text-slate-950 sm:text-3xl">Support Chat</h1>
          <p className="mb-5 text-sm text-slate-500 sm:text-base">
            Get instant help from our support team. We're here to assist you with any questions or issues.
          </p>

          {/* Chat will be opened by default */}
          <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

          {!isChatOpen && (
            <div className="text-center mt-8">
              <button
                onClick={() => setIsChatOpen(true)}
                className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
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

export default ChatPage;
