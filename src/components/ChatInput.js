import { useState } from "react";

const ChatInput = () => {
  const [placeholder, setPlaceholder] = useState(
    "Ready to chat? Too bad, I'm not."
  );
  return (
    <input
      type="text"
      id="prompt"
      disabled
      placeholder={placeholder}
      className="py-3 ps-11 pe-4 block w-full bg-white/[.03] text-white placeholder:text-grey-800 rounded-t-md text-sm border-none focus:ring-0 sm:p-4 sm:ps-11 focus:outline-none"
    ></input>
  );
};

export default ChatInput;
