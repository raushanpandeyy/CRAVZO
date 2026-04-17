import React, { useState } from 'react';
import Chat from '../../components/Chat';

const VendorChatPage = () => {
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <div className="flex-1 sm:ml-80 ml-0 min-h-screen overflow-y-auto pt-24 max-sm:pt-20 sm:ml-72 px-6 py-6 bg-[#F4F7FB]">
      <div className="max-w-4xl mr-auto ml-8 space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Vendor Support Chat</h1>
          <p className="text-gray-600 mb-6">
            Connect with our vendor support team for restaurant management assistance, order issues, or any other help you need.
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

export default VendorChatPage;