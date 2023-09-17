import React, { useState, useEffect } from "react";

const AnimatedDescription = () => {
  const messages = [
    "hey, hola, salut, ciao, privet",
    "this chat knows me quite well",
    "feel free to speak any language",
    "want to collaborate? DM me",
    "get in touch for a chat",
    "see my socials listed below",
    "need more info? just ask",
    "have a project in mind?",
    "email me for more details",
    "find me also on LinkedIn",
    "tech savvy? so am I, really",
    "you can check out my GitHub",
    "I'm also on Twitter",
    "love coding? me too",
    "go ahead, ask me anything",
    "let's connect sometime soon",
    "need tech support? I'm here",
    "DMs are open for collabs",
    "feel free to ping me",
    "what's currently on your mind?",
    "here for any technical help",
    "questions? feel free to ask",
    "I'm all ears for you",
    "coding queries? just ask",
    "here to assist you anytime",
    "how may I assist you today?",
    "tech issues? just ask me",
    "interested in web tech?",
    "curious? feel free to ask",
    "need some quick tips? ask",
    "want to know more? ask",
    "any questions you have?",
    "like web tech? so do I",
    "here to guide you always",
    "always open for inquiries",
    "chat's multilingual here",
    "reach out if you need to",
    "I'm your go-to tech guide",
    "ready to start chatting?",
    "how can I best assist?",
  ];

  const [currentMessage, setCurrentMessage] = useState(".");
  const [currentTokens, setCurrentTokens] = useState(["‏"]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [action, setAction] = useState("add");
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    let tokenizedMessage = messages[messageIndex].match(/.{1,4}/g);
    let timer;
    const randomTime = 57;
    const addTokens = (index) => {
      if (index < tokenizedMessage.length) {
        setCurrentTokens((prevTokens) => {
          const newTokens = [...prevTokens, tokenizedMessage[index]];
          setCurrentMessage(newTokens.join(""));
          return newTokens;
        });
        timer = setTimeout(() => addTokens(index + 1), randomTime);
      } else {
        setAction("pause");
      }
    };

    const removeTokens = (index) => {
      if (index >= 0) {
        setCurrentTokens((prevTokens) => {
          const newTokens = [...prevTokens];
          newTokens.pop();
          setCurrentMessage(newTokens.join(""));
          return newTokens;
        });
        timer = setTimeout(() => removeTokens(index - 1), randomTime);
      } else {
        setAction("add");
        setMessageIndex(Math.floor(Math.random() * messages.length));
      }
    };

    if (action === "add") {
      setCurrentTokens(["‏"]);
      addTokens(0);
    } else if (action === "remove") {
      removeTokens(tokenizedMessage.length - 1);
    }

    return () => clearTimeout(timer);
  }, [action, messageIndex]);

  useEffect(() => {
    let timer;
    if (action === "pause") {
      setShowCursor(true);
      timer = setTimeout(() => {
        setShowCursor(false);
        setAction("remove");
      }, 3500);
    }
    return () => clearTimeout(timer);
  }, [action]);

  return (
    <span className="text-gray-300 h-1">
      {currentMessage}
      {showCursor && <span className="animate-blink"> ▌</span>}
    </span>
  );
};

export default AnimatedDescription;
