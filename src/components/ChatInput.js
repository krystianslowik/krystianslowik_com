import { useState } from "react";
import ChatButton from "./ChatButton";

const ChatInput = ({ handleChatSubmit, isBotTyping }) => {
  const [message, setMessage] = useState("");
  const [placeholder, setPlaceholder] = useState(
    "Ready to chat? Too bad, I'm not."
  );
  // isBotTyping
  //   ? setPlaceholder((prev) => "AI is replying...")
  //   : setPlaceholder((prev) => "Type there...");
  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  return (
    <>
      <input
        type="text"
        id="prompt"
        value={message}
        placeholder={isBotTyping ? "Hmm..." : placeholder}
        onChange={handleChange}
        className="py-3 ps-11 pe-4 block w-full bg-white/[.03] text-white placeholder:text-grey-800 rounded-t-md text-sm border-none focus:ring-0 sm:p-4 sm:ps-11 focus:outline-none"
      ></input>
      <ChatButton
        handleChatSubmit={() => {
          handleChatSubmit(message);
          setMessage("");
        }}
        disabled={message.length === 0}
      />
    </>
  );
};

export default ChatInput;
