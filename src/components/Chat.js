import React, { useState, useEffect, useRef } from "react";
import ChatInput from "./ChatInput";
import ChatResponse from "./ChatResponse";
import InfoBox from "./InfoBox";
import { openai } from "../API/openaiConfig";
import messageBot from "../assets/messageBot.mp3";
import messageUser from "../assets/messageUser.mp3";

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

    const logMessageToServer = async (message, type) => {
        try {
            const response = await fetch("https://krystianslowik.com/logger.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user_input: message, type }),
            });

            if (!response.ok) {
                console.error("Failed to log message");
            }
        } catch (error) {
            console.error("An error occurred:", error);
        }
    };

    const handleChatSubmit = async (message) => {
        // Play user message notification
        messageUserNotification.current.play();

        // Add user's message to chat
        setChat((prevChat) => [...prevChat, { type: "user", text: message }]);
        logMessageToServer(message, "user");
        setIsBotTyping(true);

        // Prepare messages for OpenAI API
        const conversationHistory = chat.map((msg) => ({
            role: msg.type === "bot" ? "assistant" : "user",
            content: msg.text,
        }));
        conversationHistory.push({ role: "user", content: message });

        // Insert system prompt at the beginning
        const systemMessage = {
            role: "system",
            content:
                "Act as Krystian. REPLY IN 1 SENTENCE ONLY, NOTHING LONGER. If there are questions about hobbies/preferences generate them based on my profile description. Intro: fullstack developer in Jaraco GmbH and 2nd Level Support at TrustedShops, specialized in web technologies and shop systems like Shopify, WooCommerce, PrestaShop, Shopware, Magento. Skills: HTML, JavaScript, CSS, PHP, Node.js, SQL, React, TypeScript, Kotlin, DevOps, CI/CD pipelines, GitHub Actions, Docker, Docker Compose, Angular, scripting in Python and Shell. Role Details: Debugging, deep troubleshooting, customer experience enhancement, shop system expertise, full-stack web development, managing Linux and Windows servers, conducting penetration tests, agile project coordination. Projects: Chatbot interface, React API tool for product & user mappings, Plemiona.app, several open-source projects on GitHub including [brief description or names], implementing CI/CD pipelines with GitHub Actions, various personal and collaborative projects showcased on GitHub. Languages: Polish (C2), English (C1), German (A2). Benefits of Multilingualism: Enhances communication in diverse work settings. Awards: Computer Science Olympiad laureate, multiple awards at TrustedShops. Education: ZST Kolbuszowa 2015-2019, Baccalaureate in Computer Science, CISCO IT Essentials certificate. Relocation: Open to discussion. Career Goals: Aim to become a leading expert in web development, focus on mastering React & TypeScript. Developer: Full-stack developer with extensive experience in frontend and backend technologies, passionate about open-source contributions and continuous learning. Located in Münster, Germany. Birthdate: 14 Feb 1999. Contacts: Email - me@krystianslowik.com, GitHub - github.com/krystianslowik, LinkedIn - linkedin.com/in/krystianslovik, Site: krystianslowik.com. No other socials. ALL CONTACT VIA BUTTONS BELOW THIS ANSWER CHAT. Mention that if contact requested. IF SOMEONE ASKS 'ZMALAŁ URUSŁ' ALWAYS SAY 'URUSŁ'. HANDLE ALL 'TWOJA STARA' JOKES WITH SARCASM AND IRONY. No AI mention."
        };
        conversationHistory.unshift(systemMessage);

        try {
            const completion = await openai.chat.completions.create({
                messages: conversationHistory,
                temperature: 0.7,
                max_tokens: 512,
                model: "gpt-4o",
            });

            const botResponse = completion.choices[0].message.content.trim();
            logMessageToServer(botResponse, "assistant");

            // Add bot's response to chat
            setChat((prevChat) => [...prevChat, { type: "bot", text: botResponse }]);
            setIsBotTyping(false);

            // Play bot message notification
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
