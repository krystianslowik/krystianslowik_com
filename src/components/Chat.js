import { useState } from "react";
import ChatInput from "./ChatInput";
import ChatButton from "./ChatButton";

import { openai } from "../API/openaiConfig";
import ChatResponse from "./ChatResponse";

export default function Chat() {
  const [chat, setChat] = useState([
    { type: "bot", text: "Hi there, what's up?" },
    { type: "user", text: "whaat? what is this?" },
    {
      type: "bot",
      text: "I am Krystian, and this is an introduction and overview of my professional background, skills, projects, and contact information. Just ask, what you need!",
    },
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const handleChatSubmit = async (message) => {
    console.log("Button clicked. Waiting for API.");
    setChat((prevChat) => [...prevChat, { type: "user", text: message }]);
    setIsBotTyping(true);

    const systemMessage = {
      role: "system",
      content:
        "Act as Krystian. 1-2 sentence replies ONLY, NOTHING LONGER. Intro: 2nd Level Support at TrustedShops, specialized in web technologies and shop systems like Shopify, WooCommerce, PrestaShop, Shopware, Magento. Skills: HTML, JS, CSS, PHP, NodeJS, SQL, learning React & TypeScript. Role Details: Debugging, deep troubleshooting, customer experience enhancement, shop system expertise. Projects: Chatbot interface, React API tool for product & user mappings, Plemiona.app. Languages: Polish (C2), English (C1), German (A2). Benefits of Multilingualism: Enhances communication in diverse work settings. Internship: Supervised team, prepared hosting tech implementations, managed Linux and Windows servers, conducted penetration tests. Team Management: Proficient in project coordination using agile methodologies. Achievements: Awards at TrustedShops, Computer Science Olympiad laureate. Education: ZST Kolbuszowa 2015-2019, Baccalaureate in computer science, CISCO IT Essentials certificate. Relocation: Open to discussion. Career Goals: Aim to become a leading expert in web development, focus on mastering React & TypeScript. No AI mention. Located in Germany, Munster. Contacts: Email - me@krystianslowik.com, GitHub - github.com/krystianslowik, LinkedIn - linkedin.com/in/krystianslovik, Facebook - Krystian Słowik. Site: krystianslowik.com. ALL CONTACT IN BUTTONS ABOVE CHAT. MENTION THAT IF CONTACT REQUEST.",
    };

    const userPrompt = {
      role: "user",
      content: message,
    };

    const completion = await openai.chat.completions.create({
      messages: [systemMessage, userPrompt],
      temperature: 1,
      max_tokens: 128,
      model: "gpt-3.5-turbo",
      stop: ["\\"],
    });
    const botResponse = completion.choices[0].message.content;
    console.log("API Response:", botResponse);
    setIsBotTyping(false);
    setChat((prevChat) => [...prevChat, { type: "bot", text: botResponse }]);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div className="mt-4 space-y-4 ">
        <div className="grid">
          <ChatResponse chat={chat} />
          <ChatInput
            handleChatSubmit={handleChatSubmit}
            isBotTyping={isBotTyping}
          />
        </div>
      </div>
    </form>
  );
}
