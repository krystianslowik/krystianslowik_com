// ChatInput.js
import React, {useState} from "react";

const ChatInput = ({handleChatSubmit, isBotTyping}) => {
    const [message, setMessage] = useState("");

    const handleChange = (e) => setMessage(e.target.value);

    const handleSend = () => {
        if (message.trim()) {
            handleChatSubmit(message.trim());
            setMessage("");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex border-t border-gray-200 bg-white rounded-b-md overflow-hidden">
            <input
                type="text"
                value={message}
                placeholder={
                    isBotTyping ? "Krystian's assistant is typing..." : "Type your message..."
                }
                onChange={handleChange}
                onKeyDown={handleKeyPress}
                disabled={isBotTyping}
                className="flex-1 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none disabled:opacity-50"
            />
            <button
                onClick={handleSend}
                disabled={!message.trim() || isBotTyping}
                className={`flex items-center justify-center px-6 py-3 text-white transition-filter duration-300 ${
                    !message.trim() || isBotTyping
                        ? " filter blur-xl"
                        : "filter blur-0"
                }`}
            >
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
          ➔
        </span>
            </button>
        </div>
    );

};

export default ChatInput;