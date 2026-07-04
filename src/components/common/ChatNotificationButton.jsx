import React from "react";
import { MessageCircle } from "lucide-react";

const ChatNotificationButton = ({
  unreadCount,
  notifications,
  chatMenuOpen,
  onToggle,
  onNotificationClick,
  compact = false,
}) => {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`relative flex items-center justify-center gap-2 rounded-full font-bold ${
          compact
            ? "h-10 w-10 bg-indigo-950 text-white shadow-md"
            : "bg-white px-5 py-2 text-indigo-900"
        }`}
        aria-label={`Chat notifications with ${unreadCount} unread`}
        aria-expanded={chatMenuOpen}
      >
        <MessageCircle className="h-5 w-5" />
        {!compact ? <span>Chat</span> : null}
        {unreadCount > 0 ? (
          <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[11px] leading-4 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {chatMenuOpen ? (
        <div className="absolute right-0 top-12 z-[70] w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white text-slate-950 shadow-2xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-black">Chat notifications</p>
            <p className="text-xs text-slate-500">Tap any item to open that chat.</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => onNotificationClick(notification)}
                  className="flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black">{notification.title || "Chat message"}</span>
                    <span className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">
                      {notification.subtitle || notification.text || "New message"}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-500">No new chat notifications</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ChatNotificationButton;
