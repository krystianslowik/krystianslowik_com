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
      <div className="flex flex-col h-80 bg-gray-50 rounded-t-lg overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {chat.map((message, index) => (
              <div
                  key={index}
                  className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                {message.type === "user" ? (
                    <div
                        className="max-w-xs px-4 py-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-600 animate-slide-in text-right"
                    >
                      {message.text}
                    </div>
                ) : (
                    // **Assistant's Message with Animated Marker-Like Border**
                    <div className="marker-border-wrapper">
                      <div className="max-w-xs px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-md animate-fade-in-blur text-left">
                        {message.text}
                      </div>
                    </div>
                )}
              </div>
          ))}

          {isBotTyping && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-1 px-4 py-4 rounded-lg bg-gray-200">
                  <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-slide-in2"></span>
                  <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-slide-in2"></span>
                  <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-slide-in2"></span>
                </div>
              </div>
          )}

          <div ref={messagesEndRef}></div>
        </div>

        {/* Social Links */}
        <div className="flex justify-center items-center py-3 bg-white border-t border-gray-200">
          <a
              href="mailto:me@krystianslowik.com"
              className="mx-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
              aria-label="Email"
          >
            <Mail />
          </a>
          <a
              href="https://linkedin.com/in/krystianslowik"
              className="mx-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 "
              aria-label="LinkedIn"
          >
            <LinkedIn />
          </a>
          <a
              href="https://github.com/krystianslowik"
              className="mx-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
              aria-label="GitHub"
          >
            <GitHub />
          </a>
        </div>
      </div>
  );
};

export default ChatResponse;

