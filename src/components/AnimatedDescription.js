import React, { useState, useEffect } from "react";

const AnimatedDescription = () => {
  const messages = [
    "Curious about me? Just. Do. It!",
    "Need help from me? Put some question in the chat!",
    "Want to collaborate? Let's talk!",
    "Looking for my projects? I'm waiting below!",
    "Got questions? Fire away!",
    "Looking for my mail? Go ahead, ask!",
  ];
  const [currentMessage, setCurrentMessage] = useState("");
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
        setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
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
