import React, { useState } from 'react';
<<<<<<< HEAD
import Chat from '../../components/Chat.jsx';
=======
import Chat from '../../components/Chat';
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

const ChatPage = () => {
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <div className="flex-1 sm:ml-80 ml-0 min-h-screen overflow-y-auto sm:px-8 sm:py-8 p-4 bg-[#F4F7FB]">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Support Chat</h1>
          <p className="text-gray-600 mb-6">
            Get instant help from our support team. We're here to assist you with any questions or issues.
          </p>

          {/* Chat will be opened by default */}
          <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

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

export default ChatPage;