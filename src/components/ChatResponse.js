import React, { useEffect, useRef } from "react";
import Mail from "../assets/Mail";
import LinkedIn from "../assets/LinkedIn";
import GitHub from "../assets/GitHub";

const ChatResponse = ({ chat, isBotTyping }) => {
  const tileClass =
    "inline-flex items-center justify-center p-5 mx-4 text-base font-medium text-gray-400 rounded-lg bg-gray-800 hover:bg-gray-700 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white shadow";

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat, isBotTyping]);

  return (
    <>
      <div className="flex justify-center items-center w-full px-6 pb-4 pt-4 text-gray-400">
        <a href="mailto:me@krystianslowik.com" className={tileClass}>
          <Mail />
        </a>
        <a href="https://linkedin.com/in/krystianslovik" className={tileClass}>
          <LinkedIn />
        </a>
        <a href="https://github.com/krystianslowik" className={tileClass}>
          <GitHub />
        </a>
      </div>
      <div className="flex flex-col w-full p-4 rounded-t-lg overflow-y-auto h-[280px] max-w-[444px] bg-gray-800/0 top-fade border-t border-gray-100/50 custom-scrollbar">
        {chat.map((message, index) => (
          <div
            key={index}
            className={`inline-block p-2 my-2 rounded-lg text-white shadow ${
              message.type === "user"
                ? "bg-gray-200/50 text-right ml-auto"
                : "bg-gray-700/50 text-left mr-auto"
            }`}
          >
            {message.text}
          </div>
        ))}
        {isBotTyping && (
          <div
            id="wave"
            className="inline-block p-3 my-2 rounded-lg text-white bg-gray-700/30 text-right mr-auto"
          >
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
        <div ref={messagesEndRef}></div>
      </div>
    </>
  );
};

export default ChatResponse;
