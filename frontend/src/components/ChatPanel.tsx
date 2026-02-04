import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import type { Message } from "../types/chat.types";

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  currentUsername: string;
  isOpen: boolean;
  onToggle: () => void;
  unreadCount: number;
}

export default function ChatPanel({
  messages,
  onSendMessage,
  currentUsername,
  isOpen,
  onToggle,
  unreadCount,
}: ChatPanelProps) {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new message or panel opens
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText("");
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={onToggle}
        className={`
          fixed right-6 bottom-6 z-50
          w-14 h-14 rounded-full flex items-center justify-center
          bg-purple-600 text-white shadow-xl hover:bg-purple-700 
          transition-all duration-200 transform hover:scale-105
          focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2
        `}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <MessageCircle className="w-7 h-7" strokeWidth={2} />

        {unreadCount > 0 && (
          <span
            className="
    absolute -top-1 -right-1 
    bg-red-500 text-white text-xs font-bold 
    min-w-[1.25rem] h-5 rounded-full flex items-center justify-center
    border-2 border-white shadow-sm
  "
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`
          fixed right-6 bottom-24 z-50
          w-96 h-[480px] max-h-[80vh] flex flex-col
          bg-white dark:bg-gray-900 
          rounded-2xl shadow-2xl overflow-hidden
          border border-gray-200 dark:border-gray-800
          transform transition-all duration-300
          ${
            isOpen
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-95 opacity-0 translate-y-4 pointer-events-none"
          }
        `}
      >
        {/* Header */}
        <div
          className="
          bg-gradient-to-r from-purple-600 to-purple-700 
          text-white px-5 py-4 flex items-center justify-between
        "
        >
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6" />
            <h3 className="font-semibold text-lg">Group Chat</h3>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-full hover:bg-purple-800/50 transition"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 dark:bg-gray-950/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
              <MessageCircle className="w-12 h-12 mb-3 opacity-40" />
              <p className="font-medium">No messages yet</p>
              <p className="text-sm mt-1">Start the conversation...</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.username === currentUsername;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`
                      max-w-[80%] rounded-2xl px-4 py-3
                      ${
                        isOwnMessage
                          ? "bg-purple-600 text-white rounded-br-none"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none shadow-sm"
                      }
                    `}
                  >
                    {!isOwnMessage && (
                      <p className="text-xs font-semibold text-purple-400 dark:text-purple-300 mb-1">
                        {msg.username}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed break-words">
                      {msg.text}
                    </p>
                    <p
                      className={`
                      text-xs mt-1.5 opacity-80
                      ${isOwnMessage ? "text-purple-200" : "text-gray-500 dark:text-gray-400"}
                    `}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="
                flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 
                border border-gray-300 dark:border-gray-700 
                rounded-xl text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                transition
              "
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="
                p-3 bg-purple-600 text-white rounded-xl
                hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                transition transform hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-purple-400
              "
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
