import React, { useEffect, useRef } from "react";
import Mail from "../assets/Mail";
import LinkedIn from "../assets/LinkedIn";
import GitHub from "../assets/GitHub";

const ChatResponse = ({ chat, isBotTyping }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat, isBotTyping]);

  return (
      <div className="flex flex-col h-80 bg-gray-50">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {chat.map((message, index) => (
              <div
                  key={index}
                  className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.type === "user"
                            ? "bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-600 text-right"
                            : "bg-gray-200 text-gray-800 text-left"
                    }`}
                >
                  {message.text}
                </div>
              </div>
          ))}
          {isBotTyping && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800">
                  Typing...
                </div>
              </div>
          )}
          <div ref={messagesEndRef}></div>
        </div>

        {/* Social Links */}
        <div className="flex justify-center items-center py-3 bg-white border-t border-gray-200">
          <a
              href="mailto:me@krystianslowik.com"
              className="mx-2 text-gray-500 hover:text-gray-700"
              aria-label="Email"
          >
            <Mail />
          </a>
          <a
              href="https://linkedin.com/in/krystianslovik"
              className="mx-2 text-gray-500 hover:text-gray-700"
              aria-label="LinkedIn"
          >
            <LinkedIn />
          </a>
          <a
              href="https://github.com/krystianslowik"
              className="mx-2 text-gray-500 hover:text-gray-700"
              aria-label="GitHub"
          >
            <GitHub />
          </a>
        </div>
      </div>
  );
};

export default ChatResponse;
