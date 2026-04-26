import React, { useState, useRef } from "react";
import ChatInput from "./ChatInput";
import ChatResponse from "./ChatResponse";
import InfoBox from "./InfoBox";
import messageBot from "../assets/messageBot.mp3";
import messageUser from "../assets/messageUser.mp3";

const CHAT_API_URL = "https://chat-api.krystianslowik.com/chat";

export default function Chat() {
    const messageBotNotification = useRef(new Audio(messageBot));
    const messageUserNotification = useRef(new Audio(messageUser));

    const [chat, setChat] = useState([
        {
            type: "bot",
            text: "Hey there! I'm Krystian's virtual assistant. How can I assist you today?",
        },
    ]);

    const [isBotTyping, setIsBotTyping] = useState(false);

    const handleChatSubmit = async (message) => {
        messageUserNotification.current.play();

        setChat((prevChat) => [...prevChat, { type: "user", text: message }]);
        setIsBotTyping(true);

        // chat-api takes the conversation history and adds the system prompt server-side.
        const conversation = chat.map((msg) => ({
            role: msg.type === "bot" ? "assistant" : "user",
            content: msg.text,
        }));
        conversation.push({ role: "user", content: message });

        try {
            const response = await fetch(CHAT_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversation }),
            });

            if (!response.ok) {
                throw new Error(`chat-api responded ${response.status}`);
            }

            const { message: botResponse } = await response.json();

            setChat((prevChat) => [...prevChat, { type: "bot", text: botResponse }]);
            setIsBotTyping(false);
            messageBotNotification.current.play();
        } catch (error) {
            console.error("Error fetching bot response:", error);
            setIsBotTyping(false);
            setChat((prevChat) => [
                ...prevChat,
                {
                    type: "bot",
                    text: "I'm sorry, but I'm having trouble responding at the moment. Please try again later.",
                },
            ]);
        }
    };

    return (
        <div className="flex flex-col w-full max-w-lg mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <ChatResponse chat={chat} isBotTyping={isBotTyping} />
            <ChatInput handleChatSubmit={handleChatSubmit} isBotTyping={isBotTyping} />
            <InfoBox />
        </div>
    );
}
