import React, { useState } from 'react';
import Chat from '../../components/Chat.jsx';

const ChatPage = () => {
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <div className="min-h-screen overflow-y-auto bg-[#F4F7FB] px-3 py-3 sm:px-8 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-[28px] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
          <div className="mb-5 rounded-[24px] bg-indigo-950 p-5 text-white sm:bg-transparent sm:p-0 sm:text-slate-950">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-200 sm:hidden">Help desk</p>
            <h1 className="text-2xl font-black sm:text-3xl">Support Chat</h1>
            <p className="mt-2 text-sm leading-6 text-indigo-100 sm:text-slate-500 sm:text-base">
            Get instant help from our support team. We're here to assist you with any questions or issues.
            </p>
          </div>

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
